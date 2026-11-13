import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { summarizeSignals } from '../../adapt/signals';
import { LANGS } from '../../domain/types';
import { computeOutcomes } from '../../domain/outcomes';
import { MIN_GROUP, equityReport, type EquityDimension } from '../../pilot/aggregate';
import { generateSyntheticCohort } from '../../pilot/cohort';
import { LANG_NAMES, useI18n, type Key, type TFn } from '../../i18n';
import { useStore } from '../store';
import { Card, Chip, EmptyState, ScreenHeader } from '../ui/kit';
import { pct } from './Sponsor';

function groupLabel(t: TFn, dim: EquityDimension, group: string): string {
  if (dim === 'language' && (LANGS as readonly string[]).includes(group)) return LANG_NAMES[group as keyof typeof LANG_NAMES];
  if (dim === 'gender') return group === 'prefer_not' ? t('common.preferNot') : t(`gender.${group}` as Key);
  return group;
}

export const Pilot: React.FC = () => {
  const { t, fmtDate } = useI18n();
  const { state, today } = useStore();
  const mine = computeOutcomes(state.checkins, today);
  const signals = summarizeSignals(state.signals);
  const equity = useMemo(() => (state.mode === 'guest' ? equityReport(generateSyntheticCohort()) : null), [state.mode]);

  return (
    <div className="space-y-4">
      <ScreenHeader title={t('pilot.title')} subtitle={t('pilot.intro')} />

      <Card index={0} labelledBy="mine-title">
        <h2 id="mine-title" className="font-editorial text-lg text-forest-950">{t('pilot.mine')}</h2>
        <dl className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-forest-800/70">{t('pilot.persistence')}</dt>
            <dd className="font-editorial text-xl text-forest-950">
              {mine.persistence === null ? '—' : `${pct(mine.persistence)} · ${t('pilot.persistenceVal', { done: mine.doneDays, span: mine.spanDays })}`}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-forest-800/70">{t('pilot.recovery')}</dt>
            <dd className="font-editorial text-xl text-forest-950">{mine.recoveries.length ? mine.recoveries.join(', ') : t('pilot.recoveryNone')}</dd>
          </div>
          <div>
            <dt className="text-xs text-forest-800/70">{t('pilot.minutes')}</dt>
            <dd className="font-editorial text-xl text-forest-950">{mine.activityMinutes}</dd>
          </div>
          <div>
            <dt className="text-xs text-forest-800/70">{t('pilot.bp')}</dt>
            <dd className="text-sm text-forest-950">
              {mine.latestBp ? `${mine.latestBp.systolic}/${mine.latestBp.diastolic} mmHg · ${fmtDate(mine.latestBp.date)}` : t('pilot.notRecorded')}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-forest-800/70">{t('pilot.weight')}</dt>
            <dd className="text-sm text-forest-950">
              {mine.latestWeight ? `${mine.latestWeight.kg} kg · ${fmtDate(mine.latestWeight.date)}` : t('pilot.notRecorded')}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-forest-800/70">{t('checkin.moreHint')}</p>
      </Card>

      <Card index={1} labelledBy="signals-title">
        <h2 id="signals-title" className="font-editorial text-lg text-forest-950">{t('pilot.signals')}</h2>
        <p className="mt-1 text-sm text-forest-950">
          {signals.mostCommonHour === null ? t('pilot.noSignals') : t('pilot.commonHour', { hour: String(signals.mostCommonHour).padStart(2, '0') })}
        </p>
        <p className="mt-1 text-xs text-forest-800/70">{t('pilot.signalsNote')}</p>
      </Card>

      <h2 className="pt-2 font-editorial text-xl text-forest-950">{t('pilot.equity')}</h2>
      {!equity ? (
        <EmptyState title={t('pilot.empty', { min: MIN_GROUP })} />
      ) : (
        <>
          <Chip tone="warn">{t('sponsor.synthetic')}</Chip>
          {equity.map((d, i) => (
            <Card key={d.dimension} index={i + 2} labelledBy={`eq-${d.dimension}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 id={`eq-${d.dimension}`} className="font-editorial text-lg text-forest-950">{t(`pilot.dim.${d.dimension}` as Key)}</h3>
                {d.gapPP === null ? (
                  <Chip>{t('pilot.gapNA')}</Chip>
                ) : d.flagged ? (
                  <Chip tone="bad">
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('pilot.gapFlag')}
                  </Chip>
                ) : (
                  <Chip tone="good">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('pilot.gapOk')}
                  </Chip>
                )}
              </div>
              <ul className="mt-3 space-y-2">
                {d.rows.map((r) => (
                  <li key={r.group} className="grid grid-cols-[minmax(6rem,auto)_1fr_auto] items-center gap-3 text-sm">
                    <span className="text-forest-950">{groupLabel(t, d.dimension, r.group)}</span>
                    {r.suppressed ? (
                      <span className="col-span-2 text-forest-800/70">{t('sponsor.notEnough')}</span>
                    ) : (
                      <>
                        <span className="h-2.5 overflow-hidden rounded-full bg-forest-900/10" aria-hidden="true">
                          <span className="block h-full rounded-full bg-gradient-to-r from-forest-700 to-sage-500 transition-[width] duration-700 ease-editorial" style={{ width: pct(r.persistence) }} />
                        </span>
                        <span className="tabular-nums text-forest-950">
                          {pct(r.persistence)} <span className="text-xs text-forest-800/60">(n={r.n})</span>
                        </span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
              {d.gapPP !== null && <p className="mt-2 text-xs text-forest-800/75">{t('pilot.gap', { gap: d.gapPP })}</p>}
            </Card>
          ))}
        </>
      )}
    </div>
  );
};
