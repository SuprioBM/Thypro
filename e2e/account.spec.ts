import { expect, test, type Browser, type Page } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

/**
 * Real end-to-end test against the Supabase project in .env.local. It creates two throwaway users with a
 * transient admin key (fetched through the management API, kept only in memory), drives the real UI,
 * checks row-level security over the REST API, and deletes the users afterwards.
 * Skipped automatically when the credentials are not present.
 */
function env(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  if (!existsSync('.env.local')) return undefined;
  return readFileSync('.env.local', 'utf8').match(new RegExp(`^${name}=(.*)$`, 'm'))?.[1].trim();
}
const REF = env('SUPABASE_PROJECT_REF');
const TOKEN = env('SUPABASE_ACCESS_TOKEN');
const URL_ = REF ? `https://${REF}.supabase.co` : '';
const PUB = env('VITE_SUPABASE_PUBLISHABLE_KEY') ?? (existsSync('.env.development.local') ? readFileSync('.env.development.local', 'utf8').match(/^VITE_SUPABASE_PUBLISHABLE_KEY=(.*)$/m)?.[1].trim() : undefined);

interface TestUser { id: string; email: string; session: Record<string, unknown>; access: string }

let service = '';
const created: string[] = [];

async function admin(path: string, init: RequestInit = {}) {
  const res = await fetch(`${URL_}/auth/v1/admin${path}`, { ...init, headers: { apikey: service, Authorization: `Bearer ${service}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) } });
  return res;
}

async function makeUser(tag: string): Promise<TestUser> {
  const email = `e2e-${tag}-${Date.now()}@example.com`;
  const made = await (await admin('/users', { method: 'POST', body: JSON.stringify({ email, email_confirm: true }) })).json();
  created.push(made.id);
  const link = await (await admin('/generate_link', { method: 'POST', body: JSON.stringify({ type: 'magiclink', email }) })).json();
  const verified = await (await fetch(`${URL_}/auth/v1/verify`, { method: 'POST', headers: { apikey: PUB!, 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'magiclink', token_hash: link.hashed_token }) })).json();
  expect(verified.access_token, JSON.stringify(verified).slice(0, 200)).toBeTruthy();
  return { id: made.id, email, session: verified, access: verified.access_token };
}

async function rest(user: TestUser, path: string, init: RequestInit = {}) {
  return fetch(`${URL_}/rest/v1/${path}`, { ...init, headers: { apikey: PUB!, Authorization: `Bearer ${user.access}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) } });
}

async function openAs(browser: Browser, user: TestUser): Promise<Page> {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [`sb-${REF}-auth-token`, JSON.stringify(user.session)] as const);
  const page = await ctx.newPage();
  await page.goto('/#/app/account');
  return page;
}

