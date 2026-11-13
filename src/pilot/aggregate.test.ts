import { describe, expect, it } from 'vitest';
import { aggregateBy, equityGap, equityReport, MIN_GROUP, sponsorSummary, statsFor } from './aggregate';
import { generateSyntheticCohort, type CohortRecord } from './cohort';

const rec = (over: Partial<CohortRecord> = {}): CohortRecord => ({
  site: 'S',
  language: 'bn',
  gender: 'male',
  ageGroup: '30-44',
  active: true,
  doneDays: 14,
  spanDays: 28,
  activityMinutes: 140,
  recoveries: [],
  bpLogged: false,
  ...over
});
const many = (n: number, over: Partial<CohortRecord> = {}) => Array.from({ length: n }, () => rec(over));

describe('sponsor aggregation threshold', () => {
  it('uses 20 as the minimum group size', () => {
    expect(MIN_GROUP).toBe(20);
  });

  it('never shows any number for a group under 20', () => {
    const rows = aggregateBy([...many(19, { site: 'Small' }), ...many(25, { site: 'Big' })], (r) => r.site);
    const small = rows.find((r) => r.group === 'Small')!;
    expect(small).toEqual({ group: 'Small', suppressed: true });
    expect(Object.keys(small)).toEqual(['group', 'suppressed']);
    const big = rows.find((r) => r.group === 'Big')!;
    expect(big.suppressed).toBe(false);
  });

  it('shows a group of exactly 20', () => {
    expect(aggregateBy(many(20), (r) => r.site)[0].suppressed).toBe(false);
  });

  it('hides the overall total when any group is suppressed, so a small group cannot be worked out by subtraction', () => {
    expect(sponsorSummary([...many(19, { site: 'Small' }), ...many(25, { site: 'Big' })]).overall).toBeNull();
    expect(sponsorSummary([...many(20, { site: 'A' }), ...many(25, { site: 'B' })]).overall?.n).toBe(45);
  });

  it('returns totals and rates only: no names, ids, dates or per-person rows', () => {
    const json = JSON.stringify(sponsorSummary(generateSyntheticCohort()));
    expect(json).not.toMatch(/"name"|"id"|"date"|\d{4}-\d{2}-\d{2}/);
    const keys = Object.keys(statsFor(many(20))).sort();
    expect(keys).toEqual(['activityMinutesTotal', 'bpLoggedShare', 'doneDaysTotal', 'medianDaysToResume', 'n', 'participation', 'persistence']);
  });

  it('the synthetic cohort includes a deliberately small site that is suppressed', () => {
    const s = sponsorSummary(generateSyntheticCohort());
    expect(s.groups.some((g) => g.suppressed)).toBe(true);
    expect(s.groups.some((g) => !g.suppressed)).toBe(true);
    expect(s.overall).toBeNull();
  });

  it('is deterministic', () => {
    expect(generateSyntheticCohort()).toEqual(generateSyntheticCohort());
  });
});

describe('equity gap calculation', () => {
  it('reports the gap in percentage points between the best and worst reported group', () => {
    const rows = aggregateBy(
      [...many(20, { language: 'bn', doneDays: 17 }), ...many(20, { language: 'ur', doneDays: 11 })],
      (r) => r.language
    );
    // 17/28 = 60.7 %, 11/28 = 39.3 % → 21.4 pp
    expect(equityGap(rows)).toBeCloseTo(21.4, 1);
  });

  it('flags gaps over 10 points and not gaps of 10 or less', () => {
    const big = equityReport([...many(20, { language: 'bn', doneDays: 17 }), ...many(20, { language: 'ur', doneDays: 11 })]);
    expect(big.find((d) => d.dimension === 'language')?.flagged).toBe(true);
    const small = equityReport([...many(20, { language: 'bn', doneDays: 14 }), ...many(20, { language: 'ur', doneDays: 12 })]);
    const lang = small.find((d) => d.dimension === 'language')!;
    expect(lang.gapPP).toBeCloseTo(7.1, 1);
    expect(lang.flagged).toBe(false);
  });

  it('ignores suppressed groups and people who did not state the attribute', () => {
    const r = equityReport([
      ...many(25, { gender: 'male', doneDays: 14 }),
      ...many(5, { gender: 'female', doneDays: 2 }),
      ...many(30, { gender: 'unstated', doneDays: 1 })
    ]).find((d) => d.dimension === 'gender')!;
    expect(r.rows.map((x) => x.group).sort()).toEqual(['female', 'male']);
    expect(r.rows.find((x) => x.group === 'female')!.suppressed).toBe(true);
    expect(r.gapPP).toBeNull();
    expect(r.flagged).toBe(false);
  });

  it('the synthetic demo cohort shows one flagged gap (language)', () => {
    const report = equityReport(generateSyntheticCohort());
    expect(report.find((d) => d.dimension === 'language')?.flagged).toBe(true);
  });
});
