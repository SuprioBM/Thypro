import React, { useEffect, useState } from 'react';
import { ChevronDown, Mic, Square } from 'lucide-react';
import type { CheckIn, CheckinStatus, Feel } from '../../domain/types';
import { useI18n, type Key } from '../../i18n';
import { useStore } from '../store';
import { Expandable, SuccessCheck } from '../ui/kit';
import { useSpeech } from './useSpeech';

const STATUSES: CheckinStatus[] = ['done', 'skipped', 'unknown'];
const FEELS: Feel[] = ['good', 'okay', 'tired', 'unwell'];
const FLAGS = ['chestPain', 'breathing', 'fainting', 'severePain', 'selfHarm'] as const;

const choiceClass = (on: boolean) =>
  `min-h-[48px] flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-editorial focus-visible:outline-offset-2 ${
    on
      ? 'border-forest-800 bg-forest-800 text-ivory-50 shadow-soft-sm'
      : 'border-forest-900/15 bg-white text-forest-900 hover:border-forest-900/35'
  }`;

export const CheckInForm: React.FC<{ existing?: CheckIn; onSaved: () => void }> = ({ existing, onSaved }) => {
  const { t, lang } = useI18n();
  const { saveCheckin } = useStore();
  const speech = useSpeech(lang);

  const [status, setStatus] = useState<CheckinStatus | undefined>(existing?.status);
  const [feel, setFeel] = useState<Feel | 'unknown'>(existing?.feel ?? 'unknown');
  const [flags, setFlags] = useState<string[]>(existing?.redFlags ?? []);
  const [flagsOpen, setFlagsOpen] = useState((existing?.redFlags.length ?? 0) > 0);
  const [glucoseOpen, setGlucoseOpen] = useState(Boolean(existing?.glucose));
  const [glucose, setGlucose] = useState(existing?.glucose ? String(existing.glucose.value) : '');
  const [note, setNote] = useState(existing?.note?.original ?? '');
  const [viaVoice, setViaVoice] = useState(existing?.input === 'voice');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const glucoseValue = glucose.trim() === '' ? undefined : Number(glucose);
  const glucoseInvalid = glucoseOpen && glucoseValue !== undefined && (!Number.isFinite(glucoseValue) || glucoseValue < 20 || glucoseValue > 600);
  const canSave = status !== undefined && !glucoseInvalid && !saving;

  useEffect(() => {
    if (!saved) return;
    const id = window.setTimeout(onSaved, 2300);
    return () => window.clearTimeout(id);
  }, [saved, onSaved]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave || !status) return;
    setSaving(true);
    try {
      await saveCheckin({
        status,
        feel,
        redFlags: flags,
        glucose: glucoseOpen && glucoseValue !== undefined ? { value: glucoseValue, source: 'meter' } : undefined,
        note,
        input: viaVoice ? 'voice' : 'text'
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 py-6 text-center">
        <SuccessCheck />
        <p className="font-editorial text-xl text-forest-950">{t('checkin.saved')}</p>
        <p className="text-sm text-forest-900/75">{t('checkin.savedBody')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <p className="text-xs text-forest-800/65">{t('checkin.timeHint')}</p>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-forest-950">{t('checkin.qStatus')}</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={status === s}
              onClick={() => setStatus(s)}
              className={choiceClass(status === s)}
            >
              {t(`checkin.status.${s}` as Key)}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-forest-950">{t('checkin.qFeel')}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup">
          {FEELS.map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={feel === f}
              onClick={() => setFeel(feel === f ? 'unknown' : f)}
              className={choiceClass(feel === f)}
            >
              {t(`checkin.feel.${f}` as Key)}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <button
          type="button"
          aria-expanded={flagsOpen}
          aria-controls="flags-panel"
          onClick={() => setFlagsOpen((o) => !o)}
          className="flex min-h-[44px] w-full items-center justify-between rounded-xl px-1 text-start text-sm font-semibold text-forest-950"
        >
          <span>
            {t('checkin.qFlags')} <span className="font-normal text-forest-800/60">({t('common.optional')})</span>
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${flagsOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
        <Expandable open={flagsOpen} id="flags-panel">
          <fieldset className="space-y-1 pb-1 pt-1">
            <legend className="sr-only">{t('checkin.qFlags')}</legend>
            {FLAGS.map((f) => (
              <label key={f} className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl px-2 hover:bg-forest-900/[0.04]">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-forest-700"
                  checked={flags.includes(f)}
                  tabIndex={flagsOpen ? 0 : -1}
                  onChange={(e) => setFlags((cur) => (e.target.checked ? [...cur, f] : cur.filter((x) => x !== f)))}
                />
                <span className="text-sm text-forest-950">{t(`checkin.flag.${f}` as Key)}</span>
              </label>
            ))}
          </fieldset>
        </Expandable>
      </div>

      <div>
        <button
          type="button"
          aria-expanded={glucoseOpen}
          aria-controls="glucose-panel"
          onClick={() => setGlucoseOpen((o) => !o)}
          className="flex min-h-[44px] w-full items-center justify-between rounded-xl px-1 text-start text-sm font-semibold text-forest-950"
        >
          <span>
            {t('checkin.qGlucose')} <span className="font-normal text-forest-800/60">({t('common.optional')})</span>
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${glucoseOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
        <Expandable open={glucoseOpen} id="glucose-panel">
          <div className="space-y-1 px-1 pb-1 pt-1">
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={glucose}
                tabIndex={glucoseOpen ? 0 : -1}
                onChange={(e) => setGlucose(e.target.value.replace(/[^\d.]/g, ''))}
                aria-label={t('checkin.qGlucose')}
                aria-invalid={glucoseInvalid}
                aria-describedby="glucose-hint"
                className="min-h-[44px] w-28 rounded-xl border border-forest-900/20 bg-white px-3 text-base text-forest-950"
              />
              <span className="text-sm text-forest-800/70">mg/dL</span>
            </div>
            <p id="glucose-hint" className={`text-xs ${glucoseInvalid ? 'font-medium text-signal-crimson' : 'text-forest-800/65'}`}>
              {glucoseInvalid ? t('checkin.glucoseInvalid') : t('checkin.glucoseHint')}
            </p>
          </div>
        </Expandable>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <label htmlFor="checkin-note" className="text-sm font-semibold text-forest-950">
            {t('checkin.qNote')} <span className="font-normal text-forest-800/60">({t('common.optional')})</span>
          </label>
          {speech.supported && (
            <button
              type="button"
              onClick={() => {
                if (speech.listening) speech.stop();
                else
                  speech.start((text) => {
                    setNote((n) => (n ? `${n} ${text}` : text));
                    setViaVoice(true);
                  });
              }}
              aria-pressed={speech.listening}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors ${
                speech.listening ? 'border-signal-crimson bg-signal-crimsonSoft text-signal-crimson' : 'border-forest-900/20 text-forest-900 hover:bg-forest-900/5'
              }`}
            >
              {speech.listening ? <Square className="h-4 w-4" aria-hidden="true" /> : <Mic className="h-4 w-4" aria-hidden="true" />}
              {speech.listening ? t('voice.stop') : t('voice.start')}
            </button>
          )}
        </div>
        <textarea
          id="checkin-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('checkin.notePlaceholder')}
          className="w-full rounded-xl border border-forest-900/20 bg-white p-3 text-base text-forest-950"
        />
        <p className="mt-1 text-xs text-forest-800/65" aria-live="polite">
          {speech.supported
            ? speech.listening
              ? t('voice.listening')
              : speech.failed
                ? t('voice.error')
                : t('voice.notice')
            : t('voice.unsupported')}
        </p>
      </div>

      <button type="submit" disabled={!canSave} className="thy-btn-primary min-h-[48px] w-full">
        {t('checkin.save')}
      </button>
    </form>
  );
};
