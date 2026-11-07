import { describe, expect, it } from 'vitest';
import { createDemoState } from '../data/demoSeed';
import { translate } from '../i18n';
import type { Lang } from '../domain/types';
import { buildReportHtml, escapeHtml } from './report';

const NOW = new Date('2026-11-07T09:30:00.000Z');
const html = (lang: Lang, state = createDemoState('2026-11-07')) =>
  buildReportHtml({ state, lang, now: NOW, t: (k, p) => translate(lang, k, p) });

describe('PDF report (print HTML)', () => {
  it('has provenance, rules version, template id, disclaimer and the demo flag', () => {
    const out = html('en');
    expect(out).toContain(NOW.toISOString());
    expect(out).toContain('2026.11.1');
    expect(out).toContain('tpl-activity-walk');
    expect(out).toContain('not a medical device');
    expect(out).toContain('demo data only');
  });

  it('is right-to-left for Urdu only', () => {
    expect(html('ur')).toContain('dir="rtl"');
    expect(html('en')).toContain('dir="ltr"');
    expect(html('bn')).toContain('dir="ltr"');
  });

  it('escapes user-entered text so a note cannot inject markup', () => {
    const state = createDemoState('2026-11-07');
    state.checkins[0] = { ...state.checkins[0], note: { original: '<script>alert(1)</script>', lang: 'en' } };
    const out = html('en', state);
    expect(out).not.toContain('<script>alert(1)');
    expect(out).toContain('&lt;script&gt;');
    expect(escapeHtml(`"a" & 'b'`)).toBe('&quot;a&quot; &amp; &#39;b&#39;');
  });

  it('renders in each supported language without leftover placeholders', () => {
    for (const lang of ['en', 'bn', 'hi', 'ur'] as Lang[]) {
      expect(html(lang)).not.toMatch(/\{\w+\}/);
    }
  });

  it('does not mark real (non-synthetic) data as demo', () => {
    const state = { ...createDemoState('2026-11-07') };
    state.profile = { ...state.profile, synthetic: false };
    expect(html('en', state)).not.toContain('demo data only');
  });
});
