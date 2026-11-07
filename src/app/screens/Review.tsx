import React, { useState } from 'react';
import { Check, Minus } from 'lucide-react';
import { restartState, shiftDate, weeklyStats, type DayState } from '../../domain/week';
import { useI18n, type Key } from '../../i18n';
import { RestartCard } from '../components/RestartCard';
import { go } from '../router';
import { useStore } from '../store';
import { Card, EmptyState, Ring, ScreenHeader } from '../ui/kit';

const STATE_LABEL: Record<DayState, Key> = {
  done: 'review.done',
  skipped: 'review.skipped',
  unknown: 'review.unknown',
  missing: 'review.missing'
};

const DayMark: React.FC<{ state: DayState }> = ({ state }) => {
  if (state === 'done') {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-700 text-white">
        <Check className="h-5 w-5" aria-hidden="true" />
      </span>
    );
  }
  if (state === 'skipped') {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ochre-100 text-ochre-800">
        <Minus className="h-5 w-5" aria-hidden="true" />
      </span>
    );
  }
  if (state === 'unknown') {
    return <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-100 font-semibold text-forest-800" aria-hidden="true">?</span>;
  }
  // Missing data is drawn as an empty dashed outline: absence, not failure.
  return <span className="h-9 w-9 rounded-full border-2 border-dashed border-forest-900/25" aria-hidden="true" />;
};

export const Review: React.FC = () => {
  const { t, fmtDate } = useI18n();
  const { state, today, activePlan, restartPlan, blocked } = useStore();
  const [dismissed, setDismissed] = useState(false);

  if (state.checkins.length === 0) {
    return (
      <>
        <ScreenHeader title={t('review.title')} />
        <EmptyState
          title={t('review.empty')}
          action={
            <button type="button" className="thy-btn-primary min-h-[48px]" onClick={() => go('today')}>
              {t('nav.today')}
            </button>
          }
        />
      </>
    );
  }

  const week = weeklyStats(state.checkins, today);
  const restart = restartState(state.checkins, today);
  const weeks = [3, 2, 1, 0].map((back) => {
    const end = shiftDate(today, -7 * back);
    const w = weeklyStats(state.checkins, end);
    return { end, done: w.done, noData: w.missing === 7 };
  });

  const stats: { key: DayState; n: number; tone: string }[] = [
    { key: 'done', n: week.done, tone: 'text-forest-700' },
    { key: 'skipped', n: week.skipped, tone: 'text-ochre-700' },
    { key: 'unknown', n: week.unknown, tone: 'text-forest-800' },
    { key: 'missing', n: week.missing, tone: 'text-forest-800/70' }
  ];

  return (
    <div className="space-y-4">
      <ScreenHeader title={t('review.title')} subtitle={t('review.last7')} />

      {!blocked && activePlan && restart.needed && !dismissed && (
        <RestartCard days={restart.daysSince} canRestart={!activePlan.restart} onRestart={restartPlan} onLater={() => setDismissed(true)} />
      )}

      <Card index={1}>
        <div className="flex items-center gap-5">
          <Ring value={week.fill} size={116} label={t('review.ringLabel', { done: week.done })}>
            <span className="font-editorial text-4xl leading-none text-forest-950">{week.done}</span>
            <span dir="ltr" className="text-xs text-forest-800/65">/ 7</span>
          </Ring>
          <dl className="grid flex-1 grid-cols-2 gap-x-3 gap-y-2">
            {stats.map((s) => (
              <div key={s.key}>
                <dd className={`font-editorial text-2xl leading-none ${s.tone}`}>{s.n}</dd>
                <dt className="text-xs text-forest-800/70">{t(STATE_LABEL[s.key])}</dt>
              </div>
            ))}
          </dl>
        </div>
      </Card>

      <Card index={2} labelledBy="days-title">
        <h2 id="days-title" className="sr-only">{t('review.last7')}</h2>
        <ul className="grid grid-cols-7 gap-1 text-center">
          {week.days.map((d) => (
            <li key={d.date} className="flex flex-col items-center gap-1.5">
              <span className="text-[11px] text-forest-800/70">{fmtDate(d.date, { weekday: 'short' })}</span>
              <DayMark state={d.state} />
              <span className="sr-only">{`${fmtDate(d.date)}: ${t(STATE_LABEL[d.state])}`}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-forest-800/70">{t('review.missingNote')}</p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card index={3}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-forest-800/70">{t('review.runTitle')}</h2>
          <p className="mt-1 font-editorial text-xl text-forest-950">
            {week.currentRun > 1 ? t('review.run', { n: week.currentRun }) : week.currentRun === 1 ? t('review.runOne') : t('review.runZero')}
          </p>
          {week.bestRun > 0 && <p className="mt-1 text-xs text-forest-800/70">{t('review.best', { n: week.bestRun })}</p>}
        </Card>
        <Card index={4}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-forest-800/70">{t('review.trendTitle')}</h2>
          <p className="mt-1 font-editorial text-xl text-forest-950">{t(`review.trend.${week.trend}` as Key)}</p>
        </Card>
      </div>

      <Card index={5}>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-forest-800/70">{t('review.fourWeeks')}</h2>
        <ul className="mt-3 grid grid-cols-4 items-end gap-3">
          {weeks.map((w) => (
            <li key={w.end} className="flex flex-col items-center gap-1">
              <div className="flex h-24 w-full items-end">
                {w.noData ? (
                  <div className="h-full w-full rounded-lg border-2 border-dashed border-forest-900/20" role="img" aria-label={t('review.missing')} />
                ) : (
                  <div
                    className="w-full rounded-lg bg-gradient-to-t from-forest-700 to-sage-500 transition-[height] duration-700 ease-editorial"
                    style={{ height: `${Math.max(6, (w.done / 7) * 100)}%` }}
                    role="img"
                    aria-label={t('review.ringLabel', { done: w.done })}
                  />
                )}
              </div>
              <span className="text-[11px] text-forest-800/70">{w.noData ? t('review.missing') : `${w.done}/7`}</span>
              <span className="text-[10px] text-forest-800/55">{fmtDate(w.end, { day: 'numeric', month: 'short' })}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};
