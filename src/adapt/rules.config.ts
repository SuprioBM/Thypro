import type { AdaptationAction, Barrier, ChannelId } from '../domain/types';

/**
 * Versioned rules for the small-step ladder and the barrier-based adaptation
 * engine. DATA ONLY: engine.ts and ladder.ts read it and hold no numbers of
 * their own. This is a fixed rule table, not machine learning.
 *
 * Like the safety rules, the owner is a placeholder until a named, accountable
 * person (clinical or behavioural-science lead) is appointed.
 */

export interface BarrierRule {
  id: string;
  barrier: Barrier;
  /** Tried in order; the first `maxPerBarrier` that apply are proposed. */
  actions: AdaptationAction[];
}

export interface AdaptRulesConfig {
  version: string;
  owner: string;
  reviewStatus: 'pending_review' | 'reviewed';
  ladder: {
    /** Consecutive missed days (skipped or no check-in) before one step down. */
    missesToStepDown: number;
    /** Done days in the last 7 that count as a good week (step-up offer). */
    goodWeekDone: number;
    /** Days to stay at a level before a step up is offered. */
    minDaysAtLevel: number;
    /** Days before re-offering a step up the person declined. */
    declineCooldownDays: number;
  };
  maxPerBarrier: number;
  barrierRules: BarrierRule[];
  timeSlots: { nightShift: string; afterIftar: string; morning: string; evening: string };
  channelOrder: ChannelId[];
}

export const ADAPT_RULES: AdaptRulesConfig = {
  version: 'adapt-2026.11.1',
  owner: 'Behaviour-change lead — to be appointed (placeholder)',
  reviewStatus: 'pending_review',
  ladder: { missesToStepDown: 2, goodWeekDone: 5, minDaysAtLevel: 7, declineCooldownDays: 7 },
  maxPerBarrier: 2,
  barrierRules: [
    { id: 'A-TIME', barrier: 'time', actions: ['move_time', 'shrink'] },
    { id: 'A-TIRED', barrier: 'tired', actions: ['move_time', 'shrink'] },
    { id: 'A-SICK', barrier: 'sick', actions: ['shrink'] },
    { id: 'A-TRAVEL', barrier: 'travel', actions: ['switch_channel', 'shrink'] },
    { id: 'A-SHIFT', barrier: 'shift', actions: ['move_time', 'switch_channel'] },
    { id: 'A-MOTIVATION', barrier: 'motivation', actions: ['switch_channel', 'suggest_share', 'shrink'] },
    { id: 'A-COST', barrier: 'cost', actions: ['set_budget_low', 'shrink'] },
    { id: 'A-FAMILY', barrier: 'family', actions: ['suggest_share', 'move_time'] }
  ],
  timeSlots: { nightShift: '16:30', afterIftar: '20:30', morning: '07:00', evening: '19:00' },
  channelOrder: ['in-app', 'message', 'voice']
};
