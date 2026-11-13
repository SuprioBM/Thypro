import React, { useMemo, useState } from 'react';
import { Lock } from 'lucide-react';
import type { AuditKind, AuditResult } from '../../domain/types';
import { reasonText, useI18n, type Key } from '../../i18n';
import { useStore } from '../store';
import { Card, Chip, EmptyState, ScreenHeader } from '../ui/kit';

const KINDS: AuditKind[] = ['safety', 'plan', 'escalation', 'adaptation'];
const RESULTS: AuditResult[] = ['pass', 'blocked', 'generated', 'escalated', 'adapted', 'fallback'];

const RESULT_TONE: Record<AuditResult, 'good' | 'bad' | 'info' | 'warn' | 'neutral'> = {
  pass: 'good',
  generated: 'info',
  blocked: 'bad',
  escalated: 'warn',
  adapted: 'info',
  fallback: 'neutral'
};

const FilterGroup = <T extends string>({
  label,
  value,
  options,
  render,
  onChange,
  allLabel
}: {
  label: string;
  value: T | 'all';
  options: T[];
  render: (o: T) => string;
  onChange: (v: T | 'all') => void;
  allLabel: string;
}) => (
  <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1.5">
    <span className="me-1 text-xs font-semibold uppercase tracking-wider text-forest-800/65">{label}</span>
    {(['all', ...options] as (T | 'all')[]).map((o) => (
      <button
        key={o}
        type="button"
        aria-pressed={value === o}
        onClick={() => onChange(o)}
        className={`min-h-[44px] rounded-full border px-3.5 text-sm transition-colors ${
          value === o ? 'border-forest-800 bg-forest-800 text-ivory-50' : 'border-forest-900/15 bg-white text-forest-900 hover:border-forest-900/35'
        }`}
      >
        {o === 'all' ? allLabel : render(o)}
      </button>
    ))}
  </div>
);

export const Audit: React.FC = () => {
  const { t, fmtDateTime } = useI18n();
  const { state } = useStore();
  const [kind, setKind] = useState<AuditKind | 'all'>('all');
  const [result, setResult] = useState<AuditResult | 'all'>('all');

  const rows = useMemo(
    () =>
      [...state.audit]
        .filter((a) => (kind === 'all' || a.kind === kind) && (result === 'all' || a.result === result))
        .sort((a, b) => (a.at < b.at ? 1 : -1)),
    [state.audit, kind, result]
  );

  return (
    <div className="space-y-4">
      <ScreenHeader
        title={t('audit.title')}
        subtitle={t('audit.intro')}
        right={
          <Chip>
            <Lock className="h-3 w-3" aria-hidden="true" />
            {t('audit.readOnly')}
          </Chip>
        }
      />

      <Card index={0} className="space-y-2">
        <FilterGroup label={t('audit.filterKind')} value={kind} options={KINDS} onChange={setKind} allLabel={t('audit.all')} render={(k) => t(`audit.kind.${k}` as Key)} />
        <FilterGroup label={t('audit.filterResult')} value={result} options={RESULTS} onChange={setResult} allLabel={t('audit.all')} render={(r) => t(`audit.result.${r}` as Key)} />
      </Card>

      {state.audit.length === 0 ? (
        <EmptyState title={t('audit.emptyAll')} />
      ) : rows.length === 0 ? (
        <EmptyState title={t('audit.empty')} />
      ) : (
        <>
          <p className="text-xs text-forest-800/70" aria-live="polite">{t('audit.count', { n: rows.length })}</p>
          <ul className="space-y-2.5">
            {rows.map((a, i) => (
              <Card as="li" key={a.id} index={Math.min(i, 8)} className="!p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-forest-950">{fmtDateTime(a.at)}</span>
                  <span className="flex flex-wrap gap-1.5">
                    <Chip>{t(`audit.kind.${a.kind}` as Key)}</Chip>
                    <Chip tone={RESULT_TONE[a.result]}>{t(`audit.result.${a.result}` as Key)}</Chip>
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-forest-900/90">{reasonText(t, a.reasonCode, a.reasonParams)}</p>
                <p className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-forest-800/65">
                  <span className="font-mono">{t('audit.rules', { v: a.ruleVersion })}</span>
                  {a.templateId && <span className="font-mono">{t('audit.template', { id: a.templateId })}</span>}
                </p>
              </Card>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};
