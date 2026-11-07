import { describe, expect, it } from 'vitest';
import type { CheckIn, ScreeningKey, Tri } from '../domain/types';
import { SCREENING_KEYS } from '../domain/types';
import { evaluateCheckin, evaluatePlan, evaluateSafety, isPlanDisplayable } from './engine';
import { SAFETY_RULES_CONFIG } from './rules.config';

const allNo = (): Record<ScreeningKey, Tri> =>
  Object.fromEntries(SCREENING_KEYS.map((k) => [k, 'no'])) as Record<ScreeningKey, Tri>;

const checkin = (over: Partial<CheckIn> = {}): CheckIn => ({
  id: 'c',
  date: '2026-11-07',
  status: 'done',
  feel: 'good',
  redFlags: [],
  input: 'text',
  createdAt: '2026-11-07T10:00:00.000Z',
  ...over
});

describe('safety config', () => {
  it('is versioned and every rule has an owner', () => {
    expect(SAFETY_RULES_CONFIG.version).toMatch(/^\d{4}\.\d+\.\d+$/);
    expect(SAFETY_RULES_CONFIG.owner).toBeTruthy();
    for (const r of [...SAFETY_RULES_CONFIG.range, ...SAFETY_RULES_CONFIG.screening]) {
      expect(r.owner).toBeTruthy();
      expect(r.id).toBeTruthy();
    }
    expect(SAFETY_RULES_CONFIG.reviewStatus).toBe('pending_clinical_review');
  });
});

describe('evaluateSafety — hard limits', () => {
  it('passes ordinary input', () => {
    const d = evaluateSafety({ ownTargets: { caloriesPerDay: 2000, exerciseMinutesPerDay: 30 }, screening: allNo() });
    expect(d.result).toBe('pass');
    expect(d.route).toBe('none');
    expect(d.breaches).toEqual([]);
    expect(d.ruleVersion).toBe(SAFETY_RULES_CONFIG.version);
  });

  it.each([
    ['caloriesPerDay', 800, 'caloriesPerDay_too_low'],
    ['caloriesPerDay', 5500, 'caloriesPerDay_too_high'],
    ['fastingHoursPerDay', 20, 'fastingHoursPerDay_too_high'],
    ['exerciseMinutesPerDay', 150, 'exerciseMinutesPerDay_too_high'],
    ['exerciseMinutesPerWeek', 800, 'exerciseMinutesPerWeek_too_high'],
    ['sleepHours', 3, 'sleepHours_too_low'],
    ['sleepHours', 14, 'sleepHours_too_high']
  ] as const)('blocks extreme %s=%s and routes to a clinician', (key, value, code) => {
    const d = evaluateSafety({ ownTargets: { [key]: value }, screening: allNo() });
    expect(d.result).toBe('blocked');
    expect(d.route).toBe('clinician');
    expect(d.breaches.map((b) => b.reasonCode)).toContain(code);
  });

  it('allows values exactly on the limit', () => {
    const d = evaluateSafety({
      ownTargets: { caloriesPerDay: 1200, fastingHoursPerDay: 16, exerciseMinutesPerDay: 90, sleepHours: 6 },
      screening: allNo()
    });
    expect(d.result).toBe('pass');
  });

  it('treats a non-finite target as a breach, not as zero or as fine', () => {
    const d = evaluateSafety({ ownTargets: { caloriesPerDay: Number.NaN }, screening: allNo() });
    expect(d.result).toBe('blocked');
  });
});

