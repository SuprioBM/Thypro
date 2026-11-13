import { describe, expect, it } from 'vitest';
import type { CheckIn, CheckinStatus, ContextProfile, GoalProgress } from '../domain/types';
import { DEFAULT_CONTEXT, DEFAULT_PREFS } from '../domain/types';
import { cumulativeDays, detectLapse, evaluateStepDown, stepUpOffer } from '../domain/ladder';
import { computeOutcomes } from '../domain/outcomes';
import { nextChannel, proposeAdaptations, suggestedTime, type AdaptInput } from './engine';
import { ADAPT_RULES } from './rules.config';
import { summarizeSignals } from './signals';

const TODAY = '2026-11-14';
const ci = (date: string, status: CheckinStatus = 'done', over: Partial<CheckIn> = {}): CheckIn => ({
  id: date,
  date,
  status,
  feel: 'good',
  redFlags: [],
  input: 'text',
  createdAt: `${date}T19:00:00.000Z`,
  ...over
});

describe('lapse detector', () => {
  it('needs two consecutive missed days, counting a missing day and a skipped day alike', () => {
    expect(detectLapse([ci('2026-11-13')], TODAY).lapsed).toBe(false);
    expect(detectLapse([ci('2026-11-12')], TODAY)).toMatchObject({ lapsed: false, missedDays: 1 });
    expect(detectLapse([ci('2026-11-11')], TODAY)).toMatchObject({ lapsed: true, missedDays: 2 });
    expect(detectLapse([ci('2026-11-12'), ci('2026-11-13', 'skipped')], TODAY).lapsed).toBe(false);
    expect(detectLapse([ci('2026-11-11'), ci('2026-11-12', 'skipped'), ci('2026-11-13', 'skipped')], TODAY).lapsed).toBe(true);
  });

  it('does not treat "not sure" as a miss', () => {
    expect(detectLapse([ci('2026-11-11'), ci('2026-11-12', 'unknown'), ci('2026-11-13', 'unknown')], TODAY).lapsed).toBe(false);
  });

  it('counts today as a miss only once today is logged as skipped', () => {
    expect(detectLapse([ci('2026-11-12'), ci('2026-11-13', 'skipped')], TODAY).missedDays).toBe(1);
    expect(detectLapse([ci('2026-11-12'), ci('2026-11-13', 'skipped'), ci(TODAY, 'skipped')], TODAY).lapsed).toBe(true);
  });

  it('is never triggered for someone who has not started', () => {
    expect(detectLapse([], TODAY)).toEqual({ lapsed: false, missedDays: 0, episodeKey: '' });
  });

  it('identifies the lapse by the last done day', () => {
    expect(detectLapse([ci('2026-11-10'), ci('2026-11-11', 'skipped')], TODAY).episodeKey).toBe('2026-11-10');
  });
});

