/**
 * Device-feed abstraction. Two adapters exist and both are LOCAL:
 *   - simulatedFeed: invented, seeded numbers (synthetic).
 *   - parseCsv: a file the person chooses; parsed in the browser, never uploaded.
 * Health Connect (Android) and Apple Health (iOS) are FUTURE interfaces: nothing in this
 * build talks to them. Glucose is never accepted or inferred.
 */

export type WearableSignal = 'steps' | 'sleepMinutes' | 'activityMinutes';

export type DaySignals = Partial<Record<WearableSignal, number>>;

export interface WearableState {
  source: 'simulated' | 'csv' | null;
  /** date -> signals. A missing key means "no value", never zero. */
  data: Record<string, DaySignals>;
  importedAt?: string;
}

export const EMPTY_WEARABLES: WearableState = { source: null, data: {} };

export interface FeedAdapter {
  id: 'simulated' | 'csv' | 'health-connect' | 'apple-health';
  /** True for anything that is invented or not a real device connection. */
  simulated: boolean;
  /** Future adapters are listed in the UI as "not built". */
  available: boolean;
}

export const FEEDS: readonly FeedAdapter[] = [
  { id: 'simulated', simulated: true, available: true },
  { id: 'csv', simulated: false, available: true },
  { id: 'health-connect', simulated: false, available: false },
  { id: 'apple-health', simulated: false, available: false }
];

const LIMITS: Record<WearableSignal, { min: number; max: number }> = {
  steps: { min: 0, max: 100000 },
  sleepMinutes: { min: 0, max: 1440 },
  activityMinutes: { min: 0, max: 1440 }
};

export interface CsvResult {
  data: Record<string, DaySignals>;
  rows: number;
  errors: string[];
  /** Columns ignored on purpose (e.g. glucose) or not recognised. */
  ignored: string[];
}

const ALIASES: Record<string, WearableSignal> = {
  steps: 'steps',
  sleep_minutes: 'sleepMinutes',
  sleepminutes: 'sleepMinutes',
  sleep_hours: 'sleepMinutes',
  activity_minutes: 'activityMinutes',
  activityminutes: 'activityMinutes',
  active_minutes: 'activityMinutes'
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Parses `date,steps,sleep_minutes,activity_minutes` (any subset). Blank cells stay missing. */
export function parseCsv(text: string): CsvResult {
  const result: CsvResult = { data: {}, rows: 0, errors: [], ignored: [] };
  const stripped = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const lines = stripped.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    result.errors.push('empty');
    return result;
  }
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const dateCol = header.indexOf('date');
  if (dateCol < 0) {
    result.errors.push('no_date_column');
    return result;
  }
  const cols = header.map((h, i) => {
    if (i === dateCol) return null;
    if (/glucose|glycemi|sugar|hba1c/.test(h)) {
      result.ignored.push(h);
      return null;
    }
    const sig = ALIASES[h];
    if (!sig) result.ignored.push(h);
    return sig ?? null;
  });
  for (let r = 1; r < lines.length; r++) {
    const cells = lines[r].split(',').map((c) => c.trim());
    const date = cells[dateCol];
    if (!DATE_RE.test(date) || Number.isNaN(Date.parse(date))) {
      result.errors.push(`row_${r + 1}_bad_date`);
      continue;
    }
    const day: DaySignals = {};
    cols.forEach((sig, i) => {
      if (!sig || cells[i] === undefined || cells[i] === '') return;
      let n = Number(cells[i]);
      if (header[i] === 'sleep_hours') n = Math.round(n * 60);
      const lim = LIMITS[sig];
      if (!Number.isFinite(n) || n < lim.min || n > lim.max) {
        result.errors.push(`row_${r + 1}_${sig}_out_of_range`);
        return;
      }
      day[sig] = Math.round(n);
    });
    if (Object.keys(day).length) {
      result.data[date] = { ...(result.data[date] ?? {}), ...day };
      result.rows += 1;
    }
  }
  return result;
}

/** Tiny deterministic generator so the simulated feed is identical on every run. */
function lcg(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export type SimProfile = 'night-shift' | 'ramadan' | 'traveller';

/** Synthetic days ending at `endDate`. Some days are deliberately left without a value. */
export function simulatedFeed(endDate: string, days: number, profile: SimProfile, shiftDate: (d: string, n: number) => string): Record<string, DaySignals> {
  const rnd = lcg(profile.length * 7919);
  const out: Record<string, DaySignals> = {};
  const base = profile === 'night-shift' ? { steps: 5200, sleep: 340 } : profile === 'ramadan' ? { steps: 6100, sleep: 380 } : { steps: 7600, sleep: 400 };
  for (let i = days - 1; i >= 0; i--) {
    const date = shiftDate(endDate, -i);
    if (i % 6 === 4) continue; // a day with no data at all
    const day: DaySignals = {
      steps: Math.round(base.steps + (rnd() - 0.5) * 3000),
      sleepMinutes: i % 5 === 3 ? undefined : Math.round(base.sleep + (rnd() - 0.5) * 120),
      activityMinutes: Math.round(8 + rnd() * 22)
    };
    if (day.sleepMinutes === undefined) delete day.sleepMinutes;
    out[date] = day;
  }
  return out;
}
