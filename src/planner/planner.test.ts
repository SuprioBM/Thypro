import { describe, expect, it } from 'vitest';
import { DEFAULT_CONTEXT } from '../domain/types';
import { shiftDate } from '../domain/week';
import { checkPlannerTargets, hydrationTarget, resolveActions } from './context';
import { PLANNER_RULES } from './config';
import { plannerReducer, stepUpOffer } from './reducer';
import { computeRun, weekKey } from './runs';
import { freshPlanner, type PlannerState } from './types';

const MON = '2026-11-02'; // a Monday
const day = (n: number) => shiftDate(MON, n);

function withDone(dates: string[], track: 'hydration' | 'activity' = 'activity'): PlannerState {
  const p = freshPlanner();
  p.startedOn = dates.slice().sort()[0];
  for (const d of dates) p.entries[d] = { [track]: { done: true, at: `${d}T10:00:00Z` } };
  return p;
}

describe('runs, freezes and cumulative total', () => {
  it('counts current, best and total', () => {
    const p = withDone([day(0), day(1), day(2)]);
    const r = computeRun(p, 'activity', day(3)); // day 3 still open
    expect(r).toMatchObject({ current: 3, best: 3, total: 3, paused: false });
  });

  it('a miss with no freeze left pauses the run, keeps best and total', () => {
    // Mon, Tue done; Wed missed (freeze used); Thu done; Fri missed (no 2nd freeze this week); Sat done
    const p = withDone([day(0), day(1), day(3), day(5)]);
    const r = computeRun(p, 'activity', day(5));
    expect(r.frozen).toEqual([day(2)]);
    expect(r.best).toBe(3); // Mon, Tue, (frozen Wed keeps run), Thu
    expect(r.current).toBe(1); // Fri miss broke it, Sat restarts at 1
    expect(r.total).toBe(4); // total never resets
  });

  it('allows exactly one automatic freeze per ISO week, and a fresh one next week', () => {
    const p = withDone([day(0), day(1), day(4), day(7), day(10)]);
    const r = computeRun(p, 'activity', day(10));
    // Wed(2) frozen; Thu(3) breaks (week 1 freeze used); Fri(4) restarts; Sat/Sun missed -> frozen? run>0 but freeze used
    expect(r.frozen).toContain(day(2));
    expect(r.frozen.filter((d) => weekKey(d) === weekKey(day(0)))).toHaveLength(1);
    expect(r.total).toBe(5);
  });

  it('never freezes when there is no run to protect', () => {
    const p = withDone([day(2)]);
    p.startedOn = day(0);
    expect(computeRun(p, 'activity', day(3)).frozen).toEqual([]);
  });

  it("today still open is not a miss", () => {
    const p = withDone([day(0), day(1)]);
    const r = computeRun(p, 'activity', day(2));
    expect(r.current).toBe(2);
    expect(r.todayDone).toBe(false);
  });

  it('total days never drop even after a long gap', () => {
    const p = withDone([day(0), day(1), day(2)]);
    const r = computeRun(p, 'activity', day(30));
    expect(r.current).toBe(0);
    expect(r.total).toBe(3);
    expect(r.best).toBe(3);
  });

  it('is deterministic', () => {
    const p = withDone([day(0), day(2), day(3)]);
    expect(computeRun(p, 'activity', day(6))).toEqual(computeRun(p, 'activity', day(6)));
  });
});

describe('automatic step-down and offers', () => {
  it('steps down once after two missed days, is restorable, and does not repeat for the same lapse', () => {
    const p = withDone([day(0), day(1)]);
    const first = plannerReducer(p, { type: 'tick', today: day(4) }); // Wed, Thu missed (Wed frozen!) → freeze covers Wed
    // Wed frozen, so only Thu counts as a miss: no step-down yet.
    expect(first.events.filter((e) => e.track === 'activity')).toHaveLength(0);
    const second = plannerReducer(p, { type: 'tick', today: day(5) }); // Thu + Fri missed
    expect(second.events.filter((e) => e.track === 'activity')).toEqual([{ track: 'activity', kind: 'step_down', from: 2, to: 1 }]);
    expect(second.state.tracks.activity.level).toBe(1);
    const again = plannerReducer(second.state, { type: 'tick', today: day(6) });
    expect(again.events.filter((e) => e.track === 'activity')).toHaveLength(0);
    const restored = plannerReducer(second.state, { type: 'restoreLevel', track: 'activity' });
    expect(restored.state.tracks.activity.level).toBe(2);
  });

  it('never steps below level 1', () => {
    const p = withDone([day(0), day(1)]);
    p.tracks.activity.level = 1;
    expect(plannerReducer(p, { type: 'tick', today: day(8) }).events.filter((e) => e.track === 'activity')).toHaveLength(0);
  });

  it('offers a step-up after a good week, honours a decline, and never applies it automatically', () => {
    const p = withDone([0, 1, 2, 3, 4, 5].map(day));
    expect(stepUpOffer(p, 'activity', day(6))).toBe(true);
    const ticked = plannerReducer(p, { type: 'tick', today: day(6) });
    expect(ticked.state.tracks.activity.level).toBe(2);
    const declined = plannerReducer(p, { type: 'stepUp', track: 'activity', accept: false, today: day(6) });
    expect(stepUpOffer(declined.state, 'activity', day(7))).toBe(false);
    expect(stepUpOffer(declined.state, 'activity', shiftDate(day(6), PLANNER_RULES.stepUpCooldownDays + 1))).toBe(false); // week no longer good
  });

  it('completing a day and undoing it only touches that entry', () => {
    const p = freshPlanner();
    const done = plannerReducer(p, { type: 'complete', track: 'hydration', date: day(0), nowIso: 'x', measure: { glasses: 6 } }).state;
    expect(done.entries[day(0)].hydration).toMatchObject({ done: true, glasses: 6 });
    expect(done.startedOn).toBe(day(0));
    const undone = plannerReducer(done, { type: 'undo', track: 'hydration', date: day(0) }).state;
    expect(undone.entries[day(0)].hydration).toBeUndefined();
  });
});

