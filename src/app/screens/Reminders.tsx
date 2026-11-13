import React from 'react';
import { BellRing, SlidersHorizontal } from 'lucide-react';
import { useI18n, type Key } from '../../i18n';
import { go } from '../router';
import { useStore } from '../store';
import { Card, Chip, EmptyState, ScreenHeader, Switch } from '../ui/kit';

export const Reminders: React.FC = () => {
  const { t, fmtDateTime } = useI18n();
  const { state, setReminderEnabled, setReminderTime, sendTestReminder } = useStore();
  const log = [...state.deliveryLog].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 30);

  return (
    <div className="space-y-4">
      <ScreenHeader title={t('rem.title')} />

      <Card index={0} className="space-y-3">
        {state.reminders.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor={`rem-time-${r.id}`} className="text-sm font-medium text-forest-950">
                {t('rem.time')}
              </label>
              <input
                id={`rem-time-${r.id}`}
                type="time"
                value={r.time}
                onChange={(e) => e.target.value && setReminderTime(r.id, e.target.value)}
                className="min-h-[48px] rounded-xl border border-forest-900/20 bg-white px-3 text-base text-forest-950"
              />
            </div>
            <div className="min-w-[10rem] flex-1">
              <Switch checked={r.enabled} onChange={(v) => setReminderEnabled(r.id, v)} label={t('rem.on')} />
            </div>
          </div>
        ))}
        <button type="button" onClick={sendTestReminder} className="thy-btn-primary min-h-[48px] w-full sm:w-auto">
          <BellRing className="h-4 w-4" aria-hidden="true" />
          {t('rem.sendTest')}
        </button>
        <p className="text-xs text-forest-800/70">{t('rem.channelNote')}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="info">{t(`channel.${state.prefs.preferredChannel}` as Key)}</Chip>
          {state.prefs.quietHours.enabled && (
            <Chip>{`${t('settings.quiet')}: ${state.prefs.quietHours.start}–${state.prefs.quietHours.end}`}</Chip>
          )}
          <button type="button" onClick={() => go('settings')} className="thy-btn-quiet min-h-[44px]">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            {t('nav.settings')}
          </button>
        </div>
      </Card>

      <Card index={1} labelledBy="log-title">
        <h2 id="log-title" className="mb-2 font-editorial text-lg text-forest-950">{t('rem.logTitle')}</h2>
        {log.length === 0 ? (
          <EmptyState title={t('rem.logEmpty')} />
        ) : (
          <ul className="divide-y divide-forest-900/8">
            {log.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span className="text-forest-950">{fmtDateTime(e.at)}</span>
                <span className="flex flex-wrap items-center gap-1.5">
                  <Chip tone={e.status === 'delivered' ? 'good' : e.status === 'suppressed' ? 'neutral' : 'bad'}>
                    {e.status === 'delivered' ? t('rem.delivered') : e.status === 'suppressed' ? t('rem.suppressed') : t('rem.failed')}
                  </Chip>
                  {e.status === 'suppressed' && e.reason && <Chip>{t(`rem.reason.${e.reason}` as Key)}</Chip>}
                  {e.channel !== 'none' && <Chip>{t(`channel.${e.channel}` as Key)}</Chip>}
                  {e.simulated && <Chip tone="warn">{t('rem.simulated')}</Chip>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};
