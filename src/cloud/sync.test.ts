import { describe, expect, it, vi } from 'vitest';
import { emptyState } from '../app/reducer';
import type { AppState, AuditEntry } from '../domain/types';
import persistenceSrc from '../app/persistence.ts?raw';
import seedSrc from '../data/demoSeed.ts?raw';
import { createCloudPersistence, type CloudApi } from './sync';

const audit = (id: string): AuditEntry => ({ id, at: '2026-11-20T00:00:00Z', kind: 'coach', ruleVersion: 'v', result: 'proposed', reasonCode: 'x' });
const withAudit = (ids: string[]): AppState => ({ ...emptyState('local', 'en'), audit: ids.map(audit) });

function fakeApi(over: Partial<CloudApi> = {}) {
  const saves: AppState[] = [];
  const audits: string[][] = [];
  const api: CloudApi = {
    loadState: async () => null,
    saveState: async (s) => void saves.push(s),
    insertAudit: async (rows) => void audits.push(rows.map((r) => r.id)),
    deleteAllData: async () => undefined,
    ...over
  };
  return { api, saves, audits };
}
const make = (api: CloudApi, online = () => true) => createCloudPersistence(api, null, { debounceMs: 5, online, onOnline: () => () => undefined });
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('cloud persistence', () => {
  it('returns the state it was opened with and debounces rapid saves into one write', async () => {
    const start = emptyState('local', 'en');
    const { api, saves } = fakeApi();
    const p = createCloudPersistence(api, start, { debounceMs: 5, onOnline: () => () => undefined });
    expect(p.load()).toBe(start);
    p.save(withAudit(['a']));
    p.save(withAudit(['a', 'b']));
    p.save(withAudit(['a', 'b', 'c']));
    await wait(40);
    expect(saves).toHaveLength(1);
    expect(saves[0].audit).toHaveLength(3);
    expect(p.status()).toBe('saved');
  });

  it('mirrors each audit entry once, never re-sending ids already stored', async () => {
    const { api, audits } = fakeApi();
    const p = make(api);
    p.save(withAudit(['a', 'b']));
    await p.flush();
    p.save(withAudit(['a', 'b', 'c']));
    await p.flush();
    expect(audits).toEqual([['a', 'b'], ['c']]);
  });

  it('reports offline, keeps the newest unsaved state, and saves it when connectivity returns', async () => {
    let online = false;
    const { api, saves } = fakeApi();
    const p = make(api, () => online);
    p.save(withAudit(['a']));
    await p.flush();
    expect(p.status()).toBe('offline');
    expect(saves).toHaveLength(0);
    p.save(withAudit(['a', 'b']));
    online = true;
    await p.flush();
    expect(p.status()).toBe('saved');
    expect(saves[saves.length - 1]).toMatchObject({ audit: [{ id: 'a' }, { id: 'b' }] });
  });

  it('a server error sets status "error", then recovers on the next attempt without losing data', async () => {
    let n = 0;
    const saveState = vi.fn(async () => {
      if (++n === 1) throw new Error('boom');
    });
    const { api } = fakeApi({ saveState });
    const p = make(api);
    p.save(withAudit(['a']));
    await p.flush();
    expect(p.status()).toBe('error');
    await p.flush();
    expect(p.status()).toBe('saved');
    expect(saveState).toHaveBeenCalledTimes(2);
  });

  it('an audit failure does not mark the state as saved and the entries are retried', async () => {
    let fail = true;
    const { api, audits } = fakeApi({ insertAudit: async (rows) => { if (fail) throw new Error('x'); audits.push(rows.map((r) => r.id)); } });
    const p = make(api);
    p.save(withAudit(['a']));
    await p.flush();
    expect(p.status()).toBe('error');
    fail = false;
    await p.flush();
    expect(audits).toEqual([['a']]);
  });

  it('clear() asks the server to delete everything and forgets what it mirrored', async () => {
    const deleteAllData = vi.fn(async () => undefined);
    const { api, audits } = fakeApi({ deleteAllData });
    const p = make(api);
    p.save(withAudit(['a']));
    await p.flush();
    p.clear();
    await wait(5);
    expect(deleteAllData).toHaveBeenCalledTimes(1);
    expect(p.load()).toBeNull();
    p.save(withAudit(['a']));
    await p.flush();
    expect(audits).toEqual([['a'], ['a']]);
  });

  it('guest persistence and the demo seed never reference the cloud client (no network surface)', () => {
    expect(persistenceSrc + seedSrc).not.toMatch(/supabase|cloud\//);
  });
});
