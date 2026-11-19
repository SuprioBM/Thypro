-- Security tests for the Thypro schema. Runs inside one transaction and ROLLS BACK: leaves no data.
-- Any failed assertion raises an exception, so the API call returns an error.
-- Run: node scripts/db-run.mjs supabase/tests/rls.sql   (expect: 201 and a row with result = 'ALL OK')

begin;

create or replace function pg_temp.as_user(uid uuid, mail text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'email', mail, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;
create or replace function pg_temp.as_admin() returns void language plpgsql as $$
begin execute 'reset role'; end $$;
create or replace function pg_temp.expect_fail(sql text, label text) returns void language plpgsql as $$
begin
  begin execute sql; exception when others then return; end;
  raise exception 'EXPECTED FAILURE did not happen: %', label;
end $$;
create or replace function pg_temp.expect_eq(actual anyelement, expected anyelement, label text) returns void language plpgsql as $$
begin
  if actual is distinct from expected then raise exception 'ASSERT % : got %, wanted %', label, actual, expected; end if;
end $$;

-- fixtures (as the table owner) ------------------------------------------------
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'a@t.test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b1', 'b@t.test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000c1', 'c@t.test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000d1', 'd@t.test', 'authenticated', 'authenticated');
update public.profiles set role = 'sponsor' where id = '00000000-0000-0000-0000-0000000000d1';

-- 1. A profile row is created automatically
select pg_temp.expect_eq((select count(*)::int from public.profiles where id::text like '00000000-0000-0000-0000-0000000000%'), 4, 'profiles created');

-- 2. Ownership of state -----------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1', 'a@t.test');
insert into public.user_state (user_id, state) values ('00000000-0000-0000-0000-0000000000a1',
  jsonb_build_object('setup', jsonb_build_object('goalType', 'walk'),
    'checkins', jsonb_build_array(
      jsonb_build_object('date', current_date::text, 'status', 'done', 'feel', 'good', 'note', jsonb_build_object('original', 'secret note')),
      jsonb_build_object('date', (current_date - 1)::text, 'status', 'skipped', 'feel', 'tired')),
    'coach', jsonb_build_object('clinicianShare', true, 'history', jsonb_build_array(jsonb_build_object('id', 'cp1')))));
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1', 'b@t.test');
select pg_temp.expect_eq((select count(*)::int from public.user_state), 0, 'B cannot read A state');
select pg_temp.expect_fail($$insert into public.user_state (user_id, state) values ('00000000-0000-0000-0000-0000000000a1', '{}')$$, 'B writes as A');
update public.user_state set state = '{"hacked":true}' where user_id = '00000000-0000-0000-0000-0000000000a1';
select pg_temp.as_admin();
select pg_temp.expect_eq((select state ? 'hacked' from public.user_state where user_id = '00000000-0000-0000-0000-0000000000a1'), false, 'B update had no effect');

-- 3. Roles cannot be self-assigned ---------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1', 'a@t.test');
select pg_temp.expect_fail($$update public.profiles set role = 'sponsor' where id = auth.uid()$$, 'self-promote');
select pg_temp.expect_fail($$update public.profiles set role = 'clinician' where id = auth.uid()$$, 'self-promote clinician');
update public.profiles set display_name = 'Ayesha (test)' where id = auth.uid();

-- 4. Audit log is append-only ----------------------------------------------------------
insert into public.audit_events (user_id, client_id, at, kind, result) values (auth.uid(), 'e1', now(), 'coach', 'proposed');
select pg_temp.expect_fail($$update public.audit_events set result = 'accepted'$$, 'audit update');
select pg_temp.expect_fail($$delete from public.audit_events$$, 'audit delete');
select pg_temp.expect_fail($$insert into public.audit_events (user_id, client_id, at, kind, result) values ('00000000-0000-0000-0000-0000000000b1', 'e2', now(), 'x', 'y')$$, 'audit for someone else');
select pg_temp.expect_fail($$insert into public.audit_events (user_id, client_id, at, kind, result) values (auth.uid(), 'e1', now(), 'coach', 'proposed')$$, 'audit duplicate id');

-- 5. Consent-filtered sharing ---------------------------------------------------------------
insert into public.share_grants (owner_id, grantee_email, role, consent)
  values (auth.uid(), 'c@t.test', 'clinician', '{"goal":true,"weeklyCompletion":true,"notes":false}');
