import type { Track, TrackLevel } from './config';

export interface TrackEntry {
  done: boolean;
  /** Self-recorded measurement for the track; absent means "not recorded", never zero. */
  glasses?: number;
  minutes?: number;
  bedtime?: string;
  wake?: string;
  mealsChecked?: number;
  at: string;
}

export interface TrackSettings {
  level: TrackLevel;
  /** Scheduled time 'HH:MM', set by the person or an accepted coach change. */
  time?: string;
  /** 'alt' = indoor / seated variant of the action. */
  variant: 'default' | 'alt';
  /** Last automatic step-down: episode key so one lapse only steps down once. */
  lastStepDownEpisode?: string;
  /** Level before an automatic step-down, so the person can restore it. */
  restoreLevel?: TrackLevel;
  declinedUpOn?: string;
}

export interface PlannerState {
  entries: Record<string, Partial<Record<Track, TrackEntry>>>;
  tracks: Record<Track, TrackSettings>;
  /** Coach/plan setting: no hydration targets during fasting hours. */
  hydrationPausedFasting: boolean;
  preShift: { enabled: boolean; time: string };
  /** First day the planner was used; runs never look before this. */
  startedOn: string | null;
}

export const EMPTY_PLANNER: PlannerState = {
  entries: {},
  tracks: {
    nutrition: { level: 2, variant: 'default' },
    sleep: { level: 2, variant: 'default' },
    hydration: { level: 2, variant: 'default' },
    activity: { level: 2, variant: 'default' }
  },
  hydrationPausedFasting: false,
  preShift: { enabled: false, time: '' },
  startedOn: null
};

export function freshPlanner(): PlannerState {
  return {
    ...EMPTY_PLANNER,
    entries: {},
    tracks: {
      nutrition: { ...EMPTY_PLANNER.tracks.nutrition },
      sleep: { ...EMPTY_PLANNER.tracks.sleep },
      hydration: { ...EMPTY_PLANNER.tracks.hydration },
      activity: { ...EMPTY_PLANNER.tracks.activity }
    },
    preShift: { ...EMPTY_PLANNER.preShift }
  };
}
