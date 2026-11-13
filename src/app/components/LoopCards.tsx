import React, { useEffect, useState } from 'react';
import {
  BatteryLow,
  Briefcase,
  Check,
  Clock,
  Plane,
  Sprout,
  Thermometer,
  TrendingUp,
  Users,
  Wallet,
  Zap
} from 'lucide-react';
import { BARRIERS, type Adaptation, type Barrier } from '../../domain/types';
import { useI18n, type Key, type TFn } from '../../i18n';
import { Card } from '../ui/kit';

export const BARRIER_ICONS: Record<Barrier, typeof Clock> = {
  time: Clock,
  tired: BatteryLow,
  sick: Thermometer,
  travel: Plane,
  shift: Briefcase,
  motivation: Zap,
  cost: Wallet,
  family: Users
};

/** One tap: "What got in the way?" Shown once per lapse; skipping is always fine. */
export const BarrierCard: React.FC<{
  missedDays: number;
  picture: boolean;
  onAnswer: (b: Barrier) => void;
  onSkip: () => void;
}> = ({ missedDays, picture, onAnswer, onSkip }) => {
  const { t } = useI18n();
  return (
    <Card tone="soft" className="border-sage-300" labelledBy="barrier-title">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-100 text-forest-700">
          <Sprout className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="barrier-title" className="font-editorial text-lg text-forest-950">
            {t('barrier.title')}
          </h2>
          <p className="mt-1 text-sm text-forest-900/80">
            {t('today.restartBody', { days: missedDays })} {t('barrier.body')}
          </p>
          <div className={`mt-3 grid gap-2 ${picture ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-4'}`} role="group" aria-labelledby="barrier-title">
            {BARRIERS.map((b) => {
              const Icon = BARRIER_ICONS[b];
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => onAnswer(b)}
                  className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-forest-900/15 bg-white px-3 text-sm font-medium text-forest-900 transition-all duration-200 ease-editorial hover:-translate-y-px hover:border-forest-800 hover:shadow-soft-sm ${
                    picture ? 'flex-col py-3' : 'py-2'
                  }`}
                >
                  <Icon className={picture ? 'h-7 w-7 text-ochre-700' : 'h-4 w-4 text-ochre-700'} aria-hidden="true" />
                  {t(`barrier.${b}` as Key)}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={onSkip} className="mt-2 min-h-[44px] text-sm text-forest-800/75 underline-offset-2 hover:underline">
            {t('barrier.skip')}
          </button>
        </div>
      </div>
    </Card>
  );
};

export function proposalText(t: TFn, a: Adaptation): string {
  const channel = (id: string) => (`channel.${id}` as Key);
  switch (a.action) {
    case 'switch_channel':
      return t('proposal.switch_channel', { from: t(channel(a.from)), to: t(channel(a.to)) });
    case 'shrink':
    case 'move_time':
      return t(`proposal.${a.action}`, { from: a.from, to: a.to });
    default:
      return t(`proposal.${a.action}` as Key);
  }
}

export const ProposalCard: React.FC<{
  barrier: Barrier;
  items: Adaptation[];
  onApply: (index: number) => void;
  onKeep: () => void;
}> = ({ barrier, items, onApply, onKeep }) => {
  const { t } = useI18n();
  return (
    <Card labelledBy="proposal-title">
      <h2 id="proposal-title" className="font-editorial text-lg text-forest-950">
        {t('proposal.title')}
      </h2>
      {barrier === 'sick' && <p className="mt-1 text-sm text-forest-900/80">{t('barrier.sickNote')}</p>}
      <ul className="mt-3 space-y-2">
        {items.map((a, i) => (
          <li key={`${a.action}-${i}`} className="stagger-in flex flex-wrap items-center justify-between gap-2 rounded-xl bg-ivory-100 p-3" style={{ animationDelay: `${i * 80}ms` }}>
            <span className="text-sm text-forest-950">{proposalText(t, a)}</span>
            <button type="button" onClick={() => onApply(i)} className="thy-btn-primary min-h-[44px] !px-4 !py-2">
              <Check className="h-4 w-4" aria-hidden="true" />
              {t('proposal.apply')}
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onKeep} className="thy-btn-ghost mt-3 min-h-[44px] !py-2">
        {t('proposal.keep')}
      </button>
    </Card>
  );
};

/**
 * The ladder as a small staircase. On a change, the marker glides from the old
 * step to the new one. Framed as a step, never as a failure.
 */
export const LadderSteps: React.FC<{ level: number; max: number; from?: number; label: string }> = ({ level, max, from, label }) => {
  const [shown, setShown] = useState(from ?? level);
  useEffect(() => {
    const id = window.setTimeout(() => setShown(level), 350);
    return () => window.clearTimeout(id);
  }, [level]);
  return (
    <div className="flex items-end gap-1.5" role="img" aria-label={label}>
      {Array.from({ length: max }, (_, i) => {
        const step = i + 1;
        const active = step === shown;
        return (
          <span
            key={step}
            className={`relative w-7 rounded-t-md transition-colors duration-500 ease-editorial ${active ? 'bg-ochre-500' : step < shown ? 'bg-sage-300' : 'bg-forest-900/10'}`}
            style={{ height: `${12 + step * 10}px` }}
          >
            {active && <span aria-hidden="true" className="absolute -top-2.5 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-forest-800 animate-pop-ring" />}
          </span>
        );
      })}
    </div>
  );
};

export const LevelChangeCard: React.FC<{ kind: 'down' | 'up'; from: number; to: number; max: number }> = ({ kind, from, to, max }) => {
  const { t } = useI18n();
  return (
    <Card tone="soft" className="border-ochre-300/70" labelledBy="level-title">
      <div className="flex items-start gap-4">
        <LadderSteps level={to} from={from} max={max} label={t('ladder.level', { n: to, max })} />
        <div className="min-w-0">
          <h2 id="level-title" className="font-editorial text-lg text-forest-950">
            {kind === 'down' ? t('ladder.downTitle') : t('ladder.upDone', { to })}
          </h2>
          {kind === 'down' && <p className="mt-1 text-sm text-forest-900/80">{t('ladder.downBody', { from, to })}</p>}
        </div>
      </div>
    </Card>
  );
};

export const StepUpCard: React.FC<{ done: number; to: number; onAccept: () => void; onDecline: () => void }> = ({
  done,
  to,
  onAccept,
  onDecline
}) => {
  const { t } = useI18n();
  return (
    <Card labelledBy="stepup-title">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ochre-100 text-ochre-800">
          <TrendingUp className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id="stepup-title" className="font-editorial text-lg text-forest-950">
            {t('ladder.upTitle')}
          </h2>
          <p className="mt-1 text-sm text-forest-900/80">{t('ladder.upBody', { done, to })}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="thy-btn-primary min-h-[44px] !py-2.5" onClick={onAccept}>
              {t('ladder.upAccept')}
            </button>
            <button type="button" className="thy-btn-ghost min-h-[44px] !py-2.5" onClick={onDecline}>
              {t('ladder.upDecline')}
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};

const MILESTONES = [7, 14, 30, 60, 100];

export const TotalDays: React.FC<{ total: number }> = ({ total }) => {
  const { t } = useI18n();
  const milestone = [...MILESTONES].reverse().find((m) => total >= m);
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-forest-800/70">{t('review.totalTitle')}</p>
      <p className="mt-1 font-editorial text-2xl text-forest-950">{t('ladder.total', { n: total })}</p>
      <p className="mt-0.5 text-xs text-forest-800/70">{t('ladder.totalNote')}</p>
      {milestone && <p className="mt-2 inline-flex rounded-full bg-ochre-100 px-3 py-1 text-xs font-medium text-ochre-800">{t('ladder.milestone', { n: milestone })}</p>}
    </div>
  );
};
