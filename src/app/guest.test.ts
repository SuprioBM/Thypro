import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDemoState } from '../data/demoSeed';
import type { CheckIn } from '../domain/types';
import { evaluateSafety } from '../safety/engine';
import { createGuestPersistence, createLocalPersistence, type StorageLike } from './persistence';
import { emptyState, isBlocked, reducer } from './reducer';

const TODAY = '2026-11-07';
const NOW = `${TODAY}T10:00:00.000Z`;

const storageSpy = () => {
  const store = new Map<string, string>();
  const api = {
    getItem: vi.fn((k: string) => store.get(k) ?? null),
    setItem: vi.fn((k: string, v: string) => void store.set(k, v)),
    removeItem: vi.fn((k: string) => void store.delete(k))
  };
  return { api, store };
};

describe('guest-mode isolation', () => {
  let local: ReturnType<typeof storageSpy>;
  let session: ReturnType<typeof storageSpy>;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    local = storageSpy();
    session = storageSpy();
    fetchSpy = vi.fn();
    vi.stubGlobal('localStorage', local.api);
    vi.stubGlobal('sessionStorage', session.api);
    vi.stubGlobal('fetch', fetchSpy);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('never touches localStorage, sessionStorage or the network during a full guest session', () => {
    const persist = createGuestPersistence();
    let state = createDemoState(TODAY);
    persist.save(state);

    const checkin: CheckIn = {
      id: 'x', date: TODAY, status: 'done', feel: 'unwell', redFlags: ['chestPain'],
      input: 'text', createdAt: NOW, note: { original: 'private note', lang: 'en' }
    };
    state = reducer(state, { type: 'saveCheckin', checkin, nowIso: NOW, seed: 's1' });
    state = reducer(state, { type: 'restartPlan', nowIso: NOW, seed: 's2' });
    state = reducer(state, { type: 'setConsent', field: 'notes', value: true });
    persist.save(state);
    expect(persist.load()).toBe(state);
    persist.clear();

    for (const spy of [local.api, session.api]) {
      expect(spy.getItem).not.toHaveBeenCalled();
      expect(spy.setItem).not.toHaveBeenCalled();
      expect(spy.removeItem).not.toHaveBeenCalled();
    }
    expect(local.store.size).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('resets to nothing on exit and starts clean next time', () => {
    const persist = createGuestPersistence();
    persist.save(createDemoState(TODAY));
    persist.clear();
    expect(persist.load()).toBeNull();
    expect(createDemoState(TODAY)).toEqual(createDemoState(TODAY));
  });

  it('local mode, by contrast, does persist (to the storage it is given)', () => {
    const s = storageSpy();
    const persist = createLocalPersistence(s.api as StorageLike);
    const state = emptyState('local', 'en');
    persist.save(state);
    expect(s.api.setItem).toHaveBeenCalledOnce();
    expect(persist.load()).toEqual(state);
  });

  it('local persistence ignores corrupt or foreign data instead of crashing', () => {
    const s = storageSpy();
    s.store.set('thypro.local.v1', '{not json');
    expect(createLocalPersistence(s.api as StorageLike).load()).toBeNull();
    s.store.set('thypro.local.v1', JSON.stringify({ schema: 99, state: {} }));
    expect(createLocalPersistence(s.api as StorageLike).load()).toBeNull();
    // A guest-mode state must never be accepted back from storage.
    s.store.set('thypro.local.v1', JSON.stringify({ schema: 1, state: createDemoState(TODAY) }));
    expect(createLocalPersistence(s.api as StorageLike).load()).toBeNull();
  });
});

describe('demo seed is synthetic only', () => {
  const demo = createDemoState(TODAY);
  const json = JSON.stringify(demo);

  it('is flagged synthetic, in guest mode, Bangla-speaking and in Abu Dhabi', () => {
    expect(demo.profile.synthetic).toBe(true);
    expect(demo.mode).toBe('guest');
    expect(demo.profile.lang).toBe('bn');
    expect(demo.profile.city).toBe('Abu Dhabi');
    expect(demo.profile.displayName).toMatch(/demo/i);
  });

  it('contains no email addresses and only an obviously fake phone number', () => {
    expect(json).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
    expect(demo.profile.familyContact?.phone).toMatch(/000 0000 \(demo\)/);
  });

  it('has one habit goal and about three weeks of check-ins', () => {
    expect(demo.setup?.goalType).toBe('walk');
    expect(demo.plans).toHaveLength(1);
    expect(demo.checkins.length).toBeGreaterThanOrEqual(15);
  });

  it('passes the safety engine and is not blocked', () => {
    const d = evaluateSafety({ ownTargets: demo.setup!.ownTargets, screening: demo.setup!.screening });
    expect(d.result).toBe('pass');
    expect(isBlocked(demo)).toBe(false);
  });
});

describe('reducer', () => {
  const setupOk = createDemoState(TODAY).setup!;

  it('is pure: same action on same state gives the same result and does not mutate', () => {
    const state = emptyState('local', 'en');
    const snap = JSON.stringify(state);
    const action = { type: 'completeSetup' as const, setup: setupOk, nowIso: NOW, seed: 'a' };
    expect(reducer(state, action)).toEqual(reducer(state, action));
    expect(JSON.stringify(state)).toBe(snap);
  });

  it('creates a versioned plan and writes safety + plan audit entries', () => {
    const next = reducer(emptyState('local', 'en'), { type: 'completeSetup', setup: setupOk, nowIso: NOW, seed: 'a' });
    expect(next.plans).toHaveLength(1);
    expect(next.plans[0].version).toBe(1);
    expect(next.audit.map((a) => a.kind)).toEqual(['safety', 'plan']);
    expect(next.audit[0].result).toBe('pass');
    const again = reducer(next, { type: 'restartPlan', nowIso: NOW, seed: 'b' });
    expect(again.plans.map((p) => p.version)).toEqual([1, 2]);
    expect(again.plans[1].restart).toBe(true);
  });

  it('blocked setup creates no plan, logs the decision, and is reported as blocked', () => {
    const risky = { ...setupOk, screening: { ...setupOk.screening, pregnancy: 'yes' as const } };
    const next = reducer(emptyState('local', 'en'), { type: 'completeSetup', setup: risky, nowIso: NOW, seed: 'a' });
    expect(next.plans).toHaveLength(0);
    expect(next.audit).toHaveLength(1);
    expect(next.audit[0]).toMatchObject({ kind: 'safety', result: 'blocked', reasonCode: 'screening_pregnancy' });
    expect(isBlocked(next)).toBe(true);
  });

  it('logs an escalation to the audit log when a check-in is worrying', () => {
    const checkin: CheckIn = {
      id: 'x', date: TODAY, status: 'done', feel: 'unwell', redFlags: ['breathing'], input: 'text', createdAt: NOW
    };
    const next = reducer(createDemoState(TODAY), { type: 'saveCheckin', checkin, nowIso: NOW, seed: 'e' });
    const entry = next.audit[next.audit.length - 1];
    expect(entry).toMatchObject({ kind: 'escalation', result: 'escalated', reasonCode: 'redflag_breathing' });
  });

  it('replaces a same-day check-in instead of duplicating it', () => {
    const base = createDemoState(TODAY);
    const mk = (status: CheckIn['status']): CheckIn => ({
      id: 'x', date: TODAY, status, feel: 'good', redFlags: [], input: 'text', createdAt: NOW
    });
    const a = reducer(base, { type: 'saveCheckin', checkin: mk('skipped'), nowIso: NOW, seed: '1' });
    const b = reducer(a, { type: 'saveCheckin', checkin: mk('done'), nowIso: NOW, seed: '2' });
    expect(b.checkins.filter((c) => c.date === TODAY)).toHaveLength(1);
    expect(b.checkins.find((c) => c.date === TODAY)!.status).toBe('done');
  });
});
