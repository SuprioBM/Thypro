import React, { useMemo } from 'react';
import { ShieldAlert, Users } from 'lucide-react';
import { MIN_GROUP, sponsorSummary, type GroupStats } from '../../pilot/aggregate';
import { generateSyntheticCohort } from '../../pilot/cohort';
import { useI18n } from '../../i18n';
import { useStore } from '../store';
import { Card, Chip, EmptyState, ScreenHeader } from '../ui/kit';

export const pct = (v: number) => `${Math.round(v * 100)}%`;

const Stats: React.FC<{ s: GroupStats }> = ({ s }) => {
  const { t } = useI18n();
  const rows: [string, string][] = [
    [t('sponsor.participants'), String(s.n)],
    [t('sponsor.participation'), pct(s.participation)],
    [t('sponsor.persistence'), pct(s.persistence)],
    [t('sponsor.doneDays'), String(s.doneDaysTotal)],
    [t('sponsor.minutes'), String(s.activityMinutesTotal)],
    [t('sponsor.resume'), s.medianDaysToResume === null ? '—' : String(s.medianDaysToResume)]
  ];
  return (
    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dd className="font-editorial text-xl leading-tight text-forest-950">{v}</dd>
          <dt className="text-xs text-forest-800/70">{k}</dt>
        </div>
      ))}
    </dl>
  );
};

/**
 * Aggregate-only view for an employer or clinic. All privacy rules (minimum
 * group of 20, secondary suppression of totals) are enforced in aggregate.ts;
 * this screen can only ever render what that module returns.
 */
export const Sponsor: React.FC = () => {
  const { t } = useI18n();
  const { state } = useStore();
  const summary = useMemo(() => (state.mode === 'guest' ? sponsorSummary(generateSyntheticCohort()) : null), [state.mode]);

  return (
    <div className="space-y-4">
      <ScreenHeader title={t('sponsor.title')} subtitle={t('sponsor.intro', { min: MIN_GROUP })} />

      <div role="note" className="stagger-in flex items-center gap-3 rounded-card border-2 border-forest-800 bg-forest-900 p-4 text-ivory-50">
        <ShieldAlert className="h-6 w-6 shrink-0 text-ochre-300" aria-hidden="true" />
        <p className="font-medium">{t('sponsor.banner')}</p>
      </div>

      {!summary ? (
        <EmptyState title={t('sponsor.empty', { min: MIN_GROUP })} />
      ) : (
        <>
          <Chip tone="warn">{t('sponsor.synthetic')}</Chip>
          <ul className="space-y-3">
            {summary.groups.map((g, i) => (
              <Card as="li" key={g.group} index={i} labelledBy={`grp-${i}`}>
                <h2 id={`grp-${i}`} className="flex items-center gap-2 font-editorial text-lg text-forest-950">
                  <Users className="h-5 w-5 text-ochre-700" aria-hidden="true" />
                  <span lang="en" dir="ltr">{g.group}</span>
                </h2>
                {g.suppressed ? <p className="mt-2 text-sm font-medium text-forest-800/75">{t('sponsor.notEnough')}</p> : <Stats s={g} />}
              </Card>
            ))}
          </ul>
          <Card tone="soft">
            <h2 className="font-editorial text-lg text-forest-950">{t('sponsor.overall')}</h2>
            {summary.overall ? <Stats s={summary.overall} /> : <p className="mt-1 text-sm text-forest-900/80">{t('sponsor.overallHidden')}</p>}
          </Card>
        </>
      )}
    </div>
  );
};
