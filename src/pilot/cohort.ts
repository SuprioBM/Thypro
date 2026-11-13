/**
 * SYNTHETIC cohort for the guest-mode sponsor view and pilot report.
 *
 * Every record is generated from a fixed seed. There are no real people, no
 * names, no ids and no dates: only per-person totals and self-reported group
 * labels. It exists so the aggregation and equity rules can be demonstrated
 * honestly before any pilot data exists.
 */

import type { AgeGroup, Gender, Lang } from '../domain/types';

export interface CohortRecord {
  /** Employer or clinic group. */
  site: string;
  language: Lang;
  gender: Gender | 'unstated';
  ageGroup: AgeGroup | 'unstated';
  /** True if the person made at least one check-in. */
  active: boolean;
  doneDays: number;
  spanDays: number;
  activityMinutes: number;
  /** Days without a done day before each resumption. */
  recoveries: number[];
  bpLogged: boolean;
}

/** Small deterministic PRNG (mulberry32). */
export function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(rand: () => number, items: readonly T[]): T => items[Math.floor(rand() * items.length)];

interface SiteSpec {
  site: string;
  size: number;
}

/** Site C is deliberately below the reporting threshold so the UI shows "not enough data". */
export const SYNTHETIC_SITES: readonly SiteSpec[] = [
  { site: 'Site A (clinic)', size: 118 },
  { site: 'Site B (employer)', size: 96 },
  { site: 'Site C (employer)', size: 12 }
];

export function generateSyntheticCohort(seed = 2026): CohortRecord[] {
  const rand = prng(seed);
  const out: CohortRecord[] = [];
  const languages: Lang[] = ['bn', 'bn', 'bn', 'hi', 'hi', 'ur', 'ur', 'en'];
  const genders: (Gender | 'unstated')[] = ['male', 'male', 'male', 'female', 'female', 'unstated'];
  const ages: (AgeGroup | 'unstated')[] = ['18-29', '30-44', '30-44', '45-59', '60+', 'unstated'];

  for (const spec of SYNTHETIC_SITES) {
    for (let i = 0; i < spec.size; i++) {
      const language = pick(rand, languages);
      const spanDays = 28;
      const active = rand() > 0.12;
      // A built-in synthetic gap (Urdu speakers persist less) so the equity flag can be demonstrated.
      const base = language === 'ur' ? 0.42 : 0.6;
      const rate = Math.max(0, Math.min(1, base + (rand() - 0.5) * 0.3));
      const doneDays = active ? Math.round(spanDays * rate) : 0;
      const lapses = active ? Math.floor(rand() * 3) : 0;
      const recoveries = Array.from({ length: lapses }, () => 2 + Math.floor(rand() * 5));
      out.push({
        site: spec.site,
        language,
        gender: pick(rand, genders),
        ageGroup: pick(rand, ages),
        active,
        doneDays,
        spanDays,
        activityMinutes: doneDays * (8 + Math.floor(rand() * 8)),
        recoveries,
        bpLogged: active && rand() > 0.6
      });
    }
  }
  return out;
}
