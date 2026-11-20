import type { Track } from '../planner/config';
import type { Barrier } from '../domain/types';

/** Signals the coach may read. Each has its own consent switch. */
export const COACH_SIGNALS = ['checkins', 'planner', 'barriers', 'context', 'steps', 'sleep', 'activity'] as const;
export type CoachSignal = (typeof COACH_SIGNALS)[number];
export type SignalConsent = Record<CoachSignal, boolean>;

/** The ONLY actions the coach can propose or apply. Anything else is rejected. */
export const COACH_ACTIONS = [
  'reduce_goal',
  'change_time',
  'swap_behaviour',
  'switch_channel',
  'add_preshift_reminder',
  'pause_hydration_fasting'
] as const;
export type CoachAction = (typeof COACH_ACTIONS)[number];

export const FACTOR_IDS = ['trend', 'misses', 'barriers', 'shift', 'sleepDebt', 'heat'] as const;
export type FactorId = (typeof FACTOR_IDS)[number];

export interface Factor {
  id: FactorId;
  /** 0..1 normalised feature value. */
  value: number;
  weight: number;
  /** weight * value, in score points (0..100 scale). */
  points: number;
  /** Short machine-readable detail, e.g. {n: 2} or {barrier: 'shift'}. */
  detail?: Record<string, string | number>;
}

export type RiskBand = 'low' | 'moderate' | 'high';

export interface RiskAssessment {
  score: number;
  band: RiskBand;
  /** All factors, sorted by contribution, biggest first. */
  factors: Factor[];
  top: Factor[];
  configVersion: string;
  /** Signals actually read (consented and available). */
  used: CoachSignal[];
  /** Signals the model would have liked but could not use. */
  missing: CoachSignal[];
}

export interface CoachProposal {
  id: string;
  action: CoachAction;
  track?: Track;
  /** What will change, as plain values (never free text). */
  from: string;
  to: string;
  barrier?: Barrier;
  topFactors: FactorId[];
  score: number;
  band: RiskBand;
  /** 'low' | 'medium' effort. */
  effort: 'low' | 'medium';
  /** True if the change can be undone with one tap and carries no health risk. */
  reversible: boolean;
  configVersion: string;
  createdAt: string;
  used: CoachSignal[];
}

export type CoachDecision = 'accepted' | 'edited' | 'not_now' | 'auto_applied' | 'blocked' | 'overridden' | 'undone';

export interface ExplanationRecord {
  source: 'template' | 'llm';
  /** Model wording, stored only when a model was used (language-specific). */
  text?: { headline: string; body: string; lang: string };
  model?: string;
  /** Why the template was used instead of the model. */
  fallbackReason?: string;
}

export interface CoachRecord {
  id: string;
  at: string;
  proposal: CoachProposal;
  decision: CoachDecision | 'pending';
  /** Value after the person edited it (change_time only). */
  editedTo?: string;
  explanation: ExplanationRecord;
  inputSummary: string;
  ruleVersion: string;
  configVersion: string;
  /** Rule breaches when blocked. */
  breaches?: string[];
}

export interface CoachState {
  enabled: boolean;
  /** Off by default. Applies only reversible, low-risk changes. */
  autoAdjust: boolean;
  consent: SignalConsent;
  /** Visible to the clinician demo view only when the person allows it. */
  clinicianShare: boolean;
  pending: CoachRecord | null;
  history: CoachRecord[];
  /** Proposal ids the person said "not now" to, with the date, to avoid nagging. */
  snoozedOn: string | null;
}
