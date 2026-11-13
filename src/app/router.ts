import { useEffect, useState } from 'react';

/**
 * Minimal hash router (no dependency). The marketing page owns '' and '#/';
 * the app owns '#/app/<screen>'. Marketing anchors never touch the hash.
 */

export type Screen =
  | 'start'
  | 'today'
  | 'plan'
  | 'review'
  | 'family'
  | 'more'
  | 'reminders'
  | 'export'
  | 'audit'
  | 'setup'
  | 'clinician'
  | 'settings'
  | 'story'
  | 'techniques'
  | 'sponsor'
  | 'pilot';

const SCREENS: readonly Screen[] = [
  'start', 'today', 'plan', 'review', 'family', 'more', 'reminders', 'export', 'audit', 'setup', 'clinician',
  'settings', 'story', 'techniques', 'sponsor', 'pilot'
];

export interface Route {
  inApp: boolean;
  screen: Screen;
  /** Public website page under #/page/<slug>, if any. */
  page?: string;
}

export const SITE_PAGES = ['how-suggestions-work', 'rights', 'accessibility', 'pilot'] as const;
export type SitePage = (typeof SITE_PAGES)[number];

export function parseHash(hash: string): Route {
  const page = /^#\/page\/([\w-]+)\/?$/.exec(hash);
  if (page) return { inApp: false, screen: 'start', page: page[1] };
  const m = /^#\/app(?:\/([\w-]+))?\/?$/.exec(hash);
  if (!m) return { inApp: false, screen: 'start' };
  const screen = (m[1] ?? 'start') as Screen;
  return { inApp: true, screen: SCREENS.includes(screen) ? screen : 'today' };
}

export function go(screen: Screen): void {
  window.location.hash = `#/app/${screen}`;
}

export function goPage(slug: SitePage): void {
  window.location.hash = `#/page/${slug}`;
  window.scrollTo({ top: 0 });
}

export function leaveApp(): void {
  // Clear the hash without leaving a "#" behind, then return to the top of the page.
  window.history.pushState(null, '', window.location.pathname + window.location.search);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
  window.scrollTo({ top: 0 });
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