select set_config('t.gid', (select id::text from public.share_grants limit 1), true);
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1', 'b@t.test');
select pg_temp.expect_fail($$select public.shared_view('00000000-0000-0000-0000-0000000000a1')$$, 'stranger reads shared view');
select pg_temp.expect_fail($$select public.accept_share(current_setting('t.gid')::uuid)$$, 'stranger accepts');
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1', 'c@t.test');
select pg_temp.expect_fail($$select public.shared_view('00000000-0000-0000-0000-0000000000a1')$$, 'view before accepting');
select public.accept_share(current_setting('t.gid')::uuid);
select pg_temp.expect_eq(public.shared_view('00000000-0000-0000-0000-0000000000a1') ->> 'goal', 'walk', 'goal shared');
select pg_temp.expect_eq((public.shared_view('00000000-0000-0000-0000-0000000000a1') ->> 'weeklyDone')::int, 1, 'weekly shared');
select pg_temp.expect_eq(public.shared_view('00000000-0000-0000-0000-0000000000a1') ? 'notes', false, 'notes NOT shared');
select pg_temp.expect_eq(public.shared_view('00000000-0000-0000-0000-0000000000a1') ? 'feelings', false, 'feelings NOT shared');
select pg_temp.expect_eq(jsonb_array_length(public.shared_view('00000000-0000-0000-0000-0000000000a1') -> 'coachHistory'), 1, 'clinician sees coach history when allowed');
select pg_temp.expect_eq((select count(*)::int from public.user_state), 0, 'grantee cannot read raw state');
-- revocation takes effect immediately
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1', 'a@t.test');
update public.share_grants set status = 'revoked';
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1', 'c@t.test');
select pg_temp.expect_fail($$select public.shared_view('00000000-0000-0000-0000-0000000000a1')$$, 'view after revoke');

-- 6. Sponsor aggregates: under 20 shows nothing --------------------------------------------------
select pg_temp.as_admin();
insert into public.cohort_groups values ('small', 'Small site'), ('big', 'Big site');
insert into auth.users (id, email, aud, role)
  select ('10000000-0000-0000-0000-' || lpad(g::text, 12, '0'))::uuid, 'u' || g || '@t.test', 'authenticated', 'authenticated' from generate_series(1, 25) g;
insert into public.user_state (user_id, state)
  select ('10000000-0000-0000-0000-' || lpad(g::text, 12, '0'))::uuid,
         jsonb_build_object('checkins', jsonb_build_array(jsonb_build_object('date', current_date::text, 'status', case when g % 2 = 0 then 'done' else 'skipped' end)))
  from generate_series(1, 25) g;
insert into public.cohort_members (user_id, group_id)
  select ('10000000-0000-0000-0000-' || lpad(g::text, 12, '0'))::uuid, case when g <= 5 then 'small' else 'big' end from generate_series(1, 25) g;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1', 'a@t.test');
select pg_temp.expect_fail($$select * from public.sponsor_group_totals()$$, 'non-sponsor calls totals');
select pg_temp.as_user('00000000-0000-0000-0000-0000000000d1', 'd@t.test');
select pg_temp.expect_eq((select enough from public.sponsor_group_totals() where group_id = 'small'), false, 'small group suppressed');
select pg_temp.expect_eq((select people from public.sponsor_group_totals() where group_id = 'small'), null::int, 'small count hidden');
select pg_temp.expect_eq((select active_rate from public.sponsor_group_totals() where group_id = 'small'), null::numeric, 'small rate hidden');
select pg_temp.expect_eq((select enough from public.sponsor_group_totals() where group_id = 'big'), true, 'big group shown');
select pg_temp.expect_eq((select people from public.sponsor_group_totals() where group_id = 'big'), 20, 'big count');
select pg_temp.expect_eq((select count(*)::int from public.user_state), 0, 'sponsor cannot read any person state');

-- 6b. delete_my_data wipes one person's rows but keeps the account
select pg_temp.as_user('10000000-0000-0000-0000-000000000001', 'u1@t.test');
insert into public.audit_events (user_id, client_id, at, kind, result) values (auth.uid(), 'z1', now(), 'coach', 'proposed');
select public.delete_my_data();
select pg_temp.as_admin();
select pg_temp.expect_eq((select count(*)::int from public.user_state where user_id = '10000000-0000-0000-0000-000000000001'), 0, 'delete_my_data state');
select pg_temp.expect_eq((select count(*)::int from public.audit_events where user_id = '10000000-0000-0000-0000-000000000001'), 0, 'delete_my_data audit');
select pg_temp.expect_eq((select count(*)::int from auth.users where id = '10000000-0000-0000-0000-000000000001'), 1, 'account kept');

-- 7. Deletion removes everything ----------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1', 'a@t.test');
select public.delete_my_account();
select pg_temp.as_admin();
select pg_temp.expect_eq((select count(*)::int from public.user_state where user_id = '00000000-0000-0000-0000-0000000000a1'), 0, 'state deleted');
select pg_temp.expect_eq((select count(*)::int from public.audit_events where user_id = '00000000-0000-0000-0000-0000000000a1'), 0, 'audit deleted');
select pg_temp.expect_eq((select count(*)::int from public.share_grants where owner_id = '00000000-0000-0000-0000-0000000000a1'), 0, 'grants deleted');

select 'ALL OK' as result;
rollback;
