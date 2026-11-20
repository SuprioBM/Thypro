/**
 * Proposal selection and validation. PURE and deterministic; no LLM involved.
 *
 * The coach may propose exactly ONE action from COACH_ACTIONS. Anything else, from any
 * source (including a model), is rejected by `isAllowedAction`. Every proposal is checked
 * by `validateProposal` (the safety layer for coach changes) before it is shown.
 */

import type { Barrier, ChannelId, ContextProfile, ScreeningKey, Tri, UserPrefs } from '../domain/types';
import { checkPlannerTargets, hydrationFlagged } from '../planner/context';
import { TRACKS, type Track } from '../planner/config';
import type { PlannerState } from '../planner/types';
import { shiftDate } from '../domain/week';
import { COACH_CONFIG } from './config';
import type { CoachInput } from './risk';
import { nextChannelFor } from './channels';
import {
  COACH_ACTIONS,
  type CoachAction,
  type CoachProposal,
  type FactorId,
  type RiskAssessment
} from './types';

export const COACH_SAFETY_VERSION = 'coach-safety-2026.11.1';

export function isAllowedAction(x: unknown): x is CoachAction {
  return typeof x === 'string' && (COACH_ACTIONS as readonly string[]).includes(x);
}

export interface CoachContext {
  planner: PlannerState;
  context: ContextProfile;
  screening: Partial<Record<ScreeningKey, Tri>>;
  prefs: Pick<UserPrefs, 'channels' | 'preferredChannel' | 'quietHours'>;
  /** True when the person's safety answers block plans; the coach then stays silent. */
  setupBlocked: boolean;
}

