import React, { Suspense, lazy, useEffect } from 'react';
import { ArrowLeft, BarChart3, Dumbbell, BellRing, BookOpen, CalendarCheck, ClipboardList, FileDown, Home, LayoutGrid, Lightbulb, LogOut, MessageSquare, PieChart, ScrollText, SlidersHorizontal, Users, Volume2, X } from 'lucide-react';
import { LogoMark } from '../components/ui/Logo';
import { useI18n, type Key } from '../i18n';
import { LanguageSelect } from './components/LanguageSelect';
import { leaveApp, go, type Screen } from './router';
import { useStore } from './store';
import { Chip, ErrorBoundary, ErrorState, ScreenSkeleton } from './ui/kit';
import { Today } from './screens/Today';
import { Plan } from './screens/Plan';
import { Setup } from './screens/Setup';
import { ClinicianPath } from './screens/ClinicianPath';
import { More } from './screens/More';

// Heavier screens load on demand, which gives them a real skeleton while they arrive.
const Review = lazy(() => import('./screens/Review').then((m) => ({ default: m.Review })));
const Family = lazy(() => import('./screens/Family').then((m) => ({ default: m.Family })));
const Reminders = lazy(() => import('./screens/Reminders').then((m) => ({ default: m.Reminders })));
const Export = lazy(() => import('./screens/Export').then((m) => ({ default: m.Export })));
const Audit = lazy(() => import('./screens/Audit').then((m) => ({ default: m.Audit })));
const Settings = lazy(() => import('./screens/Settings').then((m) => ({ default: m.Settings })));
const Story = lazy(() => import('./screens/Story').then((m) => ({ default: m.Story })));
const Techniques = lazy(() => import('./screens/Techniques').then((m) => ({ default: m.Techniques })));
const Sponsor = lazy(() => import('./screens/Sponsor').then((m) => ({ default: m.Sponsor })));
const Pilot = lazy(() => import('./screens/Pilot').then((m) => ({ default: m.Pilot })));
const Strength = lazy(() => import('./screens/Strength').then((m) => ({ default: m.Strength })));
const Workout = lazy(() => import('./screens/Workout').then((m) => ({ default: m.Workout })));

const SCREENS: Record<Exclude<Screen, 'start'>, React.ReactNode> = {
  today: <Today />,
  plan: <Plan />,
  review: <Review />,
  family: <Family />,
  more: <More />,
  reminders: <Reminders />,
  export: <Export />,
  audit: <Audit />,
  setup: <Setup />,
  clinician: <ClinicianPath />,
  settings: <Settings />,
  story: <Story />,
  techniques: <Techniques />,
  sponsor: <Sponsor />,
  pilot: <Pilot />,
  strength: <Strength />,
  workout: <Workout />
};

const TABS: { screen: Screen; icon: typeof Home; key: 'nav.today' | 'nav.plan' | 'nav.review' | 'nav.family' | 'nav.more' }[] = [
  { screen: 'today', icon: Home, key: 'nav.today' },
  { screen: 'plan', icon: ClipboardList, key: 'nav.plan' },
  { screen: 'review', icon: CalendarCheck, key: 'nav.review' },
  { screen: 'family', icon: Users, key: 'nav.family' },
  { screen: 'more', icon: LayoutGrid, key: 'nav.more' }
];

const SIDE: { screen: Screen; icon: typeof Home; key: Key }[] = [
  { screen: 'strength', icon: Dumbbell, key: 'nav.strength' },
  { screen: 'settings', icon: SlidersHorizontal, key: 'nav.settings' },
  { screen: 'story', icon: BookOpen, key: 'nav.story' },
  { screen: 'reminders', icon: BellRing, key: 'nav.reminders' },
  { screen: 'techniques', icon: Lightbulb, key: 'nav.techniques' },
  { screen: 'export', icon: FileDown, key: 'nav.export' },
  { screen: 'audit', icon: ScrollText, key: 'nav.audit' },
  { screen: 'pilot', icon: BarChart3, key: 'nav.pilot' },
  { screen: 'sponsor', icon: PieChart, key: 'nav.sponsor' }
];

const NOTICE_ICON = { 'in-app': BellRing, message: MessageSquare, voice: Volume2, info: BellRing } as const;

