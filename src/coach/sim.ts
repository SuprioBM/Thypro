/**
 * Persona simulation. EVERYTHING HERE IS SYNTHETIC.
 *
 * Three invented personas live through a scripted week. The script only says how much
 * "capacity" each day offers each track; whether the person completes a track follows
 * from a small, documented rule (SIM_MODEL) and from the habits' current level. The
 * coach is the REAL pipeline (risk score -> one validated proposal -> reducer). The only
 * assumption is that the simulated person accepts what the coach suggests.
 *
 * This is a toy model to show how the product behaves. It is not evidence that the coach
 * works, and nothing in it comes from real users.
 */

import { emptyState, reducer } from '../app/reducer';
import { DEFAULT_CONTEXT, type AppState, type Barrier, type ContextProfile, type GoalSetup } from '../domain/types';
import { shiftDate } from '../domain/week';
import { resolveActions } from '../planner/context';
import { TRACKS, type Track } from '../planner/config';
import { computeRun } from '../planner/runs';
import { selectProposal } from './actions';
import { buildCoachContext, buildCoachInput, trackCompletion } from './input';
import { assessRisk } from './risk';
import { COACH_CONFIG } from './config';

export type PersonaId = 'night-shift' | 'ramadan' | 'traveller';
export const PERSONA_IDS: readonly PersonaId[] = ['night-shift', 'ramadan', 'traveller'] as const;
export type SimTag = 'shift' | 'fasting' | 'travel' | 'reminder';

export interface SimDayScript {
  cap: Record<Track, number>;
  tags: SimTag[];
  /** Barrier the person names in the evening if the day went badly. */
  barrier?: Barrier;
}

export interface Persona {
  id: PersonaId;
  context: Partial<ContextProfile>;
  usualTime: string;
  days: SimDayScript[];
}

const C = (activity: number, sleep: number, hydration: number, nutrition: number): Record<Track, number> => ({ activity, sleep, hydration, nutrition });

export const PERSONAS: Record<PersonaId, Persona> = {
  'night-shift': {
    id: 'night-shift',
    context: { shiftWork: 'night', heat: 'hot' },
    usualTime: '19:30',
    days: [
      { cap: C(3, 3, 3, 3), tags: [] },
      { cap: C(1, 1, 1, 3), tags: ['shift'], barrier: 'shift' },
      { cap: C(1, 1, 1, 3), tags: ['shift'], barrier: 'shift' },
      { cap: C(3, 3, 3, 3), tags: [] },
      { cap: C(1, 1, 1, 3), tags: ['reminder'], barrier: 'motivation' },
      { cap: C(1, 1, 1, 3), tags: ['reminder'], barrier: 'motivation' },
      { cap: C(3, 3, 3, 3), tags: [] }
    ]
  },
  ramadan: {
    id: 'ramadan',
    context: { fasting: 'ramadan', heat: 'hot' },
    usualTime: '19:30',
    days: [
      { cap: C(3, 3, 3, 3), tags: ['fasting'] },
      { cap: C(1, 1, 1, 3), tags: ['fasting'], barrier: 'tired' },
      { cap: C(1, 1, 1, 3), tags: ['fasting'], barrier: 'tired' },
      { cap: C(3, 3, 2, 3), tags: ['fasting'] },
      { cap: C(3, 3, 1, 3), tags: ['fasting'] },
      { cap: C(3, 3, 3, 3), tags: ['fasting'] },
      { cap: C(3, 3, 3, 3), tags: ['fasting'] }
    ]
  },
  traveller: {
    id: 'traveller',
    context: { shiftWork: 'none' },
    usualTime: '18:30',
    days: [
      { cap: C(3, 3, 3, 3), tags: [] },
      { cap: C(1, 1, 3, 1), tags: ['travel'], barrier: 'travel' },
      { cap: C(1, 1, 3, 1), tags: ['travel'], barrier: 'travel' },
      { cap: C(1, 3, 3, 3), tags: ['travel'] },
      { cap: C(3, 3, 3, 3), tags: [] },
      { cap: C(3, 3, 3, 3), tags: [] },
      { cap: C(3, 3, 3, 3), tags: [] }
    ]
  }
};

