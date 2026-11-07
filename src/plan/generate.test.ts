import { describe, expect, it } from 'vitest';
import type { GoalSetup, ScreeningKey, Tri } from '../domain/types';
import { LANGS, SCREENING_KEYS } from '../domain/types';
import { SAFETY_RULES_CONFIG } from '../safety/rules.config';
import { generatePlan, startMinutes } from './generate';
import { TEMPLATE_LIBRARY, getTemplate, resolvePlanItem } from './templates';

const allNo = (): Record<ScreeningKey, Tri> =>
  Object.fromEntries(SCREENING_KEYS.map((k) => [k, 'no'])) as Record<ScreeningKey, Tri>;

const setup = (over: Partial<GoalSetup> = {}): GoalSetup => ({
  goalType: 'walk',
  usualTime: '19:30',
  preferences: [],
  dietary: [],
  allergyState: 'none',
  allergies: [],
  baseline: { walkMinutesPerDay: 10, sleepHours: 'unknown', mealsPerDay: 'unknown', medicineTimesPerDay: 'unknown' },
  ownTargets: {},
  screening: allNo(),
  ...over
});

const opts = { planId: 'p1', version: 1, nowIso: '2026-11-07T08:00:00.000Z' };

describe('generatePlan', () => {
  it('builds a versioned plan from an approved template and records the template id', () => {
    const r = generatePlan(setup(), opts);
    expect(r.status).toBe('ok');
    if (r.status !== 'ok') return;
    expect(r.plan.templateId).toBe('tpl-activity-walk');
    expect(r.plan.templateVersion).toBe('1.0.0');
    expect(r.plan.version).toBe(1);
    expect(r.plan.ruleVersion).toBe(SAFETY_RULES_CONFIG.version);
    expect(r.plan.items.map((i) => i.templateItemId)).toEqual(['walk', 'cool', 'listen']);
    expect(r.output.result).toBe('pass');
  });

  it('is deterministic for the same input', () => {
    expect(generatePlan(setup(), opts)).toEqual(generatePlan(setup(), opts));
  });

  it.each(['walk', 'sleep', 'eating', 'medicine'] as const)('has a template for the %s goal', (goalType) => {
    const r = generatePlan(setup({ goalType }), opts);
    expect(r.status).toBe('ok');
    if (r.status === 'ok') expect(r.plan.items.length).toBeGreaterThan(0);
  });

  it('blocks and creates NO plan when screening says yes', () => {
    const r = generatePlan(setup({ screening: { ...allNo(), pregnancy: 'yes' } }), opts);
    expect(r.status).toBe('blocked');
    expect('plan' in r).toBe(false);
    expect(r.input.route).toBe('clinician');
  });

  it('blocks extreme self-set targets', () => {
    expect(generatePlan(setup({ ownTargets: { caloriesPerDay: 700 } }), opts).status).toBe('blocked');
    expect(generatePlan(setup({ ownTargets: { fastingHoursPerDay: 22 } }), opts).status).toBe('blocked');
    expect(generatePlan(setup({ ownTargets: { exerciseMinutesPerDay: 180 } }), opts).status).toBe('blocked');
  });

  it('keeps unknown as unknown: conservative start plus a visible caution', () => {
    const r = generatePlan(
      setup({ baseline: { walkMinutesPerDay: 'unknown', sleepHours: 'unknown', mealsPerDay: 'unknown', medicineTimesPerDay: 'unknown' } }),
      opts
    );
    expect(r.status).toBe('ok');
    if (r.status !== 'ok') return;
    expect(r.plan.targets.exerciseMinutesPerDay).toBe(10);
    expect(r.plan.cautions).toContain('baseline_unknown');
  });

  it('carries a caution when screening answers are unknown', () => {
    const r = generatePlan(setup({ screening: { ...allNo(), kidneyDisease: 'unknown' } }), opts);
    expect(r.status === 'ok' && r.plan.cautions.includes('screening_incomplete')).toBe(true);
  });

  it('never starts above the cap and a restart is smaller', () => {
    expect(startMinutes(200, false)).toBe(30);
    expect(startMinutes(0, false)).toBe(10);
    expect(startMinutes(20, true)).toBe(5);
    const r = generatePlan(setup(), { ...opts, version: 2, restart: true });
    expect(r.status).toBe('ok');
    if (r.status !== 'ok') return;
    expect(r.plan.restart).toBe(true);
    expect(r.plan.version).toBe(2);
    expect(r.plan.targets.exerciseMinutesPerDay).toBe(5);
    expect(r.plan.items.map((i) => i.templateItemId)).toEqual(['walk', 'listen']);
  });

  it('picks food wording that respects vegetarian practice and allergies', () => {
    const variant = (over: Partial<GoalSetup>) => {
      const r = generatePlan(setup({ goalType: 'eating', ...over }), opts);
      if (r.status !== 'ok') throw new Error('expected ok');
      return r.plan.items.find((i) => i.templateItemId === 'protein')!.variant;
    };
    expect(variant({})).toBe('default');
    expect(variant({ dietary: ['vegetarian'] })).toBe('plant');
    expect(variant({ allergyState: 'listed', allergies: ['fish'] })).toBe('plant');
    expect(variant({ allergyState: 'listed', allergies: ['fish', 'legumes'] })).toBe('generic');
    expect(variant({ dietary: ['vegetarian'], allergyState: 'listed', allergies: ['legumes'] })).toBe('generic');
  });
});

describe('template library', () => {
  it('has text for every language on every item, with a reason', () => {
    for (const t of TEMPLATE_LIBRARY) {
      expect(t.reviewStatus).toBe('pending_clinician_review');
      expect(t.guidanceSource.name).toBeTruthy();
      for (const item of t.items) {
        for (const v of item.variants) {
          for (const lang of LANGS) {
            expect(v.text[lang].title.trim().length, `${t.id}/${item.id}/${v.id}/${lang} title`).toBeGreaterThan(5);
            expect(v.text[lang].reason.trim().length, `${t.id}/${item.id}/${v.id}/${lang} reason`).toBeGreaterThan(5);
          }
        }
      }
    }
  });

  it('contains no calorie, fasting or dose numbers in any English wording', () => {
    const bad = /\b(kcal|calorie|calories|fast(ing)?\b|\d+\s?(mg|ml|g)\b)/i;
    for (const t of TEMPLATE_LIBRARY) {
      for (const item of t.items) {
        for (const v of item.variants) {
          expect(bad.test(v.text.en.title), `${t.id}/${item.id}`).toBe(false);
        }
      }
    }
  });

  it('medicine template never changes or suggests medication, and says to ask a clinician', () => {
    const t = getTemplate('medicine');
    const ask = t.items.find((i) => i.id === 'ask')!.variants[0].text.en.title;
    expect(ask).toMatch(/never change, stop or add/i);
  });

  it('every placeholder is filled when a plan item is resolved', () => {
    const r = generatePlan(setup(), opts);
    if (r.status !== 'ok') throw new Error('expected ok');
    for (const lang of LANGS) {
      for (const item of r.plan.items) {
        const text = resolvePlanItem(r.plan, item, lang)!;
        expect(text.title).not.toMatch(/\{\w+\}/);
        expect(text.reason).not.toMatch(/\{\w+\}/);
        expect(text.templateId).toBe('tpl-activity-walk');
      }
    }
  });
});