describe('hydration safety', () => {
  const hot = { ...DEFAULT_CONTEXT, heat: 'hot' as const };
  const sure = { kidneyDisease: 'no' as const, heartCondition: 'no' as const };

  it('hides hydration for a flagged kidney or heart condition and routes to a clinician', () => {
    for (const flag of ['kidneyDisease', 'heartCondition'] as const) {
      const screening = { ...sure, [flag]: 'yes' as const };
      expect(hydrationTarget({ screening, context: hot, level: 2 })).toBeNull();
      const a = resolveActions(freshPlanner(), hot, screening).find((x) => x.track === 'hydration')!;
      expect(a.visible).toBe(false);
      expect(a.hiddenReason).toBe('clinician');
      const d = checkPlannerTargets({ hydrationGlasses: 4 }, screening);
      expect(d.result).toBe('blocked');
      expect(d.route).toBe('clinician');
    }
  });

  it('adds a gentle heat extra only when kidney and heart answers are definite "no", capped at the limit', () => {
    expect(hydrationTarget({ screening: sure, context: hot, level: 2 })).toEqual({ glasses: 8, heatApplied: true });
    expect(hydrationTarget({ screening: sure, context: hot, level: 3 })!.glasses).toBe(PLANNER_RULES.limits.hydration.maxGlassesPerDay);
    expect(hydrationTarget({ screening: { ...sure, kidneyDisease: 'unknown' }, context: hot, level: 2 })).toEqual({ glasses: 6, heatApplied: false });
    expect(hydrationTarget({ screening: sure, context: DEFAULT_CONTEXT, level: 2 })).toEqual({ glasses: 6, heatApplied: false });
  });

  it('blocks targets above the approved limits and out-of-range sleep', () => {
    expect(checkPlannerTargets({ hydrationGlasses: 12 }, sure).breaches[0].ruleId).toBe('H-MAX-GLASSES');
    expect(checkPlannerTargets({ sleepHours: 3 }, sure).result).toBe('blocked');
    expect(checkPlannerTargets({ activityMinutes: 200 }, sure).result).toBe('blocked');
    expect(checkPlannerTargets({ hydrationGlasses: 8, sleepHours: 7, activityMinutes: 15 }, sure).result).toBe('pass');
  });
});

describe('context adaptation', () => {
  const none = {};
  it('moves the sleep window for night shift and leaves rotating shifts without a fixed window', () => {
    const night = resolveActions(freshPlanner(), { ...DEFAULT_CONTEXT, shiftWork: 'night' }, none).find((a) => a.track === 'sleep')!;
    expect(night.adapted).toContain('night_shift_sleep');
    expect(night.window?.from).toBe(PLANNER_RULES.sleepWindows.night.bed);
    const rot = resolveActions(freshPlanner(), { ...DEFAULT_CONTEXT, shiftWork: 'rotating' }, none).find((a) => a.track === 'sleep')!;
    expect(rot.window).toBeUndefined();
  });

  it('schedules meals and drinks between iftar and suhoor in Ramadan', () => {
    const acts = resolveActions(freshPlanner(), { ...DEFAULT_CONTEXT, fasting: 'ramadan' }, { kidneyDisease: 'no', heartCondition: 'no' });
    expect(acts.find((a) => a.track === 'nutrition')!.window?.from).toBe(PLANNER_RULES.ramadan.iftar);
    expect(acts.find((a) => a.track === 'hydration')!.window?.from).toBe(PLANNER_RULES.ramadan.hydrationFrom);
  });

  it('is versioned', () => {
    expect(PLANNER_RULES.version).toMatch(/^planner-/);
  });
});
