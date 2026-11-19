# Supabase

* `migrations/` additive SQL, applied in order with `node scripts/db-run.mjs <file>` (needs `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` in `.env.local`).
* `tests/rls.sql` proves the security rules (ownership, append-only audit, consent-filtered sharing, sponsor n>=20, deletion). Run `npm run db:test`; it rolls back and must end with `ALL OK`.
* To make someone a sponsor or clinician (users cannot do this themselves): `update public.profiles set role = 'sponsor' where id = '<user uuid>';`
* To create a sponsor group: `insert into public.cohort_groups values ('site-a', 'Site A');`
