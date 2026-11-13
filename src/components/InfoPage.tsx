import React, { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Lightbulb } from 'lucide-react';
import { LANGS, type Lang } from '../domain/types';
import { TECHNIQUES, TECHNIQUE_IDS, techniqueText } from '../techniques/techniques';
import { LANG_NAMES, isRtl, translate, type Key } from '../i18n';
import { SITE_PAGES, goPage, leaveApp, type SitePage } from '../app/router';
import { LogoMark } from './ui/Logo';

/**
 * Public pages: "How suggestions work" (generated from the technique data
 * file), the rights statement, the accessibility statement and the pilot
 * outcome measures. All four languages; right-to-left for Urdu.
 */
export const InfoPage: React.FC<{ slug: string; initialLang?: Lang }> = ({ slug, initialLang = 'en' }) => {
  const [lang, setLang] = useState<Lang>(initialLang);
  const t = (k: Key, p?: Record<string, string | number>) => translate(lang, k, p);
  const page: SitePage = (SITE_PAGES as readonly string[]).includes(slug) ? (slug as SitePage) : 'how-suggestions-work';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  useEffect(() => {
    const title = { 'how-suggestions-work': 'tech.title', rights: 'site.rights.title', accessibility: 'site.a11y.title', pilot: 'site.pilot.title' } as const;
    document.title = `${translate(lang, title[page])} — Thypro`;
    return () => {
      document.title = 'Thypro — One health record a whole family can act on';
    };
  }, [page, lang]);

  const list = (keys: Key[]) => (
    <ul className="space-y-3">
      {keys.map((k) => (
        <li key={k} className="flex gap-3 rounded-card border border-forest-900/10 bg-white p-4 text-forest-950 shadow-soft-sm">
          <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ochre-500" />
          <span>{t(k)}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div lang={lang} dir={isRtl(lang) ? 'rtl' : 'ltr'} className="app-root min-h-screen bg-ivory-100 text-forest-900">
      <header className="border-b border-forest-900/10 bg-white/90">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <button type="button" onClick={leaveApp} className="flex min-h-[44px] items-center gap-2 text-sm text-forest-800">
            <ArrowLeft className="h-4 w-4 flip-rtl" aria-hidden="true" />
            <LogoMark className="h-7" />
            {t('site.back')}
          </button>
          <label className="text-sm">
            <span className="sr-only">{t('shell.language')}</span>
            <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="min-h-[44px] rounded-xl border border-forest-900/20 bg-white px-3">
              {LANGS.map((l) => (
                <option key={l} value={l} lang={l}>
                  {LANG_NAMES[l]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <nav aria-label={t('site.commitments')} className="mx-auto flex max-w-3xl flex-wrap gap-1 px-4 pb-3">
          {SITE_PAGES.map((p) => (
            <button
              key={p}
              type="button"
              aria-current={p === page ? 'page' : undefined}
              onClick={() => goPage(p)}
              className={`min-h-[40px] rounded-full px-3 text-xs font-medium ${p === page ? 'bg-forest-800 text-ivory-50' : 'text-forest-800 hover:bg-forest-900/5'}`}
            >
              {t(({ 'how-suggestions-work': 'tech.title', rights: 'site.rights.title', accessibility: 'site.a11y.title', pilot: 'site.pilot.title' } as const)[p])}
            </button>
          ))}
        </nav>
      </header>

      <main id="main-content" className="route-in mx-auto max-w-3xl px-4 py-10">
        {page === 'how-suggestions-work' && (
          <>
            <h1 className="font-editorial text-3xl text-forest-950 sm:text-4xl">{t('tech.title')}</h1>
            <p className="mt-3 text-forest-900/80">{t('site.how.lede')}</p>
            <p className="mt-3 rounded-card bg-ivory-200/70 p-3 text-sm text-forest-900/85">{t('tech.mappingNote')}</p>
            <div className="mt-6 space-y-4">
              {TECHNIQUE_IDS.map((id) => {
                const text = techniqueText(id, lang);
                return (
                  <article key={id} className="rounded-card border border-forest-900/10 bg-white p-5 shadow-soft-sm">
                    <h2 className="flex items-center gap-2 font-editorial text-xl text-forest-950">
                      <Lightbulb className="h-5 w-5 text-ochre-600" aria-hidden="true" />
                      {text.name}
                    </h2>
                    <p className="mt-2 text-sm text-forest-950">
                      <strong>{t('tech.rationale')}:</strong> {text.rationale}
                    </p>
                    <p className="mt-1 text-sm text-forest-900/85">
                      <strong>{t('tech.limits')}:</strong> {text.limits}
                    </p>
                    <p className="mt-2 text-xs">
                      <a href={TECHNIQUES[id].source.url} target="_blank" rel="noreferrer noopener" lang="en" dir="ltr" className="inline-flex items-center gap-1 text-ochre-700 underline">
                        {t('tech.source')}: {TECHNIQUES[id].source.label}
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    </p>
                  </article>
                );
              })}
            </div>
          </>
        )}

        {page === 'rights' && (
          <>
            <h1 className="font-editorial text-3xl text-forest-950 sm:text-4xl">{t('site.rights.title')}</h1>
            <p className="mb-6 mt-3 text-forest-900/80">{t('site.rights.lede')}</p>
            {list(['site.rights.r1', 'site.rights.r2', 'site.rights.r3', 'site.rights.r4', 'site.rights.r5', 'site.rights.r6'])}
          </>
        )}

        {page === 'accessibility' && (
          <>
            <h1 className="font-editorial text-3xl text-forest-950 sm:text-4xl">{t('site.a11y.title')}</h1>
            <p className="mb-6 mt-3 text-forest-900/80">{t('site.a11y.lede')}</p>
            {list(['site.a11y.a1', 'site.a11y.a2', 'site.a11y.a3', 'site.a11y.a4'])}
            <h2 className="mb-3 mt-8 font-editorial text-2xl text-forest-950">{t('site.a11y.limits')}</h2>
            {list(['site.a11y.l1', 'site.a11y.l2'])}
            <p className="mt-6 text-sm text-forest-900/80">{t('site.a11y.report')}</p>
          </>
        )}

        {page === 'pilot' && (
          <>
            <h1 className="font-editorial text-3xl text-forest-950 sm:text-4xl">{t('site.pilot.title')}</h1>
            <p className="mb-6 mt-3 text-forest-900/80">{t('site.pilot.lede')}</p>
            {list(['site.pilot.m1', 'site.pilot.m2', 'site.pilot.m3', 'site.pilot.m4', 'site.pilot.m5', 'site.pilot.m6'])}
          </>
        )}

        <p className="mt-10 text-xs text-forest-800/65">{t('shell.disclaimer')}</p>
      </main>
    </div>
  );
};
