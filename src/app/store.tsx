import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { createDemoState } from '../data/demoSeed';
import type {
  AppState,
  Barrier,
  ChannelId,
  CheckIn,
  CheckinStatus,
  ContextProfile,
  Demographics,
  FamilyField,
  Feel,
  GoalSetup,
  Lang,
  Plan,
  ReadingSource,
  SessionMode,
  UserPrefs
} from '../domain/types';
import { toDateKey, shiftDate } from '../domain/week';
import type { ScreenAnswers } from '../strength/safety';
import type { LoggedSet, ScheduleMode } from '../strength/types';
import { I18nProvider, translate } from '../i18n';
import { evaluateSafety } from '../safety/engine';
import { translateNote } from './languageLayer';
import { createGuestPersistence, createLocalPersistence, type Persistence } from './persistence';
import {
  InAppChannel,
  SimulatedMessageChannel,
  SimulatedVoiceChannel,
  deliver,
  dueReminders,
  planDelivery,
  type ReminderChannel
} from './reminders';
import { NO_CONSENT, emptyState, isBlocked, reducer } from './reducer';
import { selectProposal, validateProposal } from '../coach/actions';
import { explainProposal, coachApiUrl } from '../coach/explain';
import { buildCoachContext, buildCoachInput, trackCompletion } from '../coach/input';
import { assessRisk } from '../coach/risk';
import type { CoachSignal } from '../coach/types';
import type { Track } from '../planner/config';
import type { TrackEntry, TrackSettings } from '../planner/types';
import { parseCsv, simulatedFeed, type CsvResult } from '../wearables/feed';
import { endSession } from './session';
import { leaveApp } from './router';
import { speak } from './speech';

export interface CheckinInput {
  status: CheckinStatus;
  feel: Feel | 'unknown';
  redFlags: string[];
  glucose?: { value: number; source: ReadingSource };
  note?: string;
  input: 'text' | 'voice';
  activityMinutes?: number;
  bp?: { systolic: number; diastolic: number };
  weightKg?: number;
}

export interface Notice {
  id: string;
  text: string;
  kind: ChannelId | 'info';
}

export interface StrengthApi {
  screen: (answers: ScreenAnswers) => void;
  startPlan: (starterId: string) => void;
  stopPlan: () => void;
  setMode: (mode: ScheduleMode) => void;
  /** Starts a lighter week (7 days from today) or ends it. */
  setLight: (on: boolean) => void;
  startWorkout: (routineId: string) => void;
  setSet: (ex: number, set: number, patch: Partial<LoggedSet>) => void;
  addSet: (ex: number) => void;
  removeSet: (ex: number, set: number) => void;
  /** Saves the workout; returns its id (or null if there was nothing to save). */
  finish: (stopped?: 'unwell') => string | null;
  discard: () => void;
  deleteSession: (id: string) => void;
  logBodyWeight: (kg: number) => void;
}

export interface PlannerApi {
  complete: (track: Track, measure?: Partial<Omit<TrackEntry, 'done' | 'at'>>) => void;
  undo: (track: Track) => void;
  setTrack: (track: Track, patch: Partial<TrackSettings>) => void;
  restoreLevel: (track: Track) => void;
  stepUp: (track: Track, accept: boolean) => void;
}

export interface CoachApi {
  /** True while a suggestion is being prepared. */
  checking: boolean;
  setEnabled: (v: boolean) => void;
  setAuto: (v: boolean) => void;
  setSignal: (signal: CoachSignal, v: boolean) => void;
  setClinicianShare: (v: boolean) => void;
  refresh: () => Promise<void>;
  decide: (decision: 'accepted' | 'edited' | 'not_now', editedTo?: string) => void;
  undo: (id: string) => void;
  clinician: (id: string, decision: 'accepted' | 'overridden') => void;
  loadSimulatedFeed: () => void;
  importCsv: (text: string) => CsvResult;
  clearWearables: () => void;
}

