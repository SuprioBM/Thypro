import React from 'react';
import { LANGS, type Lang } from '../../domain/types';
import { LANG_NAMES, useI18n } from '../../i18n';

/** Native <select>: 48px tall, keyboard and screen-reader friendly, each option in its own script. */
export const LanguageSelect: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { lang, setLang, t } = useI18n();
  return (
    <div className={className}>
      <label htmlFor="lang-select" className="sr-only">
        {t('shell.language')}
      </label>
      <select
        id="lang-select"
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        className="min-h-[44px] w-full rounded-xl border border-forest-900/20 bg-white px-3 text-sm font-medium text-forest-950"
      >
        {LANGS.map((l) => (
          <option key={l} value={l} lang={l}>
            {LANG_NAMES[l]}
          </option>
        ))}
      </select>
    </div>
  );
};
