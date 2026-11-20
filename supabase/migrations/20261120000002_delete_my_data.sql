-- "Delete my data" without deleting the account: removes every row this person owns,
-- including the append-only audit trail (only the owner's own deletion may do this).
create or replace function public.delete_my_data() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from public.audit_events where user_id = auth.uid();
  delete from public.share_grants where owner_id = auth.uid();
  delete from public.cohort_members where user_id = auth.uid();
  delete from public.user_state where user_id = auth.uid();
end $$;
revoke all on function public.delete_my_data() from public, anon;
grant execute on function public.delete_my_data() to authenticated;
