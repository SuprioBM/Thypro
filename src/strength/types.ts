/**
 * Strength & mobility: types. A gentle, plain take on strength training for
 * adults, including older adults. Pure data; no UI, no clock.
 *
 * Ideas such as per-weekday plans or a rotation, double progression, personal
 * records and a body map are common to many training logs. Everything here is
 * written fresh for Thypro: no code, artwork or media is copied from any
 * other project.
 */

import type { Lang } from '../domain/types';

export type Muscle = 'chest' | 'shoulders' | 'arms' | 'back' | 'core' | 'glutes' | 'quads' | 'hamstrings' | 'calves';
export const MUSCLES: readonly Muscle[] = ['chest', 'shoulders', 'arms', 'back', 'core', 'glutes', 'quads', 'hamstrings', 'calves'] as const;

export type Pattern = 'squat' | 'push' | 'pull' | 'hinge' | 'core' | 'balance' | 'mobility';
export const PATTERNS: readonly Pattern[] = ['squat', 'push', 'pull', 'hinge', 'core', 'balance', 'mobility'] as const;

export type Equipment = 'none' | 'chair' | 'wall' | 'band' | 'dumbbell';
export const EQUIPMENT: readonly Equipment[] = ['none', 'chair', 'wall', 'band', 'dumbbell'] as const;

/**
 * weight: reps with a load in kg. bodyweight: reps, no load to enter.
 * hold: seconds held (the "reps" fields hold seconds).
 */
export type LoadKind = 'weight' | 'bodyweight' | 'hold';

export interface Exercise {
  id: string;
  pattern: Pattern;
  /** Primary muscle first; the rest count as half a set. */
  muscles: Muscle[];
  equipment: Equipment;
  load: LoadKind;
  /** Weight loads only. */
  startKg?: number;
  stepKg?: number;
  /** [name, how to do it] in each language. */
  t: Record<Lang, [string, string]>;
}

export interface Prescription {
  exerciseId: string;
  sets: number;
  /** Rep (or seconds) range for double progression. */
  min: number;
  max: number;
  restSec: number;
}

export interface Routine {
  id: string;
  name: Record<Lang, string>;
  items: Prescription[];
}

export type ScheduleMode = 'weekly' | 'rotation';

export interface StarterPlan {
  id: string;
  name: Record<Lang, string>;
  blurb: Record<Lang, string>;
  mode: ScheduleMode;
  routines: Routine[];
  /** Monday first. Routine id or null (rest). Used in weekly mode. */
  weekdays: (string | null)[];
  minutes: number;
  needs: Equipment[];
}

export interface ActivePlan {
  starterId: string;
  name: Record<Lang, string>;
  mode: ScheduleMode;
  routines: Routine[];
  weekdays: (string | null)[];
  startedOn: string;
  /** Until this date (inclusive) every routine runs with one set fewer. */
  lightUntil?: string;
  /** Safety answers were not all "no": start lighter. */
  cautious: boolean;
}

export type ProgressionReason = 'first_time' | 'add_load' | 'add_rep' | 'hold' | 'deload' | 'harder_variation';

export interface Target {
  weightKg: number;
  reps: number;
  reason: ProgressionReason;
}

export interface LoggedSet {
  reps: number;
  weightKg: number;
  done: boolean;
}

export interface LoggedExercise {
  exerciseId: string;
  target: Target;
  /** Sets the routine asked for (before any "lighter" cut). */
  planned: number;
  sets: LoggedSet[];
}

export interface RecordHit {
  exerciseId: string;
  kind: 'weight' | 'reps' | 'hold';
  value: number;
}

export interface WorkoutSession {
  id: string;
  planId: string;
  routineId: string;
  date: string;
  startedAt: string;
  endedAt?: string;
  exercises: LoggedExercise[];
  /** Ended early because the person did not feel well. */
  stopped?: 'unwell';
  minutes: number;
  records: RecordHit[];
}

export type ScreenResult = 'pass' | 'caution' | 'blocked';

export interface StrengthState {
  plan: ActivePlan | null;
  /** Newest last. */
  sessions: WorkoutSession[];
  /** A workout in progress; survives a page refresh. */
  draft: WorkoutSession | null;
  bodyWeights: { date: string; kg: number }[];
  screening: { at: string; result: ScreenResult } | null;
}

export const EMPTY_STRENGTH: StrengthState = {
  plan: null,
  sessions: [],
  draft: null,
  bodyWeights: [],
  screening: null
};
