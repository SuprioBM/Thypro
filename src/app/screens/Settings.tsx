import React, { useState } from 'react';
import { Accessibility, BellRing, Database, Moon, Target, UserRound, Users, Volume2 } from 'lucide-react';
import { CHANNEL_IDS, type AgeGroup, type ChannelId, type Gender, type UserPrefs } from '../../domain/types';
import { maxLevel } from '../../plan/templates';
import { useI18n, type Key } from '../../i18n';
import { go } from '../router';
import { canSpeak } from '../speech';
import { useStore } from '../store';
import { Card, Chip, ScreenHeader, Switch } from '../ui/kit';

const GENDERS: Gender[] = ['female', 'male', 'other', 'prefer_not'];
const AGES: AgeGroup[] = ['18-29', '30-44', '45-59', '60+', 'prefer_not'];

const seg = (on: boolean) =>
  `min-h-[44px] rounded-xl border px-3.5 text-sm font-medium transition-colors ${
    on ? 'border-forest-800 bg-forest-800 text-ivory-50' : 'border-forest-900/15 bg-white text-forest-900 hover:border-forest-900/35'
  }`;

const Section: React.FC<{ icon: typeof Target; title: string; index: number; children: React.ReactNode }> = ({ icon: Icon, title, index, children }) => {
  const id = `set-${index}`;
  return (
    <Card index={index} labelledBy={id} className="space-y-3">
      <h2 id={id} className="flex items-center gap-2 font-editorial text-lg text-forest-950">
        <Icon className="h-5 w-5 text-ochre-700" aria-hidden="true" />
        {title}
      </h2>
      {children}
    </Card>
  );
};

