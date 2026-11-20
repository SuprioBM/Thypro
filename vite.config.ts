import { loadEnv, type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { handleCoachExplain } from './src/server/coachExplain';

/**
 * Local-only stand-in for the serverless function in api/coach-explain.ts, so the Groq path
 * can be tried with `npm run dev`. GROQ_API_KEY is read from the environment (.env.local) on the
 * server side only and is never sent to the browser. Not used by `vite build` or `vite preview`.
 */
function coachExplainDevProxy(keys: { GROQ_API_KEY?: string; GROQ_API_KEYS?: string }): Plugin {
  return {
    name: 'coach-explain-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/coach-explain', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('{"error":"method_not_allowed"}');
          return;
        }
        let body = '';
        req.on('data', (c: Buffer) => (body += c.toString()));
        req.on('end', () => {
          let parsed: unknown = null;
          try {
            parsed = JSON.parse(body);
          } catch {
            /* handled as bad_request below */
          }
          void handleCoachExplain(parsed, keys).then((out) => {
            res.statusCode = out.status;
            res.end(JSON.stringify(out.body));
          });
        });
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), coachExplainDevProxy({ GROQ_API_KEY: env.GROQ_API_KEY, GROQ_API_KEYS: env.GROQ_API_KEYS })],
    server: {
      port: 3000,
      host: true
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts']
    }
  };
});
