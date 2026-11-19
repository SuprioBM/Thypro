-- Thypro initial schema. Additive only: never drops existing data.
-- Principles: each person owns their rows (RLS); the audit log is append-only; sharing is
-- consent-filtered inside the database; sponsors can only reach group totals for n >= 20.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  lang text not null default 'en' check (lang in ('en', 'bn', 'hi', 'ur')),
  -- 'clinician' and 'sponsor' are granted by an operator, never by the user (see column grants below).
  role text not null default 'person' check (role in ('person', 'clinician', 'sponsor')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ------------------------------------------------------------- user_state
-- The whole app state is one JSON document owned by one person. Sync is last-write-wins on `version`.
create table if not exists public.user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  schema int not null default 4,
  version bigint not null default 1,
  state jsonb not null check (pg_column_size(state) < 3000000),
  updated_at timestamptz not null default now()
);
alter table public.user_state enable row level security;
drop policy if exists user_state_owner on public.user_state;
create policy user_state_owner on public.user_state for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------ audit_events
-- Append-only: there are no update or delete policies, and the privileges are revoked below.
create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null check (char_length(client_id) <= 120),
  at timestamptz not null,
  kind text not null,
  result text not null,
  rule_version text not null default '',
  reason_code text not null default '',
  params jsonb,
  meta jsonb,
  recorded_at timestamptz not null default now(),
  unique (user_id, client_id)
);
alter table public.audit_events enable row level security;
drop policy if exists audit_select_own on public.audit_events;
create policy audit_select_own on public.audit_events for select to authenticated using (user_id = auth.uid());
drop policy if exists audit_insert_own on public.audit_events;
create policy audit_insert_own on public.audit_events for insert to authenticated with check (user_id = auth.uid());

-- ------------------------------------------------------------ share_grants
create table if not exists public.share_grants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  grantee_email text not null check (grantee_email = lower(grantee_email) and char_length(grantee_email) <= 254),
  grantee_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('family', 'clinician')),
  -- per-field consent, same field names as the app: goal, weeklyCompletion, feelings, plan, reminders, notes, strength
  consent jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'active', 'revoked')),
  created_at timestamptz not null default now(),
  unique (owner_id, grantee_email, role)
);
alter table public.share_grants enable row level security;
drop policy if exists grants_owner on public.share_grants;
create policy grants_owner on public.share_grants for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists grants_grantee_read on public.share_grants;
create policy grants_grantee_read on public.share_grants for select to authenticated
  using (grantee_id = auth.uid() or grantee_email = lower(coalesce(auth.jwt() ->> 'email', '')));