describe('evaluateSafety — screening', () => {
  it.each(SCREENING_KEYS)('blocks on a "yes" for %s', (key) => {
    const d = evaluateSafety({ ownTargets: {}, screening: { ...allNo(), [key]: 'yes' } });
    expect(d.result).toBe('blocked');
    expect(d.route).toBe('clinician');
    expect(d.breaches[0].reasonCode).toBe(`screening_${key}`);
  });

  it('never treats unknown or prefer-not as "no": it records a caution and does not block', () => {
    for (const answer of ['unknown', 'prefer_not'] as const) {
      const d = evaluateSafety({ ownTargets: {}, screening: { ...allNo(), pregnancy: answer } });
      expect(d.result).toBe('pass');
      expect(d.cautions).toContain('screening_incomplete');
    }
  });

  it('treats a completely missing screening as incomplete, not as clear', () => {
    const d = evaluateSafety({ ownTargets: {}, screening: {} });
    expect(d.cautions).toContain('screening_incomplete');
  });

  it('reports every breach, not just the first', () => {
    const d = evaluateSafety({
      ownTargets: { caloriesPerDay: 500 },
      screening: { ...allNo(), pregnancy: 'yes', eatingConcerns: 'yes' }
    });
    expect(d.breaches.length).toBe(3);
  });
});

describe('purity', () => {
  it('gives identical output for identical input and does not mutate it', () => {
    const input = { ownTargets: { caloriesPerDay: 900 }, screening: allNo() };
    const snapshot = JSON.stringify(input);
    const a = evaluateSafety(input);
    const b = evaluateSafety(input);
    expect(a).toEqual(b);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});

describe('evaluatePlan / isPlanDisplayable', () => {
  it('blocks a plan whose own targets are extreme', () => {
    const d = evaluatePlan({ targets: { exerciseMinutesPerDay: 200 } });
    expect(d.result).toBe('blocked');
    expect(d.breaches[0].reasonCode).toBe('plan_exerciseMinutesPerDay_too_high');
  });

  it('only displays a plan when both stages pass', () => {
    const ok = { ownTargets: {}, screening: allNo() };
    expect(isPlanDisplayable(ok, { targets: { exerciseMinutesPerDay: 20 } })).toBe(true);
    expect(isPlanDisplayable(ok, { targets: { exerciseMinutesPerDay: 200 } })).toBe(false);
    expect(
      isPlanDisplayable({ ownTargets: {}, screening: { ...allNo(), pregnancy: 'yes' } }, { targets: {} })
    ).toBe(false);
  });
});

describe('evaluateCheckin — escalation', () => {
  it('does nothing for an ordinary check-in', () => {
    expect(evaluateCheckin(checkin(), []).level).toBe('none');
  });

  it.each(SAFETY_RULES_CONFIG.escalation.urgentRedFlags)('escalates urgently on red flag %s', (flag) => {
    const d = evaluateCheckin(checkin({ redFlags: [flag] }), []);
    expect(d.level).toBe('urgent');
    expect(d.reasons[0].reasonCode).toBe(`redflag_${flag}`);
  });

  it('escalates on a meter glucose reading at or beyond the thresholds', () => {
    expect(evaluateCheckin(checkin({ glucose: { value: 60, unit: 'mg/dL', source: 'meter' } }), []).level).toBe('urgent');
    expect(evaluateCheckin(checkin({ glucose: { value: 340, unit: 'mg/dL', source: 'meter' } }), []).level).toBe('urgent');
    expect(evaluateCheckin(checkin({ glucose: { value: 110, unit: 'mg/dL', source: 'meter' } }), []).level).toBe('none');
  });

  it('never uses consumer-watch data as a glucose value', () => {
    const d = evaluateCheckin(checkin({ glucose: { value: 30, unit: 'mg/dL', source: 'watch' } }), []);
    expect(d.level).toBe('none');
    expect(d.reasons.map((r) => r.reasonCode)).toEqual(['glucose_source_rejected']);
  });

  it('suggests talking to someone after 3 consecutive unwell days, not after 2', () => {
    const day = (date: string, feel: CheckIn['feel']) => checkin({ id: date, date, feel });
    const two = evaluateCheckin(day('2026-11-07', 'unwell'), [day('2026-11-06', 'unwell')]);
    expect(two.level).toBe('none');
    const three = evaluateCheckin(day('2026-11-07', 'unwell'), [day('2026-11-06', 'unwell'), day('2026-11-05', 'unwell')]);
    expect(three.level).toBe('talk_to_someone');
    const gap = evaluateCheckin(day('2026-11-07', 'unwell'), [day('2026-11-06', 'unwell'), day('2026-11-04', 'unwell')]);
    expect(gap.level).toBe('none');
  });
});
