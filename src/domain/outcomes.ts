/**
 * Personal outcome measures for the pilot. PURE.
 *
 *  - persistence: done days ÷ days since the first check-in
 *  - recovery: after each lapse (2+ days without a done day), how many days
 *    passed before the next done day
 *  - activity minutes, and the latest optional self-recorded BP and weight
 *
 * Self-recorded values are never interpreted. They are counted and shown.
 */

import { ADAPT_RULES } from '../adapt/rules.config';
import type { CheckIn } from './types';
import { daysBetween } from './ladder';
import { shiftDate } from './week';

export interface Outcomes {
  doneDays: number;
  spanDays: number;
  /** 0..1, or null before the first check-in. */
  persistence: number | null;
  /** Days without a done day before each resumption. */
  recoveries: number[];
  medianRecovery: number | null;
  activityMinutes: number;
  latestBp: { systolic: number; diastolic: number; date: string } | null;
  latestWeight: { kg: number; date: string } | null;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function computeOutcomes(checkins: CheckIn[], today: string, lapseDays = ADAPT_RULES.ladder.missesToStepDown): Outcomes {
  const sorted = [...checkins].sort((a, b) => (a.date < b.date ? -1 : 1));
  const empty: Outcomes = {
    doneDays: 0,
    spanDays: 0,
    persistence: null,
    recoveries: [],
    medianRecovery: null,
    activityMinutes: 0,
    latestBp: null,
    latestWeight: null
  };
  if (sorted.length === 0) return empty;

  const byDate = new Map(sorted.map((c) => [c.date, c]));
  const first = sorted[0].date;
  const spanDays = daysBetween(first, today) + 1;
  const doneDays = sorted.filter((c) => c.status === 'done').length;

  const recoveries: number[] = [];
  let run = 0;
  for (let d = first; d <= today; d = shiftDate(d, 1)) {
    const c = byDate.get(d);
    if (c?.status === 'done') {
      if (run >= lapseDays) recoveries.push(run);
      run = 0;
    } else if (c?.status === 'unknown') {
      run = 0; // "not sure" is not a miss
    } else {
      run += 1;
    }
  }

  const withBp = sorted.filter((c) => c.bp);
  const withWeight = sorted.filter((c) => c.weightKg !== undefined);
  const lastBp = withBp[withBp.length - 1];
  const lastW = withWeight[withWeight.length - 1];

  return {
    doneDays,
    spanDays,
    persistence: spanDays > 0 ? doneDays / spanDays : null,
    recoveries,
    medianRecovery: median(recoveries),
    activityMinutes: sorted.reduce((sum, c) => sum + (c.activityMinutes ?? 0), 0),
    latestBp: lastBp?.bp ? { ...lastBp.bp, date: lastBp.date } : null,
    latestWeight: lastW?.weightKg !== undefined ? { kg: lastW.weightKg, date: lastW.date } : null
  };
}
