import { createContext, useContext } from 'react';
import type { AccountApi } from '../../cloud/api';
import type { CloudPersistence } from '../../cloud/sync';

export interface CloudInfo {
  email: string;
  userId: string;
  account: AccountApi;
  persistence: CloudPersistence;
  signOut: () => Promise<void>;
  /** Removes the account (database function), then signs out. */
  deleteAccount: () => Promise<void>;
}

export const CloudContext = createContext<CloudInfo | null>(null);

/** Null unless the person is signed in. Guest and Local modes never have one. */
export const useCloud = (): CloudInfo | null => useContext(CloudContext);
