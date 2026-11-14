import React, { useMemo, useState } from 'react';
import {
  Activity,
  Armchair,
  Check,
  ChevronDown,
  Dumbbell,
  Footprints,
  Hand,
  Moon,
  Play,
  Repeat,
  Search,
  ShieldAlert,
  StretchHorizontal,
  Trash2,
  Trophy,
  Anchor,
  Scale
} from 'lucide-react';
import { shiftDate } from '../../domain/week';
import { useI18n, type Key } from '../../i18n';
import { EXERCISES, getExercise } from '../../strength/library';
import { STARTER_PLANS } from '../../strength/plans';
import { activityGrid, daysSinceTrained, loadLevel, muscleSets, recordList, strengthStats } from '../../strength/records';
import { EMPTY_ANSWERS, STRENGTH_SAFETY, screenStrength, type ScreenAnswer, type ScreenAnswers } from '../../strength/safety';
import { isLight, nextSession, weekdayIndex } from '../../strength/schedule';
import { estimateMinutes, exHow, exName, rangeText } from '../../strength/text';
import { EQUIPMENT, MUSCLES, type ActivePlan, type Exercise, type Muscle, type Pattern, type Prescription, type Routine } from '../../strength/types';
import { BodyMap } from '../components/BodyMap';
import { WeightChart } from '../components/WeightChart';
import { go } from '../router';
import { useStore } from '../store';
import { Card, Chip, Expandable } from '../ui/kit';

const PATTERN_ICON: Record<Pattern, typeof Dumbbell> = {
  squat: Armchair,
  push: Hand,
  pull: Anchor,
  hinge: Footprints,
  core: Activity,
  balance: Scale,
  mobility: StretchHorizontal
};

const WEEK_REF = ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15'];

function useWeekdayNames(): string[] {
  const { fmtDate } = useI18n();
  return WEEK_REF.map((d) => fmtDate(d, { weekday: 'short' }));
}

/** Muscle levels for a routine: the first muscle of each exercise counts most. */
function routineLevels(items: Prescription[]): Partial<Record<Muscle, number>> {
  const out: Partial<Record<Muscle, number>> = {};
  for (const rx of items) {
    getExercise(rx.exerciseId)?.muscles.forEach((m, i) => {
      out[m] = Math.max(out[m] ?? 0, i === 0 ? 1 : 0.55);
    });
  }
  return out;
}

const rxText = (rx: Prescription, e: Exercise | undefined, t: (k: Key) => string) =>
  `${rx.sets} × ${rangeText(rx)}${e?.load === 'hold' ? ` ${t('st.w.secs')}` : ''}`;

/* ------------------------------------------------------------------ */
/* Onboarding: pick a plan, answer three safety questions              */
/* ------------------------------------------------------------------ */

