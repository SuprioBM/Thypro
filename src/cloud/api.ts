/** Supabase-backed implementation of the cloud storage and account operations. All access is checked by row-level security. */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppState, AuditEntry, ConsentMap } from '../domain/types';
import type { CloudApi } from './sync';

export interface ShareGrant {
  id: string;
  owner_id: string;
  grantee_email: string;
  grantee_id: string | null;
  role: 'family' | 'clinician';
  consent: Partial<ConsentMap>;
  status: 'pending' | 'active' | 'revoked';
  created_at: string;
}

export interface SponsorRow {
  group_id: string;
  label: string;
  enough: boolean;
  people: number | null;
  active_rate: number | null;
  done_days: number | null;
}

function fail(e: { message: string } | null): void {
  if (e) throw new Error(e.message);
}

export function createCloudApi(sb: SupabaseClient, userId: string): CloudApi {
  return {
    async loadState() {
      const { data, error } = await sb.from('user_state').select('state, schema').eq('user_id', userId).maybeSingle();
      fail(error);
      return data ? { state: data.state as AppState, schema: data.schema as number } : null;
    },
    async saveState(state, schema) {
      const { error } = await sb
        .from('user_state')
        .upsert({ user_id: userId, state, schema, version: Date.now(), updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      fail(error);
    },
    async insertAudit(rows: AuditEntry[]) {
      const { error } = await sb.from('audit_events').upsert(
        rows.map((a) => ({
          user_id: userId,
          client_id: a.id,
          at: a.at,
          kind: a.kind,
          result: a.result,
          rule_version: a.ruleVersion,
          reason_code: a.reasonCode,
          params: a.reasonParams ?? null,
          meta: a.meta ?? null
        })),
        { onConflict: 'user_id,client_id', ignoreDuplicates: true }
      );
      fail(error);
    },
    async deleteAllData() {
      const { error } = await sb.rpc('delete_my_data');
      fail(error);
    }
  };
}

export function createAccountApi(sb: SupabaseClient, userId: string) {
  return {
    async profile(): Promise<{ role: 'person' | 'clinician' | 'sponsor' }> {
      const { data, error } = await sb.from('profiles').select('role').eq('id', userId).single();
      fail(error);
      return { role: (data?.role ?? 'person') as 'person' | 'clinician' | 'sponsor' };
    },
    async myGrants(): Promise<ShareGrant[]> {
      const { data, error } = await sb.from('share_grants').select('*').eq('owner_id', userId).order('created_at', { ascending: false });
      fail(error);
      return (data ?? []) as ShareGrant[];
    },
    async grantsToMe(): Promise<ShareGrant[]> {
      const { data, error } = await sb.from('share_grants').select('*').neq('owner_id', userId).neq('status', 'revoked').order('created_at', { ascending: false });
      fail(error);
      return (data ?? []) as ShareGrant[];
    },
    async createGrant(email: string, role: ShareGrant['role'], consent: Partial<ConsentMap>): Promise<void> {
      const { error } = await sb.from('share_grants').insert({ owner_id: userId, grantee_email: email.trim().toLowerCase(), role, consent });
      fail(error);
    },
    async updateConsent(id: string, consent: Partial<ConsentMap>): Promise<void> {
      const { error } = await sb.from('share_grants').update({ consent }).eq('id', id);
      fail(error);
    },
    async revokeGrant(id: string): Promise<void> {
      const { error } = await sb.from('share_grants').update({ status: 'revoked' }).eq('id', id);
      fail(error);
    },
    async removeGrant(id: string): Promise<void> {
      const { error } = await sb.from('share_grants').delete().eq('id', id);
      fail(error);
    },
    async acceptGrant(id: string): Promise<void> {
      const { error } = await sb.rpc('accept_share', { p_grant: id });
      fail(error);
    },
    async sharedView(owner: string): Promise<Record<string, unknown>> {
      const { data, error } = await sb.rpc('shared_view', { p_owner: owner });
      fail(error);
      return (data ?? {}) as Record<string, unknown>;
    },
    async sponsorTotals(): Promise<SponsorRow[]> {
      const { data, error } = await sb.rpc('sponsor_group_totals');
      fail(error);
      return (data ?? []) as SponsorRow[];
    },
    async deleteAccount(): Promise<void> {
      const { error } = await sb.rpc('delete_my_account');
      fail(error);
    }
  };
}

export type AccountApi = ReturnType<typeof createAccountApi>;
