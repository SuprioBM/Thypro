import React, { useState } from 'react';
import { Apple, Check, ChevronDown, Droplets, Footprints, Lightbulb, Moon, Snowflake, Undo2 } from 'lucide-react';
import { DEFAULT_CONTEXT } from '../../domain/types';
import { resolveActions, type PlannerAction } from '../../planner/context';
import type { Track } from '../../planner/config';
import { stepUpOffer } from '../../planner/reducer';
import { computeRun } from '../../planner/runs';
import { PLANNER_RULES } from '../../planner/config';
import { TECHNIQUES, techniqueText } from '../../techniques/techniques';
import { useI18n, type Key } from '../../i18n';
import { isBlockedSetup } from '../../coach/blocked';
import { go } from '../router';
import { useStore } from '../store';
import { Card, Chip, EmptyState, Expandable, Ring, ScreenHeader, SuccessCheck } from '../ui/kit';

const ICONS: Record<Track, typeof Apple> = { nutrition: Apple, sleep: Moon, hydration: Droplets, activity: Footprints };

const inputCls = 'min-h-[44px] w-full rounded-xl border border-forest-900/20 bg-white px-3 text-base text-forest-950';

const MeasureField: React.FC<{
  id: string;
  label: string;
  type: 'number' | 'time';
  value: string;
  onChange: (v: string) => void;
  max?: number;
}> = ({ id, label, type, value, onChange, max }) => (
  <div>
    <label htmlFor={id} className="mb-1 block text-xs font-medium text-forest-800">
      {label}
    </label>
    <input
      id={id}
      type={type}
      inputMode={type === 'number' ? 'numeric' : undefined}
      min={type === 'number' ? 0 : undefined}
      max={max}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputCls}
    />
  </div>
);

