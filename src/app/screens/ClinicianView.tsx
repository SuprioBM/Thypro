import React from 'react';
import { Stethoscope } from 'lucide-react';
import { reasonText, useI18n, type Key } from '../../i18n';
import { useStore } from '../store';
import { Card, Chip, EmptyState, ScreenHeader } from '../ui/kit';

/** DEMO ONLY: shows what a clinician could see if the person allowed it. No account, sign-in or transmission exists. */
export const ClinicianView: React.FC = () => {
  const { t, fmtDateTime } = useI18n();
  const { state, coach } = useStore();
  const c = state.coach;

  if (!c.clinicianShare) {
    return (
      <div className="space-y-4">
        <ScreenHeader title={t('clin.title')} subtitle={t('clin.intro')} />
        <EmptyState title={t('clin.off.title')} body={t('clin.off.body')} />
      </div>
    );
  }
  const trail = [...state.audit].filter((a) => a.kind === 'coach' || a.kind === 'planner').sort((a, b) => (a.at < b.at ? 1 : -1));
  const confirmed = new Set(state.audit.filter((a) => a.reasonCode === 'coach_clinician_accepted').map((a) => String(a.reasonParams?.action)));

  return (
    <div className="space-y-4">
      <ScreenHeader title={t('clin.title')} subtitle={t('clin.intro')} right={<Chip tone="warn"><Stethoscope className="h-3 w-3" aria-hidden="true" />{t('coach.simBadge')}</Chip>} />
      <Card tone="alert" index={0}>
        <p className="text-sm font-semibold text-forest-950" role="note">{t('clin.sim')}</p>
        <p className="mt-1 text-xs text-forest-900/80">{t('clin.patient', { name: state.profile.displayName || '–' })}</p>
      </Card>

      {c.history.length === 0 ? (
        <EmptyState title={t('clin.empty')} />
      ) : (
        <ul className="space-y-3">
          {[...c.history].reverse().map((h, i) => {
            const applied = h.decision === 'accepted' || h.decision === 'edited' || h.decision === 'auto_applied';
            return (
              <Card as="li" key={h.id} index={Math.min(i + 1, 6)}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="min-w-0 break-words font-editorial text-base text-forest-950">{t(`coach.action.${h.proposal.action}` as Key)}</h2>
                  <Chip tone={h.decision === 'blocked' ? 'bad' : h.decision === 'overridden' ? 'warn' : 'neutral'}>{t(`coach.decision.${h.decision}` as Key)}</Chip>
                </div>
                <p className="mt-0.5 text-xs text-forest-800/85">{fmtDateTime(h.at)} · {t('coach.changeLine', { from: h.proposal.from, to: h.editedTo ?? h.proposal.to })}</p>
                <p className="mt-2 text-sm font-medium text-forest-950">{t('clin.reason')}</p>
                <ul className="mt-1 flex flex-wrap gap-1.5">
                  {h.proposal.topFactors.map((f) => <li key={f}><Chip>{t(`coach.factor.${f}` as Key)}</Chip></li>)}
                </ul>
                <p className="mt-1 font-mono text-[11px] text-forest-800/85">{h.inputSummary} · {h.configVersion}</p>
                {applied && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {confirmed.has(h.proposal.action) ? (
                      <Chip tone="good">{t('clin.confirmed')}</Chip>
                    ) : (
                      <button type="button" onClick={() => coach.clinician(h.id, 'accepted')} className="thy-btn-primary min-h-[44px] !py-2">{t('clin.accept')}</button>
                    )}
                    <button type="button" onClick={() => coach.clinician(h.id, 'overridden')} className="thy-btn-ghost min-h-[44px] !py-2">{t('clin.override')}</button>
                  </div>
                )}
              </Card>
            );
          })}
        </ul>
      )}

      <Card index={7} labelledBy="trail-title">
        <h2 id="trail-title" className="font-editorial text-lg text-forest-950">{t('clin.audit')}</h2>
        <ul className="mt-2 space-y-2">
          {trail.slice(0, 20).map((a) => (
            <li key={a.id} className="rounded-xl bg-ivory-100 px-3 py-2 text-sm">
              <span className="block text-xs text-forest-800/85">{fmtDateTime(a.at)} · {t(`audit.result.${a.result}` as Key)}</span>
              <span className="break-words text-forest-900/90">{reasonText(t, a.reasonCode, a.reasonParams)}</span>
            </li>
          ))}
          {trail.length === 0 && <li className="text-sm text-forest-800/85">{t('clin.empty')}</li>}
        </ul>
      </Card>
    </div>
  );
};