interface Store {
  state: AppState;
  planner: PlannerApi;
  coach: CoachApi;
  strength: StrengthApi;
  lang: Lang;
  today: string;
  blocked: boolean;
  activePlan: Plan | undefined;
  /** 'failed' only after the optional language layer was configured and then failed. */
  langAssist: 'off' | 'failed';
  notices: Notice[];
  dismissNotice: (id: string) => void;
  completeSetup: (setup: GoalSetup) => 'ok' | 'blocked';
  saveCheckin: (input: CheckinInput) => Promise<CheckIn>;
  restartPlan: () => void;
  recordBarrier: (barrier: Barrier) => void;
  applyAdaptation: (index: number) => void;
  dismissProposal: () => void;
  respondStepUp: (accept: boolean) => void;
  setPrefs: (patch: Partial<UserPrefs>) => void;
  setContext: (context: ContextProfile) => void;
  setDemographics: (d: Demographics) => void;
  setConsent: (field: FamilyField, value: boolean) => void;
  setPersonConsent: (personId: string, field: FamilyField, value: boolean) => void;
  addPerson: (name: string, relation: string) => void;
  removePerson: (personId: string) => void;
  setReminderEnabled: (id: string, enabled: boolean) => void;
  setReminderTime: (id: string, time: string) => void;
  sendTestReminder: () => void;
  /** Reads text aloud; returns false when the browser cannot. */
  speakText: (text: string) => boolean;
  deleteData: () => void;
  exitSession: () => void;
}

const Ctx = createContext<Store | null>(null);

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function initialState(mode: SessionMode, lang: Lang, persistence: Persistence): AppState {
  const saved = persistence.load();
  if (saved) return saved;
  if (mode === 'guest') {
    const demo = createDemoState(toDateKey(new Date()));
    return { ...demo, profile: { ...demo.profile, lang } };
  }
  return emptyState('local', lang);
}

