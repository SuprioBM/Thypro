import React, { useRef, useState } from 'react';
import { FileUp, Smartphone, Trash2, Watch } from 'lucide-react';
import { visibleWearable } from '../../coach/input';
import { shiftDate } from '../../domain/week';
import { FEEDS } from '../../wearables/feed';
import { useI18n } from '../../i18n';
import { useStore } from '../store';
import { Card, Chip } from '../ui/kit';

/** Optional device signals: simulated feed or a CSV the person picks. Nothing is uploaded; nothing is a real device link. */
export const Wearables: React.FC = () => {
  const { t, fmtDate } = useI18n();
  const { state, today, coach } = useStore();
  const [msg, setMsg] = useState<{ tone: 'good' | 'bad'; text: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const w = state.wearables;
  const c = state.coach.consent;

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      if (file.size > 1_000_000) throw new Error('too_big');
      const r = coach.importCsv(await file.text());
      const out: { tone: 'good' | 'bad'; text: string }[] = [];
      if (r.rows > 0) out.push({ tone: 'good', text: t('wear.csv.ok', { n: r.rows }) });
      else out.push({ tone: 'bad', text: t('wear.csv.fail') });
      if (r.errors.length && r.rows > 0) out.push({ tone: 'bad', text: t('wear.csv.errors', { n: r.errors.length }) });
      if (r.ignored.length) out.push({ tone: 'bad', text: t('wear.csv.ignored', { list: r.ignored.join(', ') }) });
      setMsg(out);
    } catch {
      setMsg([{ tone: 'bad', text: t('wear.csv.fail') }]);
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const days = Array.from({ length: 7 }, (_, i) => shiftDate(today, -(6 - i)));
  const cell = (signal: 'steps' | 'sleepMinutes' | 'activityMinutes', date: string) => {
    const consent = signal === 'steps' ? c.steps : signal === 'sleepMinutes' ? c.sleep : c.activity;
    if (!consent) return <span className="text-forest-800/85">{t('wear.notShared')}</span>;
    const v = visibleWearable(state, signal, date);
    if (v === null) return <span className="text-forest-800/85">{t('wear.missing')}</span>;
    return signal === 'sleepMinutes' ? (v / 60).toFixed(1) : String(v);
  };

  return (
    <Card index={5} labelledBy="wear-title">
      <h2 id="wear-title" className="flex items-center gap-2 font-editorial text-lg text-forest-950">
        <Watch className="h-5 w-5 text-ochre-700" aria-hidden="true" />
        {t('wear.title')}
      </h2>
      <p className="mt-1 text-sm text-forest-900/80">{t('wear.intro')}</p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-forest-900/10 bg-ivory-50 p-3">
          <p className="text-sm font-medium text-forest-950">{t('wear.simulated')}</p>
          <p className="mt-1 text-xs text-forest-800/85">{t('wear.simulated.body')}</p>
          <button type="button" onClick={coach.loadSimulatedFeed} className="thy-btn-ghost mt-2 min-h-[44px] !py-2">
            <Smartphone className="h-4 w-4" aria-hidden="true" />
            {t('wear.load')}
          </button>
        </div>
        <div className="rounded-xl border border-forest-900/10 bg-ivory-50 p-3">
          <p className="text-sm font-medium text-forest-950">{t('wear.csv')}</p>
          <p className="mt-1 text-xs text-forest-800/85">{t('wear.csv.help')}</p>
          <input ref={fileRef} id="wear-csv" type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0])} />
          <label htmlFor="wear-csv" className="thy-btn-ghost mt-2 inline-flex min-h-[44px] cursor-pointer items-center gap-2 !py-2 focus-within:ring-2">
            <FileUp className="h-4 w-4" aria-hidden="true" />
            {t('wear.csv')}
          </label>
        </div>
      </div>

      <div aria-live="polite" className="mt-2 space-y-1">
        {msg.map((m, i) => (
          <p key={i} className={`text-xs ${m.tone === 'bad' ? 'text-signal-crimson' : 'text-forest-900'}`}>{m.text}</p>
        ))}
      </div>

      {w.source ? (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Chip tone={w.source === 'simulated' ? 'warn' : 'neutral'}>{t(w.source === 'simulated' ? 'wear.source.simulated' : 'wear.source.csv')}</Chip>
            <button type="button" onClick={coach.clearWearables} className="thy-btn-quiet min-h-[44px] !py-2">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {t('wear.clear')}
            </button>
          </div>
          <p className="mt-3 text-sm font-medium text-forest-950">{t('wear.table')}</p>
          <div className="thy-scroll-x mt-1 overflow-x-auto" tabIndex={0} role="region" aria-label={t('wear.table')}>
            <table className="w-full min-w-[320px] text-start text-xs">
              <thead>
                <tr className="text-forest-800/85">
                  <th scope="col" className="py-1.5 pe-2 text-start font-medium">{t('wear.col.date')}</th>
                  <th scope="col" className="py-1.5 pe-2 text-start font-medium">{t('wear.col.steps')}</th>
                  <th scope="col" className="py-1.5 pe-2 text-start font-medium">{t('wear.col.sleep')}</th>
                  <th scope="col" className="py-1.5 text-start font-medium">{t('wear.col.activity')}</th>
                </tr>
              </thead>
              <tbody>
                {days.map((d) => (
                  <tr key={d} className="border-t border-forest-900/10">
                    <th scope="row" className="py-1.5 pe-2 text-start font-normal">{fmtDate(d)}</th>
                    <td className="py-1.5 pe-2">{cell('steps', d)}</td>
                    <td className="py-1.5 pe-2">{cell('sleepMinutes', d)}</td>
                    <td className="py-1.5">{cell('activityMinutes', d)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-forest-800/85">{t('wear.consentHint')}</p>
        </>
      ) : (
        <p className="mt-3 text-sm text-forest-800/85">{t('wear.empty')}</p>
      )}

      <div className="mt-3 rounded-xl border border-dashed border-forest-900/20 p-3">
        <p className="text-xs font-medium text-forest-900">{t('wear.future.title')}</p>
        <ul className="mt-1 space-y-0.5 text-xs text-forest-800/85">
          {FEEDS.filter((f) => !f.available).map((f) => (
            <li key={f.id}>{t(f.id === 'health-connect' ? 'wear.future.hc' : 'wear.future.ah')}</li>
          ))}
        </ul>
        <p className="mt-1 text-xs text-forest-800/85">{t('wear.future.note')}</p>
      </div>
    </Card>
  );
};