/**
 * Documented rule: a track is done when day capacity (plus accepted-change bonuses) >= its level.
 * Bonuses (each +1 on matching days): pre-shift reminder on shift days; a moved activity time on shift
 * and fasting days; hydration paused in fasting hours on fasting days; the indoor variant on travel days;
 * a switched reminder channel on days the in-app reminder is missed.
 */
function bonus(state: AppState, track: Track, tags: SimTag[]): number {
  let b = 0;
  if (state.planner.preShift.enabled && tags.includes('shift')) b += 1;
  if (track === 'activity' && state.planner.tracks.activity.time && (tags.includes('shift') || tags.includes('fasting'))) b += 1;
  if (track === 'hydration' && state.planner.hydrationPausedFasting && tags.includes('fasting')) b += 1;
  if (track === 'activity' && state.planner.tracks.activity.variant === 'alt' && tags.includes('travel')) b += 1;
  if (state.prefs.preferredChannel !== 'in-app' && tags.includes('reminder')) b += 1;
  return b;
}

export type SimEventKind = 'missed' | 'barrier' | 'step_down' | 'proposal' | 'accepted' | 'channel_switch' | 'blocked';
export interface SimEvent {
  kind: SimEventKind;
  /** Stable detail for the UI to translate: action id, barrier id or track id. */
  detail?: string;
}

export interface SimDayResult {
  index: number;
  date: string;
  done: Record<Track, boolean>;
  levels: Record<Track, number>;
  events: SimEvent[];
  /** Share of tracks done. */
  completion: number;
}

export interface SimSummary {
  doneTrackDays: number;
  possible: number;
  longestRun: number;
  missedDays: number;
  /** Days from the first missed day until a day that is not missed. null = no lapse or not yet resumed. */
  daysToResume: number | null;
  proposals: number;
  totalDays: number;
}

export interface SimResult {
  days: SimDayResult[];
  summary: SimSummary;
  state: AppState;
}

const SETUP = (ctx: Partial<ContextProfile>, usualTime: string): GoalSetup => ({
  goalType: 'walk',
  usualTime,
  preferences: [],
  dietary: ['halal'],
  allergyState: 'none',
  allergies: [],
  baseline: { walkMinutesPerDay: 'unknown', sleepHours: 'unknown', mealsPerDay: 'unknown', medicineTimesPerDay: 'unknown' },
  ownTargets: {},
  screening: { pregnancy: 'no', eatingConcerns: 'no', heartCondition: 'no', kidneyDisease: 'no', insulinDiabetes: 'no', otherHighRisk: 'no' },
  context: { ...DEFAULT_CONTEXT, ...ctx }
});

/** Monday of the last full week, like the guest story, so dates are always in the past. */
export function simStart(today: string): string {
  const [y, m, d] = today.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return shiftDate(today, -((dow + 6) % 7) - 7);
}

