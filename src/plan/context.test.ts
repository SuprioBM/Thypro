import { describe, expect, it } from 'vitest';
import type { ContextProfile, GoalSetup, ScreeningKey, Tri } from '../domain/types';
import { DEFAULT_CONTEXT, GOAL_TYPES, LANGS, SCREENING_KEYS } from '../domain/types';
import { evaluatePlan, evaluateSafety } from '../safety/engine';
import { SAFETY_RULES_CONFIG } from '../safety/rules.config';
import { TECHNIQUES, TECHNIQUE_IDS } from '../techniques/techniques';
import { generatePlan, minutesForLevel } from './generate';
import { TEMPLATE_LIBRARY, getTemplate, maxLevel, resolvePlanItem } from './templates';

const allNo = (): Record<ScreeningKey, Tri> =>
  Object.fromEntries(SCREENING_KEYS.map((k) => [k, 'no'])) as Record<ScreeningKey, Tri>;

const setup = (over: Partial<GoalSetup> = {}, context: Partial<ContextProfile> = {}): GoalSetup => ({
  goalType: 'walk',
  usualTime: '19:30',
  preferences: [],
  dietary: [],
  allergyState: 'none',
  allergies: [],
  baseline: { walkMinutesPerDay: 'unknown', sleepHours: 'unknown', mealsPerDay: 'unknown', medicineTimesPerDay: 'unknown' },
  ownTargets: {},
  screening: allNo(),
  context: { ...DEFAULT_CONTEXT, ...context },
  ...over
});

const opts = { planId: 'p', version: 1, nowIso: '2026-11-14T08:00:00.000Z' };
const okPlan = (s: GoalSetup, level?: number) => {
  const r = generatePlan(s, { ...opts, level });
  if (r.status !== 'ok') throw new Error('expected ok');
  return r.plan;
};
const variantOf = (s: GoalSetup, itemId: string, level?: number) =>
  okPlan(s, level).items.find((i) => i.templateItemId === itemId)?.variant;

describe('tobacco is referral-only', () => {
  it('generates only referral and support steps, with no targets', () => {
    const plan = okPlan(setup({ goalType: 'tobacco' }));
    expect(plan.items.map((i) => i.templateItemId).sort()).toEqual(['noadvice', 'refer', 'support']);
    expect(plan.targets).toEqual({});
    expect(plan.cautions).toContain('tobacco_referral');
    expect(getTemplate('tobacco').referralOnly).toBe(true);
  });

  it('every tobacco step stays referral-only at every level', () => {
    for (let level = 1; level <= maxLevel('tobacco'); level++) {
      const plan = okPlan(setup({ goalType: 'tobacco' }), level);
      expect(plan.items.some((i) => i.templateItemId === 'refer')).toBe(true);
      expect(plan.items.some((i) => i.templateItemId === 'noadvice')).toBe(true);
      expect(evaluatePlan(plan).result).toBe('pass');
    }
  });

  it('blocks a tobacco plan that contains anything but approved referral items, or any target', () => {
    const plan = okPlan(setup({ goalType: 'tobacco' }));
    const tampered = { ...plan, items: [...plan.items, { id: 'x', templateItemId: 'nicotine-patch-dose', params: {}, variant: 'default' }] };
    const d = evaluatePlan(tampered);
    expect(d.result).toBe('blocked');
    expect(d.breaches[0]).toMatchObject({ ruleId: 'T-REFERRAL-ONLY', reasonCode: 'tobacco_referral_only' });
    expect(evaluatePlan({ ...plan, targets: { exerciseMinutesPerDay: 10 } }).result).toBe('blocked');
  });

  it('never mentions a dose or a quit medicine name in any language', () => {
    const banned = /\b\d+\s?mg\b|varenicline|bupropion|patch(es)? of|gum of/i;
    for (const item of getTemplate('tobacco').items) {
      for (const v of item.variants) for (const lang of LANGS) expect(banned.test(v.text[lang].title)).toBe(false);
    }
  });
});

describe('safety engine covers all four behaviours', () => {
  it('lists at least one existing rule for movement, nutrition, sleep and tobacco', () => {
    const known = new Set([
      ...SAFETY_RULES_CONFIG.range.map((r) => r.id),
      ...SAFETY_RULES_CONFIG.screening.map((r) => r.id),
      'T-REFERRAL-ONLY'
    ]);
    for (const [behaviour, ids] of Object.entries(SAFETY_RULES_CONFIG.coverage)) {
      expect(ids.length, behaviour).toBeGreaterThan(0);
      for (const id of ids) expect(known.has(id), `${behaviour}:${id}`).toBe(true);
    }
  });

  it('screening still blocks every goal, including tobacco', () => {
    for (const goalType of GOAL_TYPES) {
      const r = generatePlan(setup({ goalType, screening: { ...allNo(), pregnancy: 'yes' } }), opts);
      expect(r.status, goalType).toBe('blocked');
    }
    expect(evaluateSafety({ ownTargets: {}, screening: allNo() }).result).toBe('pass');
  });
});

