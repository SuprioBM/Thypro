/**
 * Lapse-risk score. PURE, rule-based, deterministic.
 * "Estimated from your patterns, not a diagnosis."
 */

import { shiftDate } from '../domain/week';
import { COACH_CONFIG, type CoachConfig } from './config';
import type { CoachSignal, Factor, FactorId, RiskAssessment } from './types';

/** Everything the risk model may look at, already filtered by consent. */
export interface CoachInput {
  today: string;
  /** date -> share (0..1) of tracks done that day. Absent dates = no data for that day. */
  completion: Record<string, number>;
  /** First date the person has data from; days before it are never counted as misses. */
  startedOn: string | null;
  barriers: { date: string; barrier: string }[];
  shiftWork: 'none' | 'day' | 'night' | 'rotating' | 'unknown';
  heat: 'hot' | 'mild' | 'unknown';
  fasting: 'none' | 'ramadan' | 'other' | 'unknown';
  /** 'HH:MM' of the main scheduled habit, if any. */
  usualTime: string | null;
  preShiftOn: boolean;
  /** Recent sleep hours (most recent last), from the planner or an authorised device. */
  sleepHours: number[];
  used: CoachSignal[];
  missing: CoachSignal[];
}

const clamp = (n: number) => Math.min(1, Math.max(0, n));

function mean(xs: number[]): number | null {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

function windowValues(input: CoachInput, endOffset: number, days: number): number[] {
  const out: number[] = [];
  for (let i = endOffset; i < endOffset + days; i++) {
    const d = shiftDate(input.today, -i);
    if (input.startedOn && d < input.startedOn) continue;
    // A day inside the person's history without an entry counts as not done.
    out.push(input.completion[d] ?? 0);
  }
  return out;
}

export function consecutiveMissedDays(input: CoachInput, cfg: CoachConfig = COACH_CONFIG): number {
  let n = 0;
  for (let i = 1; i <= 14; i++) {
    const d = shiftDate(input.today, -i);
    if (!input.startedOn || d < input.startedOn) break;
    if ((input.completion[d] ?? 0) >= cfg.missBelow) break;
    n += 1;
  }
  return n;
}

function inShiftWindow(time: string, cfg: CoachConfig): boolean {
  const { from, to } = cfg.shiftWindow;
  return time >= from || time < to;
}

export function featureValues(input: CoachInput, cfg: CoachConfig = COACH_CONFIG): Record<FactorId, { value: number; detail?: Record<string, string | number> }> {
  const recent = mean(windowValues(input, 1, cfg.windowDays));
  const prior = mean(windowValues(input, 1 + cfg.windowDays, cfg.windowDays));
  let trend = 0;
  if (recent !== null) trend = prior !== null && windowValues(input, 1 + cfg.windowDays, cfg.windowDays).length >= 3 ? clamp((prior - recent) / 0.5) : clamp((0.6 - recent) / 0.6);

  const misses = consecutiveMissedDays(input, cfg);

  const counts = new Map<string, number>();
  for (const b of input.barriers) if (b.date >= shiftDate(input.today, -14)) counts.set(b.barrier, (counts.get(b.barrier) ?? 0) + 1);
  let topBarrier = '';
  let topCount = 0;
  for (const [k, c] of [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
    if (c > topCount) {
      topBarrier = k;
      topCount = c;
    }
  }

  let shift = 0;
  if ((input.shiftWork === 'night' || input.shiftWork === 'rotating') && input.usualTime && inShiftWindow(input.usualTime, cfg)) shift = input.shiftWork === 'night' ? 1 : 0.5;
  if (input.preShiftOn) shift *= 0.4;

  const sleep5 = input.sleepHours.slice(-5);
  const avg = mean(sleep5);
  const sleepDebt = avg === null ? 0 : clamp((cfg.sleepReferenceHours - avg) / 2);

  return {
    trend: { value: trend },
    misses: { value: clamp(misses / cfg.missesSaturateAt), detail: { n: misses } },
    barriers: { value: clamp(topCount / 4), detail: topCount ? { barrier: topBarrier, n: topCount } : undefined },
    shift: { value: shift },
    sleepDebt: { value: sleepDebt, detail: avg === null ? undefined : { hours: Math.round(avg * 10) / 10 } },
    heat: { value: input.heat === 'hot' ? 1 : 0 }
  };
}

export function assessRisk(input: CoachInput, cfg: CoachConfig = COACH_CONFIG): RiskAssessment {
  const values = featureValues(input, cfg);
  const factors: Factor[] = (Object.keys(cfg.weights) as FactorId[]).map((id) => ({
    id,
    value: Math.round(values[id].value * 1000) / 1000,
    weight: cfg.weights[id],
    points: Math.round(cfg.weights[id] * values[id].value * 10) / 10,
    detail: values[id].detail
  }));
  // Biggest contribution first; ties keep the configured order so ranking is stable.
  const order = Object.keys(cfg.weights);
  factors.sort((a, b) => b.points - a.points || order.indexOf(a.id) - order.indexOf(b.id));
  const score = Math.round(factors.reduce((s, f) => s + f.points, 0));
  return {
    score,
    band: score >= cfg.bands.high ? 'high' : score >= cfg.bands.moderate ? 'moderate' : 'low',
    factors,
    top: factors.filter((f) => f.points > 0).slice(0, 3),
    configVersion: cfg.version,
    used: input.used,
    missing: input.missing
  };
}
