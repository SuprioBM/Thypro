/**
 * Versioned planner rules. DATA ONLY: engine code reads it and holds no thresholds.
 *
 * Every number is a conservative placeholder chosen by the engineering team so the
 * product fails safe. None of it is clinical guidance or clinically validated; each
 * block names an owner role that must be replaced by a named clinician before public use.
 */

export const TRACKS = ['nutrition', 'sleep', 'hydration', 'activity'] as const;
export type Track = (typeof TRACKS)[number];

export const PLANNER_RULES = {
  version: 'planner-2026.11.1',
  owner: 'Clinical reviewer (role to be appointed)',
  reviewStatus: 'pending_clinical_review' as const,
  /** Levels 1 (smallest) .. 3. Each level is one small, approved daily action. */
  levels: {
    nutrition: { mealsChecked: [1, 2, 3] },
    sleep: { windowToleranceMin: [90, 60, 30] },
    hydration: { glasses: [4, 6, 8] },
    activity: { minutes: [5, 10, 15] }
  },
  defaultLevel: 2,
  freezesPerWeek: 1,
  /** A good week = at least this many done days of the last 7 on a track. */
  goodWeekDays: 6,
  stepDownAfterMisses: 2,
  stepUpCooldownDays: 7,
  limits: {
    hydration: { maxGlassesPerDay: 8, heatExtraGlasses: 2, glassMl: 250 },
    sleep: { minHours: 6, maxHours: 10, dayWindowMinHours: 6 },
    activity: { maxMinutesPerDay: 60 }
  },
  sleepWindows: {
    day: { bed: '22:30', wake: '06:30' },
    night: { bed: '09:00', wake: '16:30' },
    rotating: { bed: '', wake: '' }
  },
  /** Ramadan: meals and drinks sit between iftar and suhoor. Times are editable placeholders. */
  ramadan: { iftar: '18:15', suhoor: '03:45', hydrationFrom: '18:15', hydrationUntil: '03:45' }
} as const;

export type TrackLevel = 1 | 2 | 3;