export const AppShell: React.FC<{ screen: Exclude<Screen, 'start'> }> = ({ screen }) => {
  const { t, lang, dir } = useI18n();
  const { state, notices, dismissNotice, exitSession } = useStore();
  const guest = state.mode === 'guest';
  const activeTab = (['today', 'plan', 'review', 'family'] as Screen[]).includes(screen) ? screen : 'more';

  // A new screen starts at the top instead of keeping the last screen's scroll.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  const navBtn = (active: boolean) =>
    `flex min-h-[48px] items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
      active ? 'bg-forest-800 text-ivory-50' : 'text-forest-900 hover:bg-forest-900/[0.05]'
    }`;

  return (
    <div className="app-root min-h-screen bg-ivory-100 text-forest-900" lang={lang} dir={dir}>
      <a href="#app-main" className="thy-skip-link" onClick={(e) => { e.preventDefault(); document.getElementById('app-main')?.focus(); }}>
        {t('shell.skip')}
      </a>

      <header className="sticky top-0 z-40 border-b border-forest-900/10 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
          <button type="button" onClick={leaveApp} className="flex min-h-[44px] items-center gap-2 rounded-xl pe-2 text-forest-950" aria-label={t('nav.website')}>
            <ArrowLeft className="h-4 w-4 flip-rtl" aria-hidden="true" />
            <LogoMark className="h-7" />
            <span className="font-editorial text-lg font-medium">{t('app.name')}</span>
          </button>
          <div className="flex items-center gap-2">
            {guest && <Chip tone="warn" className="hidden sm:inline-flex">{t('shell.demoChip')}</Chip>}
            <LanguageSelect className="w-32 sm:w-36" />
          </div>
        </div>
        <div className={`border-t px-4 py-2 text-xs ${guest ? 'border-ochre-300 bg-signal-amberSoft text-forest-950' : 'border-sage-300 bg-sage-50 text-forest-900'}`}>
          <p className="mx-auto max-w-6xl">
            {guest ? t('shell.demoBanner') : t('shell.localBanner')}
            {guest && <span className="block text-forest-800/70">{t('shell.demoPersona')}</span>}
          </p>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-8 px-4 pt-5 md:pt-8">
        <nav aria-label={t('nav.primary')} className="sticky top-32 hidden h-fit w-56 shrink-0 md:block">
          <ul className="space-y-1">
            {[...TABS.slice(0, 4), ...SIDE].map(({ screen: s, icon: Icon, key }) => (
              <li key={s}>
                <button type="button" aria-current={screen === s ? 'page' : undefined} onClick={() => go(s)} className={`${navBtn(screen === s)} w-full`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {t(key)}
                </button>
              </li>
            ))}
            <li className="pt-3">
              <button type="button" onClick={exitSession} className={`${navBtn(false)} w-full`}>
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {t('nav.exit')}
              </button>
            </li>
          </ul>
        </nav>

        <main id="app-main" tabIndex={-1} className="min-w-0 flex-1 pb-32 outline-none md:pb-16">
          <ErrorBoundary
            resetKey={screen}
            fallback={(reset) => (
              <ErrorState title={t('shell.errorTitle')} body={t('shell.errorBody')} retryLabel={t('common.retry')} onRetry={() => { reset(); go('today'); }} />
            )}
          >
            <Suspense fallback={<ScreenSkeleton />}>
              <div key={screen} className="route-in mx-auto max-w-2xl">
                {SCREENS[screen]}
              </div>
            </Suspense>
          </ErrorBoundary>
          <p className="mx-auto mt-10 max-w-2xl text-center text-[11px] leading-relaxed text-forest-800/65">{t('shell.disclaimer')}</p>
        </main>
      </div>

      <nav aria-label={t('nav.primary')} className="fixed inset-x-0 bottom-0 z-40 border-t border-forest-900/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {TABS.map(({ screen: s, icon: Icon, key }) => {
            const on = activeTab === s;
            return (
              <li key={s}>
                <button
                  type="button"
                  aria-current={on ? 'page' : undefined}
                  onClick={() => go(s)}
                  className={`flex min-h-[56px] w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${on ? 'text-forest-800' : 'text-forest-800/65'}`}
                >
                  <span className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-300 ${on ? 'bg-ochre-100 text-ochre-800' : ''}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  {t(key)}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6" aria-live="polite" role="status">
        {notices.map((n) => {
          const Icon = NOTICE_ICON[n.kind];
          const bubble =
            n.kind === 'message'
              ? 'rounded-2xl rounded-es-sm bg-sage-100 text-forest-950 border border-sage-300'
              : n.kind === 'voice'
                ? 'rounded-full bg-ochre-500 text-white'
                : 'rounded-2xl bg-forest-900 text-ivory-50';
          return (
          <div key={n.id} className={`stagger-in pointer-events-auto flex max-w-md items-center gap-3 px-4 py-3 text-sm shadow-lift ${bubble}`}>
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="flex-1">
              <span className="block text-[10px] font-semibold uppercase tracking-wider opacity-75">{n.kind === 'info' ? '' : t(`channel.${n.kind}` as Key)}</span>
              {n.text}
            </span>
            <button type="button" onClick={() => dismissNotice(n.id)} aria-label={t('rem.dismiss')} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          );
        })}
      </div>
    </div>
  );
};
