import { describe, expect, it } from 'vitest';
import { createDemoState } from '../data/demoSeed';
import { emptyState, normalizeState, reducer } from '../app/reducer';
import { EXERCISES, getExercise } from './library';
import { STARTER_PLANS } from './plans';
import { targetFor } from './progression';
import { activityGrid, daysSinceTrained, detectRecords, muscleSets } from './records';
import { strengthReducer, type StrengthAction } from './reducer';
import { nextSession, weekdayIndex } from './schedule';
import { screenStrength } from './safety';
import { EMPTY_STRENGTH, type LoggedExercise, type Prescription, type StrengthState, type WorkoutSession } from './types';

const TODAY = '2026-11-12'; // a Thursday

const goblet = getExercise('goblet-squat')!;
const wallPush = getExercise('wall-push-up')!;
const plank = getExercise('knee-plank')!;
const rxWeight: Prescription = { exerciseId: 'goblet-squat', sets: 3, min: 8, max: 12, restSec: 90 };
const rxBody: Prescription = { exerciseId: 'wall-push-up', sets: 2, min: 8, max: 12, restSec: 60 };
const rxHold: Prescription = { exerciseId: 'knee-plank', sets: 2, min: 20, max: 40, restSec: 45 };

function session(date: string, ex: LoggedExercise[], routineId = 'basics-a', planId = 'basics'): WorkoutSession {
  return { id: `s-${date}-${routineId}`, planId, routineId, date, startedAt: `${date}T10:00:00Z`, endedAt: `${date}T10:20:00Z`, exercises: ex, minutes: 20, records: [] };
}
const logged = (exerciseId: string, sets: [number, number][], planned = sets.length): LoggedExercise => ({
  exerciseId,
  planned,
  target: { weightKg: 0, reps: 0, reason: 'first_time' },
  sets: sets.map(([reps, weightKg]) => ({ reps, weightKg, done: true }))
});

describe('library and plans', () => {
  it('every exercise has a name and instructions in all four languages', () => {
    for (const e of EXERCISES) for (const l of ['en', 'bn', 'hi', 'ur'] as const) {
      expect(e.t[l][0].length, `${e.id} ${l} name`).toBeGreaterThan(1);
      expect(e.t[l][1].length, `${e.id} ${l} how`).toBeGreaterThan(10);
    }
  });
  it('exercise ids are unique and every starter plan only uses known exercises', () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
    for (const p of STARTER_PLANS) for (const r of p.routines) for (const i of r.items) {
      expect(getExercise(i.exerciseId), `${p.id}/${r.id}/${i.exerciseId}`).toBeDefined();
      expect(i.min).toBeLessThanOrEqual(i.max);
    }
  });
  it('weekly plans point only at routines that exist', () => {
    for (const p of STARTER_PLANS) for (const d of p.weekdays) if (d) expect(p.routines.some((r) => r.id === d)).toBe(true);
  });
});

describe('progression: double progression with safe rules', () => {
  it('starts at the bottom of the range with the starting weight', () => {
    expect(targetFor(goblet, rxWeight, [])).toEqual({ weightKg: 4, reps: 8, reason: 'first_time' });
  });
  it('adds a rep when every set met the minimum but not the maximum', () => {
    const past = [session('2026-11-01', [logged('goblet-squat', [[8, 4], [8, 4], [8, 4]])])];
    expect(targetFor(goblet, rxWeight, past)).toEqual({ weightKg: 4, reps: 9, reason: 'add_rep' });
  });
  it('adds load only after every set reached the top of the range, then restarts the range', () => {
    const past = [session('2026-11-01', [logged('goblet-squat', [[12, 4], [12, 4], [12, 4]])])];
    expect(targetFor(goblet, rxWeight, past)).toEqual({ weightKg: 5, reps: 8, reason: 'add_load' });
  });
  it('NEVER adds load after a missed set: it holds the weight', () => {
    const past = [session('2026-11-01', [logged('goblet-squat', [[12, 6], [12, 6], [5, 6]])])];
    const t = targetFor(goblet, rxWeight, past);
    expect(t.reason).toBe('hold');
    expect(t.weightKg).toBe(6);
  });
  it('a missed session cut short (fewer sets than planned) does not add load either', () => {
    const past = [session('2026-11-01', [logged('goblet-squat', [[12, 6]], 3)])];
    expect(targetFor(goblet, rxWeight, past).weightKg).toBeLessThanOrEqual(6);
    expect(targetFor(goblet, rxWeight, past).reason).not.toBe('add_load');
  });
  it('lowers the load by 10% after two misses in a row', () => {
    const past = [
      session('2026-11-01', [logged('goblet-squat', [[6, 10], [6, 10], [5, 10]])]),
      session('2026-11-04', [logged('goblet-squat', [[6, 10], [5, 10], [5, 10]])])
    ];
    expect(targetFor(goblet, rxWeight, past)).toEqual({ weightKg: 9, reps: 8, reason: 'deload' });
  });
  it('bodyweight never gets a load; at the top the advice is a harder variation', () => {
    const top = [session('2026-11-01', [logged('wall-push-up', [[12, 0], [12, 0]])])];
    expect(targetFor(wallPush, rxBody, top)).toEqual({ weightKg: 0, reps: 12, reason: 'harder_variation' });
    const mid = [session('2026-11-01', [logged('wall-push-up', [[9, 0], [9, 0]])])];
    expect(targetFor(wallPush, rxBody, mid)).toEqual({ weightKg: 0, reps: 10, reason: 'add_rep' });
  });
  it('holds count seconds the same way', () => {
    const past = [session('2026-11-01', [logged('knee-plank', [[25, 0], [22, 0]])])];
    expect(targetFor(plank, rxHold, past)).toEqual({ weightKg: 0, reps: 23, reason: 'add_rep' });
  });
});

