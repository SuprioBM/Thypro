/**
 * Safety rules engine.
 *
 * PURE: no I/O, no clock, no randomness, no AI. Same input → same output.
 * Thresholds come only from the config object passed in. The engine never
 * diagnoses; its job is to stop a plan from being shown and to route to a
 * clinician or family contact.
 */

import type {
  Breach,
  CheckIn,
  EscalationDecision,
  GoalSetup,
  Plan,
  SafetyDecision,
  ScreeningKey,
  Tri
} from '../domain/types';
import { SAFETY_RULES_CONFIG, type RangeRule, type SafetyRulesConfig } from './rules.config';

type TargetKey = RangeRule['target'];

function checkRange(rule: RangeRule, value: number | undefined): Breach | null {
  if (value === undefined) return null;
  if (!Number.isFinite(value)) {
    return { ruleId: rule.id, reasonCode: 'target_invalid', params: { target: rule.target } };
  }
  if (rule.min !== undefined && value < rule.min) {
    return {
      ruleId: rule.id,
      reasonCode: `${rule.target}_too_low`,
      params: { value, limit: rule.min }
    };
  }
  if (rule.max !== undefined && value > rule.max) {
    return {
      ruleId: rule.id,
      reasonCode: `${rule.target}_too_high`,
      params: { value, limit: rule.max }
    };
  }
  return null;
}

function isUnanswered(answer: Tri | undefined): boolean {
  return answer === undefined || answer === 'unknown' || answer === 'prefer_not';
}

export interface SafetyInput {
  ownTargets: GoalSetup['ownTargets'];
  screening: Partial<Record<ScreeningKey, Tri>>;
}

/** Stage 1: what the person told us (targets + screening). */
export function evaluateSafety(
  input: SafetyInput,
  config: SafetyRulesConfig = SAFETY_RULES_CONFIG
): SafetyDecision {
  const breaches: Breach[] = [];
  const cautions: string[] = [];

  for (const rule of config.range) {
    const breach = checkRange(rule, input.ownTargets[rule.target as TargetKey]);
    if (breach) breaches.push(breach);
  }

  let anyUnanswered = false;
  for (const rule of config.screening) {
    const answer = input.screening[rule.key];
    if (answer === rule.blockOn) {
      breaches.push({ ruleId: rule.id, reasonCode: `screening_${rule.key}` });
    } else if (isUnanswered(answer)) {
      // Unknown is never treated as "no". It does not block, but it is recorded.
      anyUnanswered = true;
    }
  }
  if (anyUnanswered) cautions.push('screening_incomplete');

  const blocked = breaches.length > 0;
  return {
    result: blocked ? 'blocked' : 'pass',
    ruleVersion: config.version,
    breaches,
    cautions,
    route: blocked ? 'clinician' : 'none'
  };
}

/**
 * Stage 2: the generated plan itself. A plan must pass this before it is ever
 * shown, so a template or generator bug can never put an extreme target on screen.
 */
export function evaluatePlan(
  plan: Pick<Plan, 'targets'> & Partial<Pick<Plan, 'goalType' | 'items'>>,
  config: SafetyRulesConfig = SAFETY_RULES_CONFIG
): SafetyDecision {
  const breaches: Breach[] = [];
  for (const rule of config.range) {
    const breach = checkRange(rule, plan.targets[rule.target as keyof Plan['targets']]);
    if (breach) breaches.push({ ...breach, reasonCode: `plan_${breach.reasonCode}` });
  }
  // Tobacco is referral-only: no targets and only the approved referral/support items.
  if (plan.goalType === 'tobacco') {
    const outside = (plan.items ?? []).some((i) => !config.tobacco.allowedItems.includes(i.templateItemId));
    const hasTargets = Object.values(plan.targets).some((v) => v !== undefined);
    if (outside || hasTargets) breaches.push({ ruleId: 'T-REFERRAL-ONLY', reasonCode: 'tobacco_referral_only' });
  }
  const blocked = breaches.length > 0;
  return {
    result: blocked ? 'blocked' : 'pass',
    ruleVersion: config.version,
    breaches,
    cautions: [],
    route: blocked ? 'clinician' : 'none'
  };
}

/** Run both stages; the plan is only displayable when both pass. */
export function isPlanDisplayable(
  input: SafetyInput,
  plan: Pick<Plan, 'targets'> & Partial<Pick<Plan, 'goalType' | 'items'>>,
  config: SafetyRulesConfig = SAFETY_RULES_CONFIG
): boolean {
  return evaluateSafety(input, config).result === 'pass' && evaluatePlan(plan, config).result === 'pass';
}

/* ---------- Check-in escalation ---------- */

/**
 * Looks at one check-in (and the days just before it) and decides whether to
 * show the "talk to a clinician or your family contact" step. This REPLACES
 * any advice: the engine never explains or interprets symptoms.
 */
export function evaluateCheckin(
  checkin: CheckIn,
  previous: CheckIn[],
  config: SafetyRulesConfig = SAFETY_RULES_CONFIG
): EscalationDecision {
  const esc = config.escalation;
  const reasons: Breach[] = [];
  let level: EscalationDecision['level'] = 'none';

  for (const flag of checkin.redFlags) {
    if (esc.urgentRedFlags.includes(flag)) {
      reasons.push({ ruleId: 'E-REDFLAG', reasonCode: `redflag_${flag}` });
      level = 'urgent';
    }
  }

  if (checkin.glucose) {
    if (checkin.glucose.source !== 'meter') {
      // Consumer-watch / other-source values are never used as glucose values.
      reasons.push({ ruleId: 'E-GLUCOSE-SOURCE', reasonCode: 'glucose_source_rejected' });
    } else if (checkin.glucose.unit === 'mg/dL') {
      const v = checkin.glucose.value;
      if (Number.isFinite(v) && v <= esc.glucoseMgDl.low) {
        reasons.push({ ruleId: 'E-GLUCOSE-LOW', reasonCode: 'glucose_low', params: { value: v } });
        level = 'urgent';
      } else if (Number.isFinite(v) && v >= esc.glucoseMgDl.high) {
        reasons.push({ ruleId: 'E-GLUCOSE-HIGH', reasonCode: 'glucose_high', params: { value: v } });
        level = 'urgent';
      }
    }
  }

  if (level !== 'urgent' && checkin.feel === 'unwell') {
    const earlier = previous
      .filter((c) => c.date < checkin.date)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    let streak = 1;
    let expected = shiftDay(checkin.date, -1);
    for (const c of earlier) {
      if (c.date === expected && c.feel === 'unwell') {
        streak += 1;
        expected = shiftDay(expected, -1);
      } else if (c.date === expected) {
        break;
      } else if (c.date < expected) {
        break;
      }
    }
    if (streak >= esc.unwellStreakDays) {
      reasons.push({ ruleId: 'E-UNWELL-STREAK', reasonCode: 'unwell_streak', params: { days: streak } });
      level = 'talk_to_someone';
    }
  }

  return { level, ruleVersion: config.version, reasons };
}

function shiftDay(dateKey: string, delta: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return dt.toISOString().slice(0, 10);
}
