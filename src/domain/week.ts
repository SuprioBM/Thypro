/**
 * Weekly review and restart logic. PURE: "today" is always passed in.
 *
 * Principles baked in here:
 *  - Missing data is reported as missing. It is never counted as a failure.
 *  - No penalties, no negative scores. A streak of 0 is simply "no current run".
 *  - Trend wording is neutral; it never judges the person.
 */

import type { CheckIn } from './types';

export type DayState = 'done' | 'skipped' | 'unknown' | 'missing';

export interface DaySummary {
  date: string;
  state: DayState;
  checkin?: CheckIn;
}

export type Trend = 'up' | 'same' | 'down' | 'no_data';

export interface WeekStats {
  days: DaySummary[];
  done: number;
  skipped: number;
  unknown: number;
  missing: number;
  /** done / 7 — only a visual fill, never shown as a grade. */
  fill: number;
  previousDone: number;
  trend: Trend;
  /** Consecutive "done" days ending today (or yesterday if today is not logged yet). */
  currentRun: number;
  /** Longest run of consecutive "done" days in the last 28 days. */
  bestRun: number;
}

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function shiftDate(dateKey: string, delta: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return dt.toISOString().slice(0, 10);
}

function indexByDate(checkins: CheckIn[]): Map<string, CheckIn> {
  const map = new Map<string, CheckIn>();
  for (const c of checkins) map.set(c.date, c);
  return map;
}

/** The `length` days ending on `endDate` (inclusive), oldest first. */
export function buildDays(checkins: CheckIn[], endDate: string, length = 7): DaySummary[] {
  const byDate = indexByDate(checkins);
  const out: DaySummary[] = [];
  for (let i = length - 1; i >= 0; i--) {
    const date = shiftDate(endDate, -i);
    const checkin = byDate.get(date);
    out.push({ date, state: checkin ? checkin.status : 'missing', checkin });
  }
  return out;
}

function countState(days: DaySummary[], state: DayState): number {
  return days.filter((d) => d.state === state).length;
}

export function weeklyStats(checkins: CheckIn[], today: string): WeekStats {
  const days = buildDays(checkins, today, 7);
  const previous = buildDays(checkins, shiftDate(today, -7), 7);
  const done = countState(days, 'done');
  const previousDone = countState(previous, 'done');
  const previousMissing = countState(previous, 'missing');

  let trend: Trend;
  if (previousMissing === 7 || countState(days, 'missing') === 7) trend = 'no_data';
  else if (done > previousDone) trend = 'up';
  else if (done < previousDone) trend = 'down';
  else trend = 'same';

  // Current run: if today is not logged yet, begin from yesterday so a day in
  // progress never reads as a broken streak.
  const byDate = indexByDate(checkins);
  let cursor = byDate.has(today) ? today : shiftDate(today, -1);
  let currentRun = 0;
  while (byDate.get(cursor)?.status === 'done') {
    currentRun += 1;
    cursor = shiftDate(cursor, -1);
  }

  let bestRun = 0;
  let run = 0;
  for (const d of buildDays(checkins, today, 28)) {
    if (d.state === 'done') {
      run += 1;
      bestRun = Math.max(bestRun, run);
    } else {
      run = 0;
    }
  }

  return {
    days,
    done,
    skipped: countState(days, 'skipped'),
    unknown: countState(days, 'unknown'),
    missing: countState(days, 'missing'),
    fill: done / 7,
    previousDone,
    trend,
    currentRun,
    bestRun
  };
}

export interface RestartState {
  needed: boolean;
  /** Whole days since the last "done" check-in (today not counted if unlogged). */
  daysSince: number;
}

/**
 * A gentle restart is offered after `threshold` days without a "done"
 * check-in, but only for someone who has begun (has at least one check-in).
 * It is an offer, never a warning.
 */
export function restartState(checkins: CheckIn[], today: string, threshold = 2): RestartState {
  if (checkins.length === 0) return { needed: false, daysSince: 0 };
  const lastDone = checkins
    .filter((c) => c.status === 'done')
    .map((c) => c.date)
    .sort()
    .pop();
  if (!lastDone) return { needed: checkins.length >= threshold, daysSince: checkins.length };
  const byDate = indexByDate(checkins);
  // Today counts only if it is already "done" (then lastDone === today, daysSince 0).
  const end = byDate.has(today) ? today : shiftDate(today, -1);
  let daysSince = 0;
  let cursor = end;
  while (cursor > lastDone) {
    daysSince += 1;
    cursor = shiftDate(cursor, -1);
  }
  return { needed: daysSince >= threshold, daysSince };
}
