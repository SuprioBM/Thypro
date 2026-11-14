/**
 * Domain model for the habit layer. Pure data types only: no React, no I/O.
 * Dates are local calendar days as 'YYYY-MM-DD'; timestamps are ISO strings.
 */

import type { StrengthState } from '../strength/types';

export type Lang = 'en' | 'bn' | 'hi' | 'ur';
export const LANGS: readonly Lang[] = ['en', 'bn', 'hi', 'ur'] as const;
export const RTL_LANGS: readonly Lang[] = ['ur'] as const;

/** Answers to yes/no questions never collapse "unknown" into "no". */
export type Tri = 'yes' | 'no' | 'unknown' | 'prefer_not';

export type GoalType = 'walk' | 'sleep' | 'eating' | 'medicine' | 'tobacco';
export const GOAL_TYPES: readonly GoalType[] = ['walk', 'eating', 'sleep', 'tobacco', 'medicine'] as const;

/* ---------- Context profile (phase 2) ---------- */

export type ShiftWork = 'none' | 'day' | 'night' | 'rotating' | 'unknown';
export type Fasting = 'none' | 'ramadan' | 'other' | 'unknown';
export type Heat = 'hot' | 'mild' | 'unknown';
export type FoodBudget = 'low' | 'medium' | 'unknown';
export type Literacy = 'low' | 'medium' | 'high' | 'unknown';
export type AccessNeed = 'vision' | 'hearing' | 'mobility' | 'cognitive';
export const ACCESS_NEEDS: readonly AccessNeed[] = ['vision', 'hearing', 'mobility', 'cognitive'] as const;

export interface ContextProfile {
  shiftWork: ShiftWork;
  fasting: Fasting;
  heat: Heat;
  foodBudget: FoodBudget;
  literacy: Literacy;
  access: AccessNeed[];
}

/** Everything unknown until the person says otherwise. Unknown is never read as "fine". */
export const DEFAULT_CONTEXT: ContextProfile = {
  shiftWork: 'unknown',
  fasting: 'unknown',
  heat: 'unknown',
  foodBudget: 'unknown',
  literacy: 'unknown',
  access: []
};

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
  /** Optional for backward compatibility with phase-1 data; read through DEFAULT_CONTEXT. */
  context?: ContextProfile;
}

export type Gender = 'female' | 'male' | 'other' | 'prefer_not';
export type AgeGroup = '18-29' | '30-44' | '45-59' | '60+' | 'prefer_not';

/** Self-reported, optional, used only for equity monitoring in the pilot report. */
export interface Demographics {
  gender?: Gender;
  ageGroup?: AgeGroup;
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
  demographics?: Demographics;
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
  /** Small-step ladder level the plan was built at (1 = smallest). Absent on phase-1 plans. */
  level?: number;
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
  /** Optional outcome fields, self-recorded. */
  activityMinutes?: number;
  bp?: { systolic: number; diastolic: number };
  weightKg?: number;
}

/* ---------- Reminders ---------- */

export type ChannelId = 'in-app' | 'message' | 'voice';
export const CHANNEL_IDS: readonly ChannelId[] = ['in-app', 'message', 'voice'] as const;

export interface Reminder {
  id: string;
  time: string;
  enabled: boolean;
  channel: ChannelId;
}

export interface DeliveryLogEntry {
  id: string;
  at: string;
  reminderId: string;
  channel: string;
  status: 'delivered' | 'failed' | 'suppressed';
  /** Always true in this build: nothing is sent outside the page. */
  simulated: boolean;
  /** Set when status is failed. */
  error?: string;
  /** Set when status is suppressed: quiet_hours | frequency | no_channel. */
  reason?: string;
}

/* ---------- Preferences (control panel) ---------- */

export interface UserPrefs {
  channels: Record<ChannelId, boolean>;
  preferredChannel: ChannelId;
  quietHours: { enabled: boolean; start: string; end: string };
  frequency: 'daily' | 'weekdays' | 'off';
  /** Recorded for the pilot only; it does not change any logic. */
  tone: 'neutral' | 'encouraging';
  voiceFirst: boolean;
  largeText: boolean;
  pictureMode: boolean;
}

export const DEFAULT_PREFS: UserPrefs = {
  channels: { 'in-app': true, message: true, voice: false },
  preferredChannel: 'in-app',
  quietHours: { enabled: true, start: '22:00', end: '07:00' },
  frequency: 'daily',
  tone: 'neutral',
  voiceFirst: false,
  largeText: false,
  pictureMode: false
};

/* ---------- Small-step ladder, lapses and adaptation ---------- */

export interface LevelChange {
  from: number;
  to: number;
  kind: 'down' | 'up';
  at: string;
  date: string;
}

export interface GoalProgress {
  level: number;
  /** Lapse episode (date of the last done day) that already caused a step down. */
  lastStepDownEpisode?: string;
  /** Date a step-up offer was declined; no new offer for a cooling-off period. */
  declinedUpOn?: string;
  lastChange?: LevelChange;
}

export type Barrier = 'time' | 'tired' | 'sick' | 'travel' | 'shift' | 'motivation' | 'cost' | 'family';
export const BARRIERS: readonly Barrier[] = ['time', 'tired', 'sick', 'travel', 'shift', 'motivation', 'cost', 'family'] as const;

export interface BarrierEntry {
  id: string;
  at: string;
  date: string;
  barrier: Barrier;
  episodeKey: string;
}

export type AdaptationAction = 'shrink' | 'move_time' | 'switch_channel' | 'suggest_share' | 'set_budget_low';

export interface Adaptation {
  action: AdaptationAction;
  ruleId: string;
  barrier: Barrier | null;
  from: string;
  to: string;
}

export interface Proposal {
  barrierId: string;
  barrier: Barrier;
  items: Adaptation[];
}

/** Placeholder "personal best time and tone" tracker. Recorded only; never used to decide anything. */
export interface PilotSignal {
  date: string;
  hour: number;
  channel: ChannelId | null;
  tone: UserPrefs['tone'];
}

export interface SharePerson {
  id: string;
  name: string;
  relation: string;
  consent: ConsentMap;
}

/* ---------- Audit ---------- */

export type AuditKind = 'safety' | 'plan' | 'escalation' | 'adaptation';
export type AuditResult = 'pass' | 'blocked' | 'generated' | 'escalated' | 'fallback' | 'adapted';

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

export type FamilyField = 'goal' | 'weeklyCompletion' | 'feelings' | 'plan' | 'reminders' | 'notes' | 'strength';
export const FAMILY_FIELDS: readonly FamilyField[] = [
  'goal',
  'weeklyCompletion',
  'feelings',
  'plan',
  'reminders',
  'notes',
  'strength'
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
  /** Sharing consent for the family contact. */
  consent: ConsentMap;
  /** Phase 2. */
  progress: GoalProgress;
  barriers: BarrierEntry[];
  proposal: Proposal | null;
  prefs: UserPrefs;
  /** Further people (a coach, a clinic) with their own sharing consent. */
  people: SharePerson[];
  signals: PilotSignal[];
  /** Strength & mobility module. */
  strength: StrengthState;
}
