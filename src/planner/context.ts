/**
 * Context adaptation and planner safety. PURE and versioned (planner-2026.11.1).
 *
 * - Shift work moves the sleep window (night shift sleeps by day; rotating = no fixed window).
 * - Ramadan moves meal and drink prompts between iftar and suhoor.
 * - Heat may add a gentle hydration extra, never above the approved cap, and only when the
 *   kidney and heart answers are both a definite "no" (unknown is never read as "no").
 * - Hydration is hidden for a flagged kidney/heart condition and the person is routed to a clinician.
 */

import type { Breach, ContextProfile, SafetyDecision, ScreeningKey, Tri } from '../domain/types';
import type { TechniqueId } from '../techniques/techniques';
import { PLANNER_RULES, type Track } from './config';
import type { PlannerState } from './types';

type Screening = Partial<Record<ScreeningKey, Tri>>;

export interface PlannerAction {
  track: Track;
  visible: boolean;
  /** Why the action is hidden; the UI shows a clinician pathway for 'clinician'. */
  hiddenReason?: 'clinician';
  level: number;
  /** The one measurable target for today (glasses, minutes, meals, or tolerance minutes). */
  target: number;
  time?: string;
  window?: { from: string; to: string };
  technique: TechniqueId;
  /** Stable codes for the adaptations that shaped the action, translated by the UI. */
  adapted: string[];
  cautions: string[];
}

export const TRACK_TECHNIQUE: Record<Track, TechniqueId> = {
  nutrition: 'selfMonitoring',
  sleep: 'actionPlanning',
  hydration: 'promptsCues',
  activity: 'gradedTasks'
};

export function hydrationFlagged(screening: Screening): boolean {
  return screening.kidneyDisease === 'yes' || screening.heartCondition === 'yes';
}

export interface HydrationInput {
  screening: Screening;
  context: ContextProfile;
  level: number;
}

/** Base glasses for the level plus a capped heat extra. Returns null when hydration must be hidden. */
export function hydrationTarget(input: HydrationInput): { glasses: number; heatApplied: boolean } | null {
  if (hydrationFlagged(input.screening)) return null;
  const idx = Math.min(Math.max(input.level, 1), 3) - 1;
  const base = PLANNER_RULES.levels.hydration.glasses[idx];
  const sure = input.screening.kidneyDisease === 'no' && input.screening.heartCondition === 'no';
  const heat = input.context.heat === 'hot' && sure;
  const glasses = Math.min(base + (heat ? PLANNER_RULES.limits.hydration.heatExtraGlasses : 0), PLANNER_RULES.limits.hydration.maxGlassesPerDay);
  return { glasses, heatApplied: heat && glasses > base };
}

/** Validates a target someone typed or a coach proposed. Blocks unsafe values; never silently clamps. */
export function checkPlannerTargets(
  targets: { hydrationGlasses?: number; sleepHours?: number; activityMinutes?: number },
  screening: Screening
): SafetyDecision {
  const breaches: Breach[] = [];
  const L = PLANNER_RULES.limits;
  if (targets.hydrationGlasses !== undefined) {
    if (hydrationFlagged(screening)) breaches.push({ ruleId: 'H-FLAGGED-HIDDEN', reasonCode: 'hydration_flagged' });
    else if (targets.hydrationGlasses > L.hydration.maxGlassesPerDay)
      breaches.push({ ruleId: 'H-MAX-GLASSES', reasonCode: 'hydration_too_high', params: { max: L.hydration.maxGlassesPerDay } });
  }
  if (targets.sleepHours !== undefined && (targets.sleepHours < L.sleep.minHours || targets.sleepHours > L.sleep.maxHours))
    breaches.push({ ruleId: 'S-SLEEP-RANGE', reasonCode: 'sleep_out_of_range', params: { min: L.sleep.minHours, max: L.sleep.maxHours } });
  if (targets.activityMinutes !== undefined && targets.activityMinutes > L.activity.maxMinutesPerDay)
    breaches.push({ ruleId: 'A-MAX-MINUTES', reasonCode: 'activity_too_high', params: { max: L.activity.maxMinutesPerDay } });
  return {
    result: breaches.length ? 'blocked' : 'pass',
    ruleVersion: PLANNER_RULES.version,
    breaches,
    cautions: [],
    route: breaches.some((b) => b.ruleId === 'H-FLAGGED-HIDDEN') ? 'clinician' : 'none'
  };
}

function pick<T>(arr: readonly T[], level: number): T {
  return arr[Math.min(Math.max(level, 1), 3) - 1];
}

export function resolveActions(planner: PlannerState, context: ContextProfile, screening: Screening): PlannerAction[] {
  const fasting = context.fasting === 'ramadan';
  const shift = context.shiftWork;
  return (['nutrition', 'sleep', 'hydration', 'activity'] as Track[]).map((track): PlannerAction => {
    const s = planner.tracks[track];
    const base = { track, level: s.level, technique: TRACK_TECHNIQUE[track], adapted: [] as string[], cautions: [] as string[], time: s.time };
    switch (track) {
      case 'nutrition': {
        const a: PlannerAction = { ...base, visible: true, target: pick(PLANNER_RULES.levels.nutrition.mealsChecked, s.level) };
        if (fasting) {
          a.adapted.push('ramadan_meals');
          a.window = { from: PLANNER_RULES.ramadan.iftar, to: PLANNER_RULES.ramadan.suhoor };
        }
        if (context.foodBudget === 'low') a.adapted.push('low_budget');
        return a;
      }
      case 'sleep': {
        const a: PlannerAction = { ...base, visible: true, target: pick(PLANNER_RULES.levels.sleep.windowToleranceMin, s.level) };
        if (shift === 'night') {
          a.adapted.push('night_shift_sleep');
          a.window = { from: PLANNER_RULES.sleepWindows.night.bed, to: PLANNER_RULES.sleepWindows.night.wake };
        } else if (shift === 'rotating') {
          a.adapted.push('rotating_sleep');
          a.cautions.push('rotating_no_fixed_window');
        } else {
          a.window = { from: PLANNER_RULES.sleepWindows.day.bed, to: PLANNER_RULES.sleepWindows.day.wake };
        }
        if (shift === 'unknown') a.cautions.push('shift_unknown');
        return a;
      }
      case 'hydration': {
        if (hydrationFlagged(screening)) return { ...base, visible: false, hiddenReason: 'clinician', target: 0 };
        const h = hydrationTarget({ screening, context, level: s.level });
        const a: PlannerAction = { ...base, visible: true, target: h?.glasses ?? 0 };
        if (fasting) {
          a.window = { from: PLANNER_RULES.ramadan.hydrationFrom, to: PLANNER_RULES.ramadan.hydrationUntil };
          a.adapted.push('ramadan_hydration');
          if (planner.hydrationPausedFasting) a.adapted.push('paused_fasting_hours');
        }
        if (h?.heatApplied) a.adapted.push('heat_extra');
        if (context.heat === 'hot' && !h?.heatApplied) a.cautions.push('heat_no_extra_unanswered');
        return a;
      }
      default:
        return { ...base, visible: true, target: pick(PLANNER_RULES.levels.activity.minutes, s.level), adapted: s.variant === 'alt' ? ['indoor_variant'] : [] };
    }
  });
}
