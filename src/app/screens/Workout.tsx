import React, { useCallback, useState } from 'react';
import { ArrowLeft, Check, Minus, OctagonAlert, Plus, Trophy } from 'lucide-react';
import { useI18n, type Key } from '../../i18n';
import { getExercise } from '../../strength/library';
import { history } from '../../strength/progression';
import { exName, liftedKg } from '../../strength/text';
import type { LoggedExercise } from '../../strength/types';
import { RestBar } from '../components/RestBar';
import { go } from '../router';
import { useStore } from '../store';
import { Card, Chip, SuccessCheck } from '../ui/kit';

const Stepper: React.FC<{
  label: string;
  unit: string;
  value: number;
  step: number;
  onChange: (v: number) => void;
}> = ({ label, unit, value, step, onChange }) => {
  const set = (v: number) => onChange(Math.max(0, Math.min(999, Math.round(v * 10) / 10)));
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-forest-800/60">{label}</div>
      <div className="flex items-center overflow-hidden rounded-xl border border-forest-900/15 bg-white">
        <button type="button" onClick={() => set(value - step)} aria-label={`${label} −`} className="flex h-11 w-10 shrink-0 items-center justify-center text-forest-800 hover:bg-forest-900/[0.05] active:bg-forest-900/10">
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => set(Number(e.target.value))}
          aria-label={`${label} (${unit})`}
          className="h-11 w-full min-w-0 border-x border-forest-900/10 bg-transparent text-center text-base font-semibold text-forest-950 focus:outline-none"
        />
        <button type="button" onClick={() => set(value + step)} aria-label={`${label} +`} className="flex h-11 w-10 shrink-0 items-center justify-center text-forest-800 hover:bg-forest-900/[0.05] active:bg-forest-900/10">
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export const Workout: React.FC = () => {
  const { t, lang, fmtDate } = useI18n();
  const { state, strength, speakText } = useStore();
  const { draft, plan, sessions } = state.strength;
  const [rest, setRest] = useState<{ endsAt: number; total: number } | null>(null);
  const [finishedId, setFinishedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<null | 'unwell' | 'discard'>(null);

  const routine = plan?.routines.find((r) => r.id === draft?.routineId);
  const finished = finishedId ? sessions.find((s) => s.id === finishedId) ?? null : null;

  const onRestOver = useCallback(() => {
    if (state.prefs.voiceFirst) speakText(t('st.w.restOver'));
    try {
      navigator.vibrate?.(180);
    } catch {
      /* not supported */
    }
  }, [state.prefs.voiceFirst, speakText, t]);

  /* ---------- Summary ---------- */
  if (finished) {
    const sets = finished.exercises.reduce((n, e) => n + e.sets.length, 0);
    const lifted = liftedKg(finished);
    return (
      <div className="thy-swap">
        <Card className="text-center" labelledBy="w-sum">
          <div className="flex justify-center"><SuccessCheck /></div>
          <h1 id="w-sum" className="mt-3 font-editorial text-3xl text-forest-950">{t('st.sum.title')}</h1>
          <p className="mt-1 text-sm text-forest-900/75">
            {finished.stopped ? t('st.sum.stopped') : `${t('st.sum.line', { sets, min: finished.minutes })}${lifted > 0 ? ` · ${lifted} kg` : ''}`}
          </p>
        </Card>
        <Card index={1} className="mt-4" labelledBy="w-rec">
          <h2 id="w-rec" className="flex items-center gap-2 font-editorial text-lg text-forest-950">
            <Trophy className="h-4 w-4 text-ochre-600" aria-hidden="true" />
            {t('st.sum.records')}
          </h2>
          {finished.records.length === 0 ? (
            <p className="mt-2 text-sm text-forest-900/70">{t('st.sum.none')}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {finished.records.map((r) => (
                <li key={`${r.exerciseId}-${r.kind}`} className="stagger-in flex items-center gap-2 rounded-xl bg-ochre-50 px-3 py-2.5 text-sm font-medium text-forest-950">
                  <Trophy className="h-4 w-4 shrink-0 text-ochre-600" aria-hidden="true" />
                  {t(`st.rec.${r.kind}` as Key, { name: exName(r.exerciseId, lang), value: r.value })}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <button type="button" onClick={() => go('strength')} className="thy-btn-primary mt-5 min-h-[48px] w-full">
          {t('st.sum.back')}
        </button>
      </div>
    );
  }

  /* ---------- Nothing to do ---------- */
  if (!draft || !routine) {
    return (
      <Card className="text-center">
        <p className="text-sm text-forest-900/75">{t('st.w.noRoutine')}</p>
        <button type="button" onClick={() => go('strength')} className="thy-btn-primary mt-4 min-h-[48px]">
          {t('st.w.back')}
        </button>
      </Card>
    );
  }

  const totalSets = draft.exercises.reduce((n, e) => n + e.sets.length, 0);
  const doneSets = draft.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
  const lifted = liftedKg(draft);
  const currentEx = draft.exercises.findIndex((e) => e.sets.some((s) => !s.done));

  const restFor = (exerciseId: string) => routine.items.find((i) => i.exerciseId === exerciseId)?.restSec ?? 60;

  const toggleDone = (exIdx: number, setIdx: number, e: LoggedExercise) => {
    const turningOn = !e.sets[setIdx].done;
    strength.setSet(exIdx, setIdx, { done: turningOn });
    if (turningOn) {
      const allDone = doneSets + 1 >= totalSets;
      if (allDone) setRest(null);
      else {
        const secs = restFor(e.exerciseId);
        setRest({ endsAt: Date.now() + secs * 1000, total: secs });
      }
    } else {
      setRest(null);
    }
  };

  const finish = (stopped?: 'unwell') => {
    setRest(null);
    if (doneSets === 0) {
      strength.discard();
      go('strength');
      return;
    }
    const id = strength.finish(stopped);
    if (id) setFinishedId(id);
  };

  return (
    <div className="pb-28">
      <button type="button" onClick={() => go('strength')} className="mb-3 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-forest-800 hover:text-forest-950">
        <ArrowLeft className="h-4 w-4 flip-rtl" aria-hidden="true" />
        {t('st.w.back')}
      </button>

      <section className="thy-luxe-dark thy-swap !rounded-3xl p-5" aria-labelledby="w-title">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-ochre-300">{t('st.w.title')}</div>
        <h1 id="w-title" className="mt-1 font-editorial text-2xl text-ivory-50">{routine.name[lang]}</h1>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuemin={0} aria-valuemax={totalSets} aria-valuenow={doneSets} aria-label={t('st.w.progress', { done: doneSets, total: totalSets })}>
          <div className="h-full rounded-full bg-ochre-500 transition-[width] duration-700 ease-editorial" style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }} />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-ivory-200/80">
          <span>{t('st.w.progress', { done: doneSets, total: totalSets })}</span>
          {lifted > 0 && <span>{t('st.w.lifted', { kg: lifted })}</span>}
        </div>
      </section>

      <div className="mt-4 space-y-3">
        {draft.exercises.map((e, exIdx) => {
          const ex = getExercise(e.exerciseId);
          const isWeight = ex?.load === 'weight';
          const isHold = ex?.load === 'hold';
          const last = history(sessions, e.exerciseId, 1)[0];
          const lastText = last
            ? last.sets.map((s) => (isWeight ? `${s.weightKg}×${s.reps}` : isHold ? `${s.reps}s` : `${s.reps}`)).join(', ')
            : null;
          const isCurrent = exIdx === currentEx;
          const allDone = e.sets.every((s) => s.done);
          const targetText = isWeight ? `${e.target.weightKg} ${t('st.w.kg')} × ${e.target.reps}` : isHold ? `${e.target.reps} ${t('st.w.secs')}` : `${e.target.reps} ${t('st.w.reps')}`;

          return (
            <Card
              key={e.exerciseId}
              index={exIdx}
              className={`transition-all duration-500 ease-editorial ${isCurrent ? '!border-ochre-400 shadow-lift' : allDone ? 'opacity-70' : ''}`}
              labelledBy={`w-ex-${exIdx}`}
            >
              <div className="flex items-start gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-500 ${allDone ? 'bg-forest-800 text-ivory-50' : isCurrent ? 'bg-ochre-500 text-white' : 'bg-forest-900/10 text-forest-800'}`}>
                  {allDone ? <Check className="h-4 w-4" aria-hidden="true" /> : exIdx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 id={`w-ex-${exIdx}`} className="font-editorial text-lg leading-snug text-forest-950">{exName(e.exerciseId, lang)}</h2>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Chip tone="info">{t('st.w.target')}: {targetText}</Chip>
                    <Chip>{lastText ? `${t('st.w.last')}: ${lastText}` : t('st.w.noLast')}</Chip>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-forest-900/70">{t(`st.reason.${e.target.reason}` as Key)}</p>
                </div>
              </div>

              <ol className="mt-4 space-y-2.5">
                {e.sets.map((s, setIdx) => (
                  <li key={setIdx} className={`rounded-2xl border p-3 transition-colors duration-500 ${s.done ? 'border-sage-300 bg-sage-50' : 'border-forest-900/10 bg-ivory-50'}`}>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-forest-900">{t('st.w.set', { n: setIdx + 1 })}</span>
                      <button
                        type="button"
                        onClick={() => toggleDone(exIdx, setIdx, e)}
                        aria-pressed={s.done}
                        aria-label={`${t('st.w.set', { n: setIdx + 1 })}: ${s.done ? t('st.w.markUndone') : t('st.w.markDone')}`}
                        className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-all duration-300 ${s.done ? 'bg-forest-800 text-ivory-50' : 'border border-forest-900/20 bg-white text-forest-900 hover:border-forest-900/40'}`}
                      >
                        <Check className={`h-4 w-4 transition-transform duration-300 ${s.done ? 'scale-100' : 'scale-75 opacity-50'}`} aria-hidden="true" />
                        {t('st.w.done')}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      {isWeight && (
                        <Stepper label={t('st.w.weightLabel')} unit={t('st.w.kg')} value={s.weightKg} step={0.5} onChange={(v) => strength.setSet(exIdx, setIdx, { weightKg: v })} />
                      )}
                      <Stepper
                        label={isHold ? t('st.w.secsLabel') : t('st.w.repsLabel')}
                        unit={isHold ? t('st.w.secs') : t('st.w.reps')}
                        value={s.reps}
                        step={isHold ? 5 : 1}
                        onChange={(v) => strength.setSet(exIdx, setIdx, { reps: v })}
                      />
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => strength.addSet(exIdx)} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-forest-900/15 px-3.5 text-xs font-semibold text-forest-900 hover:border-forest-900/35">
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('st.w.addSet')}
                </button>
                {e.sets.length > 1 && (
                  <button type="button" onClick={() => strength.removeSet(exIdx, e.sets.length - 1)} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold text-forest-800/75 hover:bg-forest-900/[0.05]">
                    <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('st.w.removeSet')}
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {panel === 'unwell' ? (
        <Card tone="alert" className="thy-swap mt-5" labelledBy="w-unwell">
          <div className="flex items-start gap-3">
            <OctagonAlert className="mt-0.5 h-5 w-5 shrink-0 text-ochre-800" aria-hidden="true" />
            <div>
              <h2 id="w-unwell" className="font-editorial text-xl text-forest-950">{t('st.w.unwellTitle')}</h2>
              <p className="mt-2 text-sm leading-relaxed text-forest-900/85">{t('st.w.unwellBody')}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => finish('unwell')} className="thy-btn-primary min-h-[48px]">{t('st.w.unwellConfirm')}</button>
                <button type="button" onClick={() => setPanel(null)} className="thy-btn-ghost min-h-[48px]">{t('st.w.cancel')}</button>
              </div>
            </div>
          </div>
        </Card>
      ) : panel === 'discard' ? (
        <Card tone="soft" className="thy-swap mt-5">
          <p className="text-sm text-forest-900/85">{t('st.w.discardConfirm')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => { strength.discard(); setRest(null); go('strength'); }} className="inline-flex min-h-[48px] items-center rounded-full bg-signal-crimson px-5 text-sm font-semibold text-white">{t('st.w.discard')}</button>
            <button type="button" onClick={() => setPanel(null)} className="thy-btn-ghost min-h-[48px]">{t('st.w.cancel')}</button>
          </div>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          <button type="button" onClick={() => finish()} className="thy-btn-accent min-h-[52px] w-full">
            <Check className="h-4 w-4" aria-hidden="true" />
            {t('st.w.finish')}
          </button>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={() => setPanel('unwell')} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-signal-crimson hover:bg-signal-crimsonSoft">
              <OctagonAlert className="h-4 w-4" aria-hidden="true" />
              {t('st.w.unwell')}
            </button>
            <button type="button" onClick={() => setPanel('discard')} className="min-h-[44px] rounded-xl px-3 text-sm font-medium text-forest-800/70 hover:bg-forest-900/[0.05]">
              {t('st.w.discard')}
            </button>
          </div>
        </div>
      )}

      {rest && (
        <RestBar
          endsAt={rest.endsAt}
          total={rest.total}
          onSkip={() => setRest(null)}
          onAdd={(s) => setRest((r) => (r ? { endsAt: r.endsAt + s * 1000, total: r.total + s } : r))}
          onOver={onRestOver}
        />
      )}
      <span className="sr-only">{fmtDate(draft.date)}</span>
    </div>
  );
};
