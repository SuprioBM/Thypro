import type { Lang } from '../domain/types';
import { getExercise } from './library';
import type { Exercise, Prescription, WorkoutSession } from './types';

export const exName = (id: string, lang: Lang): string => {
  const e = getExercise(id);
  return e ? e.t[lang][0] : id;
};

export const exHow = (e: Exercise, lang: Lang): string => e.t[lang][1];

/** "8–12" or "20–40", the unit comes from the translated label. */
export const rangeText = (rx: Pick<Prescription, 'min' | 'max'>): string => (rx.min === rx.max ? `${rx.min}` : `${rx.min}–${rx.max}`);

/** Rough length of a routine: 45 s per set plus its rest, rounded to 5 min. */
export function estimateMinutes(items: Prescription[]): number {
  const seconds = items.reduce((n, rx) => n + rx.sets * (45 + rx.restSec), 0);
  return Math.max(5, Math.round(seconds / 60 / 5) * 5);
}

/** Total moved (kg × reps) over done weighted sets. Bodyweight sets add nothing. */
export function liftedKg(session: Pick<WorkoutSession, 'exercises'>): number {
  let kg = 0;
  for (const e of session.exercises) for (const s of e.sets) if (s.done && s.weightKg > 0) kg += s.weightKg * s.reps;
  return Math.round(kg);
}
