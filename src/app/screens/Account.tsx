import React, { useCallback, useEffect, useState } from 'react';
import { Cloud, LogOut, Trash2, UserPlus } from 'lucide-react';
import type { ShareGrant, SponsorRow } from '../../cloud/api';
import type { SyncStatus } from '../../cloud/sync';
import { FAMILY_FIELDS, type ConsentMap, type FamilyField } from '../../domain/types';
import { useI18n, type Key } from '../../i18n';
import { useCloud } from '../cloud/CloudContext';
import { useStore } from '../store';
import { Card, Chip, EmptyState, ErrorState, ScreenHeader, Switch } from '../ui/kit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const input = 'min-h-[48px] w-full rounded-xl border border-forest-900/20 bg-white px-3 text-base text-forest-950';

/** Loads something async with explicit loading and error states. */
function useLoad<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data: T | null; error: boolean; loading: boolean }>({ data: null, error: false, loading: true });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, loading: true, error: false }));
    fn().then(
      (data) => live && setState({ data, error: false, loading: false }),
      () => live && setState({ data: null, error: true, loading: false })
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { ...state, reload: () => setTick((n) => n + 1) };
}

const SyncChip: React.FC = () => {
  const { t } = useI18n();
  const cloud = useCloud();
  const [status, setStatus] = useState<SyncStatus>(cloud?.persistence.status() ?? 'idle');
  useEffect(() => cloud?.persistence.subscribe(setStatus), [cloud]);
  const tone = status === 'saved' ? 'good' : status === 'saving' || status === 'idle' ? 'neutral' : 'warn';
  return (
    <span aria-live="polite">
      <Chip tone={tone}>
        <Cloud className="h-3 w-3" aria-hidden="true" />
        {t(`sync.${status}` as Key)}
      </Chip>
    </span>
  );
};

const ShareForm: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { t } = useI18n();
  const cloud = useCloud()!;
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ShareGrant['role']>('family');
  const [consent, setConsent] = useState<Partial<ConsentMap>>({ goal: true, weeklyCompletion: true });
  const [err, setErr] = useState<Key | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const mail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(mail)) return setErr('share.invalid');
    if (mail === cloud.email.toLowerCase()) return setErr('share.self');
    setBusy(true);
    setErr(null);
    try {
      await cloud.account.createGrant(mail, role, consent);
      setEmail('');
      onDone();
    } catch (ex) {
      setErr(/duplicate|unique/i.test((ex as Error).message) ? 'share.exists' : 'acct.loadError');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mt-3 space-y-3">
      <div>
        <label htmlFor="share-email" className="mb-1 block text-sm font-medium text-forest-950">{t('share.email')}</label>
        <input id="share-email" type="email" inputMode="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} className={input} aria-invalid={err === 'share.invalid'} />
      </div>
      <div>
        <label htmlFor="share-role" className="mb-1 block text-sm font-medium text-forest-950">{t('share.role')}</label>
        <select id="share-role" value={role} onChange={(e) => setRole(e.target.value as ShareGrant['role'])} className={input}>
          <option value="family">{t('share.role.family')}</option>
          <option value="clinician">{t('share.role.clinician')}</option>
        </select>
      </div>
      <fieldset>
        <legend className="mb-1 text-sm font-medium text-forest-950">{t('share.fields')}</legend>
        <div className="divide-y divide-forest-900/10">
          {FAMILY_FIELDS.map((f: FamilyField) => (
            <Switch key={f} checked={consent[f] === true} onChange={(v) => setConsent((c) => ({ ...c, [f]: v }))} label={t(`family.field.${f}` as Key)} />
          ))}
        </div>
      </fieldset>
      {err && <p className="text-sm text-signal-crimson" role="alert">{t(err)}</p>}
      <button type="submit" disabled={busy} className="thy-btn-primary min-h-[48px] w-full">
        <UserPlus className="h-4 w-4" aria-hidden="true" />
        {t('share.add')}
      </button>
    </form>
  );
};

