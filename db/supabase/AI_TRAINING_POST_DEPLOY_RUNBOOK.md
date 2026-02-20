# TradeHax AI Training Supabase Post-Deploy Runbook

This runbook covers production rollout for:

- `db/supabase/ai_training_phase25.sql` (schema + indexes + RLS + rollup function)
- `db/supabase/ai_training_phase26_seed_smoke.sql` (seed + smoke validation)

Use this as copy/paste operational checklist.

---

## 1) Preconditions

- Confirm app deploy is live (latest commit already deployed).
- Confirm these env vars are set in production app environment:
  - `TRADEHAX_AI_TRAINING_STORAGE=supabase`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `TRADEHAX_SUPABASE_AI_BENCHMARKS_TABLE=ai_training_benchmarks`
  - `TRADEHAX_SUPABASE_AI_PERSONALIZATION_TABLE=ai_trading_personalization_profiles`
  - `TRADEHAX_SUPABASE_AI_TRADE_OUTCOMES_TABLE=ai_trading_trade_outcomes`
- Run scripts in Supabase SQL Editor with an admin role.

---

## 2) Apply order (exact)

1. Run `db/supabase/ai_behavior_foundation.sql` (if not already applied in this environment).
2. Run `db/supabase/ai_training_phase25.sql`.
3. Run `db/supabase/ai_training_phase26_seed_smoke.sql`.

If any script errors, stop and resolve before continuing.

---

## 3) Immediate verification checklist

### One-command shortcut (recommended for ops)

Run:

1. `db/supabase/ai_training_ops_one_command_check.sql`

It returns a single summary row with:

- `status` (`PASS` or `FAIL`)
- `passed_checks`
- `total_checks`
- `failed_checks`
- `check_results` (JSON details per check)

Use this for fast triage; if `status = FAIL`, use the detailed checklist below to pinpoint remediation.

### A) Objects exist

```sql
select to_regclass('public.ai_training_benchmarks') as benchmarks_table;
select to_regclass('public.ai_trading_personalization_profiles') as profiles_table;
select to_regclass('public.ai_trading_trade_outcomes') as outcomes_table;
select to_regclass('public.ai_trading_personalization_rollup') as rollup_mv;
```

Expected: all 4 return non-null values.

### B) RLS is enabled on all three tables

```sql
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relname in (
  'ai_training_benchmarks',
  'ai_trading_personalization_profiles',
  'ai_trading_trade_outcomes'
)
order by relname;
```

Expected: `rls_enabled = true` for all.

### C) Service-role policies exist

```sql
select tablename, policyname
from pg_policies
where schemaname = 'public'
  and tablename in (
    'ai_training_benchmarks',
    'ai_trading_personalization_profiles',
    'ai_trading_trade_outcomes'
  )
order by tablename, policyname;
```

Expected policy names:

- `service_role_full_access_ai_training_benchmarks`
- `service_role_full_access_ai_trading_personalization_profiles`
- `service_role_full_access_ai_trading_trade_outcomes`

### D) Seed/smoke rows exist

```sql
select count(*) as seeded_benchmark_rows
from public.ai_training_benchmarks
where id in ('dataset_quality', 'personalization_lift');

select count(*) as seeded_profile_rows
from public.ai_trading_personalization_profiles
where user_id = 'smoke_user_001';

select count(*) as seeded_outcome_rows
from public.ai_trading_trade_outcomes
where user_id = 'smoke_user_001';

select count(*) as seeded_rollup_rows
from public.ai_trading_personalization_rollup
where user_id = 'smoke_user_001';
```

Expected:

- benchmark rows `>= 2`
- profile rows `= 1`
- outcome rows `>= 2`
- rollup rows `= 1`

### E) Rollup refresh function works

```sql
select public.refresh_ai_trading_personalization_rollup();
```

Expected: executes without error.

---

## 4) API-level smoke checks (post-migration)

Use admin key headers for admin endpoints.

- `GET /api/ai/admin/benchmarks`
  - Expect `ok: true`, `snapshot` populated, `persistence.mode` reflecting configured mode.
- `GET /api/ai/admin/personalization?limit=200`
  - Expect `ok: true`, `summary` populated.
- `GET /api/ai/personalization?userId=smoke_user_001`
  - Expect profile payload for `smoke_user_001`.

Optional route-level write smoke:

- POST one `trade_outcome` to `/api/ai/personalization`
- Re-query admin personalization summary and verify counters/lift update.

---

## 5) Rollback / cleanup procedures

### A) Clean only smoke seed rows (recommended first)

```sql
begin;

delete from public.ai_trading_trade_outcomes
where id in ('out_smoke_user_001_01', 'out_smoke_user_001_02');

delete from public.ai_trading_personalization_profiles
where id = 'profile_smoke_user_001';

delete from public.ai_training_benchmarks
where id in ('dataset_quality', 'personalization_lift')
  and payload->>'notes' = 'seed row for smoke validation';

select public.refresh_ai_trading_personalization_rollup();

commit;
```

### B) Full feature rollback (destructive)

Use only if you intentionally need to remove this feature schema.

```sql
begin;

drop materialized view if exists public.ai_trading_personalization_rollup;
drop function if exists public.refresh_ai_trading_personalization_rollup();

drop table if exists public.ai_trading_trade_outcomes;
drop table if exists public.ai_trading_personalization_profiles;
drop table if exists public.ai_training_benchmarks;

commit;
```

After full rollback, set app env to:

- `TRADEHAX_AI_TRAINING_STORAGE=memory`

Then redeploy app so runtime stops attempting Supabase persistence for training tables.

---

## 6) Incident response quick notes

- If API writes fail with `401/403` from Supabase:
  - Verify `SUPABASE_SERVICE_ROLE_KEY` is present and valid in deployment environment.
  - Verify RLS policies exist exactly as defined above.
- If rollup queries fail:
  - Re-run Phase 2.5 script to ensure function/materialized view exists.
- If duplicate seed concerns arise:
  - Phase 2.6 is idempotent (`on conflict do update`), so re-running is safe.

---

## 7) Ops sign-off template

- [ ] Phase 2.5 script applied successfully
- [ ] Phase 2.6 script applied successfully
- [ ] RLS enabled on all 3 tables
- [ ] Service-role policies present on all 3 tables
- [ ] Seed/smoke counts meet expected values
- [ ] Rollup refresh function executed successfully
- [ ] API smoke checks passed
- [ ] (Optional) Seed data cleaned up
- [ ] Production monitoring verified post-change
