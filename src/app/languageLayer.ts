/**
 * Optional language layer.
 *
 * AI handles LANGUAGE AND TONE ONLY: translating a person's own note. It never
 * produces plan content, never touches the safety engine, and is off unless
 * VITE_LANGUAGE_API_URL is set. If it is off or fails, the original wording is
 * saved and the UI says so; plans and reminders keep working from fixed
 * templates.
 *
 * Expected endpoint contract (yours to implement server-side):
 *   POST {url}  { text, source, target }  →  { translation: string }
 */

import type { Lang } from '../domain/types';

export type TranslateResult =
  | { ok: true; text: string; provider: string }
  | { ok: false; reason: 'unconfigured' | 'failed' };

const TIMEOUT_MS = 6000;

export function languageLayerUrl(): string | undefined {
  const url = import.meta.env.VITE_LANGUAGE_API_URL as string | undefined;
  return url && url.trim() ? url.trim() : undefined;
}

export async function translateNote(
  text: string,
  source: Lang,
  target: Lang,
  fetchImpl: typeof fetch = fetch,
  url: string | undefined = languageLayerUrl()
): Promise<TranslateResult> {
  if (!url) return { ok: false, reason: 'unconfigured' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, source, target }),
      signal: controller.signal
    });
    if (!res.ok) return { ok: false, reason: 'failed' };
    const data = (await res.json()) as { translation?: unknown };
    if (typeof data.translation !== 'string' || !data.translation.trim()) return { ok: false, reason: 'failed' };
    return { ok: true, text: data.translation, provider: 'language-layer' };
  } catch {
    return { ok: false, reason: 'failed' };
  } finally {
    clearTimeout(timer);
  }
}