describe('records', () => {
  it('the first time an exercise is done is not a "record"', () => {
    expect(detectRecords([], session('2026-11-01', [logged('goblet-squat', [[8, 4]])]))).toEqual([]);
  });
  it('flags a heavier weight, more reps (bodyweight) or a longer hold', () => {
    const before = [session('2026-11-01', [logged('goblet-squat', [[8, 4]]), logged('wall-push-up', [[10, 0]]), logged('knee-plank', [[20, 0]])])];
    const now = session('2026-11-04', [logged('goblet-squat', [[8, 5]]), logged('wall-push-up', [[11, 0]]), logged('knee-plank', [[20, 0]])]);
    const kinds = detectRecords(before, now).map((r) => `${r.exerciseId}:${r.kind}`).sort();
    expect(kinds).toEqual(['goblet-squat:weight', 'wall-push-up:reps']);
  });
  it('counts primary muscles as a full set and others as half', () => {
    const s = [session('2026-11-10', [logged('wall-push-up', [[10, 0], [10, 0]])])];
    const m = muscleSets(s, '2026-11-06');
    expect(m.chest).toBe(2);
    expect(m.shoulders).toBe(1);
    expect(m.calves).toBe(0);
    expect(muscleSets(s, '2026-11-11').chest).toBe(0);
  });
  it('knows days since each muscle was trained, and never for untrained ones', () => {
    const d = daysSinceTrained([session('2026-11-10', [logged('wall-push-up', [[10, 0]])])], TODAY);
    expect(d.chest).toBe(2);
    expect(d.calves).toBeNull();
  });
  it('builds an activity grid that ends today', () => {
    const g = activityGrid([session('2026-11-12', []), session('2026-11-12', [], 'basics-b')], TODAY, 2);
    expect(g).toHaveLength(14);
    expect(g[13]).toEqual({ date: TODAY, count: 2 });
  });
});

describe('schedule', () => {
  const basics = STARTER_PLANS.find((p) => p.id === 'basics')!;
  const full = STARTER_PLANS.find((p) => p.id === 'full-body')!;
  const plan = (starter: typeof basics, extra = {}) => ({ starterId: starter.id, name: starter.name, mode: starter.mode, routines: starter.routines, weekdays: starter.weekdays, startedOn: '2026-11-01', cautious: false, ...extra });

  it('maps dates to Monday-first weekdays', () => {
    expect(weekdayIndex('2026-11-09')).toBe(0);
    expect(weekdayIndex('2026-11-15')).toBe(6);
  });
  it('rotation: the next session is the next one not done, however the week went', () => {
    expect(nextSession(plan(basics), [], TODAY).routine?.id).toBe('basics-a');
    expect(nextSession(plan(basics), [session('2026-11-01', [])], TODAY).routine?.id).toBe('basics-b');
    const twoDone = [session('2026-11-01', [], 'basics-a'), session('2026-11-02', [], 'basics-b')];
    expect(nextSession(plan(basics), twoDone, TODAY).routine?.id).toBe('basics-a');
  });
  it('rotation does not skip a session after a long gap', () => {
    expect(nextSession(plan(basics), [session('2026-08-01', [], 'basics-a')], TODAY).routine?.id).toBe('basics-b');
  });
  it('weekly: uses the weekday, and on rest days says when the next one is', () => {
    const wed = nextSession(plan(full), [], '2026-11-11');
    expect(wed.routine?.id).toBe('full-b');
    const thu = nextSession(plan(full), [], TODAY); // Thursday: rest
    expect(thu.routine).toBeNull();
    expect(thu.nextDay).toMatchObject({ index: 4 });
  });
  it('weekly: after finishing today, points to the next day', () => {
    const r = nextSession(plan(full), [session('2026-11-11', [], 'full-b', 'full-body')], '2026-11-11');
    expect(r.doneToday).toBe(true);
    expect(r.nextDay?.index).toBe(4);
  });
});

