import { describe, expect, it } from 'vitest';
import { createDemoState } from '../data/demoSeed';
import type { AppState, CheckIn, CheckinStatus, Reminder } from '../domain/types';
import { DEFAULT_PREFS } from '../domain/types';
import { createLocalPersistence, type StorageLike } from './persistence';
import { emptyState, normalizeState, reducer } from './reducer';
import { isQuietTime, planDelivery } from './reminders';

const TODAY = '2026-11-14';
const NOW = `${TODAY}T08:00:00.000Z`;
const ci = (date: string, status: CheckinStatus = 'done'): CheckIn => ({
  id: date, date, status, feel: 'good', redFlags: [], input: 'text', createdAt: `${date}T19:00:00.000Z`
});

function started(): AppState {
  const s = reducer(emptyState('local', 'en'), {
    type: 'completeSetup',
    setup: { ...createDemoState(TODAY).setup!, context: { ...createDemoState(TODAY).setup!.context!, shiftWork: 'night' } },
    nowIso: NOW,
    seed: 's0'
  });
  return { ...s, checkins: [ci('2026-11-10'), ci('2026-11-11')] };
}

describe('habit loop in the reducer', () => {
  it('steps down once after two misses and logs it as an adaptation', () => {
    let s = started();
    s = reducer(s, { type: 'tick', today: TODAY, nowIso: NOW, seed: 't1' });
    expect(s.progress.level).toBe(1);
    expect(s.progress.lastChange).toMatchObject({ from: 2, to: 1, kind: 'down' });
    expect(s.plans[s.plans.length - 1].level).toBe(1);
    const entry = s.audit.find((a) => a.reasonCode === 'ladder_step_down')!;
    expect(entry).toMatchObject({ kind: 'adaptation', result: 'adapted', reasonParams: { from: 2, to: 1 } });
    const again = reducer(s, { type: 'tick', today: TODAY, nowIso: NOW, seed: 't2' });
    expect(again.plans.length).toBe(s.plans.length);
  });

  it('stores the barrier and proposes changes without applying them', () => {
    let s = reducer(started(), { type: 'tick', today: TODAY, nowIso: NOW, seed: 't1' });
    const before = s.setup!.usualTime;
    s = reducer(s, { type: 'recordBarrier', barrier: 'shift', today: TODAY, nowIso: NOW, seed: 'b1' });
    expect(s.barriers.map((b) => b.barrier)).toEqual(['shift']);
    expect(s.proposal?.items.map((a) => a.action)).toEqual(['move_time', 'switch_channel']);
    expect(s.setup!.usualTime).toBe(before);
  });

  it('applies a chosen adaptation and logs what changed, why and which barrier', () => {
    let s = reducer(started(), { type: 'tick', today: TODAY, nowIso: NOW, seed: 't1' });
    s = reducer(s, { type: 'recordBarrier', barrier: 'shift', today: TODAY, nowIso: NOW, seed: 'b1' });
    s = reducer(s, { type: 'applyAdaptation', index: 0, nowIso: NOW, seed: 'a1' });
    expect(s.setup!.usualTime).toBe('16:30');
    expect(s.reminders[0].time).toBe('16:30');
    const log = s.audit.find((a) => a.reasonCode === 'adapt_move_time')!;
    expect(log).toMatchObject({ kind: 'adaptation', reasonParams: { from: '19:30', to: '16:30', barrier: 'shift' } });
    expect(s.proposal?.items.map((a) => a.action)).toEqual(['switch_channel']);
    s = reducer(s, { type: 'applyAdaptation', index: 0, nowIso: NOW, seed: 'a2' });
    expect(s.prefs.preferredChannel).toBe('message');
    expect(s.proposal).toBeNull();
  });

  it('never shrinks again for the same lapse after the automatic step down', () => {
    let s = reducer(started(), { type: 'tick', today: TODAY, nowIso: NOW, seed: 't1' });
    s = reducer(s, { type: 'recordBarrier', barrier: 'sick', today: TODAY, nowIso: NOW, seed: 'b1' });
    expect(s.proposal).toBeNull();
    expect(s.progress.level).toBe(1);
  });

  it('a step up is an offer: declining records it, accepting moves up and logs it', () => {
    const s = { ...started(), progress: { level: 2 } };
    const declined = reducer(s, { type: 'respondStepUp', accept: false, today: TODAY, nowIso: NOW, seed: 'u0' });
    expect(declined.progress).toMatchObject({ level: 2, declinedUpOn: TODAY });
    const accepted = reducer(s, { type: 'respondStepUp', accept: true, today: TODAY, nowIso: NOW, seed: 'u1' });
    expect(accepted.progress.level).toBe(3);
    expect(accepted.audit.some((a) => a.reasonCode === 'ladder_step_up')).toBe(true);
  });

  it('records a pilot signal for done check-ins only, and never changes plans because of it', () => {
    const s = started();
    const plans = s.plans.length;
    const after = reducer(s, { type: 'saveCheckin', checkin: ci(TODAY), nowIso: NOW, seed: 'c1' });
    expect(after.signals).toHaveLength(1);
    expect(after.plans.length).toBe(plans);
    expect(reducer(s, { type: 'saveCheckin', checkin: ci(TODAY, 'skipped'), nowIso: NOW, seed: 'c2' }).signals).toHaveLength(0);
  });

  it('changing the context rebuilds the plan at the current level', () => {
    const s = started();
    const next = reducer(s, { type: 'setContext', context: { ...s.setup!.context!, fasting: 'ramadan', shiftWork: 'none' }, nowIso: NOW, seed: 'x' });
    const walk = next.plans[next.plans.length - 1].items.find((i) => i.templateItemId === 'walk');
    expect(walk?.variant).toBe('afterIftar');
  });
});

