/**
 * Personal records, muscle load and simple training stats. PURE.
 */

import { daysBetween } from '../domain/ladder';
import { shiftDate } from '../domain/week';
import { getExercise } from './library';
import type { Muscle, RecordHit, WorkoutSession } from './types';
import { MUSCLES } from './types';

/** Best values of an exercise over earlier sessions. */
function bests(sessions: WorkoutSession[], exerciseId: string) {
  let weight = 0;
  let reps = 0;
  let hold = 0;
  for (const s of sessions) {
    const e = s.exercises.find((x) => x.exerciseId === exerciseId);
    if (!e) continue;
    for (const set of e.sets) {
      if (!set.done) continue;
      weight = Math.max(weight, set.weightKg);
      reps = Math.max(reps, set.reps);
      hold = Math.max(hold, set.reps);
    }
  }
  return { weight, reps, hold };
}

/**
 * Records set in `session` compared with everything before it. A first-ever
 * session never counts as a "record" (there is nothing to beat).
 */
export function detectRecords(before: WorkoutSession[], session: WorkoutSession): RecordHit[] {
  const hits: RecordHit[] = [];
  for (const e of session.exercises) {
    const ex = getExercise(e.exerciseId);
    const done = e.sets.filter((s) => s.done);
    if (!ex || done.length === 0) continue;
    const has = before.some((b) => b.exercises.some((x) => x.exerciseId === e.exerciseId && x.sets.some((s) => s.done)));
    if (!has) continue;
    const prev = bests(before, e.exerciseId);
    const topWeight = Math.max(...done.map((s) => s.weightKg));
    const topReps = Math.max(...done.map((s) => s.reps));
    if (ex.load === 'weight' && topWeight > prev.weight) hits.push({ exerciseId: e.exerciseId, kind: 'weight', value: topWeight });
    else if (ex.load === 'bodyweight' && topReps > prev.reps) hits.push({ exerciseId: e.exerciseId, kind: 'reps', value: topReps });
    else if (ex.load === 'hold' && topReps > prev.hold) hits.push({ exerciseId: e.exerciseId, kind: 'hold', value: topReps });
  }
  return hits;
}

/** Done sets per muscle (primary = 1, others = 0.5) in sessions from `since` (inclusive). */
export function muscleSets(sessions: WorkoutSession[], since: string): Record<Muscle, number> {
  const out = Object.fromEntries(MUSCLES.map((m) => [m, 0])) as Record<Muscle, number>;
  for (const s of sessions) {
    if (s.date < since) continue;
    for (const e of s.exercises) {
      const ex = getExercise(e.exerciseId);
      if (!ex) continue;
      const n = e.sets.filter((x) => x.done).length;
      ex.muscles.forEach((m, i) => {
        out[m] += n * (i === 0 ? 1 : 0.5);
      });
    }
  }
  return out;
}

/** 0..1 for the body map. Ten weekly sets of a muscle is "full". */
export function loadLevel(sets: number, full = 10): number {
  return Math.max(0, Math.min(1, sets / full));
}

/** Days since each muscle was last trained; null if never. */
export function daysSinceTrained(sessions: WorkoutSession[], today: string): Record<Muscle, number | null> {
  const out = Object.fromEntries(MUSCLES.map((m) => [m, null])) as Record<Muscle, number | null>;
  for (const s of sessions) {
    const d = daysBetween(s.date, today);
    for (const e of s.exercises) {
      const ex = getExercise(e.exerciseId);
      if (!ex || !e.sets.some((x) => x.done)) continue;
      for (const m of ex.muscles) out[m] = out[m] === null ? d : Math.min(out[m] as number, d);
    }
  }
  return out;
}

/** Sessions per day for the last `weeks` weeks, oldest first, ending today. */
export function activityGrid(sessions: WorkoutSession[], today: string, weeks = 8): { date: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const s of sessions) counts.set(s.date, (counts.get(s.date) ?? 0) + 1);
  const days = weeks * 7;
  return Array.from({ length: days }, (_, i) => {
    const date = shiftDate(today, i - (days - 1));
    return { date, count: counts.get(date) ?? 0 };
  });
}

export interface StrengthStats {
  sessions: number;
  minutes: number;
  records: number;
  lastDate: string | null;
  thisWeek: number;
}

export function strengthStats(sessions: WorkoutSession[], today: string): StrengthStats {
  const weekStart = shiftDate(today, -6);
  return {
    sessions: sessions.length,
    minutes: sessions.reduce((n, s) => n + s.minutes, 0),
    records: sessions.reduce((n, s) => n + s.records.length, 0),
    lastDate: sessions.length ? sessions[sessions.length - 1].date : null,
    thisWeek: sessions.filter((s) => s.date >= weekStart && s.date <= today).length
  };
}

/** Latest first. */
export function recordList(sessions: WorkoutSession[]): (RecordHit & { date: string })[] {
  const out: (RecordHit & { date: string })[] = [];
  for (let i = sessions.length - 1; i >= 0; i--) for (const r of sessions[i].records) out.push({ ...r, date: sessions[i].date });
  return out;
}