export const Settings: React.FC = () => {
  const { t } = useI18n();
  const store = useStore();
  const { state, setPrefs } = store;
  const p = state.prefs;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const shareCount =
    (state.profile.familyContact && Object.values(state.consent).some(Boolean) ? 1 : 0) +
    state.people.filter((x) => Object.values(x.consent).some(Boolean)).length;

  const setChannel = (c: ChannelId, on: boolean) => {
    const channels = { ...p.channels, [c]: on };
    const patch: Partial<UserPrefs> = { channels };
    // Keep the preferred channel pointing at something switched on.
    if (!on && p.preferredChannel === c) patch.preferredChannel = CHANNEL_IDS.find((x) => channels[x]) ?? p.preferredChannel;
    setPrefs(patch);
  };

  return (
    <div className="space-y-4">
      <ScreenHeader title={t('settings.title')} subtitle={t('settings.intro')} />

      <Section icon={Target} title={t('settings.goal')} index={0}>
        {state.setup ? (
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="info">{t(`goal.${state.setup.goalType}` as Key)}</Chip>
            <Chip>{t('ladder.level', { n: state.progress.level, max: maxLevel(state.setup.goalType) })}</Chip>
          </div>
        ) : (
          <p className="text-sm text-forest-900/75">{t('today.noPlanTitle')}</p>
        )}
        <button type="button" className="thy-btn-ghost min-h-[44px] !py-2" onClick={() => go('setup')}>
          {t('settings.goalEdit')}
        </button>
      </Section>

      <Section icon={Moon} title={t('settings.quiet')} index={1}>
        <Switch checked={p.quietHours.enabled} onChange={(v) => setPrefs({ quietHours: { ...p.quietHours, enabled: v } })} label={t('settings.quietOn')} />
        <div className="flex flex-wrap items-center gap-3">
          {(['start', 'end'] as const).map((k) => (
            <label key={k} className="flex items-center gap-2 text-sm text-forest-950">
              {k === 'start' ? t('settings.from') : t('settings.to')}
              <input
                type="time"
                value={p.quietHours[k]}
                disabled={!p.quietHours.enabled}
                onChange={(e) => e.target.value && setPrefs({ quietHours: { ...p.quietHours, [k]: e.target.value } })}
                className="min-h-[44px] rounded-xl border border-forest-900/20 bg-white px-3 text-base disabled:bg-ivory-200"
              />
            </label>
          ))}
        </div>
      </Section>

      <Section icon={BellRing} title={t('settings.channels')} index={2}>
        <div className="divide-y divide-forest-900/8">
          {CHANNEL_IDS.map((c) => (
            <Switch key={c} checked={p.channels[c]} onChange={(v) => setChannel(c, v)} label={t(`channel.${c}` as Key)} />
          ))}
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-forest-950">{t('settings.preferred')}</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {CHANNEL_IDS.filter((c) => p.channels[c]).map((c) => (
              <button key={c} type="button" role="radio" aria-checked={p.preferredChannel === c} onClick={() => setPrefs({ preferredChannel: c })} className={seg(p.preferredChannel === c)}>
                {t(`channel.${c}` as Key)}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-forest-950">{t('settings.frequency')}</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {(['daily', 'weekdays', 'off'] as const).map((f) => (
              <button key={f} type="button" role="radio" aria-checked={p.frequency === f} onClick={() => setPrefs({ frequency: f })} className={seg(p.frequency === f)}>
                {t(`settings.freq.${f}` as Key)}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-forest-950">{t('settings.tone')}</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {(['neutral', 'encouraging'] as const).map((tone) => (
              <button key={tone} type="button" role="radio" aria-checked={p.tone === tone} onClick={() => setPrefs({ tone })} className={seg(p.tone === tone)}>
                {t(`settings.tone.${tone}` as Key)}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="thy-btn-ghost min-h-[44px] !py-2"
            onClick={() => store.speakText(t(p.tone === 'encouraging' ? 'rem.messageWarm' : 'rem.message', { goal: state.setup ? t(`goal.${state.setup.goalType}` as Key) : t('rem.noGoal') }))}
            disabled={!canSpeak()}
          >
            <Volume2 className="h-4 w-4" aria-hidden="true" />
            {t('rem.voiceSample')}
          </button>
          {!canSpeak() && <span className="text-xs text-forest-800/70">{t('rem.voiceUnsupported')}</span>}
        </div>
      </Section>

      <Section icon={Users} title={t('settings.sharing')} index={3}>
        <p className="text-sm text-forest-900/80">{t('settings.sharingCount', { n: shareCount })}</p>
        <button type="button" className="thy-btn-ghost min-h-[44px] !py-2" onClick={() => go('family')}>
          {t('settings.manageSharing')}
        </button>
      </Section>

      <Section icon={Accessibility} title={t('settings.display')} index={4}>
        <div className="divide-y divide-forest-900/8">
          <Switch checked={p.voiceFirst} onChange={(v) => setPrefs({ voiceFirst: v })} label={t('settings.voiceFirst')} hint={t('settings.voiceFirstHint')} />
          <Switch checked={p.largeText} onChange={(v) => setPrefs({ largeText: v })} label={t('settings.largeText')} />
          <Switch checked={p.pictureMode} onChange={(v) => setPrefs({ pictureMode: v })} label={t('settings.pictureMode')} hint={t('settings.pictureHint')} />
        </div>
      </Section>

      <Section icon={UserRound} title={t('settings.about')} index={5}>
        <p className="text-xs text-forest-800/70">{t('settings.aboutHint')}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-forest-950">
            <span className="mb-1 block font-medium">{t('settings.gender')}</span>
            <select
              value={state.profile.demographics?.gender ?? ''}
              onChange={(e) => store.setDemographics({ ...state.profile.demographics, gender: (e.target.value || undefined) as Gender | undefined })}
              className="min-h-[44px] w-full rounded-xl border border-forest-900/20 bg-white px-3"
            >
              <option value="">—</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g === 'prefer_not' ? t('common.preferNot') : t(`gender.${g}` as Key)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-forest-950">
            <span className="mb-1 block font-medium">{t('settings.age')}</span>
            <select
              value={state.profile.demographics?.ageGroup ?? ''}
              onChange={(e) => store.setDemographics({ ...state.profile.demographics, ageGroup: (e.target.value || undefined) as AgeGroup | undefined })}
              className="min-h-[44px] w-full rounded-xl border border-forest-900/20 bg-white px-3"
            >
              <option value="">—</option>
              {AGES.map((a) => (
                <option key={a} value={a}>
                  {a === 'prefer_not' ? t('common.preferNot') : a}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Section>

      <Section icon={Database} title={t('settings.data')} index={6}>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="thy-btn-ghost min-h-[44px] !py-2" onClick={() => go('export')}>
            {t('settings.export')}
          </button>
          {!confirmDelete && (
            <button type="button" className="thy-btn min-h-[44px] border border-signal-crimson/40 px-4 !py-2 text-signal-crimson hover:bg-signal-crimsonSoft" onClick={() => { setDeleted(false); setConfirmDelete(true); }}>
              {t('settings.delete')}
            </button>
          )}
        </div>
        {state.mode === 'guest' && <p className="text-xs text-forest-800/70">{t('settings.deleteGuest')}</p>}
        {confirmDelete && (
          <div role="alertdialog" aria-labelledby="del-q" className="rounded-xl border border-signal-crimson/30 bg-signal-crimsonSoft p-3">
            <p id="del-q" className="text-sm text-forest-950">{t('settings.deleteConfirm')}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="thy-btn min-h-[44px] bg-signal-crimson px-4 !py-2 text-white"
                onClick={() => {
                  store.deleteData();
                  setConfirmDelete(false);
                  setDeleted(true);
                }}
              >
                {t('settings.deleteYes')}
              </button>
              <button type="button" className="thy-btn-ghost min-h-[44px] !py-2" onClick={() => setConfirmDelete(false)}>
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}
        {deleted && <p role="status" className="text-sm text-forest-800">{t('settings.deleted')}</p>}
      </Section>
    </div>
  );
};