const TrackCard: React.FC<{ action: PlannerAction; index: number }> = ({ action, index }) => {
  const { t, lang } = useI18n();
  const { state, today, planner } = useStore();
  const track = action.track;
  const Icon = ICONS[track];
  const run = computeRun(state.planner, track, today);
  const entry = state.planner.entries[today]?.[track];
  const done = entry?.done === true;
  const settings = state.planner.tracks[track];
  const [why, setWhy] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [m, setM] = useState({ a: '', b: '' });
  const tech = TECHNIQUES[action.technique];
  const tt = techniqueText(action.technique, lang);
  const trackName = t(`planner.track.${track}` as Key);

  if (!action.visible) {
    return (
      <Card index={index} tone="alert" labelledBy={`pl-${track}`}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-ochre-800">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id={`pl-${track}`} className="font-editorial text-lg text-forest-950">
              {t('planner.hidden.title')}
            </h2>
            <p className="mt-1 text-sm text-forest-900/85">{t('planner.hidden.body')}</p>
            <button type="button" onClick={() => go('clinician')} className="thy-btn-primary mt-3 min-h-[44px] !py-2">
              {t('planner.hidden.cta')}
            </button>
          </div>
        </div>
      </Card>
    );
  }

  const actionKey: Key = track === 'activity' && settings.variant === 'alt' ? 'planner.action.activityAlt' : (`planner.action.${track}` as Key);
  const measure = () => {
    const a = m.a.trim() === '' ? undefined : Number(m.a);
    const out: Parameters<typeof planner.complete>[1] = {};
    if (track === 'hydration' && a !== undefined && Number.isFinite(a)) out.glasses = Math.round(a);
    if (track === 'activity' && a !== undefined && Number.isFinite(a)) out.minutes = Math.round(a);
    if (track === 'nutrition' && a !== undefined && Number.isFinite(a)) out.mealsChecked = Math.round(a);
    if (track === 'sleep') {
      if (m.a) out.bedtime = m.a;
      if (m.b) out.wake = m.b;
    }
    return out;
  };
  const complete = () => {
    if (run.paused || (run.current === 0 && run.total > 0)) setCelebrate(true);
    planner.complete(track, measure());
  };

  const offer = stepUpOffer(state.planner, track, today);
  const stepped = settings.restoreLevel !== undefined;
  const label1 = track === 'sleep' ? t('planner.measure.bedtime') : t(`planner.measure.${track === 'hydration' ? 'glasses' : track === 'activity' ? 'minutes' : 'meals'}` as Key);
  const timeStr = settings.time ?? action.time;

  return (
    <Card index={index} labelledBy={`pl-${track}`}>
      <div className="flex items-start gap-3">
        <Ring value={run.current / 7} size={72} label={t('planner.ring', { track: trackName, n: run.current })}>
          <span className="text-lg font-semibold leading-none text-forest-950">{run.current}</span>
        </Ring>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Icon className="h-4 w-4 text-ochre-700" aria-hidden="true" />
            <h2 id={`pl-${track}`} className="font-editorial text-lg text-forest-950">
              {trackName}
            </h2>
            <Chip>{t('planner.level', { n: action.level })}</Chip>
          </div>
          <p className="mt-1 break-words text-sm text-forest-900/90">{t(actionKey, { n: action.target })}</p>
          <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-forest-800/85">
            {action.window && <span>{t('planner.window', { from: action.window.from, to: action.window.to })}</span>}
            {timeStr && <span>{t('planner.at', { time: timeStr })}</span>}
          </p>
        </div>
      </div>

      {(action.adapted.length > 0 || (track === 'activity' && state.planner.preShift.enabled)) && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={t('planner.why')}>
          {action.adapted.map((a) => (
            <li key={a}>
              <Chip tone="good">
                {a === 'heat_extra' && <Snowflake className="h-3 w-3" aria-hidden="true" />}
                {t(`planner.adapt.${a}` as Key)}
              </Chip>
            </li>
          ))}
          {track === 'activity' && state.planner.preShift.enabled && <li><Chip tone="good">{t('planner.preShift', { time: state.planner.preShift.time })}</Chip></li>}
        </ul>
      )}
      {action.cautions.map((c) => (
        <p key={c} className="mt-2 text-xs text-forest-800/85">{t(`planner.caution.${c}` as Key)}</p>
      ))}

      {!done && (
        <fieldset className="mt-3">
          <legend className="mb-1.5 text-xs font-medium text-forest-800/80">{t('planner.measure.title')}</legend>
          <div className="grid grid-cols-2 gap-3">
            <MeasureField id={`m1-${track}`} label={label1} type={track === 'sleep' ? 'time' : 'number'} value={m.a} onChange={(v) => setM((x) => ({ ...x, a: v }))} max={track === 'hydration' ? 20 : 300} />
            {track === 'sleep' && <MeasureField id={`m2-${track}`} label={t('planner.measure.wake')} type="time" value={m.b} onChange={(v) => setM((x) => ({ ...x, b: v }))} />}
          </div>
        </fieldset>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {done ? (
          <>
            <span className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-sage-100 px-4 text-sm font-medium text-forest-900" role="status">
              <Check className="h-4 w-4" aria-hidden="true" />
              {t('planner.doneToday')}
            </span>
            <button type="button" onClick={() => { setCelebrate(false); planner.undo(track); }} className="thy-btn-ghost min-h-[44px] !py-2">
              <Undo2 className="h-4 w-4" aria-hidden="true" />
              {t('planner.undo')}
            </button>
            {celebrate && <span className="flex items-center gap-2 text-sm text-forest-900"><SuccessCheck size={36} />{t('planner.comeback')}</span>}
          </>
        ) : (
          <button type="button" onClick={complete} className="thy-btn-primary min-h-[44px] !py-2">
            <Check className="h-4 w-4" aria-hidden="true" />
            {t('planner.done')}
          </button>
        )}
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        {([['planner.run.current', run.current], ['planner.run.best', run.best], ['planner.run.total', run.total]] as const).map(([k, v]) => (
          <div key={k} className="rounded-xl bg-ivory-100 px-1.5 py-2">
            <dt className="text-[11px] text-forest-800/85">{t(k)}</dt>
            <dd className="text-sm font-semibold text-forest-950">{t('planner.run.days', { n: v })}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-sm font-medium text-forest-900">{t('planner.safe', { n: run.total })}</p>
      {run.paused && <p className="mt-1 text-xs text-forest-800/80">{t('planner.paused')}</p>}
      {run.frozen.length > 0 && <p className="mt-1 text-xs text-forest-800/80">{t('planner.frozen', { date: run.frozen[run.frozen.length - 1] })}</p>}

      {stepped && (
        <div className="mt-3 rounded-xl border border-sage-300 bg-sage-50 p-3 text-sm text-forest-900">
          <p>{t('planner.stepDown', { track: trackName })}</p>
          <button type="button" onClick={() => planner.restoreLevel(track)} className="thy-btn-ghost mt-2 min-h-[44px] !py-2">
            {t('planner.restore', { n: settings.restoreLevel ?? 0 })}
          </button>
        </div>
      )}
      {offer && !stepped && (
        <div className="mt-3 rounded-xl border border-sage-300 bg-sage-50 p-3 text-sm text-forest-900">
          <p>{t('planner.stepUp', { track: trackName })}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => planner.stepUp(track, true)} className="thy-btn-primary min-h-[44px] !py-2">{t('planner.stepUp.yes')}</button>
            <button type="button" onClick={() => planner.stepUp(track, false)} className="thy-btn-ghost min-h-[44px] !py-2">{t('planner.stepUp.no')}</button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setWhy((v) => !v)}
        aria-expanded={why}
        aria-controls={`why-${track}`}
        className="mt-3 flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl px-1 text-start text-sm font-medium text-forest-900"
      >
        <span className="inline-flex items-center gap-2"><Lightbulb className="h-4 w-4 text-ochre-700" aria-hidden="true" />{t('planner.why')}</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${why ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      <Expandable open={why} id={`why-${track}`}>
        {why && (
          <div className="space-y-2 pb-1 text-sm text-forest-900/85">
            <p><span className="font-medium">{t('planner.technique')}:</span> {tt.name}</p>
            <p><span className="font-medium">{t('planner.rationale')}:</span> {tt.rationale}</p>
            <p><span className="font-medium">{t('planner.limitsLabel')}:</span> {tt.limits}</p>
            <p className="break-words text-xs text-forest-800/85">{t('planner.source', { label: tech.source.label })}</p>
            <p className="font-mono text-[11px] text-forest-800/85">{t('planner.rules', { v: PLANNER_RULES.version })}</p>
          </div>
        )}
      </Expandable>
    </Card>
  );
};

export const Planner: React.FC = () => {
  const { t } = useI18n();
  const { state, today } = useStore();

  if (!state.setup) {
    return (
      <div className="space-y-4">
        <ScreenHeader title={t('planner.title')} subtitle={t('planner.subtitle')} />
        <EmptyState title={t('planner.noSetup.title')} body={t('planner.noSetup.body')} action={<button type="button" className="thy-btn-primary min-h-[44px]" onClick={() => go('setup')}>{t('planner.noSetup.cta')}</button>} />
      </div>
    );
  }
  if (isBlockedSetup(state)) {
    return (
      <div className="space-y-4">
        <ScreenHeader title={t('planner.title')} subtitle={t('planner.subtitle')} />
        <Card tone="alert" labelledBy="pl-blocked">
          <h2 id="pl-blocked" className="font-editorial text-lg text-forest-950">{t('planner.blocked.title')}</h2>
          <p className="mt-1 text-sm text-forest-900/85">{t('planner.blocked.body')}</p>
          <button type="button" onClick={() => go('clinician')} className="thy-btn-primary mt-3 min-h-[44px] !py-2">{t('planner.hidden.cta')}</button>
        </Card>
      </div>
    );
  }

  const actions = resolveActions(state.planner, state.setup.context ?? DEFAULT_CONTEXT, state.setup.screening);
  const visible = actions.filter((a) => a.visible);
  const doneToday = visible.filter((a) => state.planner.entries[today]?.[a.track]?.done).length;

  return (
    <div className="space-y-4">
      <ScreenHeader title={t('planner.title')} subtitle={t('planner.subtitle')} />
      <Card tone="soft" index={0}>
        <p className="text-sm text-forest-900/85">{t('planner.note')}</p>
        <p className="mt-2 text-sm font-medium text-forest-950" aria-live="polite">{t('planner.progress', { done: doneToday, total: visible.length })}</p>
        <p className="mt-1 text-xs text-forest-800/85">{t('planner.freezeInfo')}</p>
      </Card>
      {actions.map((a, i) => (
        <TrackCard key={a.track} action={a} index={i + 1} />
      ))}
      <button type="button" onClick={() => go('coach')} className="thy-btn-ghost min-h-[44px] w-full">{t('planner.coachLink')}</button>
    </div>
  );
};
