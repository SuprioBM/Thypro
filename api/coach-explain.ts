/**
 * Serverless entry (Vercel-style Node function). Deploy with GROQ_API_KEY set in the host's
 * environment settings; never commit the key. The browser calls it only when
 * VITE_COACH_API_URL is set (e.g. https://thypro.app/api/coach-explain).
 */
import { handleCoachExplain } from '../src/server/coachExplain';

interface Req {
  method?: string;
  body?: unknown;
}
interface Res {
  status(code: number): Res;
  setHeader(k: string, v: string): void;
  json(body: unknown): void;
}

export default async function handler(req: Req, res: Res): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  const out = await handleCoachExplain(req.body, { GROQ_API_KEY: process.env.GROQ_API_KEY, GROQ_API_KEYS: process.env.GROQ_API_KEYS });
  res.status(out.status).json(out.body);
}
