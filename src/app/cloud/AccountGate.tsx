import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { LogoMark } from '../../components/ui/Logo';
import { cloudConfigured, getClient } from '../../cloud/client';
import { createAccountApi, createCloudApi } from '../../cloud/api';
import { createCloudPersistence, type CloudPersistence } from '../../cloud/sync';
import type { AppState, Lang } from '../../domain/types';
import { isRtl, translate, type Key } from '../../i18n';
import { normalizeState } from '../reducer';
import { CloudContext, type CloudInfo } from './CloudContext';

const LOCAL_KEY = 'thypro.local.v1';
const CODE_ENTRY = import.meta.env.VITE_AUTH_CODE_ENTRY === '1';

type Phase =
  | { kind: 'boot' }
  | { kind: 'signedOut' }
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'import'; remote: null; local: AppState }
  | { kind: 'ready'; persistence: CloudPersistence; info: CloudInfo };

const field = 'min-h-[48px] w-full rounded-xl border border-forest-900/20 bg-white px-3 text-base text-forest-950';

function readLocalPlan(): AppState | null {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: AppState };
    return parsed.state?.setup ? normalizeState(parsed.state) : null;
  } catch {
    return null;
  }
}

const Frame: React.FC<{ lang: Lang; children: React.ReactNode; onBack?: () => void; back: string }> = ({ lang, children, onBack, back }) => (
  <div className="app-root min-h-screen bg-ivory-100 px-4 py-6 text-forest-900" lang={lang} dir={isRtl(lang) ? 'rtl' : 'ltr'}>
    <div className="mx-auto max-w-lg">
      {onBack && (
        <button type="button" onClick={onBack} className="mb-6 flex min-h-[44px] items-center gap-2 text-sm text-forest-800">
          <ArrowLeft className="h-4 w-4 flip-rtl" aria-hidden="true" />
          {back}
        </button>
      )}
      <LogoMark className="h-9" />
      <main id="app-main" tabIndex={-1} className="outline-none">{children}</main>
    </div>
  </div>
);

/**
 * Handles everything between "I want an account" and the app: sign-in by emailed link (PKCE),
 * loading the person's saved state, an optional one-time move of an on-device plan, and the
 * cloud persistence that the store then uses. Renders `children(persistence)` when ready.
 */