const MyGrants: React.FC<{ reloadKey: number }> = ({ reloadKey }) => {
  const { t } = useI18n();
  const cloud = useCloud()!;
  const { data, error, loading, reload } = useLoad(() => cloud.account.myGrants(), [reloadKey]);
  const act = async (fn: () => Promise<void>) => {
    await fn().catch(() => undefined);
    reload();
  };
  if (loading) return <p className="mt-2 text-sm text-forest-800/85" role="status">{t('gate.loading')}</p>;
  if (error) return <ErrorState title={t('acct.loadError')} retryLabel={t('common.retry')} onRetry={reload} />;
  if (!data || data.length === 0) return <p className="mt-2 text-sm text-forest-800/85">{t('share.empty')}</p>;
  return (
    <ul className="mt-2 space-y-2">
      {data.map((g) => (
        <li key={g.id} className="rounded-xl bg-ivory-100 p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="min-w-0 break-all font-medium text-forest-950">{g.grantee_email}</span>
            <Chip tone={g.status === 'active' ? 'good' : g.status === 'pending' ? 'warn' : 'neutral'}>{t(`share.status.${g.status}` as Key)}</Chip>
          </div>
          <p className="mt-0.5 text-xs text-forest-800/85">{t(`share.role.${g.role}` as Key)}</p>
          {g.status !== 'revoked' && (
            <div className="mt-1 divide-y divide-forest-900/10">
              {FAMILY_FIELDS.map((f) => (
                <Switch key={f} checked={g.consent[f] === true} onChange={(v) => void act(() => cloud.account.updateConsent(g.id, { ...g.consent, [f]: v }))} label={t(`family.field.${f}` as Key)} />
              ))}
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {g.status !== 'revoked' && <button type="button" onClick={() => void act(() => cloud.account.revokeGrant(g.id))} className="thy-btn-ghost min-h-[44px] !py-2">{t('share.stop')}</button>}
            <button type="button" onClick={() => void act(() => cloud.account.removeGrant(g.id))} className="thy-btn-quiet min-h-[44px] !py-2">{t('share.remove')}</button>
          </div>
        </li>
      ))}
    </ul>
  );
};

const SharedWithMe: React.FC = () => {
  const { t } = useI18n();
  const cloud = useCloud()!;
  const { data, error, loading, reload } = useLoad(() => cloud.account.grantsToMe(), []);
  const [open, setOpen] = useState<{ id: string; view: Record<string, unknown> | null; failed?: boolean } | null>(null);

  const view = async (g: ShareGrant) => {
    setOpen({ id: g.id, view: null });
    try {
      setOpen({ id: g.id, view: await cloud.account.sharedView(g.owner_id) });
    } catch {
      setOpen({ id: g.id, view: null, failed: true });
    }
  };
  const accept = async (g: ShareGrant) => {
    await cloud.account.acceptGrant(g.id).catch(() => undefined);
    reload();
  };
  const show = (v: unknown): string => (Array.isArray(v) ? (typeof v[0] === 'object' ? String(v.length) : v.join(', ') || '–') : typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v ?? '–'));

  if (loading) return <p className="mt-2 text-sm text-forest-800/85" role="status">{t('gate.loading')}</p>;
  if (error) return <ErrorState title={t('acct.loadError')} retryLabel={t('common.retry')} onRetry={reload} />;
  if (!data || data.length === 0) return <p className="mt-2 text-sm text-forest-800/85">{t('shared.empty')}</p>;
  return (
    <ul className="mt-2 space-y-2">
      {data.map((g) => (
        <li key={g.id} className="rounded-xl bg-ivory-100 p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-forest-950">{t(`shared.role.${g.role}` as Key)}</span>
            <Chip tone={g.status === 'active' ? 'good' : 'warn'}>{t(`share.status.${g.status}` as Key)}</Chip>
          </div>
          <div className="mt-2 flex gap-2">
            {g.status === 'pending' && <button type="button" onClick={() => void accept(g)} className="thy-btn-primary min-h-[44px] !py-2">{t('shared.accept')}</button>}
            {g.status === 'active' && (open?.id === g.id ? (
              <button type="button" onClick={() => setOpen(null)} className="thy-btn-ghost min-h-[44px] !py-2">{t('shared.hide')}</button>
            ) : (
              <button type="button" onClick={() => void view(g)} className="thy-btn-ghost min-h-[44px] !py-2">{t('shared.view')}</button>
            ))}
          </div>
          {open?.id === g.id && (
            <div className="mt-2" aria-live="polite">
              {open.failed ? (
                <p className="text-signal-crimson">{t('acct.loadError')}</p>
              ) : open.view === null ? (
                <p>{t('gate.loading')}</p>
              ) : Object.keys(open.view).length === 0 ? (
                <p>{t('shared.none')}</p>
              ) : (
                <dl className="space-y-1">
                  {Object.entries(open.view).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="text-forest-800/85">{k === 'goal' || k === 'plan' || k === 'reminders' || k === 'notes' ? t(`family.field.${k}` as Key) : t(`shared.${k}` as Key)}</dt>
                      <dd className="min-w-0 break-words text-end font-medium text-forest-950">{show(v)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

const SponsorLive: React.FC = () => {
  const { t } = useI18n();
  const cloud = useCloud()!;
  const { data, error, loading, reload } = useLoad<SponsorRow[]>(() => cloud.account.sponsorTotals(), []);
  return (
    <Card index={5} labelledBy="sp-live">
      <h2 id="sp-live" className="font-editorial text-lg text-forest-950">{t('sponsor.live.title')}</h2>
      <p className="mt-1 text-xs text-forest-800/85">{t('sponsor.live.note')}</p>
      {loading ? <p className="mt-2 text-sm" role="status">{t('gate.loading')}</p> : error ? <ErrorState title={t('acct.loadError')} retryLabel={t('common.retry')} onRetry={reload} /> : !data || data.length === 0 ? <p className="mt-2 text-sm">{t('sponsor.live.empty')}</p> : (
        <ul className="mt-2 space-y-2">
          {data.map((r) => (
            <li key={r.group_id} className="rounded-xl bg-ivory-100 p-3 text-sm">
              <p className="font-medium text-forest-950">{r.label}</p>
              {r.enough ? (
                <p className="text-forest-900/85">{t('sponsor.live.people')}: {r.people} · {t('sponsor.live.active')}: {Math.round((r.active_rate ?? 0) * 100)}% · {t('sponsor.live.days')}: {r.done_days}</p>
              ) : (
                <p className="text-forest-800/85">{t('sponsor.live.hidden')}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export const Account: React.FC = () => {
  const { t } = useI18n();
  const cloud = useCloud();
  const store = useStore();
  const [reloadKey, setReloadKey] = useState(0);
  const [confirm, setConfirm] = useState<'data' | 'account' | null>(null);
  const [deleted, setDeleted] = useState(false);
  const role = useLoad(async () => (cloud ? (await cloud.account.profile()).role : 'person'), [cloud]);
  const bump = useCallback(() => setReloadKey((n) => n + 1), []);

  if (!cloud) {
    return (
      <div className="space-y-4">
        <ScreenHeader title={t('acct.title')} subtitle={t('acct.subtitle')} />
        <EmptyState
          title={t('acct.localOnly.title')}
          body={t('acct.localOnly.body')}
          action={<button type="button" onClick={store.exitSession} className="thy-btn-primary min-h-[48px]">{t('acct.localOnly.cta')}</button>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ScreenHeader title={t('acct.title')} subtitle={t('acct.subtitle')} right={<SyncChip />} />
      <Card index={0}>
        <p className="break-all text-sm text-forest-950">{t('acct.signedInAs', { email: cloud.email })}</p>
        <button type="button" onClick={() => void cloud.signOut().then(store.exitSession)} className="thy-btn-ghost mt-3 min-h-[44px] !py-2">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {t('acct.signOut')}
        </button>
      </Card>

      <Card index={1} labelledBy="share-title">
        <h2 id="share-title" className="font-editorial text-lg text-forest-950">{t('share.title')}</h2>
        <p className="mt-1 text-sm text-forest-900/85">{t('share.body')}</p>
        <ShareForm onDone={bump} />
        <h3 className="mt-5 text-sm font-medium text-forest-950">{t('share.list')}</h3>
        <MyGrants reloadKey={reloadKey} />
      </Card>

      <Card index={2} labelledBy="shared-title">
        <h2 id="shared-title" className="font-editorial text-lg text-forest-950">{t('shared.title')}</h2>
        <SharedWithMe />
      </Card>

      {role.data === 'sponsor' && <SponsorLive />}

      <Card index={6} tone="alert" labelledBy="danger-title">
        <h2 id="danger-title" className="font-editorial text-lg text-forest-950">{t('danger.title')}</h2>
        {deleted && <p className="mt-1 text-sm font-medium text-forest-950" role="status">{t('danger.done')}</p>}
        {(['data', 'account'] as const).map((k) => (
          <div key={k} className="mt-3">
            <p className="text-sm font-medium text-forest-950">{t(k === 'data' ? 'danger.data' : 'danger.account')}</p>
            <p className="text-xs text-forest-900/85">{t(k === 'data' ? 'danger.dataBody' : 'danger.accountBody')}</p>
            {confirm === k ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="thy-btn min-h-[44px] bg-signal-crimson px-4 !py-2 text-white"
                  onClick={() => {
                    setConfirm(null);
                    if (k === 'data') {
                      store.deleteData();
                      setDeleted(true);
                      bump();
                    } else {
                      void cloud.deleteAccount().then(store.exitSession);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  {t('danger.confirm')}
                </button>
                <button type="button" className="thy-btn-ghost min-h-[44px] !py-2" onClick={() => setConfirm(null)}>{t('common.cancel')}</button>
              </div>
            ) : (
              <button type="button" className="thy-btn-ghost mt-2 min-h-[44px] !py-2" onClick={() => setConfirm(k)}>{t(k === 'data' ? 'danger.data' : 'danger.account')}</button>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
};
