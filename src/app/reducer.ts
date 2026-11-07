/**
 * App state transitions. PURE: ids and times arrive inside the action, so the
 * same action on the same state always gives the same result (testable).
 */

import type {
  AppState,
  AuditEntry,
  CheckIn,
  ConsentMap,
  DeliveryLogEntry,
  FamilyField,
  GoalSetup,
  Lang,
  Profile,
  SessionMode
} from '../domain/types';
import { generatePlan } from '../plan/generate';
import { evaluateCheckin, evaluateSafety } from '../safety/engine';

export type Action =
  | { type: 'setLang'; lang: Lang }
  | { type: 'completeSetup'; setup: GoalSetup; nowIso: string; seed: string }
  | { type: 'saveCheckin'; checkin: CheckIn; nowIso: string; seed: string }
  | { type: 'restartPlan'; nowIso: string; seed: string }
  | { type: 'setConsent'; field: FamilyField; value: boolean }
  | { type: 'setReminderEnabled'; id: string; enabled: boolean }
  | { type: 'setReminderTime'; id: string; time: string }
  | { type: 'logDelivery'; entry: DeliveryLogEntry }
  | { type: 'logFallback'; nowIso: string; seed: string; reasonCode: string }
  | { type: 'replace'; state: AppState };

export const DEFAULT_CONSENT: ConsentMap = {
  goal: true,
  weeklyCompletion: true,
  feelings: false,
  plan: false,
  reminders: false,
  notes: false
};

export function emptyState(mode: SessionMode, lang: Lang): AppState {
  const profile: Profile = {
    id: 'local-user',
    displayName: '',
    lang,
    city: 'Abu Dhabi',
    synthetic: false,
    familyContact: null
  };
  return {
    mode,
    profile,
    setup: null,
    plans: [],
    checkins: [],
    reminders: [{ id: 'rem-1', time: '19:00', enabled: true, channel: 'in-app' }],
    deliveryLog: [],
    audit: [],
    consent: { ...DEFAULT_CONSENT }
  };
}

function nextVersion(state: AppState): number {
  return state.plans.length === 0 ? 1 : Math.max(...state.plans.map((p) => p.version)) + 1;
}

function applyGeneration(state: AppState, setup: GoalSetup, nowIso: string, seed: string, restart: boolean): AppState {
  const planId = `plan-${seed}`;
  const result = generatePlan(setup, { planId, version: nextVersion(state), nowIso, restart });

  const audit: AuditEntry[] = [
    {
      id: `${seed}-safety`,
      at: nowIso,
      kind: 'safety',
      ruleVersion: result.input.ruleVersion,
      result: result.status === 'ok' ? 'pass' : 'blocked',
      reasonCode: result.input.breaches[0]?.reasonCode ?? result.output?.breaches[0]?.reasonCode ?? 'all_rules_passed',
      reasonParams: result.input.breaches[0]?.params ?? result.output?.breaches[0]?.params
    }
  ];

  if (result.status === 'ok') {
    audit.push({
      id: `${seed}-plan`,
      at: nowIso,
      kind: 'plan',
      ruleVersion: result.plan.ruleVersion,
      result: 'generated',
      reasonCode: restart ? 'plan_restart_generated' : 'plan_generated',
      templateId: result.plan.templateId
    });
    return {
      ...state,
      setup,
      plans: [...state.plans, result.plan],
      audit: [...state.audit, ...audit]
    };
  }
  return { ...state, setup, audit: [...state.audit, ...audit] };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'setLang':
      return { ...state, profile: { ...state.profile, lang: action.lang } };

    case 'completeSetup':
      return applyGeneration(state, action.setup, action.nowIso, action.seed, false);

    case 'restartPlan': {
      if (!state.setup) return state;
      return applyGeneration(state, state.setup, action.nowIso, action.seed, true);
    }

    case 'saveCheckin': {
      const others = state.checkins.filter((c) => c.date !== action.checkin.date);
      const checkins = [...others, action.checkin].sort((a, b) => (a.date < b.date ? -1 : 1));
      const decision = evaluateCheckin(action.checkin, others);
      const audit: AuditEntry[] = [];
      if (decision.level !== 'none') {
        audit.push({
          id: `${action.seed}-esc`,
          at: action.nowIso,
          kind: 'escalation',
          ruleVersion: decision.ruleVersion,
          result: 'escalated',
          reasonCode: decision.reasons[0]?.reasonCode ?? 'escalated',
          reasonParams: decision.reasons[0]?.params
        });
      } else if (decision.reasons.some((r) => r.reasonCode === 'glucose_source_rejected')) {
        audit.push({
          id: `${action.seed}-glu`,
          at: action.nowIso,
          kind: 'safety',
          ruleVersion: decision.ruleVersion,
          result: 'blocked',
          reasonCode: 'glucose_source_rejected'
        });
      }
      return { ...state, checkins, audit: [...state.audit, ...audit] };
    }

    case 'setConsent':
      return { ...state, consent: { ...state.consent, [action.field]: action.value } };

    case 'setReminderEnabled':
      return {
        ...state,
        reminders: state.reminders.map((r) => (r.id === action.id ? { ...r, enabled: action.enabled } : r))
      };

    case 'setReminderTime':
      return {
        ...state,
        reminders: state.reminders.map((r) => (r.id === action.id ? { ...r, time: action.time } : r))
      };

    case 'logDelivery':
      return { ...state, deliveryLog: [...state.deliveryLog, action.entry] };

    case 'logFallback':
      return {
        ...state,
        audit: [
          ...state.audit,
          {
            id: `${action.seed}-fb`,
            at: action.nowIso,
            kind: 'plan',
            ruleVersion: 'n/a',
            result: 'fallback',
            reasonCode: action.reasonCode
          }
        ]
      };

    case 'replace':
      return action.state;

    default:
      return state;
  }
}

/** True when the person's answers currently block a plan. Derived, never stored. */
export function isBlocked(state: AppState): boolean {
  if (!state.setup) return false;
  return evaluateSafety({ ownTargets: state.setup.ownTargets, screening: state.setup.screening }).result === 'blocked';
}
