import { describe, expect, it } from 'vitest';
import type { CheckIn, CheckinStatus } from './types';
import { buildFamilySummary } from './family';
import { restartState, shiftDate, toDateKey, weeklyStats } from './week';
import { createDemoState } from '../data/demoSeed';
import { DEFAULT_CONSENT } from '../app/reducer';

const TODAY = '2026-11-07';
const ci = (date: string, status: CheckinStatus = 'done', over: Partial<CheckIn> = {}): CheckIn => ({
  id: date,
  date,
  status,
  feel: 'good',
  redFlags: [],
  input: 'text',
  createdAt: `${date}T10:00:00.000Z`,
  ...over
});

describe('dates', () => {
  it('formats local calendar days and shifts across month ends', () => {
    expect(toDateKey(new Date(2026, 10, 7))).toBe('2026-11-07');
    expect(shiftDate('2026-11-01', -1)).toBe('2026-10-31');
    expect(shiftDate('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('weeklyStats', () => {
  it('reports missing days as missing, never as skipped or failed', () => {
    const w = weeklyStats([ci('2026-11-07'), ci('2026-11-05', 'skipped')], TODAY);
    expect(w.days).toHaveLength(7);
    expect(w.done).toBe(1);
    expect(w.skipped).toBe(1);
    expect(w.missing).toBe(5);
    expect(w.days.find((d) => d.date === '2026-11-06')!.state).toBe('missing');
  });

  it('counts unknown separately', () => {
    expect(weeklyStats([ci('2026-11-07', 'unknown')], TODAY).unknown).toBe(1);
  });

  it('does not break a run just because today is not logged yet', () => {
    const w = weeklyStats([ci('2026-11-06'), ci('2026-11-05'), ci('2026-11-04')], TODAY);
    expect(w.currentRun).toBe(3);
  });

  it('a skipped day ends the run without any penalty value', () => {
    const w = weeklyStats([ci('2026-11-07'), ci('2026-11-06', 'skipped'), ci('2026-11-05')], TODAY);
    expect(w.currentRun).toBe(1);
    expect(w.bestRun).toBe(1);
    expect(w.fill).toBeGreaterThanOrEqual(0);
  });

  it('describes the trend neutrally and reports no_data when there is nothing to compare', () => {
    expect(weeklyStats([], TODAY).trend).toBe('no_data');
    const up = weeklyStats([ci('2026-11-07'), ci('2026-11-06'), ci('2026-10-31')], TODAY);
    expect(up.trend).toBe('up');
  });
});

describe('restartState', () => {
  it('is not needed for someone who has not started', () => {
    expect(restartState([], TODAY)).toEqual({ needed: false, daysSince: 0 });
  });

  it('is not needed when the last done day was yesterday or today', () => {
    expect(restartState([ci('2026-11-06')], TODAY).needed).toBe(false);
    expect(restartState([ci('2026-11-07')], TODAY).needed).toBe(false);
  });

  it('is offered after 2 or more days without a done check-in', () => {
    const s = restartState([ci('2026-11-04')], TODAY);
    expect(s.needed).toBe(true);
    expect(s.daysSince).toBe(2);
  });
});

describe('demo seed produces the restart situation', () => {
  it('shows about three weeks of history and a no-shame restart offer', () => {
    const demo = createDemoState(TODAY);
    expect(demo.checkins.length).toBeGreaterThanOrEqual(15);
    expect(restartState(demo.checkins, TODAY).needed).toBe(true);
    const w = weeklyStats(demo.checkins, TODAY);
    expect(w.missing).toBeGreaterThan(0);
  });
});

describe('buildFamilySummary — consent allow-list', () => {
  const state = createDemoState(TODAY);
  const none = { goal: false, weeklyCompletion: false, feelings: false, plan: false, reminders: false, notes: false };

  it('contains nothing when nothing is shared', () => {
    expect(buildFamilySummary(state, TODAY, none)).toEqual({});
  });

  it('contains only the consented fields', () => {
    expect(Object.keys(buildFamilySummary(state, TODAY, { ...none, goal: true }))).toEqual(['goal']);
    const s = buildFamilySummary(state, TODAY, { ...none, weeklyCompletion: true });
    expect(Object.keys(s)).toEqual(['weeklyCompletion']);
    expect(s.weeklyCompletion).toMatchObject({ done: expect.any(Number), missing: expect.any(Number) });
  });

  it('never leaks notes, feelings or plan unless each is switched on', () => {
    const json = JSON.stringify(buildFamilySummary(state, TODAY, DEFAULT_CONSENT));
    expect(json).not.toContain('mall');
    expect(json).not.toContain('মল');
    expect(json).not.toContain('tpl-');
    expect(json).not.toContain('feelings');
  });

  it('adds notes and feelings only when switched on', () => {
    const withNotes = buildFamilySummary(state, TODAY, { ...none, notes: true, feelings: true });
    expect(withNotes.notes).toBeDefined();
    expect(withNotes.feelings).toBeDefined();
    expect(withNotes.goal).toBeUndefined();
  });
});
