import React, { useMemo, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import {
  GOAL_TYPES,
  LANGS,
  SCREENING_KEYS,
  type AllergyState,
  type Baseline,
  type DietaryPractice,
  type GoalSetup,
  type GoalType,
  type OwnTargets,
  type ScreeningKey,
  type Tri,
  type Unknownable
} from '../../domain/types';
import { LANG_NAMES, useI18n, type Key } from '../../i18n';
import { go } from '../router';
import { useStore } from '../store';
import { Card } from '../ui/kit';

const TOTAL = 6;
const PREFS = ['morning', 'evening', 'indoors', 'together', 'simple'] as const;
const DIETS: DietaryPractice[] = ['halal', 'vegetarian', 'noBeef', 'noPork'];
const ALLERGIES = ['fish', 'egg', 'dairy', 'nuts', 'gluten', 'shellfish', 'legumes'] as const;
const OWN: (keyof OwnTargets)[] = ['caloriesPerDay', 'fastingHoursPerDay', 'exerciseMinutesPerDay', 'exerciseMinutesPerWeek', 'sleepHours'];
const TRI: Tri[] = ['yes', 'no', 'unknown', 'prefer_not'];
const BASE_FOR_GOAL: Record<GoalType, keyof Baseline> = {
  walk: 'walkMinutesPerDay',
  sleep: 'sleepHours',
  eating: 'mealsPerDay',
  medicine: 'medicineTimesPerDay'
};

const blankDraft = (): GoalSetup => ({
  goalType: 'walk',
  usualTime: '19:30',
  preferences: [],
  dietary: [],
  allergyState: 'unknown',
  allergies: [],
  baseline: { walkMinutesPerDay: 'unknown', sleepHours: 'unknown', mealsPerDay: 'unknown', medicineTimesPerDay: 'unknown' },
  ownTargets: {},
  // Unanswered stays unanswered. The safety engine treats it as "unknown", never as "no".
  screening: {} as Record<ScreeningKey, Tri>
});

const pill = (on: boolean) =>
  `min-h-[48px] rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 ease-editorial ${
    on ? 'border-forest-800 bg-forest-800 text-ivory-50 shadow-soft-sm' : 'border-forest-900/15 bg-white text-forest-900 hover:border-forest-900/35'
  }`;

const inputClass = 'min-h-[48px] w-full rounded-xl border border-forest-900/20 bg-white px-3 text-base text-forest-950';

export const Setup: React.FC = () => {
  const { t, lang, setLang } = useI18n();
  const { state, completeSetup } = useStore();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<GoalSetup>(() => state.setup ?? blankDraft());
  const [tick, setTick] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const patch = (p: Partial<GoalSetup>) => setDraft((d) => ({ ...d, ...p }));

  const baseKey = BASE_FOR_GOAL[draft.goalType];
  const baseValue: Unknownable = draft.baseline[baseKey];

  const goTo = (n: number) => {
    setStep(n);
    setTick((x) => x + 1);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const ownInvalid = useMemo(
    () => OWN.some((k) => draft.ownTargets[k] !== undefined && !Number.isFinite(draft.ownTargets[k] as number)),
    [draft.ownTargets]
  );

  const submit = () => {
    const screening = { ...draft.screening } as Record<ScreeningKey, Tri>;
    for (const k of SCREENING_KEYS) screening[k] = screening[k] ?? 'unknown';
    const result = completeSetup({ ...draft, screening });
    go(result === 'ok' ? 'plan' : 'clinician');
  };

  const stepTitle = t(`setup.s${step}` as Key);

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-editorial text-2xl text-forest-950 sm:text-3xl">{t('setup.title')}</h1>
        <p className="mt-1 text-sm text-forest-900/70">
          {t('setup.about')} · {state.mode === 'guest' ? t('setup.guestNote') : t('setup.localNote')}
        </p>
      </div>

      <div className="mb-5" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL} aria-valuenow={step} aria-label={t('setup.step', { n: step, total: TOTAL })}>
        <div className="mb-1 flex justify-between text-xs text-forest-800/70">
          <span>{t('setup.step', { n: step, total: TOTAL })}</span>
          <span>{stepTitle}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-forest-900/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-forest-700 to-ochre-500 transition-[width] duration-500 ease-editorial"
            style={{ width: `${(step / TOTAL) * 100}%` }}
          />
        </div>
      </div>

      <Card key={tick} className="route-in space-y-5" labelledBy="setup-step-title">
        <h2 id="setup-step-title" ref={headingRef} tabIndex={-1} className="font-editorial text-xl text-forest-950 outline-none">
          {stepTitle}
        </h2>

        {step === 1 && (
          <div>
            <p className="mb-3 text-sm text-forest-900/80">{t('setup.langBody')}</p>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('shell.language')}>
              {LANGS.map((l) => (
                <button key={l} type="button" role="radio" aria-checked={lang === l} onClick={() => setLang(l)} lang={l} className={pill(lang === l)}>
                  {LANG_NAMES[l]}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="mb-3 text-sm text-forest-900/80">{t('setup.goalBody')}</p>
            <div className="grid gap-2" role="radiogroup">
              {GOAL_TYPES.map((g) => (
                <button
                  key={g}
                  type="button"
                  role="radio"
                  aria-checked={draft.goalType === g}
                  onClick={() => patch({ goalType: g })}
                  className={`flex min-h-[64px] items-center justify-between gap-3 rounded-xl border px-4 py-3 text-start transition-all duration-200 ease-editorial ${
                    draft.goalType === g ? 'border-forest-800 bg-forest-800 text-ivory-50 shadow-soft-sm' : 'border-forest-900/15 bg-white hover:border-forest-900/35'
                  }`}
                >
                  <span>
                    <span className="block text-base font-medium">{t(`goal.${g}` as Key)}</span>
                    <span className={`block text-xs ${draft.goalType === g ? 'text-ivory-200/85' : 'text-forest-800/65'}`}>{t(`goal.${g}.desc` as Key)}</span>
                  </span>
                  {draft.goalType === g && <Check className="h-5 w-5 shrink-0" aria-hidden="true" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <label htmlFor="usual-time" className="mb-1 block text-sm font-semibold text-forest-950">{t('setup.timeLabel')}</label>
              <input id="usual-time" type="time" value={draft.usualTime} onChange={(e) => patch({ usualTime: e.target.value || '19:30' })} className={`${inputClass} max-w-[10rem]`} />
            </div>
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-forest-950">{t('setup.prefLabel')}</legend>
              <div className="flex flex-wrap gap-2">
                {PREFS.map((p) => (
                  <button key={p} type="button" aria-pressed={draft.preferences.includes(p)} onClick={() => patch({ preferences: toggle(draft.preferences, p) })} className={pill(draft.preferences.includes(p))}>
                    {t(`setup.pref.${p}` as Key)}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-semibold text-forest-950">
                {t('setup.ownTitle')} <span className="font-normal text-forest-800/60">({t('common.optional')})</span>
              </legend>
              <p className="mb-2 text-xs text-forest-800/70">{t('setup.ownHint')}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {OWN.map((k) => (
                  <div key={k}>
                    <label htmlFor={`own-${k}`} className="mb-1 block text-xs font-medium text-forest-900">{t(`setup.own.${k}` as Key)}</label>
                    <input
                      id={`own-${k}`}
                      type="text"
                      inputMode="numeric"
                      value={draft.ownTargets[k] ?? ''}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^\d.]/g, '');
                        const next = { ...draft.ownTargets };
                        if (v === '') delete next[k];
                        else next[k] = Number(v);
                        patch({ ownTargets: next });
                      }}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-forest-950">{t('setup.dietLabel')}</legend>
              <div className="flex flex-wrap gap-2">
                {DIETS.map((d) => (
                  <button key={d} type="button" aria-pressed={draft.dietary.includes(d)} onClick={() => patch({ dietary: toggle(draft.dietary, d) })} className={pill(draft.dietary.includes(d))}>
                    {t(`setup.diet.${d}` as Key)}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-forest-950">{t('setup.allergyLabel')}</legend>
              <div className="flex flex-wrap gap-2" role="radiogroup">
                {(['none', 'unknown', 'listed'] as AllergyState[]).map((a) => (
                  <button
                    key={a}
                    type="button"
                    role="radio"
                    aria-checked={draft.allergyState === a}
                    onClick={() => patch({ allergyState: a, allergies: a === 'listed' ? draft.allergies : [] })}
                    className={pill(draft.allergyState === a)}
                  >
                    {t(`setup.allergy.${a}` as Key)}
                  </button>
                ))}
              </div>
              {draft.allergyState === 'listed' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {ALLERGIES.map((a) => (
                    <button key={a} type="button" aria-pressed={draft.allergies.includes(a)} onClick={() => patch({ allergies: toggle(draft.allergies, a) })} className={pill(draft.allergies.includes(a))}>
                      {t(`setup.allergy.${a}` as Key)}
                    </button>
                  ))}
                </div>
              )}
            </fieldset>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <p className="text-sm text-forest-900/80">{t('setup.baseBody')}</p>
            <label htmlFor="baseline" className="block text-sm font-semibold text-forest-950">{t(`setup.base.${baseKey}` as Key)}</label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                id="baseline"
                type="text"
                inputMode="numeric"
                disabled={baseValue === 'unknown'}
                value={baseValue === 'unknown' ? '' : baseValue}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d.]/g, '');
                  patch({ baseline: { ...draft.baseline, [baseKey]: v === '' ? 'unknown' : Number(v) } });
                }}
                className={`${inputClass} max-w-[9rem] disabled:bg-ivory-200`}
              />
              <button
                type="button"
                aria-pressed={baseValue === 'unknown'}
                onClick={() => patch({ baseline: { ...draft.baseline, [baseKey]: baseValue === 'unknown' ? 0 : 'unknown' } })}
                className={pill(baseValue === 'unknown')}
              >
                {t('common.unknown')}
              </button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-5">
            <p className="text-sm text-forest-900/80">{t('setup.screenBody')}</p>
            {SCREENING_KEYS.map((k) => (
              <fieldset key={k}>
                <legend className="mb-2 text-sm font-medium text-forest-950">{t(`setup.screen.${k}` as Key)}</legend>
                <div className="flex flex-wrap gap-2" role="radiogroup">
                  {TRI.map((a) => (
                    <button
                      key={a}
                      type="button"
                      role="radio"
                      aria-checked={draft.screening[k] === a}
                      onClick={() => patch({ screening: { ...draft.screening, [k]: a } })}
                      className={`${pill(draft.screening[k] === a)} !px-3`}
                    >
                      {a === 'yes' ? t('common.yes') : a === 'no' ? t('common.no') : a === 'unknown' ? t('common.unknown') : t('common.preferNot')}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        )}
      </Card>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button type="button" disabled={step === 1} onClick={() => goTo(step - 1)} className="thy-btn-ghost min-h-[48px] disabled:invisible">
          {t('common.back')}
        </button>
        {step < TOTAL ? (
          <button type="button" onClick={() => goTo(step + 1)} className="thy-btn-primary min-h-[48px]">
            {t('common.next')}
          </button>
        ) : (
          <button type="button" disabled={ownInvalid} onClick={submit} className="thy-btn-accent min-h-[48px]">
            {t('setup.create')}
          </button>
        )}
      </div>
    </div>
  );
};