export const StoreProvider: React.FC<{
  mode: SessionMode;
  lang: Lang;
  children: React.ReactNode;
  /** Account mode supplies its own (cloud) persistence and an exit hook that signs out. */
  persistence?: Persistence;
  onExit?: () => void;
}> = ({ mode, lang: startLang, children, persistence: given, onExit }) => {
  const persistence = useMemo<Persistence>(
    () => given ?? (mode === 'guest' ? createGuestPersistence() : createLocalPersistence(window.localStorage)),
    [mode, given]
  );
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState(mode, startLang, persistence));
  const [now, setNow] = useState(() => new Date());
  const [notices, setNotices] = useState<Notice[]>([]);
  const [langAssist, setLangAssist] = useState<'off' | 'failed'>('off');
  const [checking, setChecking] = useState(false);
  const llmCooldown = useRef<number | null>(null);
  const refreshing = useRef(false);

  const lang = state.profile.lang;
  const today = toDateKey(now);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    persistence.save(state);
  }, [persistence, state]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  // A new day: let the ladder notice two missed days, even if the app was closed.
  useEffect(() => {
    dispatch({ type: 'tick', today, nowIso: new Date().toISOString(), seed: uid() });
  }, [today]);

  // Large-text mode scales every rem-based size while the app is open.
  useEffect(() => {
    document.documentElement.style.fontSize = state.prefs.largeText ? '118.75%' : '';
    return () => {
      document.documentElement.style.fontSize = '';
    };
  }, [state.prefs.largeText]);

  const notify = useCallback((kind: Notice['kind']) => (text: string) => {
    const id = uid();
    setNotices((n) => [...n, { id, text, kind }]);
    window.setTimeout(() => setNotices((n) => n.filter((x) => x.id !== id)), 9000);
  }, []);

  const speakText = useCallback((text: string) => speak(text, stateRef.current.profile.lang), []);

  const channels = useMemo<Record<ChannelId, ReminderChannel>>(
    () => ({
      'in-app': new InAppChannel(notify('in-app')),
      message: new SimulatedMessageChannel(notify('message')),
      voice: new SimulatedVoiceChannel(notify('voice'), (text) => speak(text, stateRef.current.profile.lang))
    }),
    [notify]
  );

  const reminderText = useCallback((s: AppState) => {
    const goal = s.setup ? translate(s.profile.lang, `goal.${s.setup.goalType}`) : translate(s.profile.lang, 'rem.noGoal');
    return translate(s.profile.lang, s.prefs.tone === 'encouraging' ? 'rem.messageWarm' : 'rem.message', { goal });
  }, []);

  const send = useCallback(
    async (force: boolean) => {
      const s = stateRef.current;
      const r = s.reminders[0];
      if (!r) return;
      const at = new Date();
      const plan = planDelivery(r, s.prefs, at, force);
      if (!plan.send) {
        dispatch({
          type: 'logDelivery',
          entry: { id: `d-${uid()}`, at: at.toISOString(), reminderId: r.id, channel: 'none', status: 'suppressed', simulated: true, reason: plan.reason }
        });
        return;
      }
      const entry = await deliver(channels[plan.channel], r, reminderText(s), at, `d-${uid()}`);
      dispatch({ type: 'logDelivery', entry });
    },
    [channels, reminderText]
  );

  // Scheduler: while the app is open, deliver reminders that are due (simulated).
  useEffect(() => {
    if (dueReminders(state.reminders, now, state.deliveryLog).length > 0) void send(false);
    // Only re-evaluate when the clock ticks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  const stamp = () => ({ nowIso: new Date().toISOString(), seed: uid() });

  const value = useMemo<Store>(
    () => ({
      state,
      lang,
      today,
      blocked: isBlocked(state),
      activePlan: state.plans[state.plans.length - 1],
      langAssist,
      notices,
      dismissNotice: (id) => setNotices((n) => n.filter((x) => x.id !== id)),

      planner: {
        complete: (track, measure) => dispatch({ type: 'planner', action: { type: 'complete', track, date: today, nowIso: new Date().toISOString(), measure }, ...stamp() }),
        undo: (track) => dispatch({ type: 'planner', action: { type: 'undo', track, date: today }, ...stamp() }),
        setTrack: (track, patch) => dispatch({ type: 'planner', action: { type: 'setTrack', track, patch }, ...stamp() }),
        restoreLevel: (track) => dispatch({ type: 'planner', action: { type: 'restoreLevel', track }, ...stamp() }),
        stepUp: (track, accept) => dispatch({ type: 'planner', action: { type: 'stepUp', track, accept, today }, ...stamp() })
      },

      coach: {
        checking,
        setEnabled: (value) => dispatch({ type: 'coach', action: { type: 'setEnabled', value, ...stamp() } }),
        setAuto: (value) => dispatch({ type: 'coach', action: { type: 'setAuto', value, ...stamp() } }),
        setSignal: (signal, value) => dispatch({ type: 'coach', action: { type: 'setSignal', signal, value, ...stamp() } }),
        setClinicianShare: (value) => dispatch({ type: 'coach', action: { type: 'setClinicianShare', value } }),
        refresh: async () => {
          const s = stateRef.current;
          if (refreshing.current || !s.coach.enabled || s.coach.pending || s.coach.snoozedOn === today) return;
          refreshing.current = true;
          setChecking(true);
          try {
            // The wording call can be slow and state may move meanwhile (e.g. a step-down), so a
            // proposal is re-validated against the latest state and recomputed once if it went stale.
            for (let attempt = 0; attempt < 2; attempt++) {
              const cur = stateRef.current;
              const input = buildCoachInput(cur, today);
              const risk = assessRisk(input);
              const st = stamp();
              const proposal = selectProposal({ input, risk, ctx: buildCoachContext(cur), trackCompletion: trackCompletion(cur, today), id: `cp-${st.seed}`, nowIso: st.nowIso });
              if (!proposal) return;
              const l = cur.profile.lang;
              const res = await explainProposal(proposal, {
                t: (k, p) => translate(l, k, p),
                lang: l,
                tone: cur.prefs.tone,
                url: coachApiUrl(),
                now: Date.now(),
                cooldownUntil: llmCooldown.current
              });
              llmCooldown.current = res.cooldownUntil;
              const latest = stateRef.current;
              if (attempt === 0 && (latest.coach.pending || !validateProposal(proposal, buildCoachContext(latest)).ok)) {
                if (latest.coach.pending) return;
                continue;
              }
              dispatch({
                type: 'coach',
                action: { type: 'propose', proposal, explanation: res.record, inputSummary: `score ${risk.score}; top ${risk.top.map((f) => f.id).join(',')}; signals ${input.used.join(',') || 'none'}`, nowIso: st.nowIso, seed: st.seed }
              });
              return;
            }
          } finally {
            refreshing.current = false;
            setChecking(false);
          }
        },
        decide: (decision, editedTo) => dispatch({ type: 'coach', action: { type: 'decide', decision, editedTo, today, ...stamp() } }),
        undo: (id) => dispatch({ type: 'coach', action: { type: 'undo', id, ...stamp() } }),
        clinician: (id, decision) => dispatch({ type: 'coach', action: { type: 'clinician', id, decision, ...stamp() } }),
        loadSimulatedFeed: () =>
          dispatch({ type: 'coach', action: { type: 'setWearables', wearables: { source: 'simulated', data: simulatedFeed(today, 14, 'night-shift', shiftDate), importedAt: new Date().toISOString() }, ...stamp() } }),
        importCsv: (text) => {
          const r = parseCsv(text);
          if (r.rows > 0) dispatch({ type: 'coach', action: { type: 'setWearables', wearables: { source: 'csv', data: r.data, importedAt: new Date().toISOString() }, ...stamp() } });
          return r;
        },
        clearWearables: () => dispatch({ type: 'coach', action: { type: 'clearWearables', ...stamp() } })
      },

      strength: {
        screen: (answers) => {
          const s = stamp();
          dispatch({ type: 'strength', action: { type: 'screen', answers, nowIso: s.nowIso }, ...s });
        },
        startPlan: (starterId) => dispatch({ type: 'strength', action: { type: 'startPlan', starterId, today }, ...stamp() }),
        stopPlan: () => dispatch({ type: 'strength', action: { type: 'stopPlan' }, ...stamp() }),
        setMode: (mode) => dispatch({ type: 'strength', action: { type: 'setMode', mode }, ...stamp() }),
        setLight: (on) => dispatch({ type: 'strength', action: { type: 'setLight', until: on ? shiftDate(today, 6) : null }, ...stamp() }),
        startWorkout: (routineId) => {
          const s = stamp();
          dispatch({ type: 'strength', action: { type: 'startWorkout', routineId, id: `w-${s.seed}`, nowIso: s.nowIso, today }, ...s });
        },
        setSet: (ex, set, patch) => dispatch({ type: 'strength', action: { type: 'setSet', ex, set, patch }, ...stamp() }),
        addSet: (ex) => dispatch({ type: 'strength', action: { type: 'addSet', ex }, ...stamp() }),
        removeSet: (ex, set) => dispatch({ type: 'strength', action: { type: 'removeSet', ex, set }, ...stamp() }),
        finish: (stopped) => {
          const id = stateRef.current.strength.draft?.id ?? null;
          const s = stamp();
          dispatch({ type: 'strength', action: { type: 'finishWorkout', nowIso: s.nowIso, stopped }, ...s });
          return id;
        },
        discard: () => dispatch({ type: 'strength', action: { type: 'discardWorkout' }, ...stamp() }),
        deleteSession: (id) => dispatch({ type: 'strength', action: { type: 'deleteSession', id }, ...stamp() }),
        logBodyWeight: (kg) => dispatch({ type: 'strength', action: { type: 'logBodyWeight', date: today, kg }, ...stamp() })
      },

      completeSetup: (setup) => {
        dispatch({ type: 'completeSetup', setup, ...stamp() });
        return evaluateSafety({ ownTargets: setup.ownTargets, screening: setup.screening }).result === 'blocked'
          ? 'blocked'
          : 'ok';
      },

      saveCheckin: async (input) => {
        const nowDate = new Date();
        const checkin: CheckIn = {
          id: `c-${uid()}`,
          date: toDateKey(nowDate),
          status: input.status,
          feel: input.feel,
          redFlags: input.redFlags,
          glucose: input.glucose ? { value: input.glucose.value, unit: 'mg/dL', source: input.glucose.source } : undefined,
          input: input.input,
          createdAt: nowDate.toISOString(),
          activityMinutes: input.activityMinutes,
          bp: input.bp,
          weightKg: input.weightKg
        };
        const seed = uid();
        const text = input.note?.trim();
        if (text) {
          checkin.note = { original: text, lang };
          if (lang !== 'en') {
            const result = await translateNote(text, lang, 'en');
            if (result.ok) {
              checkin.note.translation = { text: result.text, lang: 'en', provider: result.provider };
              setLangAssist('off');
            } else if (result.reason === 'failed') {
              // Configured but failing: say so, keep the original, carry on.
              setLangAssist('failed');
              dispatch({ type: 'logFallback', nowIso: nowDate.toISOString(), seed: `${seed}-t`, reasonCode: 'lang_service_failed' });
            }
          }
        }
        dispatch({ type: 'saveCheckin', checkin, nowIso: nowDate.toISOString(), seed });
        return checkin;
      },

      restartPlan: () => dispatch({ type: 'restartPlan', ...stamp() }),
      recordBarrier: (barrier) => dispatch({ type: 'recordBarrier', barrier, today, ...stamp() }),
      applyAdaptation: (index) => dispatch({ type: 'applyAdaptation', index, ...stamp() }),
      dismissProposal: () => dispatch({ type: 'dismissProposal' }),
      respondStepUp: (accept) => dispatch({ type: 'respondStepUp', accept, today, ...stamp() }),
      setPrefs: (patch) => dispatch({ type: 'setPrefs', patch }),
      setContext: (context) => dispatch({ type: 'setContext', context, ...stamp() }),
      setDemographics: (demographics) => dispatch({ type: 'setDemographics', demographics }),
      setConsent: (field, v) => dispatch({ type: 'setConsent', field, value: v }),
      setPersonConsent: (personId, field, v) => dispatch({ type: 'setPersonConsent', personId, field, value: v }),
      addPerson: (name, relation) =>
        dispatch({ type: 'addPerson', person: { id: `p-${uid()}`, name, relation, consent: { ...NO_CONSENT } } }),
      removePerson: (personId) => dispatch({ type: 'removePerson', personId }),
      setReminderEnabled: (id, enabled) => dispatch({ type: 'setReminderEnabled', id, enabled }),
      setReminderTime: (id, time) => dispatch({ type: 'setReminderTime', id, time }),
      sendTestReminder: () => void send(true),
      speakText,

      deleteData: () => {
        persistence.clear();
        const fresh =
          mode === 'guest'
            ? (() => {
                const demo = createDemoState(today);
                return { ...demo, profile: { ...demo.profile, lang } };
              })()
            : emptyState('local', lang);
        dispatch({ type: 'replace', state: fresh });
      },

      exitSession: () => {
        if (mode === 'guest') persistence.clear();
        endSession();
        onExit?.();
        leaveApp();
      }
    }),
    // stamp() reads the clock at call time and needs no dependency.
    [state, lang, today, langAssist, notices, send, speakText, mode, persistence, checking, onExit]
  );

  return (
    <Ctx.Provider value={value}>
      <I18nProvider lang={lang} setLang={(l) => dispatch({ type: 'setLang', lang: l })}>
        {children}
      </I18nProvider>
    </Ctx.Provider>
  );
};

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside <StoreProvider>');
  return v;
}
