// Runs a .sql file against the Supabase project through the Management API (no direct DB connection needed).
// Usage: node scripts/db-run.mjs supabase/migrations/<file>.sql
// Needs SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF in the environment or .env.local. Never commit those.
import { readFileSync, existsSync } from 'node:fs';

function env(name) {
  if (process.env[name]) return process.env[name];
  if (existsSync('.env.local')) {
    const m = readFileSync('.env.local', 'utf8').match(new RegExp(`^${name}=(.*)$`, 'm'));
    if (m) return m[1].trim();
  }
  return undefined;
}

const file = process.argv[2];
const token = env('SUPABASE_ACCESS_TOKEN');
const ref = env('SUPABASE_PROJECT_REF');
if (!file || !token || !ref) {
  console.error('usage: node scripts/db-run.mjs <file.sql>   (needs SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF)');
  process.exit(2);
}
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: readFileSync(file, 'utf8') })
});
const text = await res.text();
console.log(res.status, text.slice(0, 1500));
process.exit(res.ok ? 0 : 1);
