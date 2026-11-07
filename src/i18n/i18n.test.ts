import { describe, expect, it } from 'vitest';
import { LANGS } from '../domain/types';
import { DICTS, isRtl, reasonText, translate, type TFn } from './index';
import { en } from './en';

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('dictionaries', () => {
  it('every language defines exactly the English keys, none empty', () => {
    const keys = Object.keys(en);
    for (const lang of LANGS) {
      expect(Object.keys(DICTS[lang]).sort(), lang).toEqual([...keys].sort());
      for (const k of keys) expect(DICTS[lang][k as keyof typeof en].trim().length, `${lang}:${k}`).toBeGreaterThan(0);
    }
  });

  it('keeps the same {placeholders} in every translation', () => {
    for (const lang of LANGS) {
      for (const k of Object.keys(en) as (keyof typeof en)[]) {
        expect(placeholders(DICTS[lang][k]), `${lang}:${k}`).toEqual(placeholders(en[k]));
      }
    }
  });

  it('never states a number-bearing emergency line without the real UAE numbers', () => {
    for (const lang of LANGS) {
      expect(DICTS[lang]['esc.emergency']).toContain('998');
      expect(DICTS[lang]['esc.emergency']).toContain('999');
    }
  });

  it('every language says Thypro is not an emergency service / does not monitor continuously (esc.honest, shell.disclaimer present)', () => {
    for (const lang of LANGS) {
      expect(DICTS[lang]['esc.honest'].length).toBeGreaterThan(20);
      expect(DICTS[lang]['shell.disclaimer'].length).toBeGreaterThan(20);
    }
  });
});

describe('translate / rtl / reasonText', () => {
  it('interpolates params', () => {
    expect(translate('en', 'today.greeting', { name: 'Rahim' })).toBe('Hello, Rahim');
    expect(translate('bn', 'plan.version', { v: 2 })).toContain('2');
  });

  it('only Urdu is right-to-left', () => {
    expect(LANGS.filter(isRtl)).toEqual(['ur']);
  });

  it('turns reason codes into sentences, including plan_ prefixed and red-flag codes', () => {
    const t: TFn = (k, p) => translate('en', k, p);
    expect(reasonText(t, 'fastingHoursPerDay_too_high', { value: 20, limit: 16 })).toContain('20');
    expect(reasonText(t, 'plan_exerciseMinutesPerDay_too_high', { value: 200, limit: 90 })).toMatch(/^Plan check: /);
    expect(reasonText(t, 'redflag_chestPain')).toContain('Chest pain');
    expect(reasonText(t, 'totally_unknown_code')).toBe(en['reason.unknown']);
  });
});
