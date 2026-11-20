/**
 * Builds the coach's input from app state, reading ONLY signals the person has consented to.
 * A signal without consent is neither read nor used; it is reported in `missing`.
 */

import { DEFAULT_CONTEXT, type AppState } from '../domain/types';
import { shiftDate } from '../domain/week';
import { resolveActions } from '../planner/context';
import { TRACKS, type Track } from '../planner/config';
import { doneInLast7 } from '../planner/runs';
import type { CoachContext } from './actions';
import { isBlockedSetup } from './blocked';
import type { CoachInput } from './risk';
import type { CoachSignal } from './types';

export function visibleWearable(state: AppState, signal: 'steps' | 'sleepMinutes' | 'activityMinutes', date: string): number | null {
  const consentKey = signal === 'sleepMinutes' ? 'sleep' : signal === 'steps' ? 'steps' : 'activity';
  if (!state.coach.consent[consentKey]) return null;
  return state.wearables.data[date]?.[signal] ?? null;
}

export function buildCoachContext(state: AppState): CoachContext {
  return {
    planner: state.planner,
    context: state.coach.consent.context ? (state.setup?.context ?? DEFAULT_CONTEXT) : DEFAULT_CONTEXT,
    screening: state.setup?.screening ?? {},
    prefs: state.prefs,
    setupBlocked: isBlockedSetup(state)
  };
}

export function buildCoachInput(state: AppState, today: string): CoachInput {
  const c = state.coach.consent;
  const used: CoachSignal[] = [];
  const missing: CoachSignal[] = [];
  const note = (sig: CoachSignal, on: boolean) => (on ? used : missing).push(sig);

  const completion: Record<string, number> = {};
  let startedOn: string | null = null;

  if (c.planner && state.planner.startedOn) {
    const visible = resolveActions(state.planner, state.setup?.context ?? DEFAULT_CONTEXT, state.setup?.screening ?? {}).filter((a) => a.visible).length || 1;
    for (const [date, day] of Object.entries(state.planner.entries)) {
      completion[date] = Math.min(1, TRACKS.filter((t) => day[t]?.done).length / visible);
    }
    startedOn = state.planner.startedOn;
  }
  if (c.checkins) {
    for (const ci of state.checkins) {
      if (ci.status === 'unknown') continue;
      const v = ci.status === 'done' ? 1 : 0;
      completion[ci.date] = Math.max(completion[ci.date] ?? 0, v);
      if (!startedOn || ci.date < startedOn) startedOn = ci.date;
    }
  }
  note('planner', c.planner);
  note('checkins', c.checkins);

  const barriers = c.barriers ? state.barriers.map((b) => ({ date: b.date, barrier: b.barrier })) : [];
  note('barriers', c.barriers);
  note('context', c.context);

  const ctxProfile = c.context ? (state.setup?.context ?? DEFAULT_CONTEXT) : DEFAULT_CONTEXT;
  const sleepHours: number[] = [];
  for (let i = 6; i >= 1; i--) {
    const d = shiftDate(today, -i);
    const dev = visibleWearable(state, 'sleepMinutes', d);
    if (dev !== null) sleepHours.push(dev / 60);
  }
  note('sleep', c.sleep);
  note('steps', c.steps);
  note('activity', c.activity);

  return {
    today,
    completion,
    startedOn,
    barriers,
    shiftWork: ctxProfile.shiftWork,
    heat: ctxProfile.heat,
    fasting: ctxProfile.fasting,
    usualTime: state.planner.tracks.activity.time ?? state.setup?.usualTime ?? null,
    preShiftOn: state.planner.preShift.enabled,
    sleepHours,
    used,
    missing
  };
}

export function trackCompletion(state: AppState, today: string) {
  return (t: Track): number => doneInLast7(state.planner, t, today) / 7;
}
