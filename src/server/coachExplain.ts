/**
 * Server-side core of the explanation proxy (runs in a serverless function, never in the
 * browser, so GROQ_API_KEY is never bundled). Framework-neutral and unit-tested.
 *
 * It re-validates the request (allow-listed action and fields), asks Groq to phrase it, and
 * returns {headline, body, model}. The model gets no tools and cannot return an action.
 * Free-tier note: Groq's free plan is rate-limited; on 429 the browser falls back to templates.
 */

const ACTIONS = ['reduce_goal', 'change_time', 'swap_behaviour', 'switch_channel', 'add_preshift_reminder', 'pause_hydration_fasting'];
const LANG_NAMES: Record<string, string> = { en: 'English', bn: 'Bangla', hi: 'Hindi', ur: 'Urdu' };
export const GROQ_MODEL = 'openai/gpt-oss-20b';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface ProxyResponse {
  status: number;
  body: Record<string, unknown>;
}

const SAFE = /^[\w:.-]{1,40}$/;

export function parseRequest(raw: unknown): { ok: true; req: Record<string, unknown> } | { ok: false } {
  if (typeof raw !== 'object' || raw === null) return { ok: false };
  const r = raw as Record<string, unknown>;
  if (r.task !== 'coach_explain' || typeof r.lang !== 'string' || !(r.lang in LANG_NAMES)) return { ok: false };
  if (typeof r.action !== 'string' || !ACTIONS.includes(r.action)) return { ok: false };
  for (const k of ['from', 'to', 'band', 'effort']) if (typeof r[k] !== 'string' || !SAFE.test(r[k] as string)) return { ok: false };
  if (!Array.isArray(r.factors) || r.factors.length > 3 || r.factors.some((f) => typeof f !== 'string' || !SAFE.test(f))) return { ok: false };
  if (r.track !== null && (typeof r.track !== 'string' || !SAFE.test(r.track))) return { ok: false };
  return { ok: true, req: r };
}

export async function handleCoachExplain(
  raw: unknown,
  env: { GROQ_API_KEY?: string; GROQ_API_KEYS?: string },
  fetchImpl: typeof fetch = fetch
): Promise<ProxyResponse> {
  const parsed = parseRequest(raw);
  if (!parsed.ok) return { status: 400, body: { error: 'bad_request' } };
  const keys = [...(env.GROQ_API_KEYS ?? '').split(','), env.GROQ_API_KEY ?? ''].map((k) => k.trim()).filter(Boolean);
  if (keys.length === 0) return { status: 503, body: { error: 'not_configured' } };
  const r = parsed.req;
  const system =
    'You rewrite one small, already-approved habit adjustment as a kind, plain, non-judgemental message. ' +
    'Never diagnose, never mention medicine, doses or emergencies, never add advice, never use streak or guilt language. ' +
    'Use only the values given, written with Latin digits 0-9. Phrase it as a gentle suggestion the person can accept, never as something already done. Reply in JSON: {"headline": string (max 100 chars), "body": string (max 380 chars, 2 sentences)}. ' +
    `Write in ${LANG_NAMES[r.lang as string]}. Tone: ${r.tone === 'encouraging' ? 'warm' : 'neutral'}.`;
  const UNIT: Record<string, string> = {
    reduce_goal: 'from/to are difficulty LEVELS from 1 (easiest) to 3. They are not hours, minutes or counts: say "level" or "a smaller step".',
    change_time: 'from/to are clock times (24-hour).',
    add_preshift_reminder: 'to is the clock time of the reminder (24-hour).',
    switch_channel: 'from/to are reminder channel names.',
    swap_behaviour: 'from/to are versions of the activity: default or alt (an indoor or seated version).',
    pause_hydration_fasting: 'Water targets move to the hours after iftar; there is no number.'
  };
  const user = JSON.stringify({ change: r.action, meaning: UNIT[r.action as string], track: r.track, from: r.from, to: r.to, reasons: r.factors, risk: r.band, effort: r.effort });
  try {
    // Free-tier keys are rate-limited: on 429 try the next key, otherwise give up.
    let res: Response | null = null;
    for (const key of keys) {
      res = await fetchImpl(GROQ_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: GROQ_MODEL,
          temperature: 0.2,
          max_tokens: 1000,
          reasoning_effort: 'low',
          response_format: { type: 'json_object' },
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
        })
      });
      if (res.status !== 429) break;
    }
    if (!res) return { status: 503, body: { error: 'not_configured' } };
    if (!res.ok) return { status: res.status === 429 ? 429 : 502, body: { error: 'provider' } };
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const parsedOut = JSON.parse(data.choices?.[0]?.message?.content ?? '{}') as { headline?: unknown; body?: unknown };
    if (typeof parsedOut.headline !== 'string' || typeof parsedOut.body !== 'string') return { status: 502, body: { error: 'invalid' } };
    return { status: 200, body: { headline: parsedOut.headline, body: parsedOut.body, model: GROQ_MODEL } };
  } catch {
    return { status: 502, body: { error: 'provider' } };
  }
}
