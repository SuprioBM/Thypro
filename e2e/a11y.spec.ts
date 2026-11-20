import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const SHOTS = 'docs/demo-screens/e2e';
mkdirSync(SHOTS, { recursive: true });

const ROUTES = ['today', 'planner', 'coach', 'replay', 'clinicianView', 'settings', 'audit', 'account'];
const LANGS: [string, string][] = [['en', 'ltr'], ['bn', 'ltr'], ['hi', 'ltr'], ['ur', 'rtl']];

async function enterGuest(page: Page, lang: string) {
  await page.goto('/');
  await page.getByRole('button', { name: /continue as guest/i }).first().click();
  await expect(page.locator('#app-main')).toBeVisible();
  await page.locator('select').first().selectOption(lang);
}

test('axe: no serious or critical accessibility violations on the new screens (English)', async ({ page }) => {
  await enterGuest(page, 'en');
  const all: string[] = [];
  for (const route of ROUTES) {
    await page.goto(`/#/app/${route}`);
    await page.waitForTimeout(1000); // entrance animations
    const results = await new AxeBuilder({ page }).include('#app-main').analyze();
    for (const v of results.violations.filter((x) => x.impact === 'serious' || x.impact === 'critical')) {
      all.push(`${route}: ${v.id} (${v.nodes.length}) ${v.nodes.slice(0, 2).map((x) => x.html.slice(0, 110) + ' ' + (x.any[0]?.message ?? '').slice(0, 90)).join(' || ')}`);
    }
  }
  expect(all).toEqual([]);
});

test('long Bangla, Hindi and Urdu text keeps the layout intact (no horizontal overflow) and sets direction', async ({ page }, info) => {
  for (const [lang, dir] of LANGS) {
    await enterGuest(page, lang);
    await expect(page.locator('.app-root')).toHaveAttribute('dir', dir);
    for (const route of ['planner', 'coach', 'replay', 'clinicianView']) {
      await page.goto(`/#/app/${route}`);
      await page.waitForTimeout(900);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(over, `${lang}/${route} overflow`).toBeLessThanOrEqual(1);
    }
    await page.goto('/#/app/planner');
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${SHOTS}/${info.project.name}-lang-${lang}-planner.png` });
    await page.goto('/#/app/coach');
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${SHOTS}/${info.project.name}-lang-${lang}-coach.png` });
  }
});

test('keyboard: the planner can be operated without a mouse and focus is visible', async ({ page }) => {
  await enterGuest(page, 'en');
  await page.goto('/#/app/planner');
  await page.waitForTimeout(800);
  const done = page.getByRole('button', { name: /^mark done$/i }).first();
  await done.focus();
  const outline = await done.evaluate((el) => getComputedStyle(el).outlineStyle + '|' + getComputedStyle(el).outlineWidth + '|' + getComputedStyle(el).boxShadow);
  expect(outline).not.toBe('none|0px|none');
  await page.keyboard.press('Enter');
  await expect(page.getByText(/done today/i).first()).toBeVisible();
});

test('reduced motion: entrance animations are disabled', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await enterGuest(page, 'en');
  await page.goto('/#/app/planner');
  await page.waitForTimeout(800);
  const anim = await page.locator('.stagger-in').first().evaluate((el) => getComputedStyle(el).animationName);
  expect(anim).toBe('none');
  await ctx.close();
});
