import React, { useMemo, useRef, useState } from 'react';
import { Apple, Check, CigaretteOff, Footprints, Moon, Pill } from 'lucide-react';
import {
  ACCESS_NEEDS,
  DEFAULT_CONTEXT,
  GOAL_TYPES,
  LANGS,
  SCREENING_KEYS,
  type AllergyState,
  type Baseline,
  type ContextProfile,
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

type StepId = 'lang' | 'goal' | 'time' | 'context' | 'food' | 'base' | 'safety';
const STEPS: StepId[] = ['lang', 'goal', 'time', 'context', 'food', 'base', 'safety'];
const STEP_TITLE: Record<StepId, Key> = {
  lang: 'setup.s1',
  goal: 'setup.s2',
  time: 'setup.s3',
  context: 'setup.sContext',
  food: 'setup.s4',
  base: 'setup.s5',
  safety: 'setup.s6'
};

const PREFS = ['morning', 'evening', 'indoors', 'together', 'simple'] as const;
const DIETS: DietaryPractice[] = ['halal', 'vegetarian', 'noBeef', 'noPork'];
const ALLERGIES = ['fish', 'egg', 'dairy', 'nuts', 'gluten', 'shellfish', 'legumes'] as const;
const OWN: (keyof OwnTargets)[] = ['caloriesPerDay', 'fastingHoursPerDay', 'exerciseMinutesPerDay', 'exerciseMinutesPerWeek', 'sleepHours'];
const TRI: Tri[] = ['yes', 'no', 'unknown', 'prefer_not'];
/** Tobacco has no starting measure: it is referral-only. */
const BASE_FOR_GOAL: Partial<Record<GoalType, keyof Baseline>> = {
  walk: 'walkMinutesPerDay',
  sleep: 'sleepHours',
  eating: 'mealsPerDay',
  medicine: 'medicineTimesPerDay'
};
const GOAL_ICON: Record<GoalType, typeof Footprints> = {
  walk: Footprints,
  eating: Apple,
  sleep: Moon,
  tobacco: CigaretteOff,
  medicine: Pill
};

/** Single-choice context questions: value list and translation key per option ('unknown' uses "Not sure"). */
const CONTEXT_CHOICES: {
  key: 'shiftWork' | 'fasting' | 'heat' | 'foodBudget' | 'literacy';
  label: Key;
  options: { value: string; label: Key }[];
}[] = [
  {
    key: 'shiftWork',
    label: 'setup.ctx.shiftWork',
    options: [
      { value: 'none', label: 'ctx.shift.none' },
      { value: 'day', label: 'ctx.shift.day' },
      { value: 'night', label: 'ctx.shift.night' },
      { value: 'rotating', label: 'ctx.shift.rotating' }
    ]
  },
  {
    key: 'fasting',
    label: 'setup.ctx.fasting',
    options: [
      { value: 'none', label: 'ctx.fast.none' },
      { value: 'ramadan', label: 'ctx.fast.ramadan' },
      { value: 'other', label: 'ctx.fast.other' }
    ]
  },
  {
    key: 'heat',
    label: 'setup.ctx.heat',
    options: [
      { value: 'hot', label: 'ctx.heat.hot' },
      { value: 'mild', label: 'ctx.heat.mild' }
    ]
  },
  {
    key: 'foodBudget',
    label: 'setup.ctx.foodBudget',
    options: [
      { value: 'low', label: 'ctx.budget.low' },
      { value: 'medium', label: 'ctx.budget.medium' }
    ]
  },
  {
    key: 'literacy',
    label: 'setup.ctx.literacy',
    options: [
      { value: 'low', label: 'ctx.lit.low' },
      { value: 'medium', label: 'ctx.lit.medium' },
      { value: 'high', label: 'ctx.lit.high' }
    ]
  }
];

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
  screening: {} as Record<ScreeningKey, Tri>,
  context: { ...DEFAULT_CONTEXT }
});

const pill = (on: boolean) =>
  `min-h-[48px] rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 ease-editorial ${
    on ? 'border-forest-800 bg-forest-800 text-ivory-50 shadow-soft-sm' : 'border-forest-900/15 bg-white text-forest-900 hover:border-forest-900/35'
  }`;

const inputClass = 'min-h-[48px] w-full rounded-xl border border-forest-900/20 bg-white px-3 text-base text-forest-950';

