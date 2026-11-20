/**
 * Cloud persistence. The reducer stays pure; this module only moves the finished state to and
 * from storage. It talks to a small `CloudApi` interface so it can be tested without a network.
 *
 * Policy: last write wins (one JSON document per person). Writes are debounced, failures keep the
 * change in memory and retry on the next change or when the browser comes back online. The audit
 * trail is mirrored to an append-only table; ids already sent are never re-sent.
 */
import type { AppState, AuditEntry } from '../domain/types';
import { SCHEMA, type Persistence } from '../app/persistence';

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'offline' | 'error';

export interface CloudApi {
  loadState(): Promise<{ state: AppState; schema: number } | null>;
  saveState(state: AppState, schema: number): Promise<void>;
  insertAudit(rows: AuditEntry[]): Promise<void>;
  deleteAllData(): Promise<void>;
}

export interface CloudPersistence extends Persistence {
  kind: 'cloud';
  status(): SyncStatus;
  subscribe(fn: (s: SyncStatus) => void): () => void;
  /** Saves any pending change now. */
  flush(): Promise<void>;
}

const AUDIT_BATCH = 200;

export function createCloudPersistence(
  api: CloudApi,
  initial: AppState | null,
  opts: { debounceMs?: number; online?: () => boolean; onOnline?: (fn: () => void) => () => void } = {}
): CloudPersistence {
  const debounceMs = opts.debounceMs ?? 1200;
  const isOnline = opts.online ?? (() => (typeof navigator === 'undefined' || navigator.onLine !== false));
  let held = initial;
  let pending: AppState | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let current: SyncStatus = 'idle';
  let running: Promise<void> | null = null;
  let clearing: Promise<void> | null = null;
  const sentAudit = new Set<string>();
  const listeners = new Set<(s: SyncStatus) => void>();
  const set = (s: SyncStatus) => {
    current = s;
    listeners.forEach((fn) => fn(s));
  };

  async function run(): Promise<void> {
    if (clearing) await clearing.catch(() => undefined); // a pending delete must finish before newer data is written
    if (!pending) return;
    const state = pending;
    pending = null;
    set('saving');
    try {
      if (!isOnline()) throw Object.assign(new Error('offline'), { offline: true });
      await api.saveState(state, SCHEMA);
      const fresh = state.audit.filter((a) => !sentAudit.has(a.id));
      for (let i = 0; i < fresh.length; i += AUDIT_BATCH) {
        const batch = fresh.slice(i, i + AUDIT_BATCH);
        await api.insertAudit(batch);
        batch.forEach((a) => sentAudit.add(a.id));
      }
      set(pending ? 'saving' : 'saved');
    } catch (e) {
      pending ??= state; // keep the newest unsaved state for the retry
      set((e as { offline?: boolean }).offline || !isOnline() ? 'offline' : 'error');
    }
  }

  function flush(): Promise<void> {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    running ??= (async () => {
      try {
        // A change that arrives while saving is saved right after; a failure stops the loop.
        do {
          await run();
        } while (pending && current !== 'offline' && current !== 'error');
      } finally {
        running = null;
      }
    })();
    return running;
  }

  opts.onOnline?.(() => void flush());
  if (!opts.onOnline && typeof window !== 'undefined') window.addEventListener('online', () => void flush());

  return {
    kind: 'cloud',
    load: () => held,
    save(state) {
      held = state;
      pending = state;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void flush(), debounceMs);
    },
    clear() {
      held = null;
      pending = null;
      if (timer) clearTimeout(timer);
      sentAudit.clear();
      clearing = api.deleteAllData().then(
        () => set('idle'),
        () => set('error')
      );
    },
    status: () => current,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    flush
  };
}
