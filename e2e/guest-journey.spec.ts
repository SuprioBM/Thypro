import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const SHOTS = 'docs/demo-screens/e2e';
mkdirSync(SHOTS, { recursive: true });

/** Collects anything the browser would show in its console as a problem. */
function watch(page: Page) {
  const problems: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || (m.type() === 'warning' && /key|hydrat|validateDOMNesting/i.test(m.text()))) problems.push(`console ${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));
  page.on('response', (r) => {
    if (r.status() >= 400) problems.push(`http ${r.status()}: ${r.url()}`);
  });
  return problems;
}

async function noHorizontalScroll(page: Page, where: string) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(over, `horizontal overflow on ${where}`).toBeLessThanOrEqual(1);
}

const guestButton = (page: Page) => page.getByRole('button', { name: /continue as guest/i }).first();

test('guest journey: landing, guest, language, goal, planner, technique, coach, replay, controls, sponsor, export', async ({ page }, info) => {
  const tag = info.project.name;
  const problems = watch(page);
  const shot = async (name: string) => {
    await page.waitForTimeout(900); // let entrance animations finish
    await page.screenshot({ path: `${SHOTS}/${tag}-${name}.png`, fullPage: false });
  };

  // 1. Landing and guest entry
  await page.goto('/');
  await expect(guestButton(page)).toBeVisible();
  await shot('01-landing');
  await guestButton(page).click();
  await expect(page.locator('#app-main')).toBeVisible();
  await shot('02-guest-today');

  // 2. Language switch (Urdu = RTL), then back to English
  const select = page.locator('select').first();
  await select.selectOption('ur');
  await expect(page.locator('.app-root')).toHaveAttribute('dir', 'rtl');
  await noHorizontalScroll(page, 'today (urdu)');
  await shot('03-urdu-rtl');
  await select.selectOption('en');
  await expect(page.locator('.app-root')).toHaveAttribute('dir', 'ltr');

  // 3. Goal setup opens
  await page.goto('/#/app/setup');
  await expect(page.locator('#app-main')).toBeVisible();
  await shot('04-goal');

  // 4. Planner: four tracks, mark one done, reassurance about total days
  await page.goto('/#/app/planner');
  await expect(page.getByRole('heading', { name: /daily habit planner/i })).toBeVisible();
  for (const name of ['Nutrition', 'Sleep', 'Hydration', 'Activity']) await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  await expect(page.getByText(/total days are safe/i).first()).toBeVisible();
  await noHorizontalScroll(page, 'planner');
  await page.getByRole('button', { name: /^mark done$/i }).first().click();
  await expect(page.getByText(/done today/i).first()).toBeVisible();
  await shot('05-planner');

  // 5. Technique card
  await page.getByRole('button', { name: /why this action/i }).first().click();
  await expect(page.getByText(/behaviour change technique taxonomy/i).first()).toBeVisible();
  await shot('06-technique');

  // 6. Coach: honest line, one suggestion, accept
  await page.goto('/#/app/coach');
  await expect(page.getByText('Estimated from your patterns, not a diagnosis. Starts rule-based; personal learning begins in the pilot.')).toBeVisible();
  await expect(page.getByRole('switch', { name: /comeback coach is on/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^accept$/i })).toBeVisible({ timeout: 10_000 });
  await noHorizontalScroll(page, 'coach');
  await shot('07-coach-proposal');
  await page.getByRole('button', { name: /^accept$/i }).click();
  await expect(page.getByText(/accepted/i).first()).toBeVisible();

  // 7. Week replay with and without coach
  await page.goto('/#/app/replay');
  await expect(page.getByText(/SIMULATION/).first()).toBeVisible();
  await page.getByRole('button', { name: /replay with coach/i }).click();
  await expect(page.getByText(/Coach suggests/i).first()).toBeVisible();
  await noHorizontalScroll(page, 'replay');
  await shot('08-replay-with');
  await page.getByRole('button', { name: /replay without coach/i }).click();
  await expect(page.getByText(/Automatic step-down/i).first()).toBeVisible();
  await shot('09-replay-without');

  // 8. Control panel
  await page.goto('/#/app/settings');
  await expect(page.locator('#app-main')).toBeVisible();
  await noHorizontalScroll(page, 'settings');
  await shot('10-controls');

  // 9. Sponsor view
  await page.goto('/#/app/sponsor');
  await expect(page.locator('#app-main')).toBeVisible();
  await noHorizontalScroll(page, 'sponsor');
  await shot('11-sponsor');

  // 10. Export
  await page.goto('/#/app/export');
  await expect(page.locator('#app-main')).toBeVisible();
  await noHorizontalScroll(page, 'export');
  await shot('12-export');

  // 11. Clinician demo view and audit
  await page.goto('/#/app/clinicianView');
  await expect(page.getByText(/Demo view/i).first()).toBeVisible();
  await shot('13-clinician');
  await page.goto('/#/app/audit');
  await expect(page.locator('#app-main')).toBeVisible();

  expect(problems, problems.join('\n')).toEqual([]);
});

test('guest mode stores nothing: no localStorage keys, no cookies', async ({ page, context }) => {
  await page.goto('/');
  await guestButton(page).click();
  await expect(page.locator('#app-main')).toBeVisible();
  await page.goto('/#/app/planner');
  await page.getByRole('button', { name: /^mark done$/i }).first().click();
  const stored = await page.evaluate(() => ({ local: Object.keys(localStorage), cookie: document.cookie }));
  expect(stored.local.filter((k) => k.startsWith('thypro'))).toEqual([]);
  expect(stored.cookie).toBe('');
  expect(await context.cookies()).toEqual([]);
});

test('Turn Off Coach switch silences the coach', async ({ page }) => {
  await page.goto('/');
  await guestButton(page).click();
  await page.goto('/#/app/coach');
  await page.getByRole('switch', { name: /comeback coach is on/i }).click();
  await expect(page.getByText(/the coach is off/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /^accept$/i })).toHaveCount(0);
});

test('landing page fits the viewport and names Abu Dhabi', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/Abu Dhabi/).first()).toBeVisible();
  await noHorizontalScroll(page, 'landing');
});

test('local (own-plan) mode: empty states, consent defaults, planner and coach, no console errors', async ({ page }, info) => {
  const problems = watch(page);
  await page.goto('/#/app');
  await page.getByRole('button', { name: /start my own plan/i }).click();
  await expect(page.locator('#app-main')).toBeVisible();
  // Planner needs a goal first.
  await page.goto('/#/app/planner');
  await expect(page.getByText(/set one goal first/i)).toBeVisible();
  // Coach starts with nothing authorised: it must not read anything.
  await page.goto('/#/app/coach');
  await expect(page.getByText(/no signals shared yet/i)).toBeVisible();
  for (const name of ['Check-ins', 'Planner entries', 'Barrier answers', 'Steps (device)']) {
    await expect(page.getByRole('switch', { name })).toHaveAttribute('aria-checked', 'false');
  }
  // Replay and clinician views have honest empty states and no fake data.
  await page.goto('/#/app/clinicianView');
  await expect(page.getByText(/sharing is off/i)).toBeVisible();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${SHOTS}/${info.project.name}-local-empty-states.png` });
  // Only the person's own device storage is used, and only in local mode.
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys.every((k) => k.startsWith('thypro'))).toBe(true);
  expect(problems, problems.join('\n')).toEqual([]);
});