describe('safety screening', () => {
  it('any yes blocks; unknown never blocks and is never treated as no', () => {
    expect(screenStrength({ chest: 'no', faint: 'no', advised: 'no' })).toBe('pass');
    expect(screenStrength({ chest: 'yes', faint: 'no', advised: 'no' })).toBe('blocked');
    expect(screenStrength({ chest: 'no', faint: 'unknown', advised: 'no' })).toBe('caution');
    expect(screenStrength({ chest: 'unknown', faint: 'yes', advised: 'no' })).toBe('blocked');
  });
});

describe('strength reducer', () => {
  const run = (s: StrengthState, ...actions: StrengthAction[]) => actions.reduce(strengthReducer, s);
  const pass = { chest: 'no', faint: 'no', advised: 'no' } as const;

  it('will not start a plan before screening, or after a blocking answer', () => {
    expect(run(EMPTY_STRENGTH, { type: 'startPlan', starterId: 'basics', today: TODAY }).plan).toBeNull();
    const blocked = run(EMPTY_STRENGTH, { type: 'screen', answers: { ...pass, chest: 'yes' }, nowIso: `${TODAY}T08:00:00Z` }, { type: 'startPlan', starterId: 'basics', today: TODAY });
    expect(blocked.plan).toBeNull();
  });

  it('a cautious start (unanswered question) plans one set fewer', () => {
    const s = run(EMPTY_STRENGTH,
      { type: 'screen', answers: { ...pass, faint: 'unknown' }, nowIso: `${TODAY}T08:00:00Z` },
      { type: 'startPlan', starterId: 'full-body', today: TODAY },
      { type: 'startWorkout', routineId: 'full-a', id: 'w1', nowIso: `${TODAY}T10:00:00Z`, today: TODAY });
    expect(s.plan?.cautious).toBe(true);
    expect(s.draft?.exercises[0].sets).toHaveLength(2); // 3 planned, 1 fewer
    expect(s.draft?.exercises[0].planned).toBe(3);
  });

  it('a lighter week cuts one set but never below one', () => {
    const s = run(EMPTY_STRENGTH,
      { type: 'screen', answers: pass, nowIso: `${TODAY}T08:00:00Z` },
      { type: 'startPlan', starterId: 'basics', today: TODAY },
      { type: 'setLight', until: '2026-11-18' },
      { type: 'startWorkout', routineId: 'basics-a', id: 'w1', nowIso: `${TODAY}T10:00:00Z`, today: TODAY });
    expect(s.draft?.exercises.every((e) => e.sets.length === 1)).toBe(true);
  });

  it('logs a session with only done sets, minutes, and the next target rises', () => {
    let s = run(EMPTY_STRENGTH,
      { type: 'screen', answers: pass, nowIso: `${TODAY}T08:00:00Z` },
      { type: 'startPlan', starterId: 'basics', today: TODAY },
      { type: 'startWorkout', routineId: 'basics-a', id: 'w1', nowIso: `${TODAY}T10:00:00Z`, today: TODAY });
    s = run(s, { type: 'setSet', ex: 0, set: 0, patch: { done: true, reps: 9 } }, { type: 'finishWorkout', nowIso: `${TODAY}T10:25:00Z` });
    expect(s.draft).toBeNull();
    expect(s.sessions).toHaveLength(1);
    expect(s.sessions[0].exercises).toHaveLength(1); // only the exercise with a done set
    expect(s.sessions[0].minutes).toBe(25);
    expect(nextSession(s.plan!, s.sessions, TODAY).routine?.id).toBe('basics-b');
  });

  it('an empty workout is dropped, not logged', () => {
    let s = run(EMPTY_STRENGTH,
      { type: 'screen', answers: pass, nowIso: `${TODAY}T08:00:00Z` },
      { type: 'startPlan', starterId: 'basics', today: TODAY },
      { type: 'startWorkout', routineId: 'basics-a', id: 'w1', nowIso: `${TODAY}T10:00:00Z`, today: TODAY });
    s = run(s, { type: 'finishWorkout', nowIso: `${TODAY}T10:05:00Z` });
    expect(s.sessions).toHaveLength(0);
    expect(s.draft).toBeNull();
  });

  it('stopping because unwell keeps what was done and marks the session', () => {
    let s = run(EMPTY_STRENGTH,
      { type: 'screen', answers: pass, nowIso: `${TODAY}T08:00:00Z` },
      { type: 'startPlan', starterId: 'basics', today: TODAY },
      { type: 'startWorkout', routineId: 'basics-a', id: 'w1', nowIso: `${TODAY}T10:00:00Z`, today: TODAY });
    s = run(s, { type: 'setSet', ex: 0, set: 0, patch: { done: true } }, { type: 'finishWorkout', nowIso: `${TODAY}T10:08:00Z`, stopped: 'unwell' });
    expect(s.sessions[0].stopped).toBe('unwell');
  });

  it('rejects impossible body weights', () => {
    expect(run(EMPTY_STRENGTH, { type: 'logBodyWeight', date: TODAY, kg: 5 }).bodyWeights).toHaveLength(0);
    expect(run(EMPTY_STRENGTH, { type: 'logBodyWeight', date: TODAY, kg: 71.26 }).bodyWeights[0].kg).toBe(71.3);
  });

  it('switching to weekly mode on a rotation plan creates a Mon/Wed/Fri schedule', () => {
    const s = run(EMPTY_STRENGTH,
      { type: 'screen', answers: pass, nowIso: `${TODAY}T08:00:00Z` },
      { type: 'startPlan', starterId: 'basics', today: TODAY },
      { type: 'setMode', mode: 'weekly' });
    expect(s.plan?.weekdays.filter(Boolean)).toHaveLength(3);
  });
});

