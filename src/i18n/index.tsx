import React, { createContext, useContext, useMemo } from 'react';
import { RTL_LANGS, type Lang } from '../domain/types';
import { bn } from './bn';
import { en, type Dict, type Key } from './en';
import { hi } from './hi';
import { ur } from './ur';

export type { Key } from './en';
export type Params = Record<string, string | number>;
export type TFn = (key: Key, params?: Params) => string;

export const DICTS: Record<Lang, Dict> = { en, bn, hi, ur };

/** Each language written in itself, so a reader can always find theirs. */
export const LANG_NAMES: Record<Lang, string> = {
  en: 'English',
  bn: 'বাংলা',
  hi: 'हिन्दी',
  ur: 'اردو'
};

/** Latin digits everywhere keeps times, doses and phone numbers unambiguous. */
const LOCALES: Record<Lang, string> = {
  en: 'en-GB-u-nu-latn',
  bn: 'bn-BD-u-nu-latn',
  hi: 'hi-IN-u-nu-latn',
  ur: 'ur-PK-u-nu-latn'
};

export const isRtl = (lang: Lang): boolean => RTL_LANGS.includes(lang);

export function translate(lang: Lang, key: Key, params?: Params): string {
  const raw = DICTS[lang]?.[key] ?? en[key] ?? key;
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k: string) => (k in params ? String(params[k]) : `{${k}}`));
}

/** Turns a stable reason code (from the safety engine / audit log) into a sentence. */
export function reasonText(t: TFn, code: string, params?: Params): string {
  if (code.startsWith('redflag_')) {
    const flagKey = `checkin.flag.${code.slice('redflag_'.length)}`;
    return flagKey in en ? `${t('reason.redflagPrefix')}: ${t(flagKey as Key)}` : t('reason.unknown');
  }
  const direct = `reason.${code}`;
  if (direct in en) return t(direct as Key, params);
  if (code.startsWith('plan_')) return `${t('reason.planPrefix')}: ${reasonText(t, code.slice('plan_'.length), params)}`;
  return t('reason.unknown');
}

interface I18nValue {
  lang: Lang;
  dir: 'ltr' | 'rtl';
  t: TFn;
  setLang: (lang: Lang) => void;
  /** 'YYYY-MM-DD' or an ISO timestamp → localized date. */
  fmtDate: (value: string, opts?: Intl.DateTimeFormatOptions) => string;
  fmtDateTime: (iso: string) => string;
}

const Ctx = createContext<I18nValue | null>(null);

export const I18nProvider: React.FC<{ lang: Lang; setLang: (l: Lang) => void; children: React.ReactNode }> = ({
  lang,
  setLang,
  children
}) => {
  const value = useMemo<I18nValue>(() => {
    const locale = LOCALES[lang];
    const asDate = (v: string) => (v.length === 10 ? new Date(`${v}T12:00:00`) : new Date(v));
    return {
      lang,
      dir: isRtl(lang) ? 'rtl' : 'ltr',
      t: (key, params) => translate(lang, key, params),
      setLang,
      fmtDate: (v, opts = { weekday: 'short', day: 'numeric', month: 'short' }) =>
        new Intl.DateTimeFormat(locale, opts).format(asDate(v)),
      fmtDateTime: (iso) =>
        new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(
          new Date(iso)
        )
    };
  }, [lang, setLang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useI18n(): I18nValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n must be used inside <I18nProvider>');
  return v;
}