export function simulate(persona: PersonaId, withCoach: boolean, today: string, upToDays = 7): SimResult {
  const p = PERSONAS[persona];
  const start = simStart(today);
  const base = emptyState('guest', 'en');
  let s: AppState = reducer(
    { ...base, profile: { ...base.profile, id: `sim-${persona}`, synthetic: true } },
    { type: 'completeSetup', setup: SETUP(p.context, p.usualTime), nowIso: `${shiftDate(start, -1)}T09:00:00.000Z`, seed: `sim-${persona}-setup` }
  );
  s = { ...s, coach: { ...s.coach, enabled: withCoach, autoAdjust: false } };

  const days: SimDayResult[] = [];
  const n = Math.min(upToDays, p.days.length);
  for (let i = 0; i < n; i++) {
    const date = shiftDate(start, i);
    const script = p.days[i];
    const nowIso = `${date}T08:00:00.000Z`;
    const seed = `sim-${persona}-${i}`;
    const auditBefore = s.audit.length;

    s = reducer(s, { type: 'tick', today: date, nowIso, seed: `${seed}-t` });

    if (withCoach && i > 0) {
      const input = buildCoachInput(s, date);
      const risk = assessRisk(input);
      const proposal = selectProposal({ input, risk, ctx: buildCoachContext(s), trackCompletion: trackCompletion(s, date), id: `${seed}-p`, nowIso });
      if (proposal) {
        const summary = `score ${risk.score}; signals ${input.used.join(',')}`;
        s = reducer(s, { type: 'coach', action: { type: 'propose', proposal, explanation: { source: 'template' }, inputSummary: summary, nowIso, seed: `${seed}-c` } });
        // Simulation assumption: the invented person accepts the suggestion.
        s = reducer(s, { type: 'coach', action: { type: 'decide', decision: 'accepted', today: date, nowIso, seed: `${seed}-d` } });
      }
    }

    const visible = resolveActions(s.planner, s.setup?.context ?? DEFAULT_CONTEXT, s.setup?.screening ?? {}).filter((a) => a.visible).map((a) => a.track);
    const done = { activity: false, sleep: false, hydration: false, nutrition: false } as Record<Track, boolean>;
    for (const track of visible) {
      if (script.cap[track] + bonus(s, track, script.tags) >= s.planner.tracks[track].level) {
        done[track] = true;
        s = reducer(s, { type: 'planner', action: { type: 'complete', track, date, nowIso: `${date}T18:00:00.000Z` }, seed: `${seed}-x-${track}`, nowIso });
      }
    }
    const completion = visible.length ? TRACKS.filter((t) => done[t]).length / visible.length : 0;
    // Make sure the first day exists in the planner even if nothing was done.
    if (!s.planner.startedOn) s = { ...s, planner: { ...s.planner, startedOn: date } };

    const events: SimEvent[] = [];
    if (completion < COACH_CONFIG.missBelow) {
      events.push({ kind: 'missed' });
      if (script.barrier) {
        s = { ...s, barriers: [...s.barriers, { id: `${seed}-b`, at: `${date}T20:00:00.000Z`, date, barrier: script.barrier, episodeKey: date }] };
        events.push({ kind: 'barrier', detail: script.barrier });
      }
    }
    for (const a of s.audit.slice(auditBefore)) {
      if (a.kind === 'planner' && a.reasonCode === 'planner_step_down') events.push({ kind: 'step_down', detail: String(a.reasonParams?.track) });
      if (a.kind === 'coach' && a.result === 'proposed') events.push({ kind: 'proposal', detail: String(a.reasonParams?.action) });
      if (a.kind === 'coach' && a.result === 'accepted' && a.reasonCode === 'coach_accepted') {
        events.push({ kind: 'accepted', detail: String(a.reasonParams?.action) });
        if (a.reasonParams?.action === 'switch_channel') events.push({ kind: 'channel_switch' });
      }
      if (a.kind === 'coach' && a.result === 'blocked') events.push({ kind: 'blocked', detail: String(a.reasonParams?.action) });
    }
    const levels = Object.fromEntries(TRACKS.map((t) => [t, s.planner.tracks[t].level])) as Record<Track, number>;
    days.push({ index: i, date, done, levels, events, completion });
  }

  const lastDate = days.length ? days[days.length - 1].date : start;
  const longestRun = Math.max(0, ...TRACKS.map((t) => computeRun(s.planner, t, lastDate).best));
  const firstMiss = days.findIndex((d) => d.completion < COACH_CONFIG.missBelow);
  let daysToResume: number | null = null;
  if (firstMiss >= 0) {
    const back = days.findIndex((d, idx) => idx > firstMiss && d.completion >= COACH_CONFIG.missBelow);
    daysToResume = back >= 0 ? back - firstMiss : null;
  }
  return {
    days,
    state: s,
    summary: {
      doneTrackDays: days.reduce((a, d) => a + TRACKS.filter((t) => d.done[t]).length, 0),
      possible: days.length * TRACKS.length,
      longestRun,
      missedDays: days.filter((d) => d.completion < COACH_CONFIG.missBelow).length,
      daysToResume,
      proposals: days.reduce((a, d) => a + d.events.filter((e) => e.kind === 'proposal').length, 0),
      totalDays: TRACKS.reduce((a, t) => a + computeRun(s.planner, t, lastDate).total, 0)
    }
  };
}
