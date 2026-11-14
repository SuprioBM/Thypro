/**
 * Double progression: first add reps up to the top of the range, then add a
 * little load and start the range again. PURE.
 *
 * Fixed rules, written down so they can be checked:
 *  - Missed reps never add load.
 *  - Two sessions in a row with a missed set lower the load by 10%.
 *  - Bodyweight and holds never invent a load; at the top of the range the
 *    advice is a harder variation.
 */

import { getExercise } from './library';
import type { Exercise, LoggedExercise, Prescription, Target, WorkoutSession } from './types';

export const PROGRESSION_VERSION = 'prog-2026.11.1';

const round = (kg: number) => Math.round(kg * 2) / 2;

/** Done sets of an exercise from one session, or null if it was not done. */
function doneSets(s: WorkoutSession, exerciseId: string): LoggedExercise | null {
  const e = s.exercises.find((x) => x.exerciseId === exerciseId);
  if (!e) return null;
  const done = e.sets.filter((x) => x.done);
  return done.length > 0 ? { ...e, sets: done } : null;
}

/** Latest sessions (newest first) in which the exercise was done. */
export function history(sessions: WorkoutSession[], exerciseId: string, limit = 3): LoggedExercise[] {
  const out: LoggedExercise[] = [];
  for (let i = sessions.length - 1; i >= 0 && out.length < limit; i--) {
    const d = doneSets(sessions[i], exerciseId);
    if (d) out.push(d);
  }
  return out;
}

/** Hit the planned sets with every set at or above `min` reps? */
function metMin(e: LoggedExercise, rx: Prescription): boolean {
  return e.sets.length >= Math.min(e.planned, rx.sets) && e.sets.every((s) => s.reps >= rx.min);
}

function metMax(e: LoggedExercise, rx: Prescription): boolean {
  return e.sets.length >= Math.min(e.planned, rx.sets) && e.sets.every((s) => s.reps >= rx.max);
}

export function targetFor(exercise: Exercise, rx: Prescription, sessions: WorkoutSession[]): Target {
  const past = history(sessions, exercise.id, 2);
  const startKg = exercise.load === 'weight' ? exercise.startKg ?? 0 : 0;
  if (past.length === 0) return { weightKg: startKg, reps: rx.min, reason: 'first_time' };

  const last = past[0];
  const weight = exercise.load === 'weight' ? Math.max(...last.sets.map((s) => s.weightKg)) : 0;
  const lowestReps = Math.min(...last.sets.map((s) => s.reps));

  if (!metMin(last, rx)) {
    const before = past[1];
    if (exercise.load === 'weight' && before && !metMin(before, rx)) {
      return { weightKg: round(Math.max(startKg, weight * 0.9)), reps: rx.min, reason: 'deload' };
    }
    return { weightKg: weight, reps: rx.min, reason: 'hold' };
  }

  if (metMax(last, rx)) {
    if (exercise.load === 'weight') {
      return { weightKg: round(weight + (exercise.stepKg ?? 1)), reps: rx.min, reason: 'add_load' };
    }
    return { weightKg: 0, reps: rx.max, reason: 'harder_variation' };
  }

  return { weightKg: weight, reps: Math.min(lowestReps + 1, rx.max), reason: 'add_rep' };
}

/** Sets to plan for today: one fewer on a lighter week or a cautious start (never below 1). */
export function setsFor(rx: Prescription, light: boolean): number {
  return light ? Math.max(1, rx.sets - 1) : rx.sets;
}

export function targetsForRoutine(items: Prescription[], sessions: WorkoutSession[]): { rx: Prescription; target: Target }[] {
  return items.flatMap((rx) => {
    const ex = getExercise(rx.exerciseId);
    return ex ? [{ rx, target: targetFor(ex, rx, sessions) }] : [];
  });
}