export const Onboarding: React.FC = () => {
  const { t, lang } = useI18n();
  const { strength } = useStore();
  const [picked, setPicked] = useState<string | null>(null);
  const [answered, setAnswered] = useState<Partial<ScreenAnswers>>({});
  const [blocked, setBlocked] = useState(false);

  const complete = STRENGTH_SAFETY.questions.every((q) => answered[q]);
  const result = complete ? screenStrength({ ...EMPTY_ANSWERS, ...answered } as ScreenAnswers) : null;

  const submit = () => {
    if (!picked || !complete) return;
    const answers = { ...EMPTY_ANSWERS, ...answered } as ScreenAnswers;
    strength.screen(answers);
    if (screenStrength(answers) === 'blocked') setBlocked(true);
    else strength.startPlan(picked);
  };

  if (blocked) {
    return (
      <Card tone="alert" className="thy-swap" labelledBy="st-blocked">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-ochre-800" aria-hidden="true" />
          <div>
            <h2 id="st-blocked" className="font-editorial text-xl text-forest-950">{t('st.screen.blockedTitle')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-forest-900/85">{t('st.screen.blockedBody')}</p>
            <button type="button" onClick={() => { setBlocked(false); setAnswered({}); }} className="thy-btn-ghost mt-4 min-h-[44px]">
              {t('st.screen.change')}
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5 thy-swap">
      <div>
        <h2 className="font-editorial text-xl text-forest-950">{t('st.start.title')}</h2>
        <p className="mt-1 text-sm text-forest-900/70">{t('st.start.intro')}</p>
      </div>

      <div className="grid gap-3" role="radiogroup" aria-label={t('st.start.title')}>
        {STARTER_PLANS.map((p) => {
          const on = picked === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setPicked(p.id)}
              className={`thy-luxe w-full !rounded-2xl p-4 text-start transition-all duration-500 ease-editorial sm:p-5 ${on ? '!border-ochre-500 ring-2 ring-ochre-500/30' : 'hover:-translate-y-0.5'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-editorial text-lg text-forest-950">{p.name[lang]}</div>
                  <p className="mt-1 text-sm leading-relaxed text-forest-900/75">{p.blurb[lang]}</p>
                </div>
                <span
                  aria-hidden="true"
                  className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${on ? 'border-ochre-500 bg-ochre-500 text-white' : 'border-forest-900/25'}`}
                >
                  {on && <Check className="h-3.5 w-3.5" />}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Chip tone="info">{t('st.plan.min', { n: p.minutes })}</Chip>
                {p.needs.map((n) => (
                  <Chip key={n}>{t(`st.equip.${n}` as Key)}</Chip>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <Expandable open={picked !== null} id="st-screen">
        <Card tone="soft" className="mt-1">
          <h3 className="font-editorial text-lg text-forest-950">{t('st.screen.title')}</h3>
          <p className="mt-1 text-sm text-forest-900/70">{t('st.screen.intro')}</p>
          <div className="mt-4 space-y-4">
            {STRENGTH_SAFETY.questions.map((q) => (
              <fieldset key={q}>
                <legend className="text-sm font-medium text-forest-950">{t(`st.screen.q.${q}` as Key)}</legend>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(['yes', 'no', 'unknown'] as ScreenAnswer[]).map((a) => {
                    const on = answered[q] === a;
                    return (
                      <button
                        key={a}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setAnswered((s) => ({ ...s, [q]: a }))}
                        className={`min-h-[44px] rounded-xl border px-2 text-sm font-medium transition-colors duration-300 ${on ? 'border-forest-800 bg-forest-800 text-ivory-50' : 'border-forest-900/15 bg-white text-forest-900 hover:border-forest-900/35'}`}
                      >
                        {t(`st.ans.${a}` as Key)}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
          {result === 'caution' && <p className="mt-4 rounded-xl bg-ochre-50 p-3 text-xs text-forest-900/85">{t('st.screen.cautionNote')}</p>}
          <button type="button" disabled={!complete || !picked} onClick={submit} className="thy-btn-accent mt-5 min-h-[48px] disabled:opacity-40">
            {t('st.screen.continue')}
          </button>
        </Card>
      </Expandable>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Today                                                               */
/* ------------------------------------------------------------------ */

export const TodayTab: React.FC<{ plan: ActivePlan }> = ({ plan }) => {
  const { t, lang, fmtDate } = useI18n();
  const { state, today, strength } = useStore();
  const days = useWeekdayNames();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const s = state.strength;
  const next = nextSession(plan, s.sessions, today);
  const light = isLight(plan, today);
  const lightOn = plan.lightUntil !== undefined && today <= plan.lightUntil;
  const resume = s.draft !== null;
  const routine: Routine | null = next.routine ?? next.nextDay?.routine ?? null;
  const canStartToday = Boolean(next.routine) && !next.doneToday;

  const start = (r: Routine) => {
    if (!resume) strength.startWorkout(r.id);
    go('workout');
  };

  const week = Array.from({ length: 7 }, (_, i) => {
    const date = shiftDate(today, i - 6);
    return { date, n: s.sessions.filter((x) => x.date === date).length, label: days[weekdayIndex(date)] };
  });
  const weekCount = week.reduce((n, d) => n + d.n, 0);
  const recent = [...s.sessions].reverse().slice(0, 5);
  const draftRoutine = s.draft ? plan.routines.find((r) => r.id === s.draft?.routineId) ?? null : null;
  const hero = resume ? draftRoutine ?? routine : routine;

  return (
    <div className="space-y-4">
      {hero ? (
        <section className="thy-luxe-dark thy-swap !rounded-3xl p-5 sm:p-6" aria-labelledby="st-hero">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="h-36 w-16 shrink-0 sm:h-40 sm:w-[4.5rem]" aria-hidden="true">
              <BodyMap levels={routineLevels(hero.items)} view="front" className="h-full" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-flex rounded-full bg-ochre-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white">
                {next.doneToday && !resume ? t('st.today.doneToday') : canStartToday || resume ? t('st.today.next') : t('st.today.restDay')}
              </span>
              <h2 id="st-hero" className="mt-2 font-editorial text-2xl leading-tight text-ivory-50">{hero.name[lang]}</h2>
              <p className="mt-1 text-xs text-ivory-200/75">
                {t('st.today.exercises', { n: hero.items.length })} · {t('st.plan.min', { n: estimateMinutes(hero.items) })}
              </p>
              {!canStartToday && !resume && (
                <p className="mt-2 text-sm text-ivory-200/85">
                  {next.nextDay
                    ? t('st.today.nextOn', { routine: hero.name[lang], day: days[next.nextDay.index] })
                    : t('st.today.restBody')}
                </p>
              )}
            </div>
          </div>

          <ul className="mt-5 grid gap-1.5 text-sm sm:grid-cols-2">
            {hero.items.map((rx) => {
              const e = getExercise(rx.exerciseId);
              return (
                <li key={rx.exerciseId} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2">
                  <span className="min-w-0 truncate text-ivory-100">{exName(rx.exerciseId, lang)}</span>
                  <span className="shrink-0 font-mono text-[11px] text-ochre-300">{rxText(rx, e, t)}</span>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => start(hero)} className="thy-btn-accent min-h-[48px]">
              <Play className="h-4 w-4" aria-hidden="true" />
              {resume ? t('st.today.resume') : canStartToday ? t('st.today.start') : t('st.today.startAnyway')}
            </button>
            {light && !resume && <Chip className="!border-white/20 !bg-white/10 !text-ivory-100"><Moon className="h-3 w-3" aria-hidden="true" />{t('st.light.title')}</Chip>}
          </div>
        </section>
      ) : null}

      {plan.cautious && <p className="rounded-2xl bg-ochre-50 p-3 text-xs leading-relaxed text-forest-900/85">{t('st.plan.cautious')}</p>}

      {/* This week */}
      <Card index={1} labelledBy="st-week">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 id="st-week" className="font-editorial text-lg text-forest-950">{t('st.week.title')}</h3>
          <Chip tone={weekCount > 0 ? 'good' : 'neutral'}>{t('st.week.count', { n: weekCount })}</Chip>
        </div>
        <ol className="grid grid-cols-7 gap-1.5" aria-label={t('st.week.title')}>
          {week.map((d, i) => (
            <li key={d.date} className="text-center">
              <span
                className={`mx-auto flex h-9 w-full items-center justify-center rounded-xl text-xs font-semibold transition-colors duration-500 ${d.n > 0 ? 'bg-forest-800 text-ivory-50' : 'bg-forest-900/[0.06] text-forest-800/50'} ${i === 6 ? 'ring-2 ring-ochre-400/60' : ''}`}
              >
                {d.n > 0 ? <Check className="h-4 w-4" aria-label={`${d.label}: ${d.n}`} /> : null}
              </span>
              <span className="mt-1 block text-[10px] text-forest-800/65">{d.label}</span>
            </li>
          ))}
        </ol>
      </Card>

      {/* Lighter week */}
      <Card index={2} tone="soft" labelledBy="st-light">
        <div className="flex items-start gap-3">
          <Moon className="mt-0.5 h-5 w-5 shrink-0 text-ochre-700" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <h3 id="st-light" className="font-editorial text-lg text-forest-950">{t('st.light.title')}</h3>
            <p className="mt-1 text-sm text-forest-900/75">{lightOn ? t('st.light.on', { date: fmtDate(plan.lightUntil as string) }) : t('st.light.hint')}</p>
            <button type="button" onClick={() => strength.setLight(!lightOn)} className="thy-btn-ghost mt-3 min-h-[44px]">
              {lightOn ? t('st.light.turnOff') : t('st.light.turnOn')}
            </button>
          </div>
        </div>
      </Card>

      {/* Recent */}
      <Card index={3} labelledBy="st-recent">
        <h3 id="st-recent" className="mb-3 font-editorial text-lg text-forest-950">{t('st.recent')}</h3>
        {recent.length === 0 ? (
          <p className="text-sm text-forest-900/65">{t('st.recent.none')}</p>
        ) : (
          <ul className="divide-y divide-forest-900/[0.08]">
            {recent.map((x) => {
              const r = plan.routines.find((q) => q.id === x.routineId);
              return (
                <li key={x.id} className="flex items-center gap-3 py-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest-900 text-ochre-300">
                    <Dumbbell className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-forest-950">{r?.name[lang] ?? x.routineId}</div>
                    <div className="text-xs text-forest-800/70">
                      {fmtDate(x.date)} · {t('st.session.line', { n: x.exercises.length, min: x.minutes })}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {x.records.length > 0 && <Chip tone="warn"><Trophy className="h-3 w-3" aria-hidden="true" />{t('st.session.records', { n: x.records.length })}</Chip>}
                      {x.stopped && <Chip>{t('st.session.stopped')}</Chip>}
                    </div>
                  </div>
                  {confirmId === x.id ? (
                    <button type="button" onClick={() => { strength.deleteSession(x.id); setConfirmId(null); }} className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-signal-crimson px-3 text-xs font-semibold text-white">
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('st.session.delete')}
                    </button>
                  ) : (
                    <button type="button" onClick={() => setConfirmId(x.id)} aria-label={t('st.session.delete')} className="flex h-11 w-11 items-center justify-center rounded-xl text-forest-800/60 hover:bg-forest-900/[0.05]">
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Plan                                                                */
/* ------------------------------------------------------------------ */

export const PlanTab: React.FC<{ plan: ActivePlan }> = ({ plan }) => {
  const { t, lang, fmtDate } = useI18n();
  const { strength } = useStore();
  const days = useWeekdayNames();
  const [open, setOpen] = useState<string | null>(plan.routines[0]?.id ?? null);

  return (
    <div className="space-y-4">
      <Card className="thy-swap" labelledBy="st-plan-title">
        <h2 id="st-plan-title" className="font-editorial text-xl text-forest-950">{plan.name[lang]}</h2>
        <p className="mt-1 text-xs text-forest-800/70">{t('st.plan.started', { date: fmtDate(plan.startedOn) })}</p>

        <div className="mt-5">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-forest-800/60">{t('st.plan.mode')}</div>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('st.plan.mode')}>
            {(['weekly', 'rotation'] as const).map((m) => {
              const on = plan.mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => strength.setMode(m)}
                  className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-all duration-300 ${on ? 'border-forest-800 bg-forest-800 text-ivory-50' : 'border-forest-900/15 bg-white text-forest-900 hover:border-forest-900/35'}`}
                >
                  {m === 'rotation' ? <Repeat className="h-4 w-4" aria-hidden="true" /> : null}
                  {t(`st.mode.${m}` as Key)}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-forest-900/70">{t(plan.mode === 'weekly' ? 'st.mode.weeklyHint' : 'st.mode.rotationHint')}</p>
        </div>

        {plan.mode === 'weekly' ? (
          <ol className="mt-4 grid grid-cols-7 gap-1.5" aria-label={t('st.mode.weekly')}>
            {plan.weekdays.map((id, i) => {
              const r = plan.routines.find((q) => q.id === id);
              return (
                <li key={i} className="text-center">
                  <span className="block text-[10px] text-forest-800/65">{days[i]}</span>
                  <span className={`mt-1 flex h-10 items-center justify-center rounded-xl px-0.5 text-[10px] font-semibold leading-tight ${r ? 'bg-forest-800 text-ivory-50' : 'bg-forest-900/[0.06] text-forest-800/50'}`}>
                    {r ? r.name[lang].split(' ').slice(-1)[0] : t('st.plan.restDay')}
                  </span>
                </li>
              );
            })}
          </ol>
        ) : (
          <ol className="mt-4 flex flex-wrap items-center gap-2" aria-label={t('st.mode.rotation')}>
            {plan.routines.map((r, i) => (
              <React.Fragment key={r.id}>
                <li className="rounded-full bg-forest-800 px-3 py-1.5 text-xs font-semibold text-ivory-50">{r.name[lang]}</li>
                <li aria-hidden="true" className="text-forest-800/40">{i < plan.routines.length - 1 ? '→' : '↺'}</li>
              </React.Fragment>
            ))}
          </ol>
        )}
      </Card>

      <h3 className="px-1 font-editorial text-lg text-forest-950">{t('st.plan.routines')}</h3>
      {plan.routines.map((r, ri) => {
        const isOpen = open === r.id;
        return (
          <Card key={r.id} index={ri + 1} className="!p-0 overflow-hidden">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`routine-${r.id}`}
              onClick={() => setOpen(isOpen ? null : r.id)}
              className="flex w-full items-center gap-4 p-4 text-start sm:p-5"
            >
              <div className="h-16 w-8 shrink-0" aria-hidden="true">
                <BodyMap levels={routineLevels(r.items)} view="front" className="h-full" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-editorial text-lg text-forest-950">{r.name[lang]}</div>
                <div className="text-xs text-forest-800/70">{t('st.today.exercises', { n: r.items.length })} · {t('st.plan.min', { n: estimateMinutes(r.items) })}</div>
              </div>
              <ChevronDown className={`h-5 w-5 shrink-0 text-forest-800/60 transition-transform duration-500 ease-editorial ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            <Expandable open={isOpen} id={`routine-${r.id}`}>
              <ul className="divide-y divide-forest-900/[0.07] border-t border-forest-900/[0.07]">
                {r.items.map((rx) => {
                  const e = getExercise(rx.exerciseId);
                  const Icon = PATTERN_ICON[e?.pattern ?? 'core'];
                  return (
                    <li key={rx.exerciseId} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ivory-200 text-forest-800">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-forest-950">{exName(rx.exerciseId, lang)}</div>
                        <div className="text-[11px] text-forest-800/65">{t('st.plan.rest', { n: rx.restSec })}</div>
                      </div>
                      <span className="shrink-0 font-mono text-xs text-ochre-700">{rxText(rx, e, t)}</span>
                    </li>
                  );
                })}
              </ul>
            </Expandable>
          </Card>
        );
      })}

      <Card tone="soft" index={4}>
        <button type="button" onClick={() => strength.stopPlan()} className="thy-btn-ghost min-h-[44px]">
          {t('st.plan.change')}
        </button>
        <p className="mt-2 text-xs text-forest-800/70">{t('st.plan.stopHint')}</p>
      </Card>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Library                                                             */
/* ------------------------------------------------------------------ */

export const LibraryTab: React.FC = () => {
  const { t, lang } = useI18n();
  const [q, setQ] = useState('');
  const [muscle, setMuscle] = useState<Muscle | 'all'>('all');
  const [equip, setEquip] = useState<string>('all');
  const [open, setOpen] = useState<string | null>(null);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return EXERCISES.filter((e) => {
      if (muscle !== 'all' && !e.muscles.includes(muscle)) return false;
      if (equip !== 'all' && e.equipment !== equip) return false;
      if (needle && !e.t[lang][0].toLowerCase().includes(needle) && !e.t.en[0].toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [q, muscle, equip, lang]);

  const chip = (on: boolean) =>
    `min-h-[40px] shrink-0 rounded-full border px-3.5 text-xs font-semibold transition-colors duration-300 ${on ? 'border-forest-800 bg-forest-800 text-ivory-50' : 'border-forest-900/15 bg-white text-forest-900 hover:border-forest-900/35'}`;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-forest-800/50" aria-hidden="true" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('st.lib.search')}
          aria-label={t('st.lib.search')}
          className="min-h-[48px] w-full rounded-2xl border border-forest-900/15 bg-white ps-10 pe-3 text-base focus:border-forest-800 focus:outline-none"
        />
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-1 thy-scroll-x">
        <div className="flex gap-2" role="group" aria-label={t('st.muscle.chest')}>
          <button type="button" aria-pressed={muscle === 'all'} onClick={() => setMuscle('all')} className={chip(muscle === 'all')}>{t('st.lib.all')}</button>
          {MUSCLES.map((m) => (
            <button key={m} type="button" aria-pressed={muscle === m} onClick={() => setMuscle(m)} className={chip(muscle === m)}>{t(`st.muscle.${m}` as Key)}</button>
          ))}
        </div>
      </div>
      <div className="-mx-4 overflow-x-auto px-4 pb-1 thy-scroll-x">
        <div className="flex gap-2" role="group" aria-label={t('st.plan.needs', { items: '' })}>
          <button type="button" aria-pressed={equip === 'all'} onClick={() => setEquip('all')} className={chip(equip === 'all')}>{t('st.lib.all')}</button>
          {EQUIPMENT.map((x) => (
            <button key={x} type="button" aria-pressed={equip === x} onClick={() => setEquip(x)} className={chip(equip === x)}>{t(`st.equip.${x}` as Key)}</button>
          ))}
        </div>
      </div>

      <p className="px-1 text-xs text-forest-800/65" aria-live="polite">{t('st.lib.count', { n: list.length })}</p>

      {list.length === 0 ? (
        <Card><p className="text-sm text-forest-900/70">{t('st.lib.none')}</p></Card>
      ) : (
        <ul className="space-y-2.5">
          {list.map((e) => {
            const isOpen = open === e.id;
            const Icon = PATTERN_ICON[e.pattern];
            const levels: Partial<Record<Muscle, number>> = {};
            e.muscles.forEach((m, i) => (levels[m] = i === 0 ? 1 : 0.55));
            return (
              <li key={e.id} className="thy-card overflow-hidden !rounded-2xl">
                <button type="button" aria-expanded={isOpen} aria-controls={`ex-${e.id}`} onClick={() => setOpen(isOpen ? null : e.id)} className="flex w-full items-center gap-3 p-3.5 text-start sm:p-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-forest-900 text-ochre-300">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-forest-950">{e.t[lang][0]}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Chip>{t(`st.muscle.${e.muscles[0]}` as Key)}</Chip>
                      <Chip>{t(`st.equip.${e.equipment}` as Key)}</Chip>
                    </div>
                  </div>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-forest-800/55 transition-transform duration-500 ease-editorial ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                <Expandable open={isOpen} id={`ex-${e.id}`}>
                  <div className="flex items-start gap-4 border-t border-forest-900/[0.07] p-4">
                    <div className="h-24 w-12 shrink-0" aria-hidden="true">
                      <BodyMap levels={levels} view={e.muscles[0] === 'back' || e.muscles[0] === 'glutes' || e.muscles[0] === 'hamstrings' ? 'back' : 'front'} className="h-full" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold uppercase tracking-widest text-ochre-700">{t('st.lib.how')}</div>
                      <p className="mt-1 text-sm leading-relaxed text-forest-900/85">{exHow(e, lang)}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {e.muscles.map((m) => (
                          <Chip key={m} tone="good">{t(`st.muscle.${m}` as Key)}</Chip>
                        ))}
                      </div>
                    </div>
                  </div>
                </Expandable>
              </li>
            );
          })}
        </ul>
      )}
      <p className="px-1 text-[11px] leading-relaxed text-forest-800/65">{t('st.lib.note')}</p>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Progress                                                            */
/* ------------------------------------------------------------------ */

type MapMode = 'volume' | 'recovery' | 'untrained';

export const ProgressTab: React.FC = () => {
  const { t, lang, fmtDate } = useI18n();
  const { state, today, strength } = useStore();
  const s = state.strength;
  const [mode, setMode] = useState<MapMode>('volume');
  const [bw, setBw] = useState('');

  const stats = strengthStats(s.sessions, today);
  const sets = muscleSets(s.sessions, shiftDate(today, -6));
  const since = daysSinceTrained(s.sessions, today);
  const grid = activityGrid(s.sessions, today, 8);
  const records = recordList(s.sessions).slice(0, 8);

  const level = (m: Muscle): number => {
    if (mode === 'volume') return loadLevel(sets[m]);
    const d = since[m];
    if (mode === 'recovery') return d === null || d > 4 ? 0 : 1 - d / 5;
    return d === null || d > 7 ? 1 : 0;
  };
  const levels = Object.fromEntries(MUSCLES.map((m) => [m, level(m)])) as Record<Muscle, number>;
  const detail = (m: Muscle): string => {
    if (mode === 'volume') return t('st.map.sets', { n: Math.round(sets[m] * 10) / 10 });
    const d = since[m];
    return d === null ? t('st.map.never') : d === 0 ? t('st.map.todayShort') : t('st.map.daysAgo', { n: d });
  };

  const submitBw = (e: React.FormEvent) => {
    e.preventDefault();
    const kg = Number(bw.replace(',', '.'));
    if (kg > 20 && kg < 400) {
      strength.logBodyWeight(kg);
      setBw('');
    }
  };

  const modes: MapMode[] = ['volume', 'recovery', 'untrained'];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [t('st.prog.sessions'), stats.sessions],
          [t('st.prog.thisWeek'), stats.thisWeek],
          [t('st.prog.minutes'), stats.minutes],
          [t('st.prog.records'), stats.records]
        ].map(([label, value], i) => (
          <Card key={String(label)} index={i} className="!p-4 text-center">
            <div className="font-editorial text-3xl text-forest-950">{value}</div>
            <div className="mt-0.5 text-[11px] text-forest-800/70">{label}</div>
          </Card>
        ))}
      </div>

      <Card index={2} labelledBy="st-map">
        <h3 id="st-map" className="font-editorial text-lg text-forest-950">{t('st.map.title')}</h3>
        <div className="thy-seg mt-3 w-full" role="tablist" aria-label={t('st.map.mode')}>
          {modes.map((m) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className="thy-seg-btn !shrink flex-1 justify-center !whitespace-normal !px-2 text-center !text-[11px] leading-tight">
              {t(`st.map.${m}` as Key)}
            </button>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-center gap-6">
          <div className="h-56 sm:h-64">
            <BodyMap levels={levels} frontLabel={t('st.map.front')} backLabel={t('st.map.back')} className="h-full" />
          </div>
        </div>
        <div className="mx-auto mt-3 flex max-w-xs items-center gap-2 text-[10px] text-forest-800/65" aria-hidden="true">
          <span>{t('st.map.less')}</span>
          <span className="h-2 flex-1 rounded-full" style={{ background: 'linear-gradient(90deg, rgba(10,51,44,0.07), rgba(245,112,31,0.96))' }} />
          <span>{t('st.map.more')}</span>
        </div>
        <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {MUSCLES.map((m) => (
            <li key={m} className="flex items-center gap-3 text-xs">
              <span className="w-28 shrink-0 text-forest-900">{t(`st.muscle.${m}` as Key)}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-forest-900/[0.08]" aria-hidden="true">
                <span className="block h-full rounded-full bg-ochre-500 transition-all duration-700 ease-editorial" style={{ width: `${Math.round(levels[m] * 100)}%` }} />
              </span>
              <span className="w-20 shrink-0 text-end text-forest-800/70">{detail(m)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card index={3} labelledBy="st-act">
        <h3 id="st-act" className="font-editorial text-lg text-forest-950">{t('st.prog.activity')}</h3>
        <div className="mt-3 grid grid-flow-col grid-rows-7 gap-1" role="img" aria-label={`${t('st.prog.activity')}: ${stats.sessions}`}>
          {grid.map((d) => (
            <span
              key={d.date}
              title={`${fmtDate(d.date)}: ${d.count}`}
              className={`aspect-square rounded-[4px] transition-colors duration-500 ${d.count === 0 ? 'bg-forest-900/[0.07]' : d.count === 1 ? 'bg-ochre-400' : 'bg-ochre-600'}`}
            />
          ))}
        </div>
        <p className="mt-2 text-[11px] text-forest-800/65">{t('st.prog.activityNote')}</p>
      </Card>

      <Card index={4} labelledBy="st-rec">
        <h3 id="st-rec" className="mb-3 flex items-center gap-2 font-editorial text-lg text-forest-950">
          <Trophy className="h-4 w-4 text-ochre-600" aria-hidden="true" />
          {t('st.prog.records.title')}
        </h3>
        {records.length === 0 ? (
          <p className="text-sm text-forest-900/70">{t('st.prog.records.none')}</p>
        ) : (
          <ul className="divide-y divide-forest-900/[0.07]">
            {records.map((r, i) => (
              <li key={`${r.date}-${r.exerciseId}-${i}`} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0 text-forest-950">{t(`st.rec.${r.kind}` as Key, { name: exName(r.exerciseId, lang), value: r.value })}</span>
                <span className="shrink-0 text-xs text-forest-800/65">{fmtDate(r.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card index={5} labelledBy="st-bw">
        <h3 id="st-bw" className="font-editorial text-lg text-forest-950">{t('st.prog.bw')}</h3>
        <p className="mt-1 text-xs text-forest-800/70">{t('st.prog.bwNote')}</p>
        <div className="mt-3">
          {s.bodyWeights.length === 0 ? (
            <p className="text-sm text-forest-900/65">{t('st.prog.bwNone')}</p>
          ) : (
            <WeightChart points={s.bodyWeights} label={t('st.prog.bwChart')} />
          )}
        </div>
        <form onSubmit={submitBw} className="mt-4 flex items-end gap-2">
          <label className="min-w-0 flex-1 text-xs text-forest-800/75">
            {t('st.prog.bwLabel')}
            <input
              inputMode="decimal"
              value={bw}
              onChange={(e) => setBw(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-forest-900/15 bg-white px-3 text-base text-forest-950 focus:border-forest-800 focus:outline-none"
            />
          </label>
          <button type="submit" disabled={!(Number(bw.replace(',', '.')) > 20)} className="thy-btn-primary min-h-[48px] !py-2 disabled:opacity-40">
            {t('st.prog.bwSave')}
          </button>
        </form>
      </Card>
    </div>
  );
};

