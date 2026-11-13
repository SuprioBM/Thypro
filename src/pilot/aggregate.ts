/**
 * Aggregate-only reporting for sponsors (employers, clinics) and the pilot
 * equity report. PURE.
 *
 * Privacy rules enforced here, not in the UI:
 *  - A group is reported only if it has at least MIN_GROUP people.
 *    Smaller groups are returned as `suppressed` with NO numbers at all.
 *  - If any group is suppressed, the overall total is suppressed too, so a
 *    small group's numbers cannot be worked out by subtraction.
 *  - Output contains totals and rates only: never names, ids, days or rows.
 */

import type { CohortRecord } from './cohort';
import { median } from '../domain/outcomes';

export const MIN_GROUP = 20;
export const EQUITY_GAP_PP = 10;

export interface GroupStats {
  n: number;
  /** Share of people with at least one check-in, 0..1. */
  participation: number;
  /** Done days ÷ days in programme across the group, 0..1. */
  persistence: number;
  doneDaysTotal: number;
  activityMinutesTotal: number;
  medianDaysToResume: number | null;
  bpLoggedShare: number;
}

export type GroupRow = { group: string; suppressed: true } | ({ group: string; suppressed: false } & GroupStats);

export function statsFor(records: CohortRecord[]): GroupStats {
  const n = records.length;
  const done = records.reduce((s, r) => s + r.doneDays, 0);
  const span = records.reduce((s, r) => s + r.spanDays, 0);
  return {
    n,
    participation: n ? records.filter((r) => r.active).length / n : 0,
    persistence: span ? done / span : 0,
    doneDaysTotal: done,
    activityMinutesTotal: records.reduce((s, r) => s + r.activityMinutes, 0),
    medianDaysToResume: median(records.flatMap((r) => r.recoveries)),
    bpLoggedShare: n ? records.filter((r) => r.bpLogged).length / n : 0
  };
}

export function aggregateBy(
  records: CohortRecord[],
  key: (r: CohortRecord) => string,
  min: number = MIN_GROUP
): GroupRow[] {
  const groups = new Map<string, CohortRecord[]>();
  for (const r of records) {
    const k = key(r);
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([group, rows]) => (rows.length < min ? { group, suppressed: true } : { group, suppressed: false, ...statsFor(rows) }));
}

export interface SponsorSummary {
  groups: GroupRow[];
  /** Null when any group is suppressed (prevents working out a small group by subtraction). */
  overall: GroupStats | null;
}

export function sponsorSummary(records: CohortRecord[], min: number = MIN_GROUP): SponsorSummary {
  const groups = aggregateBy(records, (r) => r.site, min);
  const anySuppressed = groups.some((g) => g.suppressed);
  return { groups, overall: anySuppressed || records.length < min ? null : statsFor(records) };
}

export type EquityDimension = 'language' | 'gender' | 'ageGroup';

export interface EquityRow {
  dimension: EquityDimension;
  rows: GroupRow[];
  /** Largest gap in persistence between reported groups, in percentage points. */
  gapPP: number | null;
  flagged: boolean;
}

export function equityGap(rows: GroupRow[]): number | null {
  const values = rows.filter((r): r is Extract<GroupRow, { suppressed: false }> => !r.suppressed).map((r) => r.persistence);
  if (values.length < 2) return null;
  return Math.round((Math.max(...values) - Math.min(...values)) * 1000) / 10;
}

export function equityReport(
  records: CohortRecord[],
  min: number = MIN_GROUP,
  thresholdPP: number = EQUITY_GAP_PP
): EquityRow[] {
  const dims: EquityDimension[] = ['language', 'gender', 'ageGroup'];
  return dims.map((dimension) => {
    // "Unstated" is not a group to compare: people who chose not to say are left out of gap maths.
    const rows = aggregateBy(
      records.filter((r) => r[dimension] !== 'unstated' && r[dimension] !== 'prefer_not'),
      (r) => String(r[dimension]),
      min
    );
    const gapPP = equityGap(rows);
    return { dimension, rows, gapPP, flagged: gapPP !== null && gapPP > thresholdPP };
  });
}
