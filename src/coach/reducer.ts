/**
 * Coach transitions on the whole AppState. PURE: ids and times arrive in the action.
 *
 * Every proposal and every decision writes an audit entry holding the input summary, the
 * safety and config versions, the explanation source/model and the outcome.
 */

import type { AppState, AuditEntry, AuditResult } from '../domain/types';
import type { WearableState } from '../wearables/feed';
import { COACH_CONFIG } from './config';
import { AUTO_SAFE, COACH_SAFETY_VERSION, validateProposal } from './actions';
import { buildCoachContext } from './input';
import {
  COACH_SIGNALS,
  type CoachAction,
  type CoachDecision,
  type CoachProposal,
  type CoachRecord,
  type CoachSignal,
  type CoachState,
  type ExplanationRecord,
  type SignalConsent
} from './types';

export const NO_SIGNALS: SignalConsent = { checkins: false, planner: false, barriers: false, context: false, steps: false, sleep: false, activity: false };
/** Guest data is synthetic, so the non-device signals start on; device signals always start off. */
export const GUEST_SIGNALS: SignalConsent = { ...NO_SIGNALS, checkins: true, planner: true, barriers: true, context: true };

export function emptyCoach(mode: 'guest' | 'local'): CoachState {
  return {
    enabled: true,
    autoAdjust: false,
    consent: { ...(mode === 'guest' ? GUEST_SIGNALS : NO_SIGNALS) },
    clinicianShare: mode === 'guest',
    pending: null,
    history: [],
    snoozedOn: null
  };
}

export type CoachAct =
  | { type: 'setEnabled'; value: boolean; nowIso: string; seed: string }
  | { type: 'setAuto'; value: boolean; nowIso: string; seed: string }
  | { type: 'setSignal'; signal: CoachSignal; value: boolean; nowIso: string; seed: string }
  | { type: 'setClinicianShare'; value: boolean }
  | { type: 'propose'; proposal: CoachProposal; explanation: ExplanationRecord; inputSummary: string; nowIso: string; seed: string }
  | { type: 'decide'; decision: 'accepted' | 'edited' | 'not_now'; editedTo?: string; today: string; nowIso: string; seed: string }
  | { type: 'undo'; id: string; nowIso: string; seed: string }
  | { type: 'clinician'; id: string; decision: 'accepted' | 'overridden'; nowIso: string; seed: string }
  | { type: 'setWearables'; wearables: WearableState; nowIso: string; seed: string }
  | { type: 'clearWearables'; nowIso: string; seed: string };

function entry(
  id: string,
  nowIso: string,
  reasonCode: string,
  result: AuditResult,
  params: Record<string, string | number> | undefined,
  meta?: Record<string, string | number>
): AuditEntry {
  return { id, at: nowIso, kind: 'coach', ruleVersion: COACH_SAFETY_VERSION, result, reasonCode, reasonParams: params, meta };
}

/** Applies the (already validated) proposal's one change to planner / prefs. */
export function applyProposal(state: AppState, p: CoachProposal, editedTo?: string): AppState {
  const to = editedTo ?? p.to;
  switch (p.action) {
    case 'reduce_goal':
      return setTrack(state, p.track!, { level: Number(to) as 1 | 2 | 3 });
    case 'change_time':
      return setTrack(state, p.track ?? 'activity', { time: to });
    case 'swap_behaviour':
      return setTrack(state, 'activity', { variant: 'alt' });
    case 'switch_channel':
      return { ...state, prefs: { ...state.prefs, preferredChannel: to as AppState['prefs']['preferredChannel'] } };
    case 'add_preshift_reminder':
      return { ...state, planner: { ...state.planner, preShift: { enabled: true, time: to } } };
    case 'pause_hydration_fasting':
      return { ...state, planner: { ...state.planner, hydrationPausedFasting: true } };
  }
}