describe('small-step ladder', () => {
  const lapsed = [ci('2026-11-10'), ci('2026-11-11'), ci('2026-11-12', 'skipped')];

  it('steps down exactly one level after two misses', () => {
    const d = evaluateStepDown({ level: 3 }, lapsed, TODAY);
    expect(d).toMatchObject({ stepDown: true, from: 3, to: 2, episodeKey: '2026-11-11' });
  });

  it('steps down only once per lapse', () => {
    const p: GoalProgress = { level: 2, lastStepDownEpisode: '2026-11-11' };
    expect(evaluateStepDown(p, lapsed, TODAY).stepDown).toBe(false);
  });

  it('never goes below level 1', () => {
    expect(evaluateStepDown({ level: 1 }, lapsed, TODAY).stepDown).toBe(false);
  });

  const goodWeek = ['2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13'].map((d) => ci(d));

  it('offers a step up after a good week, and only offers', () => {
    expect(stepUpOffer({ level: 2 }, goodWeek, TODAY, 4)).toBe(true);
  });

  it('does not offer at the top, too soon after a change, or soon after a decline', () => {
    expect(stepUpOffer({ level: 4 }, goodWeek, TODAY, 4)).toBe(false);
    const recent = { level: 2, lastChange: { from: 1, to: 2, kind: 'up' as const, at: '', date: '2026-11-12' } };
    expect(stepUpOffer(recent, goodWeek, TODAY, 4)).toBe(false);
    expect(stepUpOffer({ level: 2, declinedUpOn: '2026-11-13' }, goodWeek, TODAY, 4)).toBe(false);
    expect(stepUpOffer({ level: 2, declinedUpOn: '2026-11-01' }, goodWeek, TODAY, 4)).toBe(true);
  });

  it('does not offer after a weak week', () => {
    expect(stepUpOffer({ level: 2 }, goodWeek.slice(0, 3), TODAY, 4)).toBe(false);
  });

  it('counts cumulative days that only ever grow', () => {
    const a = [ci('2026-11-01'), ci('2026-11-02')];
    const b = [...a, ci('2026-11-03', 'skipped'), ci('2026-11-04', 'skipped'), ci('2026-11-05', 'skipped')];
    expect(cumulativeDays(a)).toBe(2);
    expect(cumulativeDays(b)).toBe(2);
    expect(cumulativeDays([...b, ci('2026-11-06')])).toBe(3);
  });
});

const ctx = (over: Partial<ContextProfile> = {}): ContextProfile => ({ ...DEFAULT_CONTEXT, ...over });
const input = (over: Partial<AdaptInput> = {}): AdaptInput => ({
  barrier: 'time',
  goalType: 'walk',
  level: 2,
  usualTime: '19:30',
  context: ctx(),
  prefs: { channels: { ...DEFAULT_PREFS.channels }, preferredChannel: 'in-app' },
  alreadySteppedDown: false,
  hasFamilyContact: true,
  familySharingOn: false,
  ...over
});

