/**
 * Per-track runs. PURE.
 *
 * - current run: consecutive done days ending today (or yesterday while today is open).
 * - best run: the longest run ever.
 * - total: all done days. It NEVER resets and is never derived from the run.
 * - A missed day pauses the run (it restarts from 0 on the next done day), unless a
 *   weekly freeze covers it. One freeze per ISO week (Mon–Sun), applied automatically
 *   to that week's first miss, and only when there is a run to protect.
 */

import { shiftDate } from '../domain/week';
import { PLANNER_RULES, type Track } from './config';
import type { PlannerState } from './types';

export interface RunStats {
  current: number;
  best: number;
  total: number;
  /** Dates a freeze covered. Deterministic: the same entries always give the same list. */
  frozen: string[];
  /** True when the run is paused by a miss and not yet restarted. */
  paused: boolean;
  /** Today is still open (not yet done), so it is not counted as a miss. */
  todayDone: boolean;
}

export function weekKey(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return shiftDate(date, -((dow + 6) % 7));
}

export function computeRun(planner: PlannerState, track: Track, today: string): RunStats {
  const start = planner.startedOn;
  const total = Object.values(planner.entries).filter((e) => e[track]?.done).length;
  const empty: RunStats = { current: 0, best: 0, total, frozen: [], paused: false, todayDone: false };
  if (!start || start > today) return empty;

  let run = 0;
  let best = 0;
  const frozen: string[] = [];
  const freezeUsed = new Map<string, number>();
  let missedLast = false;

  for (let day = start; day <= today; day = shiftDate(day, 1)) {
    const done = planner.entries[day]?.[track]?.done === true;
    if (done) {
      run += 1;
      best = Math.max(best, run);
      missedLast = false;
      continue;
    }
    if (day === today) break; // the day is still open
    const wk = weekKey(day);
    if (run > 0 && (freezeUsed.get(wk) ?? 0) < PLANNER_RULES.freezesPerWeek) {
      freezeUsed.set(wk, (freezeUsed.get(wk) ?? 0) + 1);
      frozen.push(day);
      continue; // run is kept, not extended
    }
    run = 0;
    missedLast = true;
  }
  return { current: run, best, total, frozen, paused: missedLast && run === 0, todayDone: planner.entries[today]?.[track]?.done === true };
}

/** Consecutive missed days ending yesterday (freezes are not misses). Used for step-down. */
export function consecutiveMisses(planner: PlannerState, track: Track, today: string): number {
  if (!planner.startedOn) return 0;
  const frozen = new Set(computeRun(planner, track, today).frozen);
  let n = 0;
  for (let day = shiftDate(today, -1); day >= planner.startedOn; day = shiftDate(day, -1)) {
    if (planner.entries[day]?.[track]?.done) break;
    if (frozen.has(day)) break;
    n += 1;
  }
  return n;
}

export function doneInLast7(planner: PlannerState, track: Track, today: string): number {
  let n = 0;
  for (let i = 0; i < 7; i++) if (planner.entries[shiftDate(today, -i)]?.[track]?.done) n += 1;
  return n;
}