export const Setup: React.FC = () => {
  const { t, lang, setLang } = useI18n();
  const { state, completeSetup } = useStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<GoalSetup>(() =>
    state.setup ? { ...state.setup, context: state.setup.context ?? { ...DEFAULT_CONTEXT } } : blankDraft()
  );
  const [tick, setTick] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const patch = (p: Partial<GoalSetup>) => setDraft((d) => ({ ...d, ...p }));
  const ctx = draft.context ?? DEFAULT_CONTEXT;
  const patchCtx = (p: Partial<ContextProfile>) => patch({ context: { ...ctx, ...p } });

  const step = STEPS[stepIndex];
  const total = STEPS.length;
  const baseKey = BASE_FOR_GOAL[draft.goalType];
  const baseValue: Unknownable | undefined = baseKey ? draft.baseline[baseKey] : undefined;
  const picture = state.prefs.pictureMode;

  const goTo = (n: number) => {
    setStepIndex(n);
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

  const stepTitle = t(STEP_TITLE[step]);

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-editorial text-2xl text-forest-950 sm:text-3xl">{t('setup.title')}</h1>
        <p className="mt-1 text-sm text-forest-900/70">
          {t('setup.about')} · {state.mode === 'guest' ? t('setup.guestNote') : t('setup.localNote')}
        </p>
      </div>

      <div className="mb-5" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={stepIndex + 1} aria-label={t('setup.step', { n: stepIndex + 1, total })}>
        <div className="mb-1 flex justify-between text-xs text-forest-800/70">
          <span>{t('setup.step', { n: stepIndex + 1, total })}</span>
          <span>{stepTitle}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-forest-900/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-forest-700 to-ochre-500 transition-[width] duration-500 ease-editorial"
            style={{ width: `${((stepIndex + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <Card key={tick} className="route-in space-y-5" labelledBy="setup-step-title">
        <h2 id="setup-step-title" ref={headingRef} tabIndex={-1} className="font-editorial text-xl text-forest-950 outline-none">
          {stepTitle}
        </h2>

        {step === 'lang' && (
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

        {step === 'goal' && (
          <div>
            <p className="mb-3 text-sm text-forest-900/80">{t('setup.goalBody')}</p>
            <div className="grid gap-2" role="radiogroup">
              {GOAL_TYPES.map((g) => {
                const Icon = GOAL_ICON[g];
                const on = draft.goalType === g;
                return (
                  <button
                    key={g}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => patch({ goalType: g })}
                    className={`flex min-h-[64px] items-center justify-between gap-3 rounded-xl border px-4 py-3 text-start transition-all duration-200 ease-editorial ${
                      on ? 'border-forest-800 bg-forest-800 text-ivory-50 shadow-soft-sm' : 'border-forest-900/15 bg-white hover:border-forest-900/35'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className={`${picture ? 'h-9 w-9' : 'h-5 w-5'} shrink-0 ${on ? 'text-ochre-300' : 'text-ochre-700'}`} aria-hidden="true" />
                      <span>
                        <span className="block text-base font-medium">{t(`goal.${g}` as Key)}</span>
                        <span className={`block text-xs ${on ? 'text-ivory-200/85' : 'text-forest-800/65'}`}>{t(`goal.${g}.desc` as Key)}</span>
                      </span>
                    </span>
                    {on && <Check className="h-5 w-5 shrink-0" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
            {draft.goalType === 'tobacco' && <p className="mt-3 rounded-xl bg-ivory-100 p-3 text-sm text-forest-900/85">{t('plan.caution.tobacco_referral')}</p>}
          </div>
        )}

        {step === 'time' && (
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
            {draft.goalType !== 'tobacco' && (
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
            )}
          </div>
        )}

        {step === 'context' && (
          <div className="space-y-5">
            <p className="text-sm text-forest-900/80">{t('setup.ctxBody')}</p>
            {CONTEXT_CHOICES.map((q) => (
              <fieldset key={q.key}>
                <legend className="mb-2 text-sm font-medium text-forest-950">{t(q.label)}</legend>
                <div className="flex flex-wrap gap-2" role="radiogroup">
                  {[...q.options, { value: 'unknown', label: 'common.unknown' as Key }].map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      role="radio"
                      aria-checked={ctx[q.key] === o.value}
                      onClick={() => patchCtx({ [q.key]: o.value } as Partial<ContextProfile>)}
                      className={`${pill(ctx[q.key] === o.value)} !px-3`}
                    >
                      {t(o.label)}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
            {ctx.literacy === 'low' && <p className="rounded-xl bg-sage-50 p-3 text-sm text-forest-900">{t('setup.ctx.literacyHint')}</p>}
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-forest-950">{t('setup.ctx.access')}</legend>
              <div className="flex flex-wrap gap-2">
                {ACCESS_NEEDS.map((a) => (
                  <button key={a} type="button" aria-pressed={ctx.access.includes(a)} onClick={() => patchCtx({ access: toggle(ctx.access, a) })} className={pill(ctx.access.includes(a))}>
                    {t(`ctx.access.${a}` as Key)}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        {step === 'food' && (
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

        {step === 'base' && (
          <div className="space-y-3">
            {baseKey === undefined ? (
              <p className="text-sm text-forest-900/80">{t('setup.baseNone')}</p>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}

        {step === 'safety' && (
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
        <button type="button" disabled={stepIndex === 0} onClick={() => goTo(stepIndex - 1)} className="thy-btn-ghost min-h-[48px] disabled:invisible">
          {t('common.back')}
        </button>
        {stepIndex < total - 1 ? (
          <button type="button" onClick={() => goTo(stepIndex + 1)} className="thy-btn-primary min-h-[48px]">
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
