/**
 * Supabase client, created lazily and only when someone chooses to sign in. Guest and Local
 * modes never load this module, never open a connection, and never send anything.
 * Only the PUBLIC (publishable) key is used in the browser; row-level security does the protecting.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const cloudConfigured = (): boolean => Boolean(URL_ && KEY);

let client: Promise<SupabaseClient> | null = null;

export function getClient(): Promise<SupabaseClient> {
  if (!cloudConfigured()) return Promise.reject(new Error('cloud_not_configured'));
  client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(URL_!, KEY!, { auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  );
  return client;
}
