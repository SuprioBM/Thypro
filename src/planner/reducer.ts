/**
 * Planner transitions. PURE: ids and times come in with the action.
 * Cumulative total days are derived from entries, so nothing here can reset them.
 */

import { shiftDate } from '../domain/week';
import { PLANNER_RULES, TRACKS, type Track, type TrackLevel } from './config';
import { consecutiveMisses, doneInLast7 } from './runs';
import type { PlannerState, TrackEntry, TrackSettings } from './types';

export type PlannerAction =
  | { type: 'complete'; track: Track; date: string; nowIso: string; measure?: Partial<Omit<TrackEntry, 'done' | 'at'>> }
  | { type: 'undo'; track: Track; date: string }
  | { type: 'setTrack'; track: Track; patch: Partial<TrackSettings> }
  | { type: 'setHydrationPaused'; value: boolean }
  | { type: 'setPreShift'; enabled: boolean; time: string }
  | { type: 'tick'; today: string }
  | { type: 'restoreLevel'; track: Track }
  | { type: 'stepUp'; track: Track; accept: boolean; today: string };

export interface PlannerEvent {
  track: Track;
  kind: 'step_down' | 'step_up' | 'restore';
  from: TrackLevel;
  to: TrackLevel;
}

export function plannerReducer(state: PlannerState, a: PlannerAction): { state: PlannerState; events: PlannerEvent[] } {
  const events: PlannerEvent[] = [];
  switch (a.type) {
    case 'complete': {
      const day = { ...(state.entries[a.date] ?? {}) };
      day[a.track] = { ...a.measure, done: true, at: a.nowIso };
      return {
        state: {
          ...state,
          startedOn: state.startedOn && state.startedOn < a.date ? state.startedOn : a.date,
          entries: { ...state.entries, [a.date]: day }
        },
        events
      };
    }
    case 'undo': {
      const day = { ...(state.entries[a.date] ?? {}) };
      delete day[a.track];
      return { state: { ...state, entries: { ...state.entries, [a.date]: day } }, events };
    }
    case 'setTrack':
      return { state: { ...state, tracks: { ...state.tracks, [a.track]: { ...state.tracks[a.track], ...a.patch } } }, events };
    case 'setHydrationPaused':
      return { state: { ...state, hydrationPausedFasting: a.value }, events };
    case 'setPreShift':
      return { state: { ...state, preShift: { enabled: a.enabled, time: a.time } }, events };
    case 'restoreLevel': {
      const t = state.tracks[a.track];
      if (!t.restoreLevel) return { state, events };
      events.push({ track: a.track, kind: 'restore', from: t.level, to: t.restoreLevel });
      return { state: { ...state, tracks: { ...state.tracks, [a.track]: { ...t, level: t.restoreLevel, restoreLevel: undefined } } }, events };
    }
    case 'stepUp': {
      const t = state.tracks[a.track];
      if (!a.accept) return { state: { ...state, tracks: { ...state.tracks, [a.track]: { ...t, declinedUpOn: a.today } } }, events };
      if (t.level >= 3) return { state, events };
      const to = (t.level + 1) as TrackLevel;
      events.push({ track: a.track, kind: 'step_up', from: t.level, to });
      return { state: { ...state, tracks: { ...state.tracks, [a.track]: { ...t, level: to, restoreLevel: undefined } } }, events };
    }
    case 'tick': {
      // Two missed days in a row on a track: one automatic step down per lapse, restorable.
      let next = state;
      for (const track of TRACKS) {
        const t = next.tracks[track];
        const misses = consecutiveMisses(next, track, a.today);
        if (misses < PLANNER_RULES.stepDownAfterMisses || t.level <= 1) continue;
        const episode = shiftDate(a.today, -misses);
        if (t.lastStepDownEpisode === episode) continue;
        const to = (t.level - 1) as TrackLevel;
        events.push({ track, kind: 'step_down', from: t.level, to });
        next = { ...next, tracks: { ...next.tracks, [track]: { ...t, level: to, restoreLevel: t.level, lastStepDownEpisode: episode } } };
      }
      return { state: next, events };
    }
  }
}

/** A step-up is only offered, never applied automatically. */
export function stepUpOffer(state: PlannerState, track: Track, today: string): boolean {
  const t = state.tracks[track];
  if (t.level >= 3) return false;
  if (doneInLast7(state, track, today) < PLANNER_RULES.goodWeekDays) return false;
  if (t.declinedUpOn && t.declinedUpOn > shiftDate(today, -PLANNER_RULES.stepUpCooldownDays)) return false;
  return true;
}
