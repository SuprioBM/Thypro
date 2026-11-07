/**
 * Domain model for the habit layer. Pure data types only: no React, no I/O.
 * Dates are local calendar days as 'YYYY-MM-DD'; timestamps are ISO strings.
 */

export type Lang = 'en' | 'bn' | 'hi' | 'ur';
export const LANGS: readonly Lang[] = ['en', 'bn', 'hi', 'ur'] as const;
export const RTL_LANGS: readonly Lang[] = ['ur'] as const;

/** Answers to yes/no questions never collapse "unknown" into "no". */
export type Tri = 'yes' | 'no' | 'unknown' | 'prefer_not';

export type GoalType = 'walk' | 'sleep' | 'eating' | 'medicine';
export const GOAL_TYPES: readonly GoalType[] = ['walk', 'sleep', 'eating', 'medicine'] as const;

export type ScreeningKey =
  | 'pregnancy'
  | 'eatingConcerns'
  | 'heartCondition'
  | 'kidneyDisease'
  | 'insulinDiabetes'
  | 'otherHighRisk';

export const SCREENING_KEYS: readonly ScreeningKey[] = [
  'pregnancy',
  'eatingConcerns',
  'heartCondition',
  'kidneyDisease',
  'insulinDiabetes',
  'otherHighRisk'
] as const;

export type Unknownable = number | 'unknown';

export interface Baseline {
  walkMinutesPerDay: Unknownable;
  sleepHours: Unknownable;
  mealsPerDay: Unknownable;
  medicineTimesPerDay: Unknownable;
}

/** Optional targets a person types in themselves; these are what the safety engine limits. */
export interface OwnTargets {
  caloriesPerDay?: number;
  fastingHoursPerDay?: number;
  exerciseMinutesPerDay?: number;
  exerciseMinutesPerWeek?: number;
  sleepHours?: number;
}

export type DietaryPractice = 'halal' | 'vegetarian' | 'noBeef' | 'noPork';
export type AllergyState = 'none' | 'listed' | 'unknown';

export interface GoalSetup {
  goalType: GoalType;
  /** Usual daily time for the habit, 'HH:MM' (24h). */
  usualTime: string;
  preferences: string[];
  dietary: DietaryPractice[];
  allergyState: AllergyState;
  allergies: string[];
  baseline: Baseline;
  ownTargets: OwnTargets;
  screening: Record<ScreeningKey, Tri>;
}

export interface FamilyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface Profile {
  id: string;
  displayName: string;
  lang: Lang;
  city: string;
  /** True for any profile made of invented data. Must be true for every seed. */
  synthetic: boolean;
  familyContact: FamilyContact | null;
}

/* ---------- Safety ---------- */

export type SafetyResult = 'pass' | 'blocked';

export interface Breach {
  ruleId: string;
  /** Stable code; translated at display time. */
  reasonCode: string;
  params?: Record<string, string | number>;
}

export interface SafetyDecision {
  result: SafetyResult;
  ruleVersion: string;
  breaches: Breach[];
  /** Non-blocking notes, e.g. screening questions left unanswered. */
  cautions: string[];
  route: 'none' | 'clinician';
}

export type EscalationLevel = 'none' | 'talk_to_someone' | 'urgent';

export interface EscalationDecision {
  level: EscalationLevel;
  ruleVersion: string;
  reasons: Breach[];
}

/* ---------- Plans ---------- */

export interface PlanItem {
  id: string;
  templateItemId: string;
  params: Record<string, string | number>;
  /** Text variant chosen (e.g. 'default', 'vegetarian'). */
  variant: string;
}

export interface Plan {
  id: string;
  /** Increments each time a plan is regenerated or restarted. */
  version: number;
  templateId: string;
  templateVersion: string;
  goalType: GoalType;
  createdAt: string;
  ruleVersion: string;
  restart: boolean;
  items: PlanItem[];
  cautions: string[];
  /** Hard targets inside the plan, re-checked by the safety engine before display. */
  targets: { exerciseMinutesPerDay?: number; exerciseMinutesPerWeek?: number; sleepHours?: number };
}

/* ---------- Check-ins ---------- */

export type CheckinStatus = 'done' | 'skipped' | 'unknown';
export type Feel = 'good' | 'okay' | 'tired' | 'unwell';
export type ReadingSource = 'meter' | 'watch' | 'other';

export interface CheckIn {
  id: string;
  date: string;
  status: CheckinStatus;
  feel: Feel | 'unknown';
  redFlags: string[];
  glucose?: { value: number; unit: 'mg/dL'; source: ReadingSource };
  note?: {
    original: string;
    lang: Lang;
    translation?: { text: string; lang: Lang; provider: string };
  };
  input: 'text' | 'voice';
  createdAt: string;
}

/* ---------- Reminders ---------- */

export interface Reminder {
  id: string;
  time: string;
  enabled: boolean;
  channel: 'in-app';
}

export interface DeliveryLogEntry {
  id: string;
  at: string;
  reminderId: string;
  channel: string;
  status: 'delivered' | 'failed';
  /** Always true in this build: nothing is sent outside the page. */
  simulated: boolean;
  /** Set when status is failed. */
  error?: string;
}

/* ---------- Audit ---------- */

export type AuditKind = 'safety' | 'plan' | 'escalation';
export type AuditResult = 'pass' | 'blocked' | 'generated' | 'escalated' | 'fallback';

export interface AuditEntry {
  id: string;
  at: string;
  kind: AuditKind;
  ruleVersion: string;
  result: AuditResult;
  reasonCode: string;
  reasonParams?: Record<string, string | number>;
  /** For plan entries. */
  templateId?: string;
}

/* ---------- Family consent ---------- */

export type FamilyField = 'goal' | 'weeklyCompletion' | 'feelings' | 'plan' | 'reminders' | 'notes';
export const FAMILY_FIELDS: readonly FamilyField[] = [
  'goal',
  'weeklyCompletion',
  'feelings',
  'plan',
  'reminders',
  'notes'
] as const;

export type ConsentMap = Record<FamilyField, boolean>;

/* ---------- Whole app state ---------- */

export type SessionMode = 'guest' | 'local';

export interface AppState {
  mode: SessionMode;
  profile: Profile;
  setup: GoalSetup | null;
  /** Newest last. The last entry is the active plan. */
  plans: Plan[];
  checkins: CheckIn[];
  reminders: Reminder[];
  deliveryLog: DeliveryLogEntry[];
  audit: AuditEntry[];
  consent: ConsentMap;
}