export const AccountGate: React.FC<{
  lang: Lang;
  onCancel: () => void;
  children: (p: { persistence: CloudPersistence; onExit: () => void }) => React.ReactNode;
}> = ({ lang, onCancel, children }) => {
  const t = (k: Key, p?: Record<string, string | number>) => translate(lang, k, p);
  const [phase, setPhase] = useState<Phase>({ kind: 'boot' });
  const sbRef = useRef<SupabaseClient | null>(null);
  const readyRef = useRef(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Key | null>(null);

  const open = useCallback(
    async (sb: SupabaseClient, userId: string, mail: string, useLocal: boolean | null) => {
      setPhase({ kind: 'loading' });
      try {
        const api = createCloudApi(sb, userId);
        const remote = await api.loadState();
        let initial: AppState | null = remote ? normalizeState(remote.state) : null;
        if (!remote && useLocal === null) {
          const local = readLocalPlan();
          if (local) {
            setPhase({ kind: 'import', remote: null, local });
            return;
          }
        }
        if (!remote && useLocal) initial = readLocalPlan();
        const persistence = createCloudPersistence(api, initial);
        const signOut = async () => {
          await persistence.flush().catch(() => undefined);
          await sb.auth.signOut();
        };
        const info: CloudInfo = {
          email: mail,
          userId,
          account: createAccountApi(sb, userId),
          persistence,
          signOut,
          deleteAccount: async () => {
            await createAccountApi(sb, userId).deleteAccount();
            await sb.auth.signOut({ scope: 'local' }); // the account no longer exists server-side
          }
        };
        readyRef.current = true;
        setPhase({ kind: 'ready', persistence, info });
      } catch {
        setPhase({ kind: 'error' });
      }
    },
    []
  );

  const boot = useCallback(async () => {
    setPhase({ kind: 'boot' });
    try {
      const sb = await getClient();
      sbRef.current = sb;
      const { data } = await sb.auth.getSession();
      if (new URLSearchParams(window.location.search).has('code')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.hash);
      }
      if (data.session) void open(sb, data.session.user.id, data.session.user.email ?? '', null);
      else setPhase({ kind: 'signedOut' });
    } catch {
      setPhase(cloudConfigured() ? { kind: 'error' } : { kind: 'signedOut' });
    }
  }, [open]);

  useEffect(() => {
    void boot();
  }, [boot]);

  // Signing in (link opened in this browser) or out elsewhere moves us along.
  useEffect(() => {
    let off: (() => void) | undefined;
    void getClient()
      .then((sb) => {
        const { data } = sb.auth.onAuthStateChange((event, session) => {
          // SIGNED_IN also fires when the tab regains focus; never rebuild an open session.
          if (event === 'SIGNED_IN' && session && !readyRef.current) void open(sb, session.user.id, session.user.email ?? '', null);
          if (event === 'SIGNED_OUT') {
            readyRef.current = false;
            setPhase({ kind: 'signedOut' });
          }
        });
        off = () => data.subscription.unsubscribe();
      })
      .catch(() => undefined);
    return () => off?.();
  }, [open]);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    const mail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return setMessage('auth.invalidEmail');
    setBusy(true);
    setMessage(null);
    try {
      const sb = sbRef.current ?? (await getClient());
      const { error } = await sb.auth.signInWithOtp({ email: mail, options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/#/app/today` } });
      if (error) setMessage(error.status === 429 || /rate/i.test(error.message) ? 'auth.rate' : 'auth.failed');
      else setSent(true);
    } catch {
      setMessage('auth.failed');
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const sb = sbRef.current ?? (await getClient());
      const { error } = await sb.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'email' });
      if (error) setMessage('auth.codeBad');
    } catch {
      setMessage('auth.failed');
    } finally {
      setBusy(false);
    }
  }

  const exit = useCallback(() => {
    void sbRef.current?.auth.signOut({ scope: 'local' }); // idempotent: already signed out by the caller
  }, []);

  if (phase.kind === 'ready') {
    return (
      <CloudContext.Provider value={phase.info}>
        {children({ persistence: phase.persistence, onExit: exit })}
      </CloudContext.Provider>
    );
  }

  if (phase.kind === 'boot' || phase.kind === 'loading') {
    return (
      <Frame lang={lang} back={t('common.back')}>
        <p className="mt-10 flex items-center gap-3 text-base text-forest-900" role="status">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          {t('gate.loading')}
        </p>
      </Frame>
    );
  }

  if (phase.kind === 'error') {
    return (
      <Frame lang={lang} onBack={onCancel} back={t('common.back')}>
        <h1 className="mt-6 font-editorial text-2xl text-forest-950">{t('gate.errorTitle')}</h1>
        <p className="mt-2 text-sm text-forest-900/85">{t('gate.errorBody')}</p>
        <button type="button" onClick={() => void boot()} className="thy-btn-primary mt-4 min-h-[48px]">{t('common.retry')}</button>
      </Frame>
    );
  }

  if (phase.kind === 'import') {
    const choose = async (useLocal: boolean) => {
      const sb = sbRef.current;
      const { data } = (await sb?.auth.getSession()) ?? { data: { session: null } };
      if (sb && data.session) void open(sb, data.session.user.id, data.session.user.email ?? '', useLocal);
    };
    return (
      <Frame lang={lang} back={t('common.back')}>
        <h1 className="mt-6 font-editorial text-2xl text-forest-950">{t('gate.import.title')}</h1>
        <p className="mt-2 text-sm text-forest-900/85">{t('gate.import.body')}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={() => void choose(true)} className="thy-btn-primary min-h-[48px]">{t('gate.import.yes')}</button>
          <button type="button" onClick={() => void choose(false)} className="thy-btn-ghost min-h-[48px]">{t('gate.import.no')}</button>
        </div>
      </Frame>
    );
  }

  return (
    <Frame lang={lang} onBack={onCancel} back={t('common.back')}>
      <h1 className="mt-6 font-editorial text-3xl text-forest-950">{t('auth.title')}</h1>
      {!cloudConfigured() ? (
        <p className="mt-3 text-sm text-forest-900/85" role="alert">{t('auth.notConfigured')}</p>
      ) : sent ? (
        <div className="mt-3 space-y-4" aria-live="polite">
          <h2 className="flex items-center gap-2 font-editorial text-xl text-forest-950"><Mail className="h-5 w-5 text-ochre-700" aria-hidden="true" />{t('auth.sent')}</h2>
          <p className="text-sm text-forest-900/85">{t('auth.sentBody', { email })}</p>
          {CODE_ENTRY && (
            <form onSubmit={verify} className="space-y-2">
              <label htmlFor="auth-code" className="block text-sm font-medium text-forest-950">{t('auth.code')}</label>
              <input id="auth-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} className={field} />
              <button type="submit" disabled={busy || code.trim().length < 6} className="thy-btn-primary min-h-[48px] w-full">{t('auth.verify')}</button>
            </form>
          )}
          {message && <p className="text-sm text-signal-crimson" role="alert">{t(message)}</p>}
        </div>
      ) : (
        <form onSubmit={sendLink} className="mt-3 space-y-3" noValidate>
          <p className="text-sm text-forest-900/85">{t('auth.body')}</p>
          <label htmlFor="auth-email" className="block text-sm font-medium text-forest-950">{t('auth.email')}</label>
          <input id="auth-email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={message === 'auth.invalidEmail'} className={field} />
          {message && <p className="text-sm text-signal-crimson" role="alert">{t(message)}</p>}
          <button type="submit" disabled={busy} className="thy-btn-primary min-h-[48px] w-full">{busy ? t('auth.sending') : t('auth.send')}</button>
          <p className="text-xs text-forest-800/85">{t('auth.privacy')}</p>
        </form>
      )}
    </Frame>
  );
};
