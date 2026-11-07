import React from 'react';
import { Eye, Lock } from 'lucide-react';
import { buildFamilySummary } from '../../domain/family';
import { FAMILY_FIELDS, type Feel } from '../../domain/types';
import { useI18n, type Key } from '../../i18n';
import { useStore } from '../store';
import { Card, Chip, ScreenHeader, Switch } from '../ui/kit';

export const Family: React.FC = () => {
  const { t } = useI18n();
  const { state, today, setConsent } = useStore();
  const contact = state.profile.familyContact;
  const summary = buildFamilySummary(state, today);
  const shared = Object.keys(summary).length;
  const who = contact?.name ?? t('family.noContact');

  return (
    <div className="space-y-4">
      <ScreenHeader title={t('family.title')} subtitle={t('family.intro')} />

      <Card tone="soft" index={0} className="text-sm text-forest-900/85">
        {t('family.demoNote')}
        {contact && <p className="mt-1 font-medium text-forest-950">{t('family.sharedWith', { name: contact.name, relation: contact.relation })}</p>}
        {!contact && <p className="mt-1 text-forest-800/70">{t('family.noContact')}</p>}
      </Card>

      <Card index={1} labelledBy="toggles-title">
        <h2 id="toggles-title" className="mb-1 font-editorial text-lg text-forest-950">{t('family.toggles')}</h2>
        <div className="divide-y divide-forest-900/8">
          {FAMILY_FIELDS.map((f) => (
            <Switch
              key={f}
              checked={state.consent[f]}
              onChange={(v) => setConsent(f, v)}
              label={t(`family.field.${f}` as Key)}
            />
          ))}
        </div>
      </Card>

      <Card index={2} tone="dark" labelledBy="preview-title">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="preview-title" className="font-editorial text-lg">{t('family.previewTitle', { name: who })}</h2>
          <Chip tone="neutral" className="!bg-white/15 !text-ivory-50 !border-white/20">
            <Lock className="h-3 w-3" aria-hidden="true" />
            {t('family.readOnly')}
          </Chip>
        </div>

        {shared === 0 ? (
          <p className="flex items-center gap-2 text-sm text-ivory-200/90">
            <Eye className="h-4 w-4" aria-hidden="true" />
            {t('family.previewEmpty')}
          </p>
        ) : (
          <dl className="space-y-3 text-sm">
            {summary.goal && (
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ivory-200/70">{t('family.field.goal')}</dt>
                <dd>{t(`goal.${summary.goal}` as Key)}</dd>
              </div>
            )}
            {summary.weeklyCompletion && (
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ivory-200/70">{t('family.field.weeklyCompletion')}</dt>
                <dd>{t('family.weekly', summary.weeklyCompletion)}</dd>
              </div>
            )}
            {summary.feelings && (
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ivory-200/70">{t('family.field.feelings')}</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {Object.entries(summary.feelings).map(([k, n]) => (
                    <span key={k} className="rounded-full bg-white/15 px-2.5 py-1 text-xs">
                      {k === 'unknown' ? t('common.unknown') : t(`checkin.feel.${k as Feel}` as Key)} × {n}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            {summary.plan && (
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ivory-200/70">{t('family.field.plan')}</dt>
                <dd className="font-mono text-xs">{`${summary.plan.templateId} · v${summary.plan.version}`}</dd>
              </div>
            )}
            {summary.reminders && (
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ivory-200/70">{t('family.field.reminders')}</dt>
                <dd>{summary.reminders.times.join(', ') || t('today.noReminder')}</dd>
              </div>
            )}
            {summary.notes && (
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ivory-200/70">{t('family.field.notes')}</dt>
                <dd>
                  <ul className="list-disc space-y-1 ps-5">
                    {summary.notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
        )}
      </Card>

    </div>
  );
};
