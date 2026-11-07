import type { ScreeningKey } from '../domain/types';

/**
 * Versioned safety rules. This file is DATA: the engine in engine.ts reads it
 * and contains no thresholds of its own.
 *
 * IMPORTANT: every numeric value below is a conservative placeholder chosen by
 * the engineering team so the product fails safe. None of it is clinical
 * guidance and none of it has been clinically validated. Each rule carries an
 * `owner`; replace it with a named, accountable clinician before any public
 * use and bump `version` on every change.
 */

export interface RangeRule {
  id: string;
  /** Which target the rule limits. */
  target: 'caloriesPerDay' | 'fastingHoursPerDay' | 'exerciseMinutesPerDay' | 'exerciseMinutesPerWeek' | 'sleepHours';
  min?: number;
  max?: number;
  owner: string;
  note: string;
}

export interface ScreeningRule {
  id: string;
  key: ScreeningKey;
  /** Answers that block plan generation and route to the clinician pathway. */
  blockOn: 'yes';
  owner: string;
  note: string;
}

export interface EscalationRules {
  owner: string;
  /** Check-in red-flag ids that always escalate as urgent. */
  urgentRedFlags: string[];
  /** Glucose-meter thresholds, mg/dL. Meter readings only. */
  glucoseMgDl: { low: number; high: number };
  /** Consecutive days of "unwell" that prompt a talk-to-someone step. */
  unwellStreakDays: number;
}

export interface SafetyRulesConfig {
  version: string;
  owner: string;
  reviewStatus: 'pending_clinical_review' | 'clinically_reviewed';
  range: RangeRule[];
  screening: ScreeningRule[];
  escalation: EscalationRules;
}

const PENDING_OWNER = 'Clinical safety owner — to be appointed (placeholder)';

export const SAFETY_RULES_CONFIG: SafetyRulesConfig = {
  version: '2026.11.1',
  owner: PENDING_OWNER,
  reviewStatus: 'pending_clinical_review',
  range: [
    {
      id: 'R-CAL-MIN',
      target: 'caloriesPerDay',
      min: 1200,
      owner: PENDING_OWNER,
      note: 'No very-low-energy daily targets.'
    },
    {
      id: 'R-CAL-MAX',
      target: 'caloriesPerDay',
      max: 4000,
      owner: PENDING_OWNER,
      note: 'No extreme high-energy daily targets.'
    },
    {
      id: 'R-FAST-MAX',
      target: 'fastingHoursPerDay',
      max: 16,
      owner: PENDING_OWNER,
      note: 'No extended daily fasting targets.'
    },
    {
      id: 'R-EX-DAY-MAX',
      target: 'exerciseMinutesPerDay',
      max: 90,
      owner: PENDING_OWNER,
      note: 'No extreme daily exercise targets.'
    },
    {
      id: 'R-EX-WEEK-MAX',
      target: 'exerciseMinutesPerWeek',
      max: 420,
      owner: PENDING_OWNER,
      note: 'No extreme weekly exercise targets.'
    },
    {
      id: 'R-SLEEP-RANGE',
      target: 'sleepHours',
      min: 6,
      max: 10,
      owner: PENDING_OWNER,
      note: 'Sleep targets stay within an ordinary range.'
    }
  ],
  screening: [
    { id: 'S-PREG', key: 'pregnancy', blockOn: 'yes', owner: PENDING_OWNER, note: 'Pregnancy needs individual clinical advice.' },
    { id: 'S-ED', key: 'eatingConcerns', blockOn: 'yes', owner: PENDING_OWNER, note: 'Signs of disordered eating.' },
    { id: 'S-HEART', key: 'heartCondition', blockOn: 'yes', owner: PENDING_OWNER, note: 'Known heart condition.' },
    { id: 'S-KIDNEY', key: 'kidneyDisease', blockOn: 'yes', owner: PENDING_OWNER, note: 'Known kidney disease.' },
    { id: 'S-INSULIN', key: 'insulinDiabetes', blockOn: 'yes', owner: PENDING_OWNER, note: 'Diabetes treated with insulin.' },
    { id: 'S-OTHER', key: 'otherHighRisk', blockOn: 'yes', owner: PENDING_OWNER, note: 'Another condition a clinician is managing closely.' }
  ],
  escalation: {
    owner: PENDING_OWNER,
    urgentRedFlags: ['chestPain', 'breathing', 'fainting', 'severePain', 'selfHarm'],
    glucoseMgDl: { low: 70, high: 300 },
    unwellStreakDays: 3
  }
};
