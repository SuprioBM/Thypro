/**
 * Strength state transitions. PURE: ids and times arrive inside the action.
 */

import { getExercise } from './library';
import { getStarter } from './plans';
import { setsFor, targetsForRoutine } from './progression';
import { detectRecords } from './records';
import { isLight } from './schedule';
import { screenStrength, type ScreenAnswers } from './safety';
import type { ActivePlan, LoggedExercise, LoggedSet, ScheduleMode, StrengthState, WorkoutSession } from './types';

export type StrengthAction =
  | { type: 'screen'; answers: ScreenAnswers; nowIso: string }
  | { type: 'startPlan'; starterId: string; today: string }
  | { type: 'stopPlan' }
  | { type: 'setMode'; mode: ScheduleMode }
  | { type: 'setLight'; until: string | null }
  | { type: 'startWorkout'; routineId: string; id: string; nowIso: string; today: string }
  | { type: 'setSet'; ex: number; set: number; patch: Partial<LoggedSet> }
  | { type: 'addSet'; ex: number }
  | { type: 'removeSet'; ex: number; set: number }
  | { type: 'finishWorkout'; nowIso: string; stopped?: 'unwell' }
  | { type: 'discardWorkout' }
  | { type: 'deleteSession'; id: string }
  | { type: 'logBodyWeight'; date: string; kg: number };

/** Monday, Wednesday, Friday, taking the routines in turn. */
export function defaultWeekdays(routineIds: string[]): (string | null)[] {
  const out: (string | null)[] = [null, null, null, null, null, null, null];
  if (routineIds.length === 0) return out;
  [0, 2, 4].forEach((day, i) => {
    out[day] = routineIds[i % routineIds.length];
  });
  return out;
}

function buildPlan(starterId: string, today: string, cautious: boolean): ActivePlan | null {
  const starter = getStarter(starterId);
  if (!starter) return null;
  return {
    starterId,
    name: starter.name,
    mode: starter.mode,
    routines: starter.routines,
    weekdays: starter.weekdays,
    startedOn: today,
    cautious
  };
}

function finish(state: StrengthState, nowIso: string, stopped?: 'unwell'): StrengthState {
  const draft = state.draft;
  if (!draft) return state;
  const exercises: LoggedExercise[] = draft.exercises
    .map((e) => ({ ...e, sets: e.sets.filter((s) => s.done) }))
    .filter((e) => e.sets.length > 0);
  if (exercises.length === 0) return { ...state, draft: null };
  const minutes = Math.min(240, Math.max(1, Math.round((Date.parse(nowIso) - Date.parse(draft.startedAt)) / 60000)));
  const session: WorkoutSession = { ...draft, exercises, endedAt: nowIso, minutes, stopped, records: [] };
  session.records = detectRecords(state.sessions, session);
  return { ...state, draft: null, sessions: [...state.sessions, session] };
}

export function strengthReducer(state: StrengthState, action: StrengthAction): StrengthState {
  switch (action.type) {
    case 'screen':
      return { ...state, screening: { at: action.nowIso, result: screenStrength(action.answers) } };

    case 'startPlan': {
      if (!state.screening || state.screening.result === 'blocked') return state;
      const plan = buildPlan(action.starterId, action.today, state.screening.result === 'caution');
      return plan ? { ...state, plan } : state;
    }

    case 'stopPlan':
      return { ...state, plan: null, draft: null };

    case 'setMode': {
      if (!state.plan || state.plan.mode === action.mode) return state;
      const weekdays = action.mode === 'weekly' && state.plan.weekdays.every((d) => d === null)
        ? defaultWeekdays(state.plan.routines.map((r) => r.id))
        : state.plan.weekdays;
      return { ...state, plan: { ...state.plan, mode: action.mode, weekdays } };
    }

    case 'setLight': {
      if (!state.plan) return state;
      const { lightUntil: _drop, ...rest } = state.plan;
      return { ...state, plan: action.until ? { ...rest, lightUntil: action.until } : rest };
    }

    case 'startWorkout': {
      if (!state.plan || state.draft) return state;
      const routine = state.plan.routines.find((r) => r.id === action.routineId);
      if (!routine) return state;
      const light = isLight(state.plan, action.today);
      const exercises: LoggedExercise[] = targetsForRoutine(routine.items, state.sessions).map(({ rx, target }) => ({
        exerciseId: rx.exerciseId,
        target,
        planned: rx.sets,
        sets: Array.from({ length: setsFor(rx, light) }, () => ({ reps: target.reps, weightKg: target.weightKg, done: false }))
      }));
      const draft: WorkoutSession = {
        id: action.id,
        planId: state.plan.starterId,
        routineId: routine.id,
        date: action.today,
        startedAt: action.nowIso,
        exercises,
        minutes: 0,
        records: []
      };
      return { ...state, draft };
    }

    case 'setSet': {
      if (!state.draft) return state;
      const exercises = state.draft.exercises.map((e, i) =>
        i !== action.ex ? e : { ...e, sets: e.sets.map((s, j) => (j === action.set ? { ...s, ...action.patch } : s)) }
      );
      return { ...state, draft: { ...state.draft, exercises } };
    }

    case 'addSet': {
      if (!state.draft) return state;
      const exercises = state.draft.exercises.map((e, i) => {
        if (i !== action.ex) return e;
        const last = e.sets[e.sets.length - 1];
        return { ...e, sets: [...e.sets, { reps: last?.reps ?? e.target.reps, weightKg: last?.weightKg ?? e.target.weightKg, done: false }] };
      });
      return { ...state, draft: { ...state.draft, exercises } };
    }

    case 'removeSet': {
      if (!state.draft) return state;
      const exercises = state.draft.exercises.map((e, i) =>
        i !== action.ex || e.sets.length <= 1 ? e : { ...e, sets: e.sets.filter((_, j) => j !== action.set) }
      );
      return { ...state, draft: { ...state.draft, exercises } };
    }

    case 'finishWorkout':
      return finish(state, action.nowIso, action.stopped);

    case 'discardWorkout':
      return { ...state, draft: null };

    case 'deleteSession':
      return { ...state, sessions: state.sessions.filter((s) => s.id !== action.id) };

    case 'logBodyWeight': {
      if (!(action.kg > 20 && action.kg < 400)) return state;
      const rest = state.bodyWeights.filter((w) => w.date !== action.date);
      return { ...state, bodyWeights: [...rest, { date: action.date, kg: Math.round(action.kg * 10) / 10 }].sort((a, b) => (a.date < b.date ? -1 : 1)) };
    }

    default:
      return state;
  }
}

/** Does this exercise id exist in the library? Used to ignore stale ids in saved data. */
export const knownExercise = (id: string): boolean => getExercise(id) !== undefined;
