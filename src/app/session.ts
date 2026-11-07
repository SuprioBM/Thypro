/**
 * Which kind of session is running. Held in memory only, so a guest session is
 * gone when the page closes. Local mode is remembered by the presence of its
 * own saved data (see persistence.ts), never by anything guest-related.
 */

import type { Lang, SessionMode } from '../domain/types';

let current: { mode: SessionMode; lang: Lang } | null = null;

const LOCAL_KEY = 'thypro.local.v1';

export function startSession(mode: SessionMode, lang: Lang): void {
  current = { mode, lang };
}

export function endSession(): void {
  current = null;
}

export function readSession(): { mode: SessionMode; lang: Lang } | null {
  if (current) return current;
  // A returning "local" user has saved data on this device; resume without asking.
  try {
    if (typeof window !== 'undefined' && window.localStorage.getItem(LOCAL_KEY)) {
      return { mode: 'local', lang: 'en' };
    }
  } catch {
    /* storage blocked: treat as no saved session */
  }
  return null;
}
