/**
 * Versioned Comeback Coach configuration. DATA ONLY.
 *
 * The score is a transparent weighted sum of six hand-set features. The weights are the
 * engineering team's starting values: they were NOT fitted to, or trained on, any real
 * users. Personal learning is planned for the pilot and does not exist yet.
 */

import type { FactorId } from './types';

export const COACH_CONFIG = {
  version: 'coach-2026.11.1',
  /** Weights sum to 100, so the score is directly 0..100. */
  weights: { trend: 30, misses: 25, barriers: 15, shift: 12, sleepDebt: 10, heat: 8 } as Record<FactorId, number>,
  /** Score at which the coach proposes one change, and the band edges. */
  proposeAt: 15,
  bands: { moderate: 15, high: 40 },
  /** Consecutive missed days at which the "misses" feature saturates. */
  missesSaturateAt: 2,
  windowDays: 7,
  /** Hours of sleep treated as "enough" for the sleep-debt feature (a planning default, not clinical advice). */
  sleepReferenceHours: 7,
  /** A day counts as missed when less than this share of visible tracks was done. */
  missBelow: 0.5,
  /** Shift-conflict window for night / rotating work, 'HH:MM'. */
  shiftWindow: { from: '19:00', to: '07:00' },
  /** Times the coach may move things to. */
  times: { preShiftLeadMinutes: 60, cooler: '18:30', afterIftar: '19:30', morning: '08:00', nightShift: '17:30' },
  heatAvoid: { from: '11:00', to: '16:00' },
  /** After a provider failure, no model calls for this long. */
  llmCooldownMs: 10 * 60 * 1000,
  llmTimeoutMs: 6000
} as const;

export type CoachConfig = typeof COACH_CONFIG;
