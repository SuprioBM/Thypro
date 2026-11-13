/**
 * App state transitions. PURE: ids and times arrive inside the action, so the
 * same action on the same state always gives the same result (testable).
 *
 * Phase 2 adds the small-step ladder, barrier answers and rule-based
 * adaptations. Every adaptation is written to the audit log with what changed,
 * why, and which barrier.
 */

import { ADAPT_RULES } from '../adapt/rules.config';
import { proposeAdaptations } from '../adapt/engine';
import { makeSignal } from '../adapt/signals';
import { detectLapse, evaluateStepDown } from '../domain/ladder';
import {
  DEFAULT_CONTEXT,
  DEFAULT_PREFS,
  type Adaptation,
  type AppState,
  type AuditEntry,
  type Barrier,
  type CheckIn,
  type ConsentMap,
  type ContextProfile,
  type DeliveryLogEntry,
  type Demographics,
  type FamilyField,
  type GoalProgress,
  type GoalSetup,
  type Lang,
  type Profile,
  type SessionMode,
  type SharePerson,
  type UserPrefs
} from '../domain/types';
import { DEFAULT_LEVEL, clampLevel, generatePlan } from '../plan/generate';
import { evaluateCheckin, evaluateSafety } from '../safety/engine';

export type Action =
  | { type: 'setLang'; lang: Lang }
  | { type: 'completeSetup'; setup: GoalSetup; nowIso: string; seed: string }
  | { type: 'saveCheckin'; checkin: CheckIn; nowIso: string; seed: string }
  | { type: 'restartPlan'; nowIso: string; seed: string }
  | { type: 'tick'; today: string; nowIso: string; seed: string }
  | { type: 'recordBarrier'; barrier: Barrier; today: string; nowIso: string; seed: string; autoApply?: boolean }
  | { type: 'applyAdaptation'; index: number; nowIso: string; seed: string }
  | { type: 'dismissProposal' }
  | { type: 'respondStepUp'; accept: boolean; today: string; nowIso: string; seed: string }
  | { type: 'setPrefs'; patch: Partial<UserPrefs> }
  | { type: 'setContext'; context: ContextProfile; nowIso: string; seed: string }
  | { type: 'setDemographics'; demographics: Demographics }
  | { type: 'setConsent'; field: FamilyField; value: boolean }
  | { type: 'setPersonConsent'; personId: string; field: FamilyField; value: boolean }
  | { type: 'addPerson'; person: SharePerson }
  | { type: 'removePerson'; personId: string }
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

export const NO_CONSENT: ConsentMap = {
  goal: false,
  weeklyCompletion: false,
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
    consent: { ...DEFAULT_CONSENT },
    progress: { level: DEFAULT_LEVEL },
    barriers: [],
    proposal: null,
    prefs: { ...DEFAULT_PREFS, channels: { ...DEFAULT_PREFS.channels }, quietHours: { ...DEFAULT_PREFS.quietHours } },
    people: [],
    signals: []
  };
}

function nextVersion(state: AppState): number {
  return state.plans.length === 0 ? 1 : Math.max(...state.plans.map((p) => p.version)) + 1;
}

interface GenOpts {
  restart?: boolean;
  level: number;
  reasonCode: string;
  /** Log a safety entry too (new answers). Level and time changes reuse already-checked answers. */
  logSafety: boolean;
}

function applyGeneration(state: AppState, setup: GoalSetup, nowIso: string, seed: string, opts: GenOpts): AppState {
  const planId = `plan-${seed}`;
  const result = generatePlan(setup, { planId, version: nextVersion(state), nowIso, restart: opts.restart, level: opts.level });

  const audit: AuditEntry[] = [];
  if (opts.logSafety || result.status !== 'ok') {
    audit.push({
      id: `${seed}-safety`,
      at: nowIso,
      kind: 'safety',
      ruleVersion: result.input.ruleVersion,
      result: result.status === 'ok' ? 'pass' : 'blocked',
      reasonCode: result.input.breaches[0]?.reasonCode ?? result.output?.breaches[0]?.reasonCode ?? 'all_rules_passed',
      reasonParams: result.input.breaches[0]?.params ?? result.output?.breaches[0]?.params
    });
  }

  if (result.status === 'ok') {
    audit.push({
      id: `${seed}-plan`,
      at: nowIso,
      kind: 'plan',
      ruleVersion: result.plan.ruleVersion,
      result: 'generated',
      reasonCode: opts.reasonCode,
      templateId: result.plan.templateId
    });
    return { ...state, setup, plans: [...state.plans, result.plan], audit: [...state.audit, ...audit] };
  }
  return { ...state, setup, audit: [...state.audit, ...audit] };
}

/** True when the person's answers currently block a plan. Derived, never stored. */
export function isBlocked(state: AppState): boolean {
  if (!state.setup) return false;
  return evaluateSafety({ ownTargets: state.setup.ownTargets, screening: state.setup.screening }).result === 'blocked';
}

