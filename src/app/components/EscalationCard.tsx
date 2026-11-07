import React from 'react';
import { PhoneCall, TriangleAlert } from 'lucide-react';
import type { EscalationDecision, FamilyContact } from '../../domain/types';
import { reasonText, useI18n } from '../../i18n';
import { Card } from '../ui/kit';

/**
 * Shown when a check-in is worrying. It REPLACES advice: it names the family
 * contact, gives the local emergency numbers, and is honest about limits.
 */
export const EscalationCard: React.FC<{
  decision: EscalationDecision;
  contact: FamilyContact | null;
}> = ({ decision, contact }) => {
  const { t } = useI18n();
  const urgent = decision.level === 'urgent';
  const glucoseIgnored = decision.reasons.some((r) => r.reasonCode === 'glucose_source_rejected');
  const shown = decision.reasons.filter((r) => r.reasonCode !== 'glucose_source_rejected');

  if (decision.level === 'none' && !glucoseIgnored) return null;

  if (decision.level === 'none') {
    return (
      <Card tone="soft" className="text-sm text-forest-900/85" index={0}>
        {t('esc.glucoseIgnored')}
      </Card>
    );
  }

  return (
    <section
      role="alert"
      aria-labelledby="esc-title"
      className="stagger-in rounded-card border-2 border-signal-crimson bg-signal-crimsonSoft p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-0.5 h-6 w-6 shrink-0 text-signal-crimson" aria-hidden="true" />
        <div className="min-w-0">
          <h2 id="esc-title" className="font-editorial text-xl text-signal-crimson">
            {urgent ? t('esc.titleUrgent') : t('esc.titleTalk')}
          </h2>
          <p className="mt-1 text-sm text-forest-950">{t('esc.body')}</p>

          <div className="mt-3 flex items-start gap-2 rounded-xl bg-white p-3 text-sm text-forest-950">
            <PhoneCall className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" aria-hidden="true" />
            <span>
              {contact
                ? t('esc.contact', { name: contact.name, relation: contact.relation, phone: contact.phone })
                : t('esc.noContact')}
            </span>
          </div>

          <p className="mt-3 text-sm font-semibold text-forest-950">{t('esc.emergency')}</p>
          <p className="mt-1 text-xs text-forest-900/75">{t('esc.honest')}</p>

          {shown.length > 0 && (
            <div className="mt-3 border-t border-signal-crimson/20 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-forest-900/70">{t('esc.why')}</p>
              <ul className="mt-1 list-disc ps-5 text-sm text-forest-900/85">
                {shown.map((r, i) => (
                  <li key={i}>{reasonText(t, r.reasonCode, r.params)}</li>
                ))}
              </ul>
            </div>
          )}
          {glucoseIgnored && <p className="mt-2 text-xs text-forest-900/75">{t('esc.glucoseIgnored')}</p>}
        </div>
      </div>
    </section>
  );
};