-- The grantee accepts a grant addressed to their verified email.
create or replace function public.accept_share(p_grant uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.share_grants
     set grantee_id = auth.uid(), status = 'active'
   where id = p_grant and status = 'pending'
     and grantee_email = lower(coalesce(auth.jwt() ->> 'email', ''));
  if not found then raise exception 'grant not found'; end if;
end $$;

-- What a grantee may see: ONLY the fields the owner switched on, computed in the database.
-- Raw state is never returned. A clinician additionally sees coach adjustments, only if the owner allowed it.
create or replace function public.shared_view(p_owner uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  g public.share_grants;
  s jsonb;
  c jsonb;
  out jsonb := '{}'::jsonb;
  since date := current_date - 6;
begin
  select * into g from public.share_grants
   where owner_id = p_owner and grantee_id = auth.uid() and status = 'active'
   order by created_at desc limit 1;
  if not found then raise exception 'no active grant'; end if;
  select state into s from public.user_state where user_id = p_owner;
  if s is null then return out; end if;
  c := g.consent;

  if (c ->> 'goal')::boolean is true then
    out := out || jsonb_build_object('goal', s #>> '{setup,goalType}');
  end if;
  if (c ->> 'weeklyCompletion')::boolean is true then
    out := out || jsonb_build_object('weeklyDone', (
      select count(*) from jsonb_array_elements(coalesce(s -> 'checkins', '[]'::jsonb)) x
       where x ->> 'status' = 'done' and (x ->> 'date')::date >= since));
  end if;
  if (c ->> 'feelings')::boolean is true then
    out := out || jsonb_build_object('feelings', (
      select coalesce(jsonb_agg(x ->> 'feel'), '[]'::jsonb) from jsonb_array_elements(coalesce(s -> 'checkins', '[]'::jsonb)) x
       where (x ->> 'date')::date >= since));
  end if;
  if (c ->> 'plan')::boolean is true then
    out := out || jsonb_build_object('plan', (
      select jsonb_build_object('templateId', p ->> 'templateId', 'level', p -> 'level')
        from jsonb_array_elements(coalesce(s -> 'plans', '[]'::jsonb)) with ordinality t(p, i) order by i desc limit 1));
  end if;
  if (c ->> 'reminders')::boolean is true then
    out := out || jsonb_build_object('reminders', coalesce(s -> 'reminders', '[]'::jsonb));
  end if;
  if (c ->> 'notes')::boolean is true then
    out := out || jsonb_build_object('notes', (
      select coalesce(jsonb_agg(x #>> '{note,original}'), '[]'::jsonb) from jsonb_array_elements(coalesce(s -> 'checkins', '[]'::jsonb)) x
       where x -> 'note' is not null and (x ->> 'date')::date >= since));
  end if;
  if (c ->> 'strength')::boolean is true then
    out := out || jsonb_build_object('strengthSessions', (
      select count(*) from jsonb_array_elements(coalesce(s #> '{strength,sessions}', '[]'::jsonb)) x
       where (x ->> 'date')::date >= current_date - 13));
  end if;
  if g.role = 'clinician' and (s #>> '{coach,clinicianShare}')::boolean is true then
    out := out || jsonb_build_object('coachHistory', coalesce(s #> '{coach,history}', '[]'::jsonb));
  end if;
  return out;
end $$;

-- ------------------------------------------------------------------ cohorts
-- For the sponsor aggregate view. Membership needs the person's own consent.
create table if not exists public.cohort_groups (
  id text primary key check (id ~ '^[a-z0-9-]{1,40}$'),
  label text not null
);
alter table public.cohort_groups enable row level security;
drop policy if exists cohort_groups_read on public.cohort_groups;
create policy cohort_groups_read on public.cohort_groups for select to authenticated using (true);

create table if not exists public.cohort_members (
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id text not null references public.cohort_groups(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (user_id, group_id)
);
alter table public.cohort_members enable row level security;
drop policy if exists cohort_members_owner on public.cohort_members;
create policy cohort_members_owner on public.cohort_members for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Group totals only. Below 20 people NOTHING numeric is returned, not even the count.
create or replace function public.sponsor_group_totals() returns table (
  group_id text, label text, enough boolean, people int, active_rate numeric, done_days int
) language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'sponsor') then
    raise exception 'not a sponsor';
  end if;
  return query
  with m as (
    select cm.group_id as gid, cm.user_id,
           (select count(*) from jsonb_array_elements(coalesce(us.state -> 'checkins', '[]'::jsonb)) x
             where x ->> 'status' = 'done' and (x ->> 'date')::date >= current_date - 6)::int as done7
      from public.cohort_members cm left join public.user_state us on us.user_id = cm.user_id
  ), agg as (
    select gid, count(*)::int as n, count(*) filter (where done7 > 0)::int as active, sum(done7)::int as done
      from m group by gid
  )
  select g.id, g.label, coalesce(a.n, 0) >= 20,
         case when coalesce(a.n, 0) >= 20 then a.n end,
         case when coalesce(a.n, 0) >= 20 then round(a.active::numeric / a.n, 3) end,
         case when coalesce(a.n, 0) >= 20 then a.done end
    from public.cohort_groups g left join agg a on a.gid = g.id order by g.id;
end $$;

-- --------------------------------------------------------- account deletion
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from auth.users where id = auth.uid(); -- cascades to every table above
end $$;

-- ------------------------------------------------------------------ privileges
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon;
grant select on public.profiles to authenticated;
grant update (display_name, lang) on public.profiles to authenticated;
grant select, insert, update, delete on public.user_state to authenticated;
grant select, insert on public.audit_events to authenticated;
grant select, insert, update, delete on public.share_grants to authenticated;
grant select on public.cohort_groups to authenticated;
grant select, insert, delete on public.cohort_members to authenticated;
grant execute on function public.accept_share(uuid), public.shared_view(uuid),
  public.sponsor_group_totals(), public.delete_my_account() to authenticated;
