/**
 * Safety checks for strength training. PURE and versioned like the main
 * safety engine. Numbers and wording are placeholders: the owner below must
 * be appointed and the rules clinically reviewed before any public pilot.
 *
 *  - Any "yes" blocks the plan and points to a clinician.
 *  - "Not sure" / "prefer not to say" never blocks and is never treated as
 *    "no": the plan starts lighter and says some questions were unanswered.
 *  - During a workout, "I don't feel well" ends the session.
 */

import type { ScreenResult } from './types';

export const STRENGTH_SAFETY = {
  version: 'strength-2026.11.1',
  owner: 'Pending appointment: physiotherapist and clinical reviewer',
  questions: ['chest', 'faint', 'advised'] as const
} as const;

export type ScreenQuestion = (typeof STRENGTH_SAFETY.questions)[number];
export type ScreenAnswer = 'yes' | 'no' | 'unknown';
export type ScreenAnswers = Record<ScreenQuestion, ScreenAnswer>;

export const EMPTY_ANSWERS: ScreenAnswers = { chest: 'unknown', faint: 'unknown', advised: 'unknown' };

export function screenStrength(answers: ScreenAnswers): ScreenResult {
  const values = STRENGTH_SAFETY.questions.map((q) => answers[q]);
  if (values.includes('yes')) return 'blocked';
  if (values.includes('unknown')) return 'caution';
  return 'pass';
}

/** First blocking question, used for the audit reason. */
export function firstBreach(answers: ScreenAnswers): ScreenQuestion | null {
  return STRENGTH_SAFETY.questions.find((q) => answers[q] === 'yes') ?? null;
}