describe('channels, quiet hours and frequency', () => {
  const rem: Reminder = { id: 'r', time: '22:30', enabled: true, channel: 'in-app' };
  const at = (h: number, m = 0, day = 14) => new Date(2026, 10, day, h, m);

  it('quiet hours work across midnight', () => {
    const q = { enabled: true, start: '22:00', end: '07:00' };
    expect(isQuietTime(at(22, 30), q)).toBe(true);
    expect(isQuietTime(at(6, 59), q)).toBe(true);
    expect(isQuietTime(at(7, 0), q)).toBe(false);
    expect(isQuietTime(at(12), q)).toBe(false);
    expect(isQuietTime(at(23), { ...q, enabled: false })).toBe(false);
  });

  it('holds a reminder back in quiet hours, on weekends for weekdays-only, and when off', () => {
    expect(planDelivery(rem, DEFAULT_PREFS, at(22, 30))).toEqual({ send: false, reason: 'quiet_hours' });
    expect(planDelivery(rem, { ...DEFAULT_PREFS, frequency: 'off' }, at(12))).toEqual({ send: false, reason: 'frequency' });
    // 2026-11-14 is a Saturday.
    expect(planDelivery(rem, { ...DEFAULT_PREFS, frequency: 'weekdays' }, at(12))).toEqual({ send: false, reason: 'frequency' });
    expect(planDelivery(rem, { ...DEFAULT_PREFS, frequency: 'weekdays' }, at(12, 0, 16))).toMatchObject({ send: true });
  });

  it('uses the preferred channel, falls back to another enabled one, never a disabled one', () => {
    expect(planDelivery(rem, { ...DEFAULT_PREFS, preferredChannel: 'message' }, at(12))).toEqual({ send: true, channel: 'message' });
    const voiceOnly = { ...DEFAULT_PREFS, channels: { 'in-app': false, message: false, voice: true }, preferredChannel: 'in-app' as const };
    expect(planDelivery(rem, voiceOnly, at(12))).toEqual({ send: true, channel: 'voice' });
    const none = { ...DEFAULT_PREFS, channels: { 'in-app': false, message: false, voice: false } };
    expect(planDelivery(rem, none, at(12))).toEqual({ send: false, reason: 'no_channel' });
  });

  it('a test reminder the person asked for ignores quiet hours but still respects channels', () => {
    expect(planDelivery(rem, DEFAULT_PREFS, at(23), true)).toMatchObject({ send: true });
  });
});

describe('backward-compatible storage (schema 1 → 2)', () => {
  it('loads phase-1 local data and fills phase-2 defaults without dropping anything', () => {
    const phase1 = JSON.parse(JSON.stringify(emptyState('local', 'bn'))) as Record<string, unknown>;
    for (const k of ['progress', 'barriers', 'proposal', 'prefs', 'people', 'signals']) delete phase1[k];
    (phase1.checkins as CheckIn[]) = [ci('2026-11-10')];
    const store = new Map([['thypro.local.v1', JSON.stringify({ schema: 1, state: phase1 })]]);
    const storage: StorageLike = {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => void store.set(k, v),
      removeItem: (k) => void store.delete(k)
    };
    const loaded = createLocalPersistence(storage).load()!;
    expect(loaded.checkins).toHaveLength(1);
    expect(loaded.profile.lang).toBe('bn');
    expect(loaded.progress.level).toBe(2);
    expect(loaded.prefs).toEqual(DEFAULT_PREFS);
    expect(loaded.barriers).toEqual([]);
    expect(loaded.people).toEqual([]);
  });

  it('normalizing a current state changes nothing', () => {
    const demo = createDemoState(TODAY);
    expect(normalizeState(demo)).toEqual(demo);
  });
});
