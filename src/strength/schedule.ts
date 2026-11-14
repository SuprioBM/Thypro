/**
 * Which routine is next. PURE.
 *
 *  weekly:   the routine set for today's weekday (Monday first).
 *  rotation: A, B, A, B...: the next session is simply the next one you have
 *            not done, however the week went.
 */

import type { ActivePlan, Routine, WorkoutSession } from './types';

/** 0 = Monday ... 6 = Sunday. */
export function weekdayIndex(dateKey: string): number {
  return (new Date(`${dateKey}T12:00:00`).getDay() + 6) % 7;
}

export interface NextSession {
  routine: Routine | null;
  /** A session for this plan was already finished today. */
  doneToday: boolean;
  /** Weekly mode, rest day: the next weekday that has a routine. */
  nextDay?: { index: number; routine: Routine };
}

export function nextSession(plan: ActivePlan, sessions: WorkoutSession[], today: string): NextSession {
  const mine = sessions.filter((s) => s.planId === plan.starterId);
  const doneToday = mine.some((s) => s.date === today);
  const byId = new Map(plan.routines.map((r) => [r.id, r]));

  if (plan.mode === 'rotation') {
    const last = mine[mine.length - 1];
    const lastIdx = last ? plan.routines.findIndex((r) => r.id === last.routineId) : -1;
    return { routine: plan.routines[(lastIdx + 1) % plan.routines.length] ?? null, doneToday };
  }

  const todayIdx = weekdayIndex(today);
  const todays = plan.weekdays[todayIdx];
  const routine = todays ? byId.get(todays) ?? null : null;
  let nextDay: NextSession['nextDay'];
  if (!routine || doneToday) {
    for (let step = 1; step <= 7; step++) {
      const idx = (todayIdx + step) % 7;
      const id = plan.weekdays[idx];
      const r = id ? byId.get(id) : undefined;
      if (r) {
        nextDay = { index: idx, routine: r };
        break;
      }
    }
  }
  return { routine, doneToday, nextDay };
}

/** Is a lighter week in force on `today`? */
export function isLight(plan: ActivePlan, today: string): boolean {
  return plan.cautious || (plan.lightUntil !== undefined && today <= plan.lightUntil);
}
