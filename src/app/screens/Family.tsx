import React, { useState } from 'react';
import { Eye, Lock, Trash2, UserPlus } from 'lucide-react';
import { buildFamilySummary, type FamilySummary } from '../../domain/family';
import { FAMILY_FIELDS, type ConsentMap, type FamilyField, type Feel } from '../../domain/types';
import { useI18n, type Key } from '../../i18n';
import { useStore } from '../store';
import { Card, Chip, ScreenHeader, Switch } from '../ui/kit';

const SummaryView: React.FC<{ summary: FamilySummary }> = ({ summary }) => {
  const { t, fmtDate } = useI18n();
  if (Object.keys(summary).length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-ivory-200/90">
        <Eye className="h-4 w-4" aria-hidden="true" />
        {t('family.previewEmpty')}
      </p>
    );
  }
  return (
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
      {summary.strength && (
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-ivory-200/70">{t('family.field.strength')}</dt>
          <dd>
            {t('family.strength', { sessions: summary.strength.sessions, minutes: summary.strength.minutes })}
            {summary.strength.lastDate && <span className="block text-xs text-ivory-200/70">{t('family.strength.last', { date: fmtDate(summary.strength.lastDate) })}</span>}
          </dd>
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
  );
};

const PersonBlock: React.FC<{
  id: string;
  name: string;
  relation: string;
  consent: ConsentMap;
  index: number;
  onToggle: (field: FamilyField, v: boolean) => void;
  onRemove?: () => void;
}> = ({ id, name, relation, consent, index, onToggle, onRemove }) => {
  const { t } = useI18n();
  const { state, today } = useStore();
  const summary = buildFamilySummary(state, today, consent);
  return (
    <div className="space-y-3">
      <Card index={index} labelledBy={`toggles-${id}`}>
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h2 id={`toggles-${id}`} className="font-editorial text-lg text-forest-950">
            {t('family.sharedWith', { name, relation })}
          </h2>
          {onRemove && (
            <button type="button" onClick={onRemove} className="thy-btn-quiet min-h-[44px]" aria-label={`${t('family.remove')}: ${name}`}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {t('family.remove')}
            </button>
          )}
        </div>
        <p className="text-xs text-forest-800/70">{t('family.toggles')}</p>
        <div className="divide-y divide-forest-900/8">
          {FAMILY_FIELDS.map((f) => (
            <Switch key={f} checked={consent[f]} onChange={(v) => onToggle(f, v)} label={t(`family.field.${f}` as Key)} />
          ))}
        </div>
      </Card>
      <Card index={index + 1} tone="dark" labelledBy={`preview-${id}`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 id={`preview-${id}`} className="font-editorial text-lg">{t('family.previewTitle', { name })}</h3>
          <Chip tone="neutral" className="!border-white/20 !bg-white/15 !text-ivory-50">
            <Lock className="h-3 w-3" aria-hidden="true" />
            {t('family.readOnly')}
          </Chip>
        </div>
        <SummaryView summary={summary} />
      </Card>
    </div>
  );
};

export const Family: React.FC = () => {
  const { t } = useI18n();
  const { state, setConsent, setPersonConsent, addPerson, removePerson } = useStore();
  const contact = state.profile.familyContact;
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');

  return (
    <div className="space-y-4">
      <ScreenHeader title={t('family.title')} subtitle={t('family.intro')} />

      <Card tone="soft" index={0} className="text-sm text-forest-900/85">
        {t('family.demoNote')}
        {!contact && <p className="mt-1 text-forest-800/70">{t('family.noContact')}</p>}
      </Card>

      {contact && (
        <PersonBlock id="contact" name={contact.name} relation={contact.relation} consent={state.consent} index={1} onToggle={setConsent} />
      )}

      {state.people.length > 0 && <h2 className="pt-2 font-editorial text-xl text-forest-950">{t('family.people')}</h2>}
      {state.people.map((p, i) => (
        <PersonBlock
          key={p.id}
          id={p.id}
          name={p.name}
          relation={p.relation}
          consent={p.consent}
          index={i + 2}
          onToggle={(f, v) => setPersonConsent(p.id, f, v)}
          onRemove={() => removePerson(p.id)}
        />
      ))}

      <Card labelledBy="add-person">
        <h2 id="add-person" className="flex items-center gap-2 font-editorial text-lg text-forest-950">
          <UserPlus className="h-5 w-5 text-ochre-700" aria-hidden="true" />
          {t('family.addPerson')}
        </h2>
        <form
          className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            addPerson(name.trim(), relation.trim() || '—');
            setName('');
            setRelation('');
          }}
        >
          <label className="text-sm">
            <span className="sr-only">{t('family.name')}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('family.name')} className="min-h-[44px] w-full rounded-xl border border-forest-900/20 bg-white px-3 text-base" />
          </label>
          <label className="text-sm">
            <span className="sr-only">{t('family.relation')}</span>
            <input value={relation} onChange={(e) => setRelation(e.target.value)} placeholder={t('family.relation')} className="min-h-[44px] w-full rounded-xl border border-forest-900/20 bg-white px-3 text-base" />
          </label>
          <button type="submit" disabled={!name.trim()} className="thy-btn-primary min-h-[44px] !py-2">
            {t('family.add')}
          </button>
        </form>
      </Card>
    </div>
  );
};