/** Puts back what `applyProposal` changed (uses the proposal's `from`). */
export function revertProposal(state: AppState, p: CoachProposal): AppState {
  switch (p.action) {
    case 'reduce_goal':
      return setTrack(state, p.track!, { level: Number(p.from) as 1 | 2 | 3 });
    case 'change_time':
      return setTrack(state, p.track ?? 'activity', { time: p.from });
    case 'swap_behaviour':
      return setTrack(state, 'activity', { variant: 'default' });
    case 'switch_channel':
      return { ...state, prefs: { ...state.prefs, preferredChannel: p.from as AppState['prefs']['preferredChannel'] } };
    case 'add_preshift_reminder':
      return { ...state, planner: { ...state.planner, preShift: { enabled: false, time: '' } } };
    case 'pause_hydration_fasting':
      return { ...state, planner: { ...state.planner, hydrationPausedFasting: false } };
  }
}

function setTrack(state: AppState, track: NonNullable<CoachProposal['track']>, patch: Partial<AppState['planner']['tracks'][typeof track]>): AppState {
  return { ...state, planner: { ...state.planner, tracks: { ...state.planner.tracks, [track]: { ...state.planner.tracks[track], ...patch } } } };
}

function meta(r: CoachRecord, extra: Record<string, string | number> = {}): Record<string, string | number> {
  return {
    configVersion: r.configVersion,
    explanation: r.explanation.source,
    ...(r.explanation.model ? { model: r.explanation.model } : {}),
    ...(r.explanation.fallbackReason ? { fallback: r.explanation.fallbackReason } : {}),
    input: r.inputSummary,
    ...extra
  };
}

function withRecord(state: AppState, rec: CoachRecord, audit: AuditEntry, pending: CoachRecord | null, applied?: AppState): AppState {
  const base = applied ?? state;
  const history = [...state.coach.history.filter((h) => h.id !== rec.id), rec];
  return { ...base, coach: { ...base.coach, pending, history }, audit: [...state.audit, audit] };
}

