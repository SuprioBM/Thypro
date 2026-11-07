import React, { useState } from 'react';
import { Bell, ChevronRight } from 'lucide-react';
import { restartState, weeklyStats } from '../../domain/week';
import { resolvePlanItem } from '../../plan/templates';
import { evaluateCheckin } from '../../safety/engine';
import { useI18n, type Key } from '../../i18n';
import { CheckInForm } from '../components/CheckInForm';
import { EscalationCard } from '../components/EscalationCard';
import { RestartCard } from '../components/RestartCard';
import { go } from '../router';
import { useStore } from '../store';
import { Card, Chip, Ring } from '../ui/kit';

export const Today: React.FC = () => {
  const { t, lang, fmtDate } = useI18n();
  const { state, today, activePlan, blocked, restartPlan } = useStore();
  const [dismissedRestart, setDismissedRestart] = useState(false);
  const todayCheckin = state.checkins.find((c) => c.date === today);
  const [editing, setEditing] = useState(!todayCheckin);

  const week = weeklyStats(state.checkins, today);
  const restart = restartState(state.checkins, today);
  const escalation = todayCheckin
    ? evaluateCheckin(todayCheckin, state.checkins.filter((c) => c.date !== today))
    : null;
  const firstItem = activePlan ? resolvePlanItem(activePlan, activePlan.items[0], lang) : null;
  const nextReminder = state.reminders.find((r) => r.enabled);
  const name = state.profile.displayName;

  return (
    <div className="space-y-4">
      <div className="mb-1">
        <h1 id="screen-title" className="font-editorial text-2xl text-forest-950 sm:text-3xl">
          {name ? t('today.greeting', { name }) : t('today.greetingAnon')}
        </h1>
        <p className="mt-1 text-sm text-forest-900/70">{fmtDate(today, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {escalation && <EscalationCard decision={escalation} contact={state.profile.familyContact} />}

      {blocked && (
        <Card tone="alert" labelledBy="blocked-title">
          <h2 id="blocked-title" className="font-editorial text-lg text-forest-950">
            {t('today.blockedTitle')}
          </h2>
          <p className="mt-1 text-sm text-forest-900/85">{t('today.blockedBody')}</p>
          <button type="button" className="thy-btn-primary mt-3 min-h-[44px] !py-2.5" onClick={() => go('clinician')}>
            {t('today.blockedCta')}
          </button>
        </Card>
      )}

      {!blocked && activePlan && restart.needed && !dismissedRestart && (
        <RestartCard
          days={restart.daysSince}
          canRestart={!activePlan.restart}
          onRestart={restartPlan}
          onLater={() => setDismissedRestart(true)}
        />
      )}

      <Card index={1} labelledBy="week-title">
        <div className="flex items-center gap-5">
          <Ring value={week.fill} size={104} label={t('review.ringLabel', { done: week.done })}>
            <span className="font-editorial text-3xl leading-none text-forest-950">{week.done}</span>
            <span className="text-[11px] text-forest-800/65">/ 7</span>
          </Ring>
          <div className="min-w-0">
            <h2 id="week-title" className="font-editorial text-lg text-forest-950">
              {t('today.week')}
            </h2>
            <p className="text-sm text-forest-900/75">{t('today.weekCount', { done: week.done })}</p>
            <button type="button" onClick={() => go('review')} className="mt-1 inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-ochre-700 hover:underline">
              {t('review.title')}
              <ChevronRight className="h-4 w-4 flip-rtl" aria-hidden="true" />
            </button>
          </div>
        </div>
      </Card>

      <Card index={2} labelledBy="checkin-title">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 id="checkin-title" className="font-editorial text-lg text-forest-950">
            {t('checkin.title')}
          </h2>
          {todayCheckin && !editing && <Chip tone="good">{t(`checkin.status.${todayCheckin.status}` as Key)}</Chip>}
        </div>

        {editing || !todayCheckin ? (
          <CheckInForm existing={todayCheckin} onSaved={() => setEditing(false)} />
        ) : (
          <div className="space-y-3">
            {todayCheckin.feel !== 'unknown' && (
              <div className="flex flex-wrap gap-2">
                <Chip>{t(`checkin.feel.${todayCheckin.feel}` as Key)}</Chip>
              </div>
            )}
            {todayCheckin.note && (
              <div className="rounded-xl bg-ivory-100 p-3 text-sm text-forest-950">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-forest-800/60">{t('checkin.original')}</p>
                <p className="mt-0.5 whitespace-pre-wrap">{todayCheckin.note.original}</p>
                {todayCheckin.note.translation ? (
                  <>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-forest-800/60">{t('checkin.translated')}</p>
                    <p className="mt-0.5 whitespace-pre-wrap">{todayCheckin.note.translation.text}</p>
                  </>
                ) : (
                  todayCheckin.note.lang !== 'en' && <p className="mt-2 text-xs text-forest-800/65">{t('checkin.translationUnavailable')}</p>
                )}
              </div>
            )}
            <button type="button" onClick={() => setEditing(true)} className="thy-btn-ghost min-h-[44px] !py-2.5">
              {t('checkin.change')}
            </button>
          </div>
        )}
      </Card>

      <Card index={3} labelledBy="plan-today-title">
        <h2 id="plan-today-title" className="font-editorial text-lg text-forest-950">
          {t('today.plan')}
        </h2>
        {blocked ? (
          <p className="mt-1 text-sm text-forest-900/75">{t('today.blockedBody')}</p>
        ) : firstItem && activePlan ? (
          <>
            <p className="mt-2 text-sm text-forest-950">{firstItem.title}</p>
            <button type="button" onClick={() => go('plan')} className="mt-2 inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-ochre-700 hover:underline">
              {t('today.viewPlan')}
              <ChevronRight className="h-4 w-4 flip-rtl" aria-hidden="true" />
            </button>
          </>
        ) : (
          <div className="mt-1">
            <p className="text-sm font-medium text-forest-950">{t('today.noPlanTitle')}</p>
            <p className="text-sm text-forest-900/75">{t('today.noPlanBody')}</p>
            <button type="button" onClick={() => go('setup')} className="thy-btn-primary mt-3 min-h-[44px] !py-2.5">
              {t('today.setup')}
            </button>
          </div>
        )}
        <div className="mt-3 flex items-center gap-2 border-t border-forest-900/10 pt-3 text-xs text-forest-800/70">
          <Bell className="h-4 w-4" aria-hidden="true" />
          {nextReminder ? t('today.nextReminder', { time: nextReminder.time }) : t('today.noReminder')}
        </div>
      </Card>
    </div>
  );
};
