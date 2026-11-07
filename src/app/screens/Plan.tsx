import React, { useState } from 'react';
import { ChevronDown, ExternalLink, ShieldCheck } from 'lucide-react';
import { resolvePlanItem } from '../../plan/templates';
import { useI18n, type Key } from '../../i18n';
import { go } from '../router';
import { useStore } from '../store';
import { Card, Chip, EmptyState, Expandable, ScreenHeader } from '../ui/kit';
import { ClinicianPath } from './ClinicianPath';

export const Plan: React.FC = () => {
  const { t, lang } = useI18n();
  const { state, activePlan, blocked, restartPlan, langAssist } = useStore();
  const [open, setOpen] = useState<string | null>(null);

  // A plan is only ever displayed when the safety rules currently allow it.
  if (blocked) return <ClinicianPath />;

  if (!activePlan) {
    return (
      <>
        <ScreenHeader title={t('plan.title')} />
        <EmptyState
          title={t('today.noPlanTitle')}
          body={t('today.noPlanBody')}
          action={
            <button type="button" className="thy-btn-primary min-h-[48px]" onClick={() => go('setup')}>
              {t('today.setup')}
            </button>
          }
        />
      </>
    );
  }

  const items = activePlan.items.map((item) => ({ item, text: resolvePlanItem(activePlan, item, lang) }));
  const earlier = state.plans.length - 1;

  return (
    <div className="space-y-4">
      <ScreenHeader title={t('plan.title')} subtitle={t(`goal.${activePlan.goalType}` as Key)} />

      <Card index={0} className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Chip tone="info">{t('plan.version', { v: activePlan.version })}</Chip>
          <Chip>
            <span className="font-mono">{t('plan.template', { id: `${activePlan.templateId} v${activePlan.templateVersion}` })}</span>
          </Chip>
          <Chip tone="good">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {t('plan.rulesPassed', { v: activePlan.ruleVersion })}
          </Chip>
          <Chip tone="warn">{t('plan.reviewPending')}</Chip>
          {activePlan.restart && <Chip tone="neutral">{t('plan.restartBadge')}</Chip>}
          {state.profile.synthetic && <Chip tone="warn">{t('shell.demoChip')}</Chip>}
        </div>

        {activePlan.cautions.length > 0 && (
          <ul className="space-y-1.5 rounded-xl bg-ivory-100 p-3 text-sm text-forest-900/85">
            {activePlan.cautions.map((c) => (
              <li key={c}>{t(`plan.caution.${c}` as Key)}</li>
            ))}
          </ul>
        )}

        <p className="text-xs text-forest-800/65" aria-live="polite">
          {langAssist === 'failed' ? t('plan.langFailed') : t('plan.langOff')}
        </p>
      </Card>

      <ol className="space-y-3">
        {items.map(({ item, text }, i) => {
          if (!text) return null;
          const isOpen = open === item.id;
          const panelId = `why-${i}`;
          return (
            <Card as="li" key={item.id} index={i + 1}>
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ochre-100 font-mono text-sm font-semibold text-ochre-800">{i + 1}</span>
                <p className="pt-0.5 text-base leading-relaxed text-forest-950">{text.title}</p>
              </div>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : item.id)}
                className="mt-2 flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl px-2 text-start text-sm font-medium text-ochre-700 hover:bg-ochre-50"
              >
                <span>{t('plan.why')}</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              <Expandable open={isOpen} id={panelId}>
                <dl className="mt-1 space-y-2 rounded-xl bg-ivory-100 p-3 text-sm text-forest-900/90">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-forest-800/60">{t('plan.reason')}</dt>
                    <dd>{text.reason}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-forest-800/60">{t('plan.templateLabel')}</dt>
                    <dd className="font-mono text-xs">{text.templateId}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-forest-800/60">{t('plan.guidance')}</dt>
                    <dd>
                      {text.guidanceSource.url ? (
                        <a href={text.guidanceSource.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-ochre-700 underline" lang="en" dir="ltr">
                          {text.guidanceSource.name}
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      ) : (
                        <span lang="en" dir="ltr">{text.guidanceSource.name}</span>
                      )}
                    </dd>
                  </div>
                </dl>
              </Expandable>
            </Card>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="thy-btn-ghost min-h-[48px]" onClick={() => go('setup')}>
          {t('plan.change')}
        </button>
        {!activePlan.restart && (
          <button type="button" className="thy-btn-ghost min-h-[48px]" onClick={restartPlan}>
            {t('plan.makeSmaller')}
          </button>
        )}
        {earlier > 0 && <span className="text-xs text-forest-800/65">{t('plan.earlier', { n: earlier })}</span>}
      </div>
    </div>
  );
};
