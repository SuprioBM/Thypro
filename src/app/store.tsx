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
import { toDateKey } from '../domain/week';
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

interface Store {
  state: AppState;
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

export const StoreProvider: React.FC<{ mode: SessionMode; lang: Lang; children: React.ReactNode }> = ({
  mode,
  lang: startLang,
  children
}) => {
  const persistence = useMemo<Persistence>(
    () => (mode === 'guest' ? createGuestPersistence() : createLocalPersistence(window.localStorage)),
    [mode]
  );
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState(mode, startLang, persistence));
  const [now, setNow] = useState(() => new Date());
  const [notices, setNotices] = useState<Notice[]>([]);
  const [langAssist, setLangAssist] = useState<'off' | 'failed'>('off');

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
        leaveApp();
      }
    }),
    // stamp() reads the clock at call time and needs no dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, lang, today, langAssist, notices, send, speakText, mode, persistence]
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