function adaptationEntry(id: string, nowIso: string, reasonCode: string, params: Record<string, string | number>): AuditEntry {
  return { id, at: nowIso, kind: 'adaptation', ruleVersion: ADAPT_RULES.version, result: 'adapted', reasonCode, reasonParams: params };
}

function changeLevel(
  state: AppState,
  to: number,
  kind: 'down' | 'up',
  date: string,
  nowIso: string,
  seed: string,
  extra: Partial<GoalProgress> = {}
): AppState {
  if (!state.setup) return state;
  const from = state.progress.level;
  const level = clampLevel(state.setup.goalType, to);
  const regenerated = applyGeneration(state, state.setup, nowIso, seed, {
    level,
    reasonCode: kind === 'down' ? 'plan_level_down' : 'plan_level_up',
    logSafety: false
  });
  return {
    ...regenerated,
    progress: { ...state.progress, ...extra, level, lastChange: { from, to: level, kind, at: nowIso, date } }
  };
}

/** Step down once per lapse. Runs after every check-in and on each new day. */
function ladderTick(state: AppState, today: string, nowIso: string, seed: string): AppState {
  if (!state.setup || state.plans.length === 0 || isBlocked(state)) return state;
  const decision = evaluateStepDown(state.progress, state.checkins, today);
  if (!decision.stepDown) return state;
  const stepped = changeLevel(state, decision.to, 'down', today, nowIso, `${seed}-down`, {
    lastStepDownEpisode: decision.episodeKey
  });
  return {
    ...stepped,
    audit: [...stepped.audit, adaptationEntry(`${seed}-ladder`, nowIso, 'ladder_step_down', { from: decision.from, to: decision.to })]
  };
}

function applyOne(state: AppState, a: Adaptation, nowIso: string, seed: string): AppState {
  if (!state.setup) return state;
  const params = { from: a.from, to: a.to, barrier: a.barrier ?? 'lapse' };
  let next = state;
  switch (a.action) {
    case 'shrink': {
      const lapse = detectLapse(state.checkins, nowIso.slice(0, 10));
      next = changeLevel(state, Number(a.to), 'down', nowIso.slice(0, 10), nowIso, seed, {
        lastStepDownEpisode: lapse.episodeKey || state.progress.lastStepDownEpisode
      });
      break;
    }
    case 'move_time': {
      const setup = { ...state.setup, usualTime: a.to };
      const moved = { ...state, reminders: state.reminders.map((r, i) => (i === 0 ? { ...r, time: a.to } : r)) };
      next = applyGeneration(moved, setup, nowIso, seed, { level: state.progress.level, reasonCode: 'plan_time_moved', logSafety: false });
      break;
    }
    case 'switch_channel': {
      const to = a.to as UserPrefs['preferredChannel'];
      next = { ...state, prefs: { ...state.prefs, preferredChannel: to, channels: { ...state.prefs.channels, [to]: true } } };
      break;
    }
    case 'suggest_share':
      next = { ...state, consent: { ...state.consent, weeklyCompletion: true } };
      break;
    case 'set_budget_low': {
      const context = { ...(state.setup.context ?? DEFAULT_CONTEXT), foodBudget: 'low' as const };
      next = applyGeneration(state, { ...state.setup, context }, nowIso, seed, {
        level: state.progress.level,
        reasonCode: 'plan_context_changed',
        logSafety: false
      });
      break;
    }
  }
  return { ...next, audit: [...next.audit, adaptationEntry(`${seed}-adapt`, nowIso, `adapt_${a.action}`, params)] };
}

