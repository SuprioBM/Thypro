/**
 * Which kind of session is running. Held in memory only, so a guest session is
 * gone when the page closes. Local mode is remembered by the presence of its
 * own saved data (see persistence.ts), never by anything guest-related.
 */

import type { Lang, SessionMode } from '../domain/types';
import { hasStoredSession } from '../cloud/hasSession';

/** 'account' = signed in with an email; its data is the same shape as Local mode, stored in the person's protected account. */
export type EntryMode = SessionMode | 'account';

let current: { mode: EntryMode; lang: Lang } | null = null;

const LOCAL_KEY = 'thypro.local.v1';

export function startSession(mode: EntryMode, lang: Lang): void {
  current = { mode, lang };
}

export function endSession(): void {
  current = null;
}

export function readSession(): { mode: EntryMode; lang: Lang } | null {
  if (current) return current;
  // A returning sign-in link or a stored account session resumes the account without asking.
  if (hasStoredSession()) return { mode: 'account', lang: 'en' };
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