export interface Validation {
  ok: boolean;
  breaches: string[];
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

function inRange(time: string, from: string, to: string): boolean {
  return from <= to ? time >= from && time < to : time >= from || time < to;
}

export function validateProposal(p: { action: unknown; track?: Track; from: string; to: string }, ctx: CoachContext): Validation {
  const breaches: string[] = [];
  if (!isAllowedAction(p.action)) return { ok: false, breaches: ['action_not_allowed'] };
  if (ctx.setupBlocked) breaches.push('setup_blocked');
  const level = p.track ? ctx.planner.tracks[p.track].level : 0;
  switch (p.action) {
    case 'reduce_goal':
      if (!p.track || level <= 1 || Number(p.to) !== level - 1) breaches.push('reduce_invalid');
      break;
    case 'change_time': {
      if (!HHMM.test(p.to)) breaches.push('time_invalid');
      else {
        const q = ctx.prefs.quietHours;
        if (q.enabled && inRange(p.to, q.start, q.end)) breaches.push('time_in_quiet_hours');
        if (ctx.context.heat === 'hot' && p.track === 'activity' && inRange(p.to, COACH_CONFIG.heatAvoid.from, COACH_CONFIG.heatAvoid.to))
          breaches.push('time_in_heat');
      }
      break;
    }
    case 'swap_behaviour':
      if (p.track !== 'activity' || ctx.planner.tracks.activity.variant === 'alt') breaches.push('swap_invalid');
      break;
    case 'switch_channel':
      if (!['in-app', 'message', 'voice'].includes(p.to) || !ctx.prefs.channels[p.to as ChannelId] || p.to === ctx.prefs.preferredChannel)
        breaches.push('channel_invalid');
      break;
    case 'add_preshift_reminder':
      if (ctx.planner.preShift.enabled || !HHMM.test(p.to)) breaches.push('preshift_invalid');
      break;
    case 'pause_hydration_fasting':
      // One shared hydration rule: the same check the planner uses to hide the track.
      if (checkPlannerTargets({ hydrationGlasses: 0 }, ctx.screening).result === 'blocked') breaches.push('hydration_flagged');
      if (ctx.context.fasting !== 'ramadan' || ctx.planner.hydrationPausedFasting) breaches.push('pause_invalid');
      break;
  }
  return { ok: breaches.length === 0, breaches };
}

/** Reversible, low-risk actions are the only ones automatic adjustment may apply. */
export const AUTO_SAFE: readonly CoachAction[] = ['change_time', 'switch_channel', 'add_preshift_reminder'];

const BARRIER_ACTION: Record<Barrier, CoachAction> = {
  shift: 'add_preshift_reminder',
  tired: 'change_time',
  time: 'change_time',
  motivation: 'switch_channel',
  cost: 'swap_behaviour',
  sick: 'reduce_goal',
  travel: 'swap_behaviour',
  family: 'reduce_goal'
};

function weakestTrack(planner: PlannerState, ctx: CoachContext, today: string, completion: (t: Track) => number): Track | null {
  void today;
  const candidates = TRACKS.filter((t) => planner.tracks[t].level > 1 && !(t === 'hydration' && hydrationFlagged(ctx.screening)));
  if (!candidates.length) return null;
  return [...candidates].sort((a, b) => completion(a) - completion(b) || TRACKS.indexOf(a) - TRACKS.indexOf(b))[0];
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(n: number): string {
  const x = ((n % 1440) + 1440) % 1440;
  return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`;
}

interface Candidate {
  action: CoachAction;
  track?: Track;
  from: string;
  to: string;
  barrier?: Barrier;
}

export interface SelectOptions {
  input: CoachInput;
  risk: RiskAssessment;
  ctx: CoachContext;
  /** Per-track share of days done in the last 7, for choosing the weakest track. */
  trackCompletion: (t: Track) => number;
  id: string;
  nowIso: string;
}

/** Returns exactly one valid proposal, or null (below threshold, nothing applicable, or blocked). */
export function selectProposal(o: SelectOptions): CoachProposal | null {
  if (o.ctx.setupBlocked || o.risk.score < COACH_CONFIG.proposeAt) return null;
  // Context alone (shift, heat) is never a reason to nudge: there must be a lapse signal first.
  const lapseSignal = o.risk.factors.some((f) => (f.id === 'misses' || f.id === 'trend') && f.points > 0);
  if (!lapseSignal) return null;
  const { ctx, input } = o;
  const topIds = o.risk.top.map((f) => f.id);
  const topBarrier = o.risk.factors.find((f) => f.id === 'barriers')?.detail?.barrier as Barrier | undefined;
  const pre = minutesToTime(timeToMinutes(ctx.planner.tracks.activity.time ?? input.usualTime ?? '19:30') - COACH_CONFIG.times.preShiftLeadMinutes);
  const cool = ctx.context.heat === 'hot' ? COACH_CONFIG.times.cooler : null;
  const moveTo =
    ctx.context.shiftWork === 'night' ? COACH_CONFIG.times.nightShift
    : ctx.context.fasting === 'ramadan' ? COACH_CONFIG.times.afterIftar
    : cool ?? ((ctx.planner.tracks.activity.time ?? input.usualTime ?? '19:30') >= '18:00' ? COACH_CONFIG.times.morning : COACH_CONFIG.times.cooler);
  const weakest = weakestTrack(ctx.planner, ctx, input.today, o.trackCompletion);
  const channel = nextChannelFor(ctx.prefs);

  const byAction = (a: CoachAction, barrier?: Barrier): Candidate | null => {
    switch (a) {
      case 'reduce_goal':
        return weakest ? { action: a, track: weakest, from: String(ctx.planner.tracks[weakest].level), to: String(ctx.planner.tracks[weakest].level - 1), barrier } : null;
      case 'change_time':
        return { action: a, track: 'activity', from: ctx.planner.tracks.activity.time ?? input.usualTime ?? '19:30', to: moveTo, barrier };
      case 'swap_behaviour':
        return { action: a, track: 'activity', from: 'default', to: 'alt', barrier };
      case 'switch_channel':
        return channel ? { action: a, from: ctx.prefs.preferredChannel, to: channel, barrier } : null;
      case 'add_preshift_reminder':
        return { action: a, from: 'off', to: pre, barrier };
      case 'pause_hydration_fasting':
        return { action: a, track: 'hydration', from: 'on', to: 'paused', barrier };
    }
  };

  const ordered: (Candidate | null)[] = [];
  const byFactor: Partial<Record<FactorId, () => (Candidate | null)[]>> = {
    barriers: () => (topBarrier ? [byAction(BARRIER_ACTION[topBarrier], topBarrier)] : []),
    shift: () => [byAction('add_preshift_reminder')],
    heat: () => [ctx.context.fasting === 'ramadan' ? byAction('pause_hydration_fasting') : byAction('change_time')],
    sleepDebt: () => [byAction('change_time')],
    misses: () => [byAction('reduce_goal')],
    trend: () => [byAction('reduce_goal')]
  };
  // In Ramadan, missed hydration is addressed first by moving drinking to the hours after iftar.
  if (ctx.context.fasting === 'ramadan' && o.trackCompletion('hydration') < 0.5) ordered.push(byAction('pause_hydration_fasting'));
  // The barrier named in the last two days is the most specific signal: address it first.
  const fresh = [...input.barriers].filter((b) => b.date >= shiftDate(input.today, -2)).sort((x, y) => (x.date < y.date ? 1 : -1))[0];
  if (fresh && fresh.barrier in BARRIER_ACTION) ordered.push(byAction(BARRIER_ACTION[fresh.barrier as Barrier], fresh.barrier as Barrier));
  // A barrier named at least twice is the most specific signal: address it first.
  const barrierN = Number(o.risk.factors.find((f) => f.id === 'barriers')?.detail?.n ?? 0);
  if (topBarrier && barrierN >= 2) ordered.push(byAction(BARRIER_ACTION[topBarrier], topBarrier));
  for (const f of topIds) ordered.push(...(byFactor[f]?.() ?? []));
  // Safe fallbacks so a risky pattern still gets one valid, small step.
  ordered.push(byAction('reduce_goal'), byAction('switch_channel'), byAction('change_time'));

  for (const c of ordered) {
    if (!c) continue;
    if (!validateProposal(c, ctx).ok) continue;
    const reversible = AUTO_SAFE.includes(c.action);
    return {
      id: o.id,
      action: c.action,
      track: c.track,
      from: c.from,
      to: c.to,
      barrier: c.barrier,
      topFactors: topIds,
      score: o.risk.score,
      band: o.risk.band,
      effort: c.action === 'reduce_goal' || c.action === 'pause_hydration_fasting' ? 'low' : 'medium',
      reversible,
      configVersion: o.risk.configVersion,
      createdAt: o.nowIso,
      used: o.risk.used
    };
  }
  return null;
}
