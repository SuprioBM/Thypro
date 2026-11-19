import React, { useEffect, useMemo, useState } from 'react';
import { Check, Minus, Pause, Play, RotateCcw } from 'lucide-react';
import { PERSONA_IDS, simulate, type PersonaId, type SimEvent } from '../../coach/sim';
import { TRACKS } from '../../planner/config';
import { useI18n, type Key } from '../../i18n';
import { useStore } from '../store';
import { Card, Chip, ScreenHeader } from '../ui/kit';

const TOTAL = 7;

const ArmButton: React.FC<{ active: boolean; label: string; onClick: () => void }> = ({ active, label, onClick }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={`min-h-[44px] flex-1 rounded-xl border px-3 text-sm font-medium transition-colors ${active ? 'border-forest-800 bg-forest-800 text-ivory-50' : 'border-forest-900/20 bg-white text-forest-900 hover:bg-forest-900/[0.04]'}`}
  >
    {label}
  </button>
);

export const Replay: React.FC = () => {
  const { t, fmtDate } = useI18n();
  const { today } = useStore();
  const [persona, setPersona] = useState<PersonaId>('night-shift');
  const [withCoach, setWithCoach] = useState(true);
  const [day, setDay] = useState(TOTAL);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setDay((d) => {
        if (d >= TOTAL) {
          setPlaying(false);
          return d;
        }
        return d + 1;
      });
    }, 1100);
    return () => window.clearInterval(id);
  }, [playing]);

  const full = useMemo(() => simulate(persona, withCoach, today, TOTAL), [persona, withCoach, today]);
  const upto = useMemo(() => simulate(persona, withCoach, today, Math.max(day, 0)), [persona, withCoach, today, day]);
  const other = useMemo(() => simulate(persona, !withCoach, today, Math.max(day, 0)), [persona, withCoach, today, day]);
  const shown = full.days.slice(0, day);
  const s = upto.summary;
  const o = other.summary;
  const dash = '–';

  const eventText = (e: SimEvent): string => {
    const x = !e.detail ? '' : e.kind === 'barrier' ? t(`barrier.${e.detail}` as Key) : e.kind === 'step_down' ? t(`planner.track.${e.detail}` as Key) : t(`coach.action.${e.detail}` as Key);
    return t(`replay.event.${e.kind}` as Key, { x });
  };
  const personaName = t(`replay.persona.${persona}` as Key);
  const armName = t(withCoach ? 'replay.arm.with' : 'replay.arm.without');

  const stats = (sum: typeof s) => [
    [t('replay.stat.done'), `${sum.doneTrackDays}/${Math.max(sum.possible, 0)}`],
    [t('replay.stat.longest'), String(sum.longestRun)],
    [t('replay.stat.missed'), String(sum.missedDays)],
    [t('replay.stat.resume'), sum.daysToResume === null ? dash : String(sum.daysToResume)],
    [t('replay.stat.total'), String(sum.totalDays)],
    [t('replay.stat.proposals'), String(sum.proposals)]
  ];

  return (
    <div className="space-y-4">
      <ScreenHeader title={t('replay.title')} subtitle={t('replay.subtitle')} />
      <Card tone="alert" index={0}>
        <p className="text-sm font-semibold text-forest-950" role="note">{t('replay.sim')}</p>
      </Card>

      <Card index={1} labelledBy="persona-title">
        <h2 id="persona-title" className="font-editorial text-lg text-forest-950">{t('replay.persona')}</h2>
        <div role="radiogroup" aria-labelledby="persona-title" className="mt-2 grid gap-2">
          {PERSONA_IDS.map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={persona === id}
              onClick={() => { setPersona(id); setDay(TOTAL); setPlaying(false); }}
              className={`min-h-[56px] rounded-xl border px-3 py-2 text-start transition-colors ${persona === id ? 'border-forest-800 bg-sage-50' : 'border-forest-900/15 bg-white hover:bg-forest-900/[0.03]'}`}
            >
              <span className="block text-sm font-medium text-forest-950">{t(`replay.persona.${id}` as Key)}</span>
              <span className="block text-xs text-forest-800/85">{t(`replay.persona.${id}.desc` as Key)}</span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2" role="group" aria-label={t('replay.compare')}>
          <ArmButton active={withCoach} label={t('replay.with')} onClick={() => { setWithCoach(true); setDay(TOTAL); setPlaying(false); }} />
          <ArmButton active={!withCoach} label={t('replay.without')} onClick={() => { setWithCoach(false); setDay(TOTAL); setPlaying(false); }} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => { if (playing) setPlaying(false); else { if (day >= TOTAL) setDay(0); setPlaying(true); } }}
            className="thy-btn-primary min-h-[44px] !py-2"
          >
            {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
            {playing ? t('replay.pause') : t('replay.play')}
          </button>
          <button type="button" onClick={() => { setPlaying(false); setDay(0); }} className="thy-btn-ghost min-h-[44px] !py-2">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {t('replay.restart')}
          </button>
          <span className="text-sm text-forest-800/80" aria-live="polite">{t('replay.day', { n: day, total: TOTAL })}</span>
        </div>
        <input
          type="range"
          min={0}
          max={TOTAL}
          value={day}
          aria-label={t('replay.day', { n: day, total: TOTAL })}
          onChange={(e) => { setPlaying(false); setDay(Number(e.target.value)); }}
          className="mt-3 w-full accent-forest-700"
        />
      </Card>

      <Card index={2} labelledBy="grid-title">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="grid-title" className="font-editorial text-lg text-forest-950">{t('replay.grid', { persona: personaName, arm: armName })}</h2>
          <Chip tone="warn">{t('coach.simBadge')}</Chip>
        </div>
        <div className="thy-scroll-x mt-2 overflow-x-auto" tabIndex={0} role="region" aria-label={t('replay.grid', { persona: personaName, arm: armName })}>
          <table className="w-full min-w-[340px] text-xs">
            <thead>
              <tr>
                <th scope="col" className="w-20 py-1" />
                {full.days.map((d) => (
                  <th key={d.date} scope="col" className="px-0.5 py-1 text-center font-medium text-forest-800/85">{fmtDate(d.date, { weekday: 'short' })}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TRACKS.map((track) => (
                <tr key={track} className="border-t border-forest-900/10">
                  <th scope="row" className="py-1.5 pe-1 text-start font-medium text-forest-900">{t(`planner.track.${track}` as Key)}</th>
                  {full.days.map((d, i) => {
                    const revealed = i < day;
                    const done = d.done[track];
                    return (
                      <td key={d.date} className="px-0.5 py-1 text-center">
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${!revealed ? 'bg-forest-900/[0.04] text-forest-800/40' : done ? 'bg-sage-100 text-forest-900' : 'bg-signal-amberSoft text-ochre-800'}`}
                          role="img"
                          aria-label={revealed ? t(done ? 'replay.cell.done' : 'replay.cell.missed') : t('replay.cell.notYet')}
                        >
                          {revealed ? (done ? <Check className="h-4 w-4" aria-hidden="true" /> : <Minus className="h-4 w-4" aria-hidden="true" />) : null}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-forest-800/85">{t('replay.coachNote')}</p>
      </Card>

      <Card index={3} labelledBy="events-title">
        <h2 id="events-title" className="font-editorial text-lg text-forest-950">{t('replay.title')}</h2>
        <ol className="mt-2 space-y-2">
          {shown.map((d) => (
            <li key={d.date} className="rounded-xl bg-ivory-100 px-3 py-2 text-sm">
              <p className="text-xs font-medium text-forest-800/85">{t('replay.day', { n: d.index + 1, total: TOTAL })} · {fmtDate(d.date)}</p>
              {d.events.length === 0 ? (
                <p className="text-forest-800/85">{t('replay.event.none')}</p>
              ) : (
                <ul className="mt-0.5 space-y-0.5">
                  {d.events.map((e, i) => (
                    <li key={i} className={`break-words ${e.kind === 'proposal' || e.kind === 'accepted' || e.kind === 'channel_switch' ? 'font-medium text-forest-900' : 'text-forest-900/85'}`}>{eventText(e)}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </Card>

      <Card index={4} labelledBy="sum-title">
        <h2 id="sum-title" className="font-editorial text-lg text-forest-950">{t('replay.summary')}</h2>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {[[armName, s], [t(withCoach ? 'replay.arm.without' : 'replay.arm.with'), o]].map(([label, sum], i) => (
            <div key={String(label)} className={`rounded-xl p-3 ${i === 0 ? 'bg-sage-50 ring-1 ring-sage-300' : 'bg-ivory-100'}`}>
              <p className="text-xs font-semibold text-forest-950">{String(label)}</p>
              <dl className="mt-1 space-y-1">
                {stats(sum as typeof s).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2 text-xs">
                    <dt className="text-forest-800/85">{k}</dt>
                    <dd className="font-semibold text-forest-950">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
        <h3 className="mt-4 text-sm font-medium text-forest-950">{t('replay.model.title')}</h3>
        <p className="mt-1 text-xs text-forest-800/85">{t('replay.model.body')}</p>
      </Card>
    </div>
  );
};
