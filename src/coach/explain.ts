/**
 * Explanation layer. The model ONLY turns an already-validated, structured proposal into
 * kind wording in the person's language. It cannot choose, change or add an action.
 *
 * Pipeline: redact -> request -> JSON-schema check -> safety screen -> show.
 * Any failure (no URL, offline, timeout, quota, bad JSON, unsafe wording) falls back to the
 * fixed template for that action, so the coach never depends on the network.
 */

import type { Lang } from '../domain/types';
import type { TFn } from '../i18n';
import { COACH_CONFIG } from './config';
import type { CoachProposal, ExplanationRecord } from './types';
import { isAllowedAction } from './actions';

export interface Explanation {
  headline: string;
  body: string;
}

export interface RedactedProposal {
  task: 'coach_explain';
  lang: Lang;
  tone: 'neutral' | 'encouraging';
  action: string;
  track: string | null;
  from: string;
  to: string;
  factors: string[];
  band: string;
  effort: string;
}

/**
 * Allow-list redaction: only these fields can ever leave the page. No names, notes, family
 * contacts, cities, dates, ids or free text are copied, because none are read here.
 */
export function redactForLlm(p: CoachProposal, lang: Lang, tone: 'neutral' | 'encouraging'): RedactedProposal {
  return {
    task: 'coach_explain',
    lang,
    tone,
    action: p.action,
    track: p.track ?? null,
    from: p.from,
    to: p.to,
    factors: p.topFactors.slice(0, 3),
    band: p.band,
    effort: p.effort
  };
}

export function templateExplanation(p: CoachProposal, t: TFn): Explanation {
  const params = { from: p.from, to: p.to, track: p.track ? t(`planner.track.${p.track}` as never) : '' };
  return {
    headline: t(`coach.tpl.${p.action}.head` as never, params),
    body: t(`coach.tpl.${p.action}.body` as never, params)
  };
}

/** JSON-schema check for the model's reply: exactly two non-empty strings within length limits. */
export const EXPLANATION_SCHEMA = {
  type: 'object',
  required: ['headline', 'body'],
  properties: { headline: { type: 'string', minLength: 1, maxLength: 120 }, body: { type: 'string', minLength: 1, maxLength: 420 } }
} as const;

export function validateExplanationShape(x: unknown): x is Explanation {
  if (typeof x !== 'object' || x === null) return false;
  const o = x as Record<string, unknown>;
  const ok = (v: unknown, max: number) => typeof v === 'string' && v.trim().length >= 1 && v.length <= max;
  const props = EXPLANATION_SCHEMA.properties;
  return ok(o.headline, props.headline.maxLength) && ok(o.body, props.body.maxLength);
}

const FORBIDDEN =
  /(https?:\/\/|www\.|@\w|\b(diagnos\w*|prescri\w*|medicat\w*|medicine|dose|dosage|insulin|nicotine|tablet|pill|cure[sd]?|guarantee\w*|clinically (proven|validated)|emergency number)\b|\b(mg|ml)\b)/i;

/** Safety screen on model wording. Numbers must come from the proposal; no medical or hype claims. */
export function screenExplanation(e: Explanation, p: CoachProposal): { ok: boolean; reason?: string } {
  const text = `${e.headline} ${e.body}`;
  if (FORBIDDEN.test(text)) return { ok: false, reason: 'forbidden_wording' };
  const allowed = new Set<string>([...`${p.from} ${p.to} ${p.score}`.matchAll(/\d+/g)].map((m) => m[0]));
  const numbers = text.match(/\d+/g) ?? [];
  if (numbers.some((n) => !allowed.has(n) && !allowed.has(String(Number(n))))) return { ok: false, reason: 'unexpected_number' };
  return { ok: true };
}

export interface ExplainOptions {
  t: TFn;
  lang: Lang;
  tone: 'neutral' | 'encouraging';
  url?: string;
  fetchImpl?: typeof fetch;
  /** Epoch ms; model calls are skipped while now < cooldownUntil. */
  now: number;
  cooldownUntil: number | null;
}

export interface ExplainResult {
  explanation: Explanation;
  record: ExplanationRecord;
  cooldownUntil: number | null;
}

export function coachApiUrl(): string | undefined {
  const url = import.meta.env.VITE_COACH_API_URL as string | undefined;
  return url && url.trim() ? url.trim() : undefined;
}

export async function explainProposal(p: CoachProposal, o: ExplainOptions): Promise<ExplainResult> {
  const fallback = (reason: string, cooldown: number | null = o.cooldownUntil): ExplainResult => ({
    explanation: templateExplanation(p, o.t),
    record: { source: 'template', fallbackReason: reason },
    cooldownUntil: cooldown
  });
  if (!isAllowedAction(p.action)) return fallback('action_not_allowed');
  if (!o.url) return fallback('not_configured');
  if (o.cooldownUntil !== null && o.now < o.cooldownUntil) return fallback('cooldown');
  const f = o.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), COACH_CONFIG.llmTimeoutMs);
  const cool = o.now + COACH_CONFIG.llmCooldownMs;
  try {
    const res = await f(o.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(redactForLlm(p, o.lang, o.tone)),
      signal: controller.signal
    });
    if (!res.ok) return fallback(res.status === 429 ? 'quota' : 'http_error', cool);
    const data: unknown = await res.json();
    if (!validateExplanationShape(data)) return fallback('invalid_json');
    const screened = screenExplanation(data, p);
    if (!screened.ok) return fallback(screened.reason ?? 'unsafe');
    const rawModel = (data as unknown as Record<string, unknown>).model;
    const model = typeof rawModel === 'string' ? rawModel : 'unknown';
    return { explanation: { headline: data.headline.trim(), body: data.body.trim() }, record: { source: 'llm', model, text: { headline: data.headline.trim(), body: data.body.trim(), lang: o.lang } }, cooldownUntil: o.cooldownUntil };
  } catch {
    return fallback('network', cool);
  } finally {
    clearTimeout(timer);
  }
}
