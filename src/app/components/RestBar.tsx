import React, { useEffect, useRef, useState } from 'react';
import { Plus, SkipForward } from 'lucide-react';
import { useI18n } from '../../i18n';

/**
 * Rest countdown, pinned above the bottom bar. Time is measured from a fixed
 * end timestamp, so a throttled background tab still shows the right number.
 */
export const RestBar: React.FC<{
  endsAt: number;
  total: number;
  onSkip: () => void;
  onAdd: (seconds: number) => void;
  /** Fires once when the countdown reaches zero (speech, vibration). */
  onOver: () => void;
}> = ({ endsAt, total, onSkip, onAdd, onOver }) => {
  const { t } = useI18n();
  const [now, setNow] = useState(() => Date.now());
  const fired = useRef(false);

  useEffect(() => {
    fired.current = false;
  }, [endsAt]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const left = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const over = left === 0;
  useEffect(() => {
    if (over && !fired.current) {
      fired.current = true;
      onOver();
    }
  }, [over, onOver]);

  const frac = Math.max(0, Math.min(1, total > 0 ? left / total : 0));
  const c = 2 * Math.PI * 18;
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, '0');

  return (
    <div
      role="timer"
      aria-label={t('st.w.rest')}
      className="thy-luxe-dark stagger-in fixed inset-x-3 bottom-[4.75rem] z-40 mx-auto flex max-w-md items-center gap-3 !rounded-2xl p-3 md:bottom-6"
    >
      <svg viewBox="0 0 44 44" className="h-12 w-12 shrink-0 -rotate-90" aria-hidden="true">
        <circle cx="22" cy="22" r="18" fill="none" strokeWidth="4" className="stroke-white/15" />
        <circle
          cx="22"
          cy="22"
          r="18"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - (over ? 1 : frac))}
          className={over ? 'stroke-sage-300' : 'stroke-ochre-400'}
          style={{ transition: 'stroke-dashoffset 0.3s linear' }}
        />
      </svg>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-ochre-300">{t('st.w.rest')}</div>
        <div className="font-editorial text-xl leading-tight text-ivory-50" aria-live="off">
          {over ? t('st.w.restOver') : `${mm}:${ss}`}
        </div>
      </div>
      {!over && (
        <button type="button" onClick={() => onAdd(15)} className="inline-flex min-h-[44px] items-center gap-1 rounded-full border border-white/20 px-3 text-xs font-semibold text-ivory-100 hover:bg-white/10">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {t('st.w.plus15')}
        </button>
      )}
      <button type="button" onClick={onSkip} className="inline-flex min-h-[44px] items-center gap-1 rounded-full bg-ivory-50 px-3 text-xs font-semibold text-forest-950 hover:bg-white">
        <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
        {over ? t('st.w.done') : t('st.w.skipRest')}
      </button>
    </div>
  );
};
