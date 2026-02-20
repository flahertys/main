-- TradeHax AI training one-command ops checker
-- Run this entire file in Supabase SQL Editor as a single execution unit.
-- Output: one summary row with pass/fail + compact JSON details.

with
expected_policies as (
  select unnest(array[
    'service_role_full_access_ai_training_benchmarks',
    'service_role_full_access_ai_trading_personalization_profiles',
    'service_role_full_access_ai_trading_trade_outcomes'
  ]) as policyname
),
policy_actual as (
  select tablename, policyname
  from pg_policies
  where schemaname = 'public'
    and tablename in (
      'ai_training_benchmarks',
      'ai_trading_personalization_profiles',
      'ai_trading_trade_outcomes'
    )
),
checks as (
  select
    'benchmarks_table_exists'::text as check_name,
    (to_regclass('public.ai_training_benchmarks') is not null) as passed,
    to_jsonb(to_regclass('public.ai_training_benchmarks')) as details

  union all

  select
    'profiles_table_exists',
    (to_regclass('public.ai_trading_personalization_profiles') is not null),
    to_jsonb(to_regclass('public.ai_trading_personalization_profiles'))

  union all

  select
    'outcomes_table_exists',
    (to_regclass('public.ai_trading_trade_outcomes') is not null),
    to_jsonb(to_regclass('public.ai_trading_trade_outcomes'))

  union all

  select
    'rollup_mv_exists',
    (to_regclass('public.ai_trading_personalization_rollup') is not null),
    to_jsonb(to_regclass('public.ai_trading_personalization_rollup'))

  union all

  select
    'refresh_function_exists',
    (to_regprocedure('public.refresh_ai_trading_personalization_rollup()') is not null),
    to_jsonb(to_regprocedure('public.refresh_ai_trading_personalization_rollup()'))

  union all

  select
    'rls_benchmarks_enabled',
    exists(
      select 1 from pg_class c
      where c.relname = 'ai_training_benchmarks' and c.relrowsecurity = true
    ),
    (
      select to_jsonb(c.relrowsecurity)
      from pg_class c
      where c.relname = 'ai_training_benchmarks'
      limit 1
    )

  union all

  select
    'rls_profiles_enabled',
    exists(
      select 1 from pg_class c
      where c.relname = 'ai_trading_personalization_profiles' and c.relrowsecurity = true
    ),
    (
      select to_jsonb(c.relrowsecurity)
      from pg_class c
      where c.relname = 'ai_trading_personalization_profiles'
      limit 1
    )

  union all

  select
    'rls_outcomes_enabled',
    exists(
      select 1 from pg_class c
      where c.relname = 'ai_trading_trade_outcomes' and c.relrowsecurity = true
    ),
    (
      select to_jsonb(c.relrowsecurity)
      from pg_class c
      where c.relname = 'ai_trading_trade_outcomes'
      limit 1
    )

  union all

  select
    'service_role_policy_count_ok',
    (
      select count(*)
      from expected_policies ep
      join policy_actual pa on pa.policyname = ep.policyname
    ) = 3,
    jsonb_build_object(
      'expected', 3,
      'actual', (
        select count(*)
        from expected_policies ep
        join policy_actual pa on pa.policyname = ep.policyname
      )
    )

  union all

  select
    'seed_benchmark_rows_ok',
    (
      select count(*)
      from public.ai_training_benchmarks
      where id in ('dataset_quality', 'personalization_lift')
    ) >= 2,
    jsonb_build_object(
      'minimum', 2,
      'actual', (
        select count(*)
        from public.ai_training_benchmarks
        where id in ('dataset_quality', 'personalization_lift')
      )
    )

  union all

  select
    'seed_profile_row_ok',
    (
      select count(*)
      from public.ai_trading_personalization_profiles
      where user_id = 'smoke_user_001'
    ) = 1,
    jsonb_build_object(
      'expected', 1,
      'actual', (
        select count(*)
        from public.ai_trading_personalization_profiles
        where user_id = 'smoke_user_001'
      )
    )

  union all

  select
    'seed_outcomes_rows_ok',
    (
      select count(*)
      from public.ai_trading_trade_outcomes
      where user_id = 'smoke_user_001'
    ) >= 2,
    jsonb_build_object(
      'minimum', 2,
      'actual', (
        select count(*)
        from public.ai_trading_trade_outcomes
        where user_id = 'smoke_user_001'
      )
    )

  union all

  select
    'seed_rollup_row_ok',
    (
      select count(*)
      from public.ai_trading_personalization_rollup
      where user_id = 'smoke_user_001'
    ) = 1,
    jsonb_build_object(
      'expected', 1,
      'actual', (
        select count(*)
        from public.ai_trading_personalization_rollup
        where user_id = 'smoke_user_001'
      )
    )
),
summary as (
  select
    count(*)::int as total_checks,
    count(*) filter (where passed)::int as passed_checks,
    count(*) filter (where not passed)::int as failed_checks,
    jsonb_agg(
      jsonb_build_object(
        'check', check_name,
        'passed', passed,
        'details', details
      )
      order by check_name
    ) as check_results
  from checks
)
select
  case when failed_checks = 0 then 'PASS' else 'FAIL' end as status,
  passed_checks,
  total_checks,
  failed_checks,
  check_results
from summary;
