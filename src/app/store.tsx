import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { createDemoState } from '../data/demoSeed';
import type {
  AppState,
  CheckIn,
  CheckinStatus,
  FamilyField,
  Feel,
  GoalSetup,
  Lang,
  Plan,
  ReadingSource,
  SessionMode
} from '../domain/types';
import { toDateKey } from '../domain/week';
import { I18nProvider, translate } from '../i18n';
import { evaluateSafety } from '../safety/engine';
import { translateNote } from './languageLayer';
import { createGuestPersistence, createLocalPersistence, type Persistence } from './persistence';
import { InAppChannel, deliver, dueReminders } from './reminders';
import { emptyState, isBlocked, reducer } from './reducer';
import { endSession } from './session';
import { leaveApp } from './router';

export interface CheckinInput {
  status: CheckinStatus;
  feel: Feel | 'unknown';
  redFlags: string[];
  glucose?: { value: number; source: ReadingSource };
  note?: string;
  input: 'text' | 'voice';
}

export interface Notice {
  id: string;
  text: string;
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
  setConsent: (field: FamilyField, value: boolean) => void;
  setReminderEnabled: (id: string, enabled: boolean) => void;
  setReminderTime: (id: string, time: string) => void;
  sendTestReminder: () => void;
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
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    persistence.save(state);
  }, [persistence, state]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  const notify = useCallback((text: string) => {
    const id = uid();
    setNotices((n) => [...n, { id, text }]);
    window.setTimeout(() => setNotices((n) => n.filter((x) => x.id !== id)), 9000);
  }, []);

  const goalLabel = useCallback(
    (s: AppState) => (s.setup ? translate(s.profile.lang, `goal.${s.setup.goalType}`) : translate(s.profile.lang, 'rem.noGoal')),
    []
  );

  const channel = useMemo(() => new InAppChannel(notify), [notify]);

  // Scheduler: while the app is open, deliver reminders that are due (simulated, in-app).
  useEffect(() => {
    const due = dueReminders(state.reminders, now, state.deliveryLog);
    due.forEach(async (r) => {
      const s = stateRef.current;
      const text = translate(s.profile.lang, 'rem.message', { goal: goalLabel(s) });
      const entry = await deliver(channel, r, text, new Date(), `d-${uid()}`);
      dispatch({ type: 'logDelivery', entry });
    });
    // Only re-evaluate when the clock ticks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  const value = useMemo<Store>(
    () => ({
      state,
      lang,
      today: toDateKey(now),
      blocked: isBlocked(state),
      activePlan: state.plans[state.plans.length - 1],
      langAssist,
      notices,
      dismissNotice: (id) => setNotices((n) => n.filter((x) => x.id !== id)),

      completeSetup: (setup) => {
        dispatch({ type: 'completeSetup', setup, nowIso: new Date().toISOString(), seed: uid() });
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
          createdAt: nowDate.toISOString()
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

      restartPlan: () => dispatch({ type: 'restartPlan', nowIso: new Date().toISOString(), seed: uid() }),
      setConsent: (field, v) => dispatch({ type: 'setConsent', field, value: v }),
      setReminderEnabled: (id, enabled) => dispatch({ type: 'setReminderEnabled', id, enabled }),
      setReminderTime: (id, time) => dispatch({ type: 'setReminderTime', id, time }),

      sendTestReminder: () => {
        const r = stateRef.current.reminders[0];
        if (!r) return;
        const s = stateRef.current;
        void deliver(channel, r, translate(s.profile.lang, 'rem.message', { goal: goalLabel(s) }), new Date(), `d-${uid()}`).then(
          (entry) => dispatch({ type: 'logDelivery', entry })
        );
      },

      exitSession: () => {
        if (mode === 'guest') persistence.clear();
        endSession();
        leaveApp();
      }
    }),
    [state, lang, now, langAssist, notices, channel, goalLabel, mode, persistence]
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
