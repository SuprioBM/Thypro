/**
 * Plan generation. PURE: ids and the current time are passed in.
 * Free-form AI output is never used; plans are assembled from the approved
 * template library and must pass the safety engine (twice) before they exist.
 */

import type {
  GoalSetup,
  Plan,
  PlanItem,
  SafetyDecision,
  Unknownable
} from '../domain/types';
import { evaluatePlan, evaluateSafety } from '../safety/engine';
import { SAFETY_RULES_CONFIG, type SafetyRulesConfig } from '../safety/rules.config';
import { getTemplate, pickVariant } from './templates';

export interface GenerateOptions {
  planId: string;
  /** Version number to assign; callers pass previous version + 1 (or 1). */
  version: number;
  nowIso: string;
  restart?: boolean;
  config?: SafetyRulesConfig;
}

export type GenerateResult =
  | { status: 'ok'; plan: Plan; input: SafetyDecision; output: SafetyDecision }
  | { status: 'blocked'; input: SafetyDecision; output: SafetyDecision | null };

const START_MINUTES_UNKNOWN = 10;
const RESTART_MINUTES = 5;
const MAX_START_MINUTES = 30;

/** Conservative walking start. Unknown is never assumed fit. */
export function startMinutes(baseline: Unknownable, restart: boolean): number {
  if (restart) return RESTART_MINUTES;
  if (baseline === 'unknown') return START_MINUTES_UNKNOWN;
  if (!Number.isFinite(baseline) || baseline < 0) return START_MINUTES_UNKNOWN;
  return Math.min(MAX_START_MINUTES, Math.max(START_MINUTES_UNKNOWN, Math.round(baseline) + 5));
}

const ALLERGY_TAGS = ['fish', 'egg', 'dairy', 'nuts', 'gluten', 'shellfish', 'legumes'];

export function allergyTagsOf(setup: Pick<GoalSetup, 'allergies'>): string[] {
  return setup.allergies.map((a) => a.trim().toLowerCase()).filter((a) => ALLERGY_TAGS.includes(a));
}

export function generatePlan(setup: GoalSetup, opts: GenerateOptions): GenerateResult {
  const config = opts.config ?? SAFETY_RULES_CONFIG;

  // Stage 1: what the person told us.
  const input = evaluateSafety({ ownTargets: setup.ownTargets, screening: setup.screening }, config);
  if (input.result === 'blocked') return { status: 'blocked', input, output: null };

  const template = getTemplate(setup.goalType);
  const restart = opts.restart === true;
  const minutes = startMinutes(setup.baseline.walkMinutesPerDay, restart);
  const tags = allergyTagsOf(setup);

  const keep = restart ? new Set(template.restartKeep) : null;
  const items: PlanItem[] = template.items
    .filter((i) => !keep || keep.has(i.id))
    .map((i) => {
      const variant = pickVariant(i, setup.dietary, tags);
      return {
        id: `${opts.planId}:${i.id}`,
        templateItemId: i.id,
        variant: variant.id,
        params: { minutes, time: setup.usualTime }
      };
    });

  const cautions = [...input.cautions];
  if (setup.goalType === 'walk' && setup.baseline.walkMinutesPerDay === 'unknown') cautions.push('baseline_unknown');
  if (setup.goalType === 'sleep' && setup.baseline.sleepHours === 'unknown') cautions.push('baseline_unknown');
  if (setup.goalType === 'eating' && setup.allergyState !== 'none') cautions.push('check_allergies');

  const plan: Plan = {
    id: opts.planId,
    version: opts.version,
    templateId: template.id,
    templateVersion: template.version,
    goalType: setup.goalType,
    createdAt: opts.nowIso,
    ruleVersion: config.version,
    restart,
    items,
    cautions,
    targets: setup.goalType === 'walk' ? { exerciseMinutesPerDay: minutes, exerciseMinutesPerWeek: minutes * 7 } : {}
  };

  // Stage 2: the plan itself. If this fails, the plan is discarded and never shown.
  const output = evaluatePlan(plan, config);
  if (output.result === 'blocked') return { status: 'blocked', input, output };

  return { status: 'ok', plan, input, output };
}
