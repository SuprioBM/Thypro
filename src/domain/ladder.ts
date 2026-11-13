/**
 * Small-step ladder and lapse detector. PURE: "today" is always passed in.
 *
 *  - A lapse is N consecutive days without a "done" check-in (a skipped day or
 *    a day with no check-in at all). "Not sure" is not a miss.
 *  - After a lapse the goal steps down one level, once per lapse.
 *  - After a good week a step up is OFFERED; the person may decline.
 *  - Progress is counted as cumulative done days. Nothing ever resets to zero.
 */

import { ADAPT_RULES, type AdaptRulesConfig } from '../adapt/rules.config';
import type { CheckIn, GoalProgress } from './types';
import { shiftDate, weeklyStats } from './week';

export interface Lapse {
  lapsed: boolean;
  /** Consecutive missed days counted back from today (or yesterday if today is not logged). */
  missedDays: number;
  /** Identifies this lapse: the date of the last done day (or the first check-in if none). */
  episodeKey: string;
}

export function detectLapse(
  checkins: CheckIn[],
  today: string,
  threshold: number = ADAPT_RULES.ladder.missesToStepDown
): Lapse {
  if (checkins.length === 0) return { lapsed: false, missedDays: 0, episodeKey: '' };
  const byDate = new Map(checkins.map((c) => [c.date, c]));
  const dates = checkins.map((c) => c.date).sort();
  const first = dates[0];
  const doneDates = checkins.filter((c) => c.status === 'done').map((c) => c.date).sort();
  const episodeKey = doneDates.length ? doneDates[doneDates.length - 1] : first;

  let cursor = byDate.has(today) ? today : shiftDate(today, -1);
  let missedDays = 0;
  while (cursor >= first) {
    const c = byDate.get(cursor);
    if (c && c.status !== 'skipped') break; // done or "not sure" ends the run
    missedDays += 1;
    cursor = shiftDate(cursor, -1);
  }
  return { lapsed: missedDays >= threshold, missedDays, episodeKey };
}

/** Every done day ever recorded. It only grows. */
export function cumulativeDays(checkins: CheckIn[]): number {
  return checkins.filter((c) => c.status === 'done').length;
}

export function daysBetween(fromDate: string, toDate: string): number {
  const a = Date.UTC(+fromDate.slice(0, 4), +fromDate.slice(5, 7) - 1, +fromDate.slice(8, 10));
  const b = Date.UTC(+toDate.slice(0, 4), +toDate.slice(5, 7) - 1, +toDate.slice(8, 10));
  return Math.round((b - a) / 86400000);
}

export interface StepDownDecision {
  stepDown: boolean;
  from: number;
  to: number;
  episodeKey: string;
}

export function evaluateStepDown(
  progress: GoalProgress,
  checkins: CheckIn[],
  today: string,
  rules: AdaptRulesConfig = ADAPT_RULES
): StepDownDecision {
  const lapse = detectLapse(checkins, today, rules.ladder.missesToStepDown);
  const stepDown = lapse.lapsed && progress.level > 1 && progress.lastStepDownEpisode !== lapse.episodeKey;
  return {
    stepDown,
    from: progress.level,
    to: stepDown ? progress.level - 1 : progress.level,
    episodeKey: lapse.episodeKey
  };
}

/** A step up is only ever an offer. */
export function stepUpOffer(
  progress: GoalProgress,
  checkins: CheckIn[],
  today: string,
  maxLevel: number,
  rules: AdaptRulesConfig = ADAPT_RULES
): boolean {
  if (progress.level >= maxLevel) return false;
  if (detectLapse(checkins, today, rules.ladder.missesToStepDown).lapsed) return false;
  if (weeklyStats(checkins, today).done < rules.ladder.goodWeekDone) return false;
  if (progress.lastChange && daysBetween(progress.lastChange.date, today) < rules.ladder.minDaysAtLevel) return false;
  if (progress.declinedUpOn && daysBetween(progress.declinedUpOn, today) < rules.ladder.declineCooldownDays) return false;
  return true;
}
