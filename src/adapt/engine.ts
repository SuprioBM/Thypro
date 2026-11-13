/**
 * Rule-based adaptation engine. PURE and deterministic.
 *
 * Given one barrier ("what got in the way?") it proposes at most two small
 * changes, taken in order from the versioned rule table: shrink the goal, move
 * the time, switch the reminder channel, suggest sharing with family, or note
 * a low food budget. It never claims to learn or predict anything.
 */

import type {
  Adaptation,
  AdaptationAction,
  Barrier,
  ChannelId,
  ContextProfile,
  GoalType,
  UserPrefs
} from '../domain/types';
import { ADAPT_RULES, type AdaptRulesConfig } from './rules.config';

export interface AdaptInput {
  barrier: Barrier;
  goalType: GoalType;
  level: number;
  usualTime: string;
  context: ContextProfile;
  prefs: Pick<UserPrefs, 'channels' | 'preferredChannel'>;
  /** True when the ladder already stepped down for this lapse: no double shrink. */
  alreadySteppedDown: boolean;
  hasFamilyContact: boolean;
  familySharingOn: boolean;
}

export function suggestedTime(usualTime: string, ctx: ContextProfile, rules: AdaptRulesConfig = ADAPT_RULES): string {
  const slots = rules.timeSlots;
  let target: string;
  if (ctx.shiftWork === 'night' || ctx.shiftWork === 'rotating') target = slots.nightShift;
  else if (ctx.fasting === 'ramadan') target = slots.afterIftar;
  else target = usualTime >= '18:00' ? slots.morning : slots.evening;
  if (target === usualTime) target = target === slots.morning ? slots.evening : slots.morning;
  return target;
}

export function nextChannel(
  prefs: Pick<UserPrefs, 'channels' | 'preferredChannel'>,
  rules: AdaptRulesConfig = ADAPT_RULES
): ChannelId | null {
  const order = rules.channelOrder;
  const start = order.indexOf(prefs.preferredChannel);
  for (let step = 1; step < order.length; step++) {
    const candidate = order[(start + step) % order.length];
    if (prefs.channels[candidate]) return candidate;
  }
  return null;
}

function tryAction(action: AdaptationAction, input: AdaptInput, ruleId: string, rules: AdaptRulesConfig): Adaptation | null {
  const base = { action, ruleId, barrier: input.barrier };
  switch (action) {
    case 'shrink':
      if (input.level <= 1 || input.alreadySteppedDown) return null;
      return { ...base, from: String(input.level), to: String(input.level - 1) };
    case 'move_time': {
      const to = suggestedTime(input.usualTime, input.context, rules);
      return to === input.usualTime ? null : { ...base, from: input.usualTime, to };
    }
    case 'switch_channel': {
      const to = nextChannel(input.prefs, rules);
      return to ? { ...base, from: input.prefs.preferredChannel, to } : null;
    }
    case 'suggest_share':
      if (!input.hasFamilyContact || input.familySharingOn) return null;
      return { ...base, from: 'off', to: 'on' };
    case 'set_budget_low':
      if (input.goalType !== 'eating' || input.context.foodBudget === 'low') return null;
      return { ...base, from: input.context.foodBudget, to: 'low' };
    default:
      return null;
  }
}

export function proposeAdaptations(input: AdaptInput, rules: AdaptRulesConfig = ADAPT_RULES): Adaptation[] {
  const rule = rules.barrierRules.find((r) => r.barrier === input.barrier);
  if (!rule) return [];
  const out: Adaptation[] = [];
  for (const action of rule.actions) {
    if (out.length >= rules.maxPerBarrier) break;
    const a = tryAction(action, input, rule.id, rules);
    if (a) out.push(a);
  }
  return out;
}
