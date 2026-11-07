import React from 'react';
import { PhoneCall, Stethoscope } from 'lucide-react';
import { evaluateSafety } from '../../safety/engine';
import { reasonText, useI18n } from '../../i18n';
import { go } from '../router';
import { useStore } from '../store';
import { Card, EmptyState } from '../ui/kit';

/** Where a blocked plan lands: no plan, a clear reason, and a human next step. */
export const ClinicianPath: React.FC = () => {
  const { t } = useI18n();
  const { state } = useStore();
  const setup = state.setup;

  if (!setup) {
    return (
      <EmptyState
        title={t('today.noPlanTitle')}
        body={t('today.noPlanBody')}
        action={
          <button type="button" className="thy-btn-primary min-h-[48px]" onClick={() => go('setup')}>
            {t('today.setup')}
          </button>
        }
      />
    );
  }

  const decision = evaluateSafety({ ownTargets: setup.ownTargets, screening: setup.screening });
  const contact = state.profile.familyContact;

  return (
    <div className="space-y-4">
      <Card tone="alert" index={0} labelledBy="clin-title">
        <div className="flex items-start gap-3">
          <Stethoscope className="mt-1 h-6 w-6 shrink-0 text-ochre-700" aria-hidden="true" />
          <div>
            <h1 id="clin-title" className="font-editorial text-2xl text-forest-950">
              {t('clinician.title')}
            </h1>
            <p className="mt-1 text-sm text-forest-900/85">{t('clinician.body')}</p>
          </div>
        </div>
      </Card>

      {decision.breaches.length > 0 && (
        <Card index={1} labelledBy="clin-why">
          <h2 id="clin-why" className="text-sm font-semibold uppercase tracking-wider text-forest-800/70">
            {t('clinician.why')}
          </h2>
          <ul className="mt-2 list-disc space-y-1.5 ps-5 text-sm text-forest-950">
            {decision.breaches.map((b, i) => (
              <li key={i}>{reasonText(t, b.reasonCode, b.params)}</li>
            ))}
          </ul>
        </Card>
      )}

      <Card index={2} labelledBy="clin-steps">
        <h2 id="clin-steps" className="font-editorial text-lg text-forest-950">
          {t('clinician.stepsTitle')}
        </h2>
        <ol className="mt-2 list-decimal space-y-1.5 ps-5 text-sm text-forest-950">
          <li>{t('clinician.step1')}</li>
          <li>{t('clinician.step2')}</li>
        </ol>
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-ivory-100 p-3 text-sm text-forest-950">
          <PhoneCall className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" aria-hidden="true" />
          <span>{contact ? t('esc.contact', { name: contact.name, relation: contact.relation, phone: contact.phone }) : t('esc.noContact')}</span>
        </div>
        <p className="mt-3 text-sm font-semibold text-forest-950">{t('esc.emergency')}</p>
        <p className="mt-1 text-xs text-forest-900/70">{t('esc.honest')}</p>
        <button type="button" className="thy-btn-ghost mt-4 min-h-[48px]" onClick={() => go('setup')}>
          {t('clinician.edit')}
        </button>
      </Card>

      <p className="text-xs text-forest-800/65">{t('clinician.logged')}</p>
    </div>
  );
};