describe('adaptation engine', () => {
  it('is versioned with an owner, and every barrier has a rule', () => {
    expect(ADAPT_RULES.version).toMatch(/^adapt-\d{4}\.\d+\.\d+$/);
    expect(ADAPT_RULES.owner).toBeTruthy();
    for (const b of ['time', 'tired', 'sick', 'travel', 'shift', 'motivation', 'cost', 'family'] as const) {
      expect(ADAPT_RULES.barrierRules.some((r) => r.barrier === b), b).toBe(true);
    }
  });

  it('proposes at most two changes, in rule order, each with its rule and barrier', () => {
    const out = proposeAdaptations(input({ barrier: 'time' }));
    expect(out.map((a) => a.action)).toEqual(['move_time', 'shrink']);
    expect(out.every((a) => a.ruleId === 'A-TIME' && a.barrier === 'time')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(ADAPT_RULES.maxPerBarrier);
  });

  it('never shrinks twice for one lapse, and never below level 1', () => {
    expect(proposeAdaptations(input({ barrier: 'sick', alreadySteppedDown: true }))).toEqual([]);
    expect(proposeAdaptations(input({ barrier: 'sick', level: 1 }))).toEqual([]);
    expect(proposeAdaptations(input({ barrier: 'sick' }))[0]).toMatchObject({ action: 'shrink', from: '2', to: '1' });
  });

  it('moves the time to fit shift work and Ramadan', () => {
    expect(suggestedTime('19:30', ctx({ shiftWork: 'night' }))).toBe(ADAPT_RULES.timeSlots.nightShift);
    expect(suggestedTime('19:30', ctx({ fasting: 'ramadan' }))).toBe(ADAPT_RULES.timeSlots.afterIftar);
    expect(suggestedTime('19:30', ctx())).toBe(ADAPT_RULES.timeSlots.morning);
    expect(suggestedTime('07:00', ctx())).toBe(ADAPT_RULES.timeSlots.evening);
    const shift = proposeAdaptations(input({ barrier: 'shift', context: ctx({ shiftWork: 'night' }) }));
    expect(shift[0]).toMatchObject({ action: 'move_time', from: '19:30', to: '16:30' });
  });

  it('switches only to a channel the person has switched on', () => {
    expect(nextChannel({ channels: { 'in-app': true, message: true, voice: false }, preferredChannel: 'in-app' })).toBe('message');
    expect(nextChannel({ channels: { 'in-app': true, message: false, voice: true }, preferredChannel: 'in-app' })).toBe('voice');
    expect(nextChannel({ channels: { 'in-app': true, message: false, voice: false }, preferredChannel: 'in-app' })).toBeNull();
    const travel = proposeAdaptations(
      input({ barrier: 'travel', prefs: { channels: { 'in-app': true, message: false, voice: false }, preferredChannel: 'in-app' } })
    );
    expect(travel.map((a) => a.action)).toEqual(['shrink']);
  });

  it('suggests a low budget only for the nutrition goal', () => {
    expect(proposeAdaptations(input({ barrier: 'cost', goalType: 'eating' }))[0]).toMatchObject({ action: 'set_budget_low', to: 'low' });
    expect(proposeAdaptations(input({ barrier: 'cost', goalType: 'walk' })).map((a) => a.action)).toEqual(['shrink']);
  });

  it('suggests sharing only when there is a contact and sharing is off', () => {
    expect(proposeAdaptations(input({ barrier: 'family' }))[0].action).toBe('suggest_share');
    expect(proposeAdaptations(input({ barrier: 'family', familySharingOn: true }))[0].action).toBe('move_time');
  });

  it('is pure', () => {
    const i = input({ barrier: 'motivation' });
    const snap = JSON.stringify(i);
    expect(proposeAdaptations(i)).toEqual(proposeAdaptations(i));
    expect(JSON.stringify(i)).toBe(snap);
  });
});

describe('personal best time and tone tracker (record only)', () => {
  it('summarises without changing anything', () => {
    const s = summarizeSignals([
      { date: 'a', hour: 20, channel: 'in-app', tone: 'neutral' },
      { date: 'b', hour: 20, channel: 'message', tone: 'encouraging' },
      { date: 'c', hour: 7, channel: null, tone: 'neutral' }
    ]);
    expect(s.count).toBe(3);
    expect(s.mostCommonHour).toBe(20);
    expect(s.byTone).toEqual({ neutral: 2, encouraging: 1 });
    expect(s.byChannel).toMatchObject({ 'in-app': 1, message: 1, none: 1 });
    expect(summarizeSignals([]).mostCommonHour).toBeNull();
  });
});

describe('outcomes', () => {
  it('measures persistence, recovery after lapses, minutes and the latest self-recorded values', () => {
    const o = computeOutcomes(
      [
        ci('2026-11-01', 'done', { activityMinutes: 10 }),
        ci('2026-11-02', 'skipped'),
        // 11-03 missing
        ci('2026-11-04', 'done', { activityMinutes: 12, bp: { systolic: 120, diastolic: 80 } }),
        ci('2026-11-05', 'done', { weightKg: 70 })
      ],
      '2026-11-05'
    );
    expect(o.doneDays).toBe(3);
    expect(o.spanDays).toBe(5);
    expect(o.persistence).toBeCloseTo(0.6);
    expect(o.recoveries).toEqual([2]);
    expect(o.medianRecovery).toBe(2);
    expect(o.activityMinutes).toBe(22);
    expect(o.latestBp).toMatchObject({ systolic: 120, diastolic: 80 });
    expect(o.latestWeight).toMatchObject({ kg: 70 });
  });

  it('does not count a single missed day as a lapse, nor an ongoing lapse as a recovery', () => {
    const o = computeOutcomes([ci('2026-11-01'), ci('2026-11-03'), ci('2026-11-04')], '2026-11-08');
    expect(o.recoveries).toEqual([]);
  });

  it('is empty before the first check-in', () => {
    expect(computeOutcomes([], TODAY)).toMatchObject({ doneDays: 0, persistence: null });
  });
});
