/**
 * Plan generation. PURE: ids and the current time are passed in.
 * Free-form AI output is never used; plans are assembled from the approved
 * template library and must pass the safety engine (twice) before they exist.
 *
 * Phase 2: plans are built at a small-step ladder level and read the person's
 * context profile (shift work, Ramadan, heat, budget, accessibility).
 */

import {
  DEFAULT_CONTEXT,
  type GoalSetup,
  type Plan,
  type PlanItem,
  type SafetyDecision,
  type Unknownable
} from '../domain/types';
import { evaluatePlan, evaluateSafety } from '../safety/engine';
import { SAFETY_RULES_CONFIG, type SafetyRulesConfig } from '../safety/rules.config';
import { getTemplate, matchesContext, pickVariant } from './templates';

export const DEFAULT_LEVEL = 2;

export interface GenerateOptions {
  planId: string;
  /** Version number to assign; callers pass previous version + 1 (or 1). */
  version: number;
  nowIso: string;
  /** "Make it smaller": jump to ladder level 1. */
  restart?: boolean;
  /** Ladder level; defaults to 2. Clamped to the template's ladder. */
  level?: number;
  config?: SafetyRulesConfig;
}

export type GenerateResult =
  | { status: 'ok'; plan: Plan; input: SafetyDecision; output: SafetyDecision }
  | { status: 'blocked'; input: SafetyDecision; output: SafetyDecision | null };

const START_MINUTES_UNKNOWN = 10;
const SMALLEST_MINUTES = 5;
const MAX_LADDER_MINUTES = 30;

/** Conservative walking start. Unknown is never assumed fit. */
export function startMinutes(baseline: Unknownable, restart: boolean): number {
  if (restart) return SMALLEST_MINUTES;
  if (baseline === 'unknown') return START_MINUTES_UNKNOWN;
  if (!Number.isFinite(baseline) || baseline < 0) return START_MINUTES_UNKNOWN;
  return Math.min(MAX_LADDER_MINUTES, Math.max(START_MINUTES_UNKNOWN, Math.round(baseline) + 5));
}

/** Minutes for a walking ladder level: 1 is the smallest, 2 the starting point, then +5 per level. */
export function minutesForLevel(baseline: Unknownable, level: number): number {
  if (level <= 1) return SMALLEST_MINUTES;
  const start = startMinutes(baseline, false);
  return Math.min(MAX_LADDER_MINUTES, start + (level - 2) * 5);
}

const ALLERGY_TAGS = ['fish', 'egg', 'dairy', 'nuts', 'gluten', 'shellfish', 'legumes'];

export function allergyTagsOf(setup: Pick<GoalSetup, 'allergies'>): string[] {
  return setup.allergies.map((a) => a.trim().toLowerCase()).filter((a) => ALLERGY_TAGS.includes(a));
}

export function clampLevel(goalType: GoalSetup['goalType'], level: number): number {
  const max = getTemplate(goalType).ladder.length;
  return Math.max(1, Math.min(max, Math.round(level)));
}

export function generatePlan(setup: GoalSetup, opts: GenerateOptions): GenerateResult {
  const config = opts.config ?? SAFETY_RULES_CONFIG;
  const ctx = setup.context ?? DEFAULT_CONTEXT;

  // Stage 1: what the person told us.
  const input = evaluateSafety({ ownTargets: setup.ownTargets, screening: setup.screening }, config);
  if (input.result === 'blocked') return { status: 'blocked', input, output: null };

  const template = getTemplate(setup.goalType);
  const restart = opts.restart === true;
  const level = restart ? 1 : clampLevel(setup.goalType, opts.level ?? DEFAULT_LEVEL);
  const ladder = template.ladder.find((l) => l.level === level) ?? template.ladder[0];
  const tags = allergyTagsOf(setup);

  let minutes = minutesForLevel(setup.baseline.walkMinutesPerDay, level);

  const ids = [...ladder.itemIds];
  if (level >= 2) for (const i of template.items) if (i.conditional && !ids.includes(i.id)) ids.push(i.id);

  const chosen: { itemId: string; variantId: string }[] = [];
  for (const id of ids) {
    const tItem = template.items.find((i) => i.id === id);
    if (!tItem) continue;
    if (tItem.skipWhen && matchesContext(tItem.skipWhen, ctx)) continue;
    const variant = pickVariant(tItem, setup.dietary, tags, ctx);
    if (!variant) continue;
    if (variant.capMinutes !== undefined) minutes = Math.min(minutes, variant.capMinutes);
    chosen.push({ itemId: id, variantId: variant.id });
  }

  const items: PlanItem[] = chosen.map((c) => ({
    id: `${opts.planId}:${c.itemId}`,
    templateItemId: c.itemId,
    variant: c.variantId,
    params: { minutes, time: setup.usualTime }
  }));

  const cautions = [...input.cautions];
  if (setup.goalType === 'walk' && setup.baseline.walkMinutesPerDay === 'unknown') cautions.push('baseline_unknown');
  if (setup.goalType === 'sleep' && setup.baseline.sleepHours === 'unknown') cautions.push('baseline_unknown');
  if (setup.goalType === 'eating' && setup.allergyState !== 'none') cautions.push('check_allergies');
  if (template.referralOnly) cautions.push('tobacco_referral');

  const plan: Plan = {
    id: opts.planId,
    version: opts.version,
    templateId: template.id,
    templateVersion: template.version,
    goalType: setup.goalType,
    createdAt: opts.nowIso,
    ruleVersion: config.version,
    restart,
    level,
    items,
    cautions,
    targets: setup.goalType === 'walk' ? { exerciseMinutesPerDay: minutes, exerciseMinutesPerWeek: minutes * 7 } : {}
  };

  // Stage 2: the plan itself. If this fails, the plan is discarded and never shown.
  const output = evaluatePlan(plan, config);
  if (output.result === 'blocked') return { status: 'blocked', input, output };

  return { status: 'ok', plan, input, output };
}