export function coachReducer(state: AppState, a: CoachAct): AppState {
  switch (a.type) {
    case 'setEnabled': {
      const next = { ...state.coach, enabled: a.value, pending: a.value ? state.coach.pending : null };
      return { ...state, coach: next, audit: [...state.audit, entry(a.seed, a.nowIso, a.value ? 'coach_on' : 'coach_off', 'accepted', undefined)] };
    }
    case 'setAuto':
      return {
        ...state,
        coach: { ...state.coach, autoAdjust: a.value },
        audit: [...state.audit, entry(a.seed, a.nowIso, a.value ? 'coach_auto_on' : 'coach_auto_off', 'accepted', undefined)]
      };
    case 'setSignal': {
      if (!COACH_SIGNALS.includes(a.signal)) return state;
      return {
        ...state,
        coach: { ...state.coach, consent: { ...state.coach.consent, [a.signal]: a.value } },
        audit: [...state.audit, entry(a.seed, a.nowIso, a.value ? 'coach_signal_on' : 'coach_signal_off', 'accepted', { signal: a.signal })]
      };
    }
    case 'setClinicianShare':
      return { ...state, coach: { ...state.coach, clinicianShare: a.value } };

    case 'propose': {
      if (!state.coach.enabled) return state;
      const v = validateProposal(a.proposal, buildCoachContext(state));
      const base: CoachRecord = {
        id: a.proposal.id,
        at: a.nowIso,
        proposal: a.proposal,
        decision: 'pending',
        explanation: a.explanation,
        inputSummary: a.inputSummary,
        ruleVersion: COACH_SAFETY_VERSION,
        configVersion: COACH_CONFIG.version
      };
      if (!v.ok) {
        const rec: CoachRecord = { ...base, decision: 'blocked', breaches: v.breaches };
        return withRecord(state, rec, entry(a.seed, a.nowIso, 'coach_blocked', 'blocked', { action: String(a.proposal.action), rule: v.breaches[0] ?? 'unknown' }, meta(rec)), null);
      }
      if (state.coach.autoAdjust && a.proposal.reversible && AUTO_SAFE.includes(a.proposal.action as CoachAction)) {
        const rec: CoachRecord = { ...base, decision: 'auto_applied' };
        return withRecord(state, rec, entry(a.seed, a.nowIso, 'coach_auto_applied', 'auto_applied', { action: a.proposal.action, from: a.proposal.from, to: a.proposal.to }, meta(rec)), null, applyProposal(state, a.proposal));
      }
      return withRecord(state, base, entry(a.seed, a.nowIso, 'coach_proposed', 'proposed', { action: a.proposal.action, from: a.proposal.from, to: a.proposal.to, score: a.proposal.score }, meta(base)), base);
    }

    case 'decide': {
      const rec = state.coach.pending;
      if (!rec) return state;
      if (a.decision === 'not_now') {
        const done: CoachRecord = { ...rec, decision: 'not_now' };
        const next = withRecord(state, done, entry(a.seed, a.nowIso, 'coach_not_now', 'declined', { action: rec.proposal.action }, meta(done)), null);
        return { ...next, coach: { ...next.coach, snoozedOn: a.today } };
      }
      const editedTo = a.decision === 'edited' ? a.editedTo : undefined;
      const check = validateProposal({ ...rec.proposal, to: editedTo ?? rec.proposal.to }, buildCoachContext(state));
      if (!check.ok) {
        const done: CoachRecord = { ...rec, decision: 'blocked', breaches: check.breaches };
        return withRecord(state, done, entry(a.seed, a.nowIso, 'coach_blocked', 'blocked', { action: rec.proposal.action, rule: check.breaches[0] ?? 'unknown' }, meta(done)), null);
      }
      const done: CoachRecord = { ...rec, decision: a.decision, editedTo };
      return withRecord(
        state,
        done,
        entry(a.seed, a.nowIso, a.decision === 'edited' ? 'coach_edited' : 'coach_accepted', a.decision === 'edited' ? 'edited' : 'accepted', { action: rec.proposal.action, from: rec.proposal.from, to: editedTo ?? rec.proposal.to }, meta(done)),
        null,
        applyProposal(state, rec.proposal, editedTo)
      );
    }

    case 'undo': {
      const rec = state.coach.history.find((h) => h.id === a.id);
      if (!rec || (rec.decision !== 'auto_applied' && rec.decision !== 'accepted' && rec.decision !== 'edited')) return state;
      const done: CoachRecord = { ...rec, decision: 'undone' as CoachDecision };
      return withRecord(state, done, entry(a.seed, a.nowIso, 'coach_undone', 'undone', { action: rec.proposal.action }, meta(done)), state.coach.pending, revertProposal(state, rec.proposal));
    }

    case 'clinician': {
      const rec = state.coach.history.find((h) => h.id === a.id);
      if (!rec || !state.coach.clinicianShare) return state;
      if (a.decision === 'accepted') {
        return withRecord(state, rec, entry(a.seed, a.nowIso, 'coach_clinician_accepted', 'accepted', { action: rec.proposal.action }, meta(rec, { by: 'clinician-demo' })), state.coach.pending);
      }
      const applied = rec.decision === 'auto_applied' || rec.decision === 'accepted' || rec.decision === 'edited';
      const done: CoachRecord = { ...rec, decision: 'overridden' };
      return withRecord(state, done, entry(a.seed, a.nowIso, 'coach_overridden', 'overridden', { action: rec.proposal.action }, meta(done, { by: 'clinician-demo' })), state.coach.pending, applied ? revertProposal(state, rec.proposal) : undefined);
    }

    case 'setWearables':
      return { ...state, wearables: a.wearables, audit: [...state.audit, entry(a.seed, a.nowIso, 'wearables_loaded', 'accepted', { source: a.wearables.source ?? 'none' })] };
    case 'clearWearables':
      return { ...state, wearables: { source: null, data: {} }, audit: [...state.audit, entry(a.seed, a.nowIso, 'wearables_cleared', 'accepted', undefined)] };
  }
}