describe('app integration', () => {
  it('writes audit entries for the screening and the plan, and for stopping unwell', () => {
    let st = emptyState('local', 'en');
    const at = `${TODAY}T08:00:00Z`;
    const go = (action: StrengthAction, seed: string) => (st = reducer(st, { type: 'strength', action, seed, nowIso: at }));
    go({ type: 'screen', answers: { chest: 'yes', faint: 'no', advised: 'no' }, nowIso: at }, 'a');
    expect(st.audit[st.audit.length - 1]).toMatchObject({ kind: 'safety', result: 'blocked', reasonCode: 'strength_screen_blocked', reasonParams: { question: 'chest' } });
    go({ type: 'screen', answers: { chest: 'no', faint: 'no', advised: 'no' }, nowIso: at }, 'b');
    go({ type: 'startPlan', starterId: 'basics', today: TODAY }, 'c');
    expect(st.audit[st.audit.length - 1]).toMatchObject({ kind: 'plan', reasonCode: 'strength_plan_started' });
    go({ type: 'startWorkout', routineId: 'basics-a', id: 'w', nowIso: at, today: TODAY }, 'd');
    go({ type: 'setSet', ex: 0, set: 0, patch: { done: true } }, 'e');
    go({ type: 'finishWorkout', nowIso: `${TODAY}T08:10:00Z`, stopped: 'unwell' }, 'f');
    expect(st.audit[st.audit.length - 1]).toMatchObject({ kind: 'escalation', reasonCode: 'strength_stopped_unwell' });
  });

  it('upgrades saved data from before the module existed, keeping everything', () => {
    const old = { ...emptyState('local', 'en') } as Partial<ReturnType<typeof emptyState>>;
    delete old.strength;
    const oldConsent = { goal: true, weeklyCompletion: true, feelings: false, plan: false, reminders: false, notes: false };
    const up = normalizeState({ ...(old as ReturnType<typeof emptyState>), consent: oldConsent as never });
    expect(up.strength.sessions).toEqual([]);
    expect(up.consent.strength).toBe(false);
    expect(up.consent.goal).toBe(true);
  });

  it('the guest demo has a plan, a few sessions with a record, and body weights', () => {
    const demo = createDemoState('2026-11-14');
    expect(demo.strength.plan?.starterId).toBe('basics');
    expect(demo.strength.sessions.length).toBe(5);
    expect(demo.strength.sessions.flatMap((s) => s.records).length).toBeGreaterThan(0);
    expect(demo.strength.bodyWeights).toHaveLength(3);
    expect(demo.strength.draft).toBeNull();
    expect(demo.audit.some((a) => a.reasonCode === 'strength_plan_started')).toBe(true);
  });
});
