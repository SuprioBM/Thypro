import React, { useState } from 'react';
import { ArrowLeft, Sparkles, User } from 'lucide-react';
import { LogoMark } from '../components/ui/Logo';
import { LANGS, type Lang, type SessionMode } from '../domain/types';
import { LANG_NAMES, isRtl, translate } from '../i18n';
import { leaveApp } from './router';

/** First screen of the app: pick a language, then a guest demo or your own plan. */
export const Entry: React.FC<{ initialLang: Lang; onStart: (mode: SessionMode, lang: Lang) => void }> = ({ initialLang, onStart }) => {
  const [lang, setLang] = useState<Lang>(initialLang);
  const t = (k: Parameters<typeof translate>[1], p?: Parameters<typeof translate>[2]) => translate(lang, k, p);

  return (
    <div className="app-root min-h-screen bg-ivory-100 px-4 py-6 text-forest-900" lang={lang} dir={isRtl(lang) ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-lg">
        <button type="button" onClick={leaveApp} className="mb-6 flex min-h-[44px] items-center gap-2 text-sm text-forest-800">
          <ArrowLeft className="h-4 w-4 flip-rtl" aria-hidden="true" />
          {t('nav.website')}
        </button>

        <LogoMark className="h-14" />
        <h1 className="mt-4 font-editorial text-3xl text-forest-950">{t('entry.title')}</h1>
        <p className="mt-2 text-base text-forest-900/80">{t('entry.body')}</p>

        <fieldset className="mt-6">
          <legend className="mb-2 text-sm font-semibold text-forest-950">{t('shell.language')}</legend>
          <div className="grid grid-cols-2 gap-2" role="radiogroup">
            {LANGS.map((l) => (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={lang === l}
                lang={l}
                onClick={() => setLang(l)}
                className={`min-h-[52px] rounded-xl border px-4 py-3 text-base font-medium transition-all duration-200 ease-editorial ${
                  lang === l ? 'border-forest-800 bg-forest-800 text-ivory-50 shadow-soft-sm' : 'border-forest-900/15 bg-white hover:border-forest-900/35'
                }`}
              >
                {LANG_NAMES[l]}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-6 space-y-4">
          <div>
            <button type="button" onClick={() => onStart('guest', lang)} className="thy-btn-accent min-h-[56px] w-full text-base">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
              {t('entry.guest')}
            </button>
            <p className="mt-1.5 text-xs text-forest-800/70">{t('entry.guestHint')}</p>
          </div>
          <div>
            <button type="button" onClick={() => onStart('local', lang)} className="thy-btn-ghost min-h-[56px] w-full text-base">
              <User className="h-5 w-5" aria-hidden="true" />
              {t('entry.local')}
            </button>
            <p className="mt-1.5 text-xs text-forest-800/70">{t('entry.localHint')}</p>
          </div>
        </div>

        <p className="mt-8 text-[11px] leading-relaxed text-forest-800/65">{t('shell.disclaimer')}</p>
      </div>
    </div>
  );
};
