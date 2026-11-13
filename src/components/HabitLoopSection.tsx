import React from 'react';
import { ArrowDownRight, Check, ClipboardCheck, Lightbulb, MessageCircleQuestion, Minus, Play, RefreshCw, Target } from 'lucide-react';
import type { Lang } from '../domain/types';
import { isRtl, translate, type Key } from '../i18n';
import { goPage } from '../app/router';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';

interface HabitLoopSectionProps {
  lang: Lang;
  onReplay: () => void;
}

const STEPS: { icon: typeof Target; t: Key; b: Key }[] = [
  { icon: Target, t: 'site.loop.s1.t', b: 'site.loop.s1.b' },
  { icon: ClipboardCheck, t: 'site.loop.s2.t', b: 'site.loop.s2.b' },
  { icon: ArrowDownRight, t: 'site.loop.s3.t', b: 'site.loop.s3.b' },
  { icon: MessageCircleQuestion, t: 'site.loop.s4.t', b: 'site.loop.s4.b' },
  { icon: RefreshCw, t: 'site.loop.s5.t', b: 'site.loop.s5.b' }
];

/** The same Mon–Sun the in-app replay shows: ✓ ✓ – · ↘ ✓ ✓ (missing day shown as missing). */
const WEEK: ('done' | 'skipped' | 'missing' | 'down')[] = ['done', 'done', 'skipped', 'missing', 'down', 'done', 'done'];

/**
 * "Sustaining healthy habits": the five-step habit loop, the replayable week
 * and the scope (three behaviours plus referral-only tobacco). Fully
 * translated (en/bn/hi/ur); right-to-left for Urdu.
 */
export const HabitLoopSection: React.FC<HabitLoopSectionProps> = ({ lang, onReplay }) => {
  const t = (k: Key, p?: Record<string, string | number>) => translate(lang, k, p);
  return (
    <section id="habit-loop" lang={lang} dir={isRtl(lang) ? 'rtl' : 'ltr'} className="thy-section relative overflow-hidden border-b border-forest-900/10 bg-ivory-50">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-10 h-[30rem] w-[30rem] rounded-full bg-sage-100/50 blur-3xl animate-float-slow" />
      <div className="thy-container relative">
        <SectionHeading
          index=""
          eyebrow={t('site.loop.eyebrow')}
          title={t('site.loop.title')}
          titleAccent={t('site.loop.accent')}
          lede={t('site.loop.lede')}
          className="mb-12"
        />

        <ol className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal as="li" key={s.t} delay={i * 80}>
                <div className="thy-card-interactive relative h-full p-5">
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-ochre-50 text-ochre-700 ring-1 ring-ochre-200">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="absolute end-4 top-4 font-mono text-xs text-forest-800/40">0{i + 1}</span>
                  <h3 className="mb-1.5 font-editorial text-lg leading-snug text-forest-950">{t(s.t)}</h3>
                  <p className="text-sm leading-relaxed text-forest-900/75">{t(s.b)}</p>
                </div>
              </Reveal>
            );
          })}
        </ol>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <div className="thy-panel h-full p-6">
              <div className="mb-4 flex items-center gap-1.5" aria-hidden="true">
                {WEEK.map((d, i) => (
                  <span
                    key={i}
                    className={`flex h-9 flex-1 items-center justify-center rounded-lg ${
                      d === 'done'
                        ? 'bg-forest-700 text-white'
                        : d === 'skipped'
                          ? 'bg-ochre-100 text-ochre-800'
                          : d === 'missing'
                            ? 'border-2 border-dashed border-forest-900/25'
                            : 'bg-ochre-500 text-white'
                    }`}
                  >
                    {d === 'done' && <Check className="h-4 w-4" />}
                    {d === 'skipped' && <Minus className="h-4 w-4" />}
                    {d === 'down' && <ArrowDownRight className="h-4 w-4" />}
                  </span>
                ))}
              </div>
              <p className="mb-4 text-sm text-forest-900/80">{t('story.intro')}</p>
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={onReplay} className="thy-btn-accent">
                  <Play className="h-4 w-4" aria-hidden="true" />
                  {t('site.loop.replay')}
                </button>
                <button type="button" onClick={() => goPage('how-suggestions-work')} className="thy-btn-ghost">
                  <Lightbulb className="h-4 w-4" aria-hidden="true" />
                  {t('tech.title')}
                </button>
              </div>
              <p className="mt-4 text-xs text-forest-800/65">{t('site.loop.status')}</p>
            </div>
          </Reveal>
          <Reveal className="lg:col-span-5" delay={120}>
            <div className="h-full rounded-card bg-forest-950 p-6 text-ivory-100">
              <h3 className="mb-2 font-editorial text-xl text-ivory-50">{t('site.loop.scopeTitle')}</h3>
              <p className="text-sm leading-relaxed text-ivory-200/90">{t('site.loop.scopeBody')}</p>
              <ul className="mt-4 flex flex-wrap gap-2 text-xs">
                {(['walk', 'eating', 'sleep', 'tobacco'] as const).map((g) => (
                  <li key={g} className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
                    {t(`goal.${g}` as Key)}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
