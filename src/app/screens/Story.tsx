import React, { useEffect, useMemo, useState } from 'react';
import { BellRing, Check, Clock, Minus, Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import { cumulativeDays } from '../../domain/ladder';
import { weeklyStats } from '../../domain/week';
import { maxLevel } from '../../plan/templates';
import { buildStory, replayTo } from '../../scenario/week';
import { reasonText, useI18n, type Key } from '../../i18n';
import { LadderSteps } from '../components/LoopCards';
import { useStore } from '../store';
import { Card, Chip, Ring, ScreenHeader } from '../ui/kit';

const STEP_MS = 1700;

/**
 * Replays an invented person's week through the real reducer and rules.
 * The person's state is local to this screen: it never touches the visitor's own demo data.
 */
export const Story: React.FC = () => {
  const { t, fmtDate } = useI18n();
  const { today } = useStore();
  const story = useMemo(() => buildStory(today), [today]);
  const [day, setDay] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    if (day >= story.days.length) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => setDay((d) => d + 1), STEP_MS);
    return () => window.clearTimeout(id);
  }, [playing, day, story.days.length]);

  const states = useMemo(() => Array.from({ length: story.days.length + 1 }, (_, n) => replayTo(story, n)), [story]);
  const now = states[day];
  const lastDate = day > 0 ? story.days[day - 1].date : story.days[0].date;
  const week = weeklyStats(now.checkins, lastDate);
  const max = maxLevel('walk');
  const prevLevel = day > 0 ? states[day - 1].progress.level : now.progress.level;

  const replay = () => {
    setDay(0);
    setPlaying(true);
  };

  return (
    <div className="space-y-4">
      <ScreenHeader title={t('story.title')} subtitle={t('story.intro')} />
      <Chip tone="warn">{t('story.synthetic')}</Chip>

      <Card index={0} className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={replay} className="thy-btn-accent min-h-[48px]">
          <Play className="h-4 w-4" aria-hidden="true" />
          {t('story.replay')}
        </button>
        {playing ? (
          <button type="button" onClick={() => setPlaying(false)} className="thy-btn-ghost min-h-[48px]">
            <Pause className="h-4 w-4" aria-hidden="true" />
            {t('story.pause')}
          </button>
        ) : (
          <button type="button" disabled={day >= story.days.length} onClick={() => setDay((d) => Math.min(d + 1, story.days.length))} className="thy-btn-ghost min-h-[48px]">
            <SkipForward className="h-4 w-4 flip-rtl" aria-hidden="true" />
            {t('story.step')}
          </button>
        )}
        <button type="button" onClick={() => { setPlaying(false); setDay(0); }} className="thy-btn-quiet min-h-[48px]">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {t('story.reset')}
        </button>
      </Card>

      <Card index={1}>
        <div className="flex flex-wrap items-center gap-5">
          <Ring value={week.fill} size={104} label={t('review.ringLabel', { done: week.done })}>
            <span className="font-editorial text-3xl leading-none text-forest-950">{week.done}</span>
            <span dir="ltr" className="text-[11px] text-forest-800/65">/ 7</span>
          </Ring>
          <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-forest-800/70">{t('story.levelNow')}</dt>
              <dd className="mt-1">
                <LadderSteps key={now.progress.level} level={now.progress.level} from={prevLevel} max={max} label={t('ladder.level', { n: now.progress.level, max })} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-forest-800/70">{t('story.timeNow')}</dt>
              <dd className="mt-1 flex items-center gap-1.5 font-editorial text-xl text-forest-950">
                <Clock className="h-4 w-4 text-ochre-700" aria-hidden="true" />
                {now.setup?.usualTime}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-forest-800/70">{t('story.channelNow')}</dt>
              <dd className="mt-1">
                <Chip tone="info">
                  <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
                  {t(`channel.${now.prefs.preferredChannel}` as Key)}
                </Chip>
              </dd>
            </div>
            <div className="col-span-2 text-forest-800">{t('ladder.total', { n: cumulativeDays(now.checkins) })}</div>
          </dl>
        </div>
      </Card>

      <ol className="space-y-2" aria-live="polite">
        {story.days.slice(0, day).map((d, i) => {
          const before = states[i];
          const after = states[i + 1];
          const checkin = after.checkins.find((c) => c.date === d.date);
          const adaptations = after.audit.slice(before.audit.length).filter((a) => a.kind === 'adaptation');
          const delivered = after.deliveryLog.slice(before.deliveryLog.length);
          const barrier = d.events.find((e) => e.kind === 'barrier');
          return (
            <Card as="li" key={d.date} index={0} className="!p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-editorial text-base text-forest-950">{fmtDate(d.date, { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                <span className="flex flex-wrap gap-1.5">
                  {delivered.map((x) => (
                    <Chip key={x.id}>
                      <BellRing className="h-3 w-3" aria-hidden="true" />
                      {t(`channel.${x.channel}` as Key)}
                    </Chip>
                  ))}
                </span>
              </div>
              <ul className="mt-1.5 space-y-1 text-sm">
                {adaptations.map((a) => (
                  <li key={a.id} className="stagger-in flex items-start gap-2 rounded-lg bg-ochre-50 px-2.5 py-1.5 text-forest-950">
                    <span aria-hidden="true">↘</span>
                    {reasonText(t, a.reasonCode, a.reasonParams)}
                  </li>
                ))}
                {barrier && barrier.kind === 'barrier' && (
                  <li className="flex items-start gap-2 text-forest-900/85">
                    {t('story.e.barrier', { barrier: t(`barrier.${barrier.barrier}` as Key) })}
                  </li>
                )}
                <li className="flex items-center gap-2 text-forest-900/85">
                  {checkin?.status === 'done' ? (
                    <Check className="h-4 w-4 text-forest-700" aria-hidden="true" />
                  ) : (
                    <Minus className="h-4 w-4 text-ochre-700" aria-hidden="true" />
                  )}
                  {checkin ? (checkin.status === 'done' ? t('story.e.done') : t('story.e.skipped')) : t('story.e.missing')}
                </li>
              </ul>
            </Card>
          );
        })}
      </ol>

      {day >= story.days.length && <Card tone="soft" className="route-in text-sm font-medium text-forest-950">{t('story.end')}</Card>}
    </div>
  );
};
