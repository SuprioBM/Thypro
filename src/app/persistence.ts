/**
 * Persistence adapters.
 *
 * Guest: an in-memory holder only. It takes NO storage object and imports no
 * browser storage API, so it cannot write to localStorage, sessionStorage,
 * cookies, IndexedDB or the network. Guest data disappears when the page is
 * closed or the guest exits. (A test spies on the globals to prove it.)
 *
 * Local: serialises to a storage object that is passed in (localStorage in the
 * browser). Data never leaves the device; there is no server.
 */

import type { AppState } from '../domain/types';
import { normalizeState } from './reducer';

const KEY = 'thypro.local.v1';
/** 1 = phase 1. 2 = phase 2 (ladder, prefs, barriers, people). Older data is migrated on load, never dropped. */
export const SCHEMA = 2;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface Persistence {
  kind: 'memory' | 'local';
  load(): AppState | null;
  save(state: AppState): void;
  clear(): void;
}

export function createGuestPersistence(): Persistence {
  let held: AppState | null = null;
  return {
    kind: 'memory',
    load: () => held,
    save: (s) => {
      held = s;
    },
    clear: () => {
      held = null;
    }
  };
}

export function createLocalPersistence(storage: StorageLike): Persistence {
  return {
    kind: 'local',
    load() {
      try {
        const raw = storage.getItem(KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { schema?: number; state?: AppState };
        if (!parsed.state || parsed.state.mode !== 'local') return null;
        if (parsed.schema !== 1 && parsed.schema !== SCHEMA) return null;
        return normalizeState(parsed.state);
      } catch {
        return null;
      }
    },
    save(state) {
      try {
        storage.setItem(KEY, JSON.stringify({ schema: SCHEMA, state }));
      } catch {
        /* storage full or blocked: keep running in memory */
      }
    },
    clear() {
      try {
        storage.removeItem(KEY);
      } catch {
        /* ignore */
      }
    }
  };
}