describe('context profile shapes the plan', () => {
  it('a night-shift worker gets a shorter walk that fits around the shift', () => {
    const plan = okPlan(setup({ baseline: { walkMinutesPerDay: 25, sleepHours: 'unknown', mealsPerDay: 'unknown', medicineTimesPerDay: 'unknown' } }, { shiftWork: 'night' }), 3);
    expect(plan.items.find((i) => i.templateItemId === 'walk')?.variant).toBe('shiftShort');
    expect(plan.targets.exerciseMinutesPerDay).toBeLessThanOrEqual(10);
  });

  it('Ramadan moves the walk to after iftar and adds suhoor/iftar eating guidance', () => {
    expect(variantOf(setup({}, { fasting: 'ramadan' }), 'walk')).toBe('afterIftar');
    const eat = okPlan(setup({ goalType: 'eating' }, { fasting: 'ramadan' }));
    expect(eat.items.map((i) => i.templateItemId)).toContain('ramadanEat');
  });

  it('a mobility need gives a seated or supported version', () => {
    expect(variantOf(setup({}, { access: ['mobility'] }), 'walk')).toBe('seated');
  });

  it('mild weather drops the heat tip; unknown or hot keeps it', () => {
    expect(okPlan(setup({}, { heat: 'mild' })).items.map((i) => i.templateItemId)).not.toContain('cool');
    expect(okPlan(setup({}, { heat: 'hot' })).items.map((i) => i.templateItemId)).toContain('cool');
    expect(okPlan(setup()).items.map((i) => i.templateItemId)).toContain('cool');
  });

  it('a tight food budget adds low-cost choices that respect diet and allergies', () => {
    expect(variantOf(setup({ goalType: 'eating' }, { foodBudget: 'low' }), 'budget')).toBe('default');
    expect(variantOf(setup({ goalType: 'eating', dietary: ['vegetarian'] }, { foodBudget: 'low' }), 'budget')).toBe('plant');
    expect(variantOf(setup({ goalType: 'eating', allergyState: 'listed', allergies: ['egg', 'legumes'] }, { foodBudget: 'low' }), 'budget')).toBe('generic');
    expect(variantOf(setup({ goalType: 'eating' }), 'budget')).toBeUndefined();
  });

  it('shift workers get a sleep step for after night shifts', () => {
    expect(okPlan(setup({ goalType: 'sleep' }, { shiftWork: 'rotating' })).items.map((i) => i.templateItemId)).toContain('shiftSleep');
  });

  it('unknown context never picks a context-specific variant', () => {
    expect(variantOf(setup(), 'walk')).toBe('default');
  });
});

describe('ladder levels in plans', () => {
  it('level 1 is always the smallest, and minutes only rise level by level up to the cap', () => {
    expect(minutesForLevel('unknown', 1)).toBe(5);
    expect(minutesForLevel('unknown', 2)).toBe(10);
    expect(minutesForLevel('unknown', 3)).toBe(15);
    expect(minutesForLevel(28, 4)).toBe(30);
    for (const goalType of GOAL_TYPES) {
      const sizes = Array.from({ length: maxLevel(goalType) }, (_, i) => okPlan(setup({ goalType }), i + 1).items.length);
      for (let i = 1; i < sizes.length; i++) expect(sizes[i], goalType).toBeGreaterThanOrEqual(sizes[i - 1]);
    }
  });

  it('records the level on the plan and clamps out-of-range levels', () => {
    expect(okPlan(setup(), 3).level).toBe(3);
    expect(okPlan(setup(), 99).level).toBe(maxLevel('walk'));
    expect(okPlan(setup(), -4).level).toBe(1);
  });
});

describe('technique cards', () => {
  it('every plan action carries a known technique', () => {
    for (const t of TEMPLATE_LIBRARY) for (const item of t.items) expect(TECHNIQUE_IDS).toContain(item.technique);
  });

  it('every technique has a rationale, limits and a source in every language', () => {
    for (const id of TECHNIQUE_IDS) {
      expect(TECHNIQUES[id].source.label).toBeTruthy();
      for (const lang of LANGS) {
        const t = TECHNIQUES[id].text[lang];
        expect(t.name && t.rationale && t.limits, `${id}/${lang}`).toBeTruthy();
      }
    }
  });

  it('resolved plan items expose their technique', () => {
    const plan = okPlan(setup());
    expect(resolvePlanItem(plan, plan.items[0], 'bn')?.technique).toBe('actionPlanning');
  });

  it('the incentives technique rules out money, prizes and leaderboards', () => {
    expect(TECHNIQUES.incentives.text.en.limits).toMatch(/no money, prizes, rankings or leaderboards/i);
  });
});