test.describe('accounts against the real Supabase project', () => {
  test.skip(!REF || !TOKEN || !PUB, 'Supabase credentials not available');
  // eslint-disable-next-line no-empty-pattern -- Playwright requires a destructured first argument
  test.beforeAll(async ({}, info) => {
    test.skip(info.project.name !== 'desktop', 'one run is enough');
    const keys = await (await fetch(`https://api.supabase.com/v1/projects/${REF}/api-keys?reveal=true`, { headers: { Authorization: `Bearer ${TOKEN}` } })).json();
    service = (keys as { name: string; api_key: string }[]).find((k) => k.name === 'service_role')?.api_key ?? '';
    expect(service).not.toBe('');
  });
  test.afterAll(async () => {
    for (const id of created) await admin(`/users/${id}`, { method: 'DELETE' });
  });

  test('sync, audit mirror, sharing with consent, isolation and deletion', async ({ browser }) => {
    test.setTimeout(120_000);
    const a = await makeUser('a');
    const b = await makeUser('b');
    const problems: string[] = [];

    // --- A signs in (stored session), the account loads and saves
    const pageA = await openAs(browser, a);
    pageA.on('console', (m) => m.type() === 'error' && problems.push(m.text()));
    pageA.on('response', (r) => r.status() >= 400 && problems.push(`${r.status()} ${r.request().method()} ${r.url().replace(URL_, '')}`));
    await expect(pageA.getByText(`Signed in as ${a.email}`)).toBeVisible({ timeout: 20_000 });
    await pageA.goto('/#/app/coach');
    await pageA.getByRole('switch', { name: /automatic adjustment/i }).first().click();
    await pageA.goto('/#/app/account');
    await expect(pageA.getByText(/saved to your account/i)).toBeVisible({ timeout: 15_000 });

    // the state row and the mirrored audit entry exist, and only A can read them
    const stateA = await (await rest(a, `user_state?select=user_id,schema`)).json();
    expect(stateA).toHaveLength(1);
    await expect
      .poll(async () => ((await (await rest(a, `audit_events?select=reason_code`)).json()) as { reason_code: string }[]).map((r) => r.reason_code), { timeout: 15_000 })
      .toContain('coach_auto_on');
    expect(await (await rest(b, `user_state?select=user_id&user_id=eq.${a.id}`)).json()).toEqual([]);
    expect(await (await rest(b, `audit_events?select=id`)).json()).toEqual([]);

    // the audit log cannot be edited or deleted, even by its owner, through the API
    const upd = await rest(a, `audit_events?reason_code=eq.coach_auto_on`, { method: 'PATCH', body: JSON.stringify({ result: 'x' }) });
    expect(upd.status).toBeGreaterThanOrEqual(400);
    const del = await rest(a, `audit_events?reason_code=eq.coach_auto_on`, { method: 'DELETE' });
    expect(del.status).toBeGreaterThanOrEqual(400);
    // a person cannot make themselves a sponsor or clinician
    const promote = await rest(a, `profiles?id=eq.${a.id}`, { method: 'PATCH', body: JSON.stringify({ role: 'sponsor' }) });
    expect(promote.status).toBeGreaterThanOrEqual(400);

    // --- A shares goal + weekly completion with B (family), through the UI
    await pageA.getByLabel('Their email').fill(b.email);
    await pageA.getByRole('button', { name: /^share$/i }).click();
    await expect(pageA.getByText(b.email)).toBeVisible();
    await expect(pageA.getByText(/waiting for them to accept/i)).toBeVisible();

    // --- B accepts and views: only the allowed fields come back
    const pageB = await openAs(browser, b);
    await expect(pageB.getByText(`Signed in as ${b.email}`)).toBeVisible({ timeout: 20_000 });
    await expect(pageB.getByText(/you are family/i)).toBeVisible({ timeout: 15_000 });
    await pageB.getByRole('button', { name: /^accept$/i }).click();
    await pageB.getByRole('button', { name: /^view$/i }).click();
    await expect(pageB.getByText(/done days this week/i)).toBeVisible({ timeout: 15_000 });
    await expect(pageB.getByText(/how they felt/i)).toHaveCount(0); // not consented

    // revocation is immediate
    await pageA.getByRole('button', { name: /stop sharing/i }).click();
    await expect(pageA.getByText(/^stopped$/i).first()).toBeVisible();
    const afterRevoke = await fetch(`${URL_}/rest/v1/rpc/shared_view`, { method: 'POST', headers: { apikey: PUB!, Authorization: `Bearer ${b.access}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_owner: a.id }) });
    expect(afterRevoke.status).toBeGreaterThanOrEqual(400);

    // --- A deletes the account: every row is gone
    await pageA.getByRole('button', { name: /delete my account/i }).first().click();
    await pageA.getByRole('button', { name: /yes, delete/i }).click();
    await expect.poll(async () => (await admin(`/users/${a.id}`)).status, { timeout: 15_000 }).toBe(404);
    created.splice(created.indexOf(a.id), 1);

    // Expected: the logout request after the account was deleted server-side (its user no longer exists).
    const unexpected = problems.filter((p) => !/favicon|POST \/auth\/v1\/logout|status of 403/.test(p));
    expect(unexpected, problems.join('\n')).toEqual([]);
  });
});