function lastDeliveredChannel(state: AppState, date: string) {
  const entry = [...state.deliveryLog].reverse().find((l) => l.status === 'delivered' && l.at.slice(0, 10) === date);
  return (entry?.channel as UserPrefs['preferredChannel'] | undefined) ?? null;
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'setLang':
      return { ...state, profile: { ...state.profile, lang: action.lang } };

    case 'completeSetup': {
      // A new goal starts at the default level. Check-ins and totals are kept.
      const fresh = { ...state, progress: { level: DEFAULT_LEVEL }, proposal: null };
      return applyGeneration(fresh, action.setup, action.nowIso, action.seed, {
        level: DEFAULT_LEVEL,
        reasonCode: 'plan_generated',
        logSafety: true
      });
    }

    case 'restartPlan': {
      if (!state.setup) return state;
      const restarted = applyGeneration(state, state.setup, action.nowIso, action.seed, {
        restart: true,
        level: 1,
        reasonCode: 'plan_restart_generated',
        logSafety: true
      });
      const from = state.progress.level;
      return {
        ...restarted,
        progress: {
          ...state.progress,
          level: 1,
          lastChange: { from, to: 1, kind: 'down', at: action.nowIso, date: action.nowIso.slice(0, 10) }
        }
      };
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
      const signals =
        action.checkin.status === 'done'
          ? [
              ...state.signals.filter((s) => s.date !== action.checkin.date),
              makeSignal(action.checkin.date, action.checkin.createdAt, lastDeliveredChannel(state, action.checkin.date), state.prefs.tone)
            ]
          : state.signals;
      const saved = { ...state, checkins, signals, audit: [...state.audit, ...audit] };
      return ladderTick(saved, action.checkin.date, action.nowIso, action.seed);
    }

    case 'tick':
      return ladderTick(state, action.today, action.nowIso, action.seed);

    case 'recordBarrier': {
      if (!state.setup) return state;
      const lapse = detectLapse(state.checkins, action.today);
      const entry = {
        id: `b-${action.seed}`,
        at: action.nowIso,
        date: action.today,
        barrier: action.barrier,
        episodeKey: lapse.episodeKey
      };
      const items = proposeAdaptations({
        barrier: action.barrier,
        goalType: state.setup.goalType,
        level: state.progress.level,
        usualTime: state.setup.usualTime,
        context: state.setup.context ?? DEFAULT_CONTEXT,
        prefs: state.prefs,
        alreadySteppedDown: state.progress.lastStepDownEpisode === lapse.episodeKey,
        hasFamilyContact: Boolean(state.profile.familyContact),
        familySharingOn: state.consent.weeklyCompletion
      });
      const withBarrier = { ...state, barriers: [...state.barriers, entry] };
      if (!action.autoApply) {
        return { ...withBarrier, proposal: items.length ? { barrierId: entry.id, barrier: action.barrier, items } : null };
      }
      return items.reduce<AppState>(
        (s, a, i) => applyOne(s, a, action.nowIso, `${action.seed}-${i}`),
        { ...withBarrier, proposal: null }
      );
    }

    case 'applyAdaptation': {
      const item = state.proposal?.items[action.index];
      if (!state.proposal || !item) return state;
      const rest = state.proposal.items.filter((_, i) => i !== action.index);
      const applied = applyOne(state, item, action.nowIso, action.seed);
      return { ...applied, proposal: rest.length ? { ...state.proposal, items: rest } : null };
    }

    case 'dismissProposal':
      return { ...state, proposal: null };

    case 'respondStepUp': {
      if (!action.accept) return { ...state, progress: { ...state.progress, declinedUpOn: action.today } };
      const up = changeLevel(state, state.progress.level + 1, 'up', action.today, action.nowIso, action.seed);
      return {
        ...up,
        audit: [
          ...up.audit,
          adaptationEntry(`${action.seed}-up`, action.nowIso, 'ladder_step_up', { from: state.progress.level, to: up.progress.level })
        ]
      };
    }

    case 'setPrefs':
      return { ...state, prefs: { ...state.prefs, ...action.patch } };

    case 'setContext': {
      if (!state.setup) return state;
      return applyGeneration(state, { ...state.setup, context: action.context }, action.nowIso, action.seed, {
        level: state.progress.level,
        reasonCode: 'plan_context_changed',
        logSafety: false
      });
    }

    case 'setDemographics':
      return { ...state, profile: { ...state.profile, demographics: action.demographics } };

    case 'setConsent':
      return { ...state, consent: { ...state.consent, [action.field]: action.value } };

    case 'setPersonConsent':
      return {
        ...state,
        people: state.people.map((p) =>
          p.id === action.personId ? { ...p, consent: { ...p.consent, [action.field]: action.value } } : p
        )
      };

    case 'addPerson':
      return { ...state, people: [...state.people, action.person] };

    case 'removePerson':
      return { ...state, people: state.people.filter((p) => p.id !== action.personId) };

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

/**
 * Brings a saved state from an older schema up to date. Phase-1 data has no
 * ladder, preferences, barriers or people; those get safe defaults. Nothing is
 * removed. This is the "migration" for the on-device store.
 */
export function normalizeState(raw: AppState): AppState {
  const base = emptyState(raw.mode, raw.profile?.lang ?? 'en');
  const lastPlan = raw.plans?.[raw.plans.length - 1];
  return {
    ...base,
    ...raw,
    reminders: (raw.reminders ?? base.reminders).map((r) => ({ ...r, channel: r.channel ?? 'in-app' })),
    progress: raw.progress ?? { level: lastPlan?.level ?? (lastPlan?.restart ? 1 : DEFAULT_LEVEL) },
    barriers: raw.barriers ?? [],
    proposal: raw.proposal ?? null,
    prefs: {
      ...base.prefs,
      ...(raw.prefs ?? {}),
      channels: { ...base.prefs.channels, ...(raw.prefs?.channels ?? {}) },
      quietHours: { ...base.prefs.quietHours, ...(raw.prefs?.quietHours ?? {}) }
    },
    people: raw.people ?? [],
    signals: raw.signals ?? []
  };
}
