/**
 * Family / coach view. PURE and deliberately allow-list based: a field is
 * present in the output only if its consent flag is true. Nothing is derived
 * from a field the person has not shared.
 *
 * In this build the view is a demonstration: nothing is transmitted anywhere.
 */

import type { AppState, ConsentMap, Feel, GoalType } from './types';
import { weeklyStats, type WeekStats } from './week';

export interface FamilySummary {
  goal?: GoalType;
  weeklyCompletion?: Pick<WeekStats, 'done' | 'skipped' | 'unknown' | 'missing'>;
  feelings?: Partial<Record<Feel | 'unknown', number>>;
  plan?: { templateId: string; version: number };
  reminders?: { times: string[] };
  notes?: string[];
}

export function buildFamilySummary(state: AppState, today: string, consent: ConsentMap = state.consent): FamilySummary {
  const summary: FamilySummary = {};
  const week = weeklyStats(state.checkins, today);
  const weekDates = new Set(week.days.map((d) => d.date));
  const weekCheckins = state.checkins.filter((c) => weekDates.has(c.date));
  const activePlan = state.plans[state.plans.length - 1];

  if (consent.goal && state.setup) summary.goal = state.setup.goalType;

  if (consent.weeklyCompletion) {
    summary.weeklyCompletion = { done: week.done, skipped: week.skipped, unknown: week.unknown, missing: week.missing };
  }

  if (consent.feelings) {
    const counts: Partial<Record<Feel | 'unknown', number>> = {};
    for (const c of weekCheckins) counts[c.feel] = (counts[c.feel] ?? 0) + 1;
    summary.feelings = counts;
  }

  if (consent.plan && activePlan) {
    summary.plan = { templateId: activePlan.templateId, version: activePlan.version };
  }

  if (consent.reminders) {
    summary.reminders = { times: state.reminders.filter((r) => r.enabled).map((r) => r.time) };
  }

  if (consent.notes) {
    summary.notes = weekCheckins.map((c) => c.note?.original).filter((n): n is string => Boolean(n));
  }

  return summary;
}
