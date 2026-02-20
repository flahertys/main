-- TradeHax AI training phase 2.5 schema
-- Benchmarks + personalization persistence with service-role-only RLS
-- Run in Supabase SQL editor after ai_behavior_foundation.sql

create table if not exists public.ai_training_benchmarks (
  id text primary key,
  updated_at timestamptz not null default now(),
  payload jsonb not null,
  constraint ai_training_benchmarks_payload_object
    check (jsonb_typeof(payload) = 'object'),
  constraint ai_training_benchmarks_id_known
    check (
      id in (
        'dataset_quality',
        'regime_coverage',
        'response_quality',
        'execution_safety',
        'personalization_lift',
        'web5_game_integration',
        'live_chart_readiness'
      )
    )
);

create index if not exists idx_ai_training_benchmarks_updated_at
  on public.ai_training_benchmarks (updated_at desc);

create index if not exists idx_ai_training_benchmarks_payload_gin
  on public.ai_training_benchmarks using gin (payload);

create table if not exists public.ai_trading_personalization_profiles (
  id text primary key,
  user_id text not null,
  updated_at timestamptz not null default now(),
  profile_json jsonb not null,
  trades_tracked integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  avg_pnl_percent numeric not null default 0,
  confidence_avg numeric not null default 0,
  user_lift numeric not null default 0,
  constraint ai_trading_personalization_profiles_user_unique unique (user_id),
  constraint ai_trading_personalization_profiles_profile_object
    check (jsonb_typeof(profile_json) = 'object'),
  constraint ai_trading_personalization_profiles_counts_nonnegative
    check (trades_tracked >= 0 and wins >= 0 and losses >= 0),
  constraint ai_trading_personalization_profiles_wins_losses_bound
    check (wins + losses <= greatest(trades_tracked, 0)),
  constraint ai_trading_personalization_profiles_confidence_range
    check (confidence_avg >= 0 and confidence_avg <= 1)
);

create index if not exists idx_ai_trading_personalization_profiles_trades
  on public.ai_trading_personalization_profiles (trades_tracked desc);

create index if not exists idx_ai_trading_personalization_profiles_updated_at
  on public.ai_trading_personalization_profiles (updated_at desc);

create index if not exists idx_ai_trading_personalization_profiles_lift
  on public.ai_trading_personalization_profiles (user_lift desc);

create index if not exists idx_ai_trading_personalization_profiles_profile_gin
  on public.ai_trading_personalization_profiles using gin (profile_json);

create table if not exists public.ai_trading_trade_outcomes (
  id text primary key,
  user_id text not null,
  timestamp timestamptz not null default now(),
  symbol text not null,
  regime text not null,
  side text not null,
  pnl_percent numeric not null default 0,
  confidence numeric not null default 0,
  indicators_used jsonb not null default '[]'::jsonb,
  notes text not null default '',
  payload jsonb not null,
  constraint ai_trading_trade_outcomes_regime_valid
    check (regime in ('bull', 'bear', 'sideways', 'volatile', 'macro_shock')),
  constraint ai_trading_trade_outcomes_side_valid
    check (side in ('long', 'short')),
  constraint ai_trading_trade_outcomes_confidence_range
    check (confidence >= 0 and confidence <= 1),
  constraint ai_trading_trade_outcomes_indicators_array
    check (jsonb_typeof(indicators_used) = 'array'),
  constraint ai_trading_trade_outcomes_payload_object
    check (jsonb_typeof(payload) = 'object')
);

create index if not exists idx_ai_trading_trade_outcomes_user_timestamp
  on public.ai_trading_trade_outcomes (user_id, timestamp desc);

create index if not exists idx_ai_trading_trade_outcomes_symbol_timestamp
  on public.ai_trading_trade_outcomes (symbol, timestamp desc);

create index if not exists idx_ai_trading_trade_outcomes_regime_timestamp
  on public.ai_trading_trade_outcomes (regime, timestamp desc);

create index if not exists idx_ai_trading_trade_outcomes_payload_gin
  on public.ai_trading_trade_outcomes using gin (payload);

create index if not exists idx_ai_trading_trade_outcomes_indicators_gin
  on public.ai_trading_trade_outcomes using gin (indicators_used);

-- Optional rollup view for quick admin reads if needed later.
create materialized view if not exists public.ai_trading_personalization_rollup as
select
  p.user_id,
  p.trades_tracked,
  p.wins,
  p.losses,
  p.avg_pnl_percent,
  p.confidence_avg,
  p.user_lift,
  p.updated_at,
  (
    select count(*)
    from public.ai_trading_trade_outcomes o
    where o.user_id = p.user_id
  ) as outcomes_stored
from public.ai_trading_personalization_profiles p;

create unique index if not exists idx_ai_trading_personalization_rollup_user_id
  on public.ai_trading_personalization_rollup (user_id);

-- RLS hardening: service-role-only API writes/reads.
alter table public.ai_training_benchmarks enable row level security;
alter table public.ai_trading_personalization_profiles enable row level security;
alter table public.ai_trading_trade_outcomes enable row level security;

-- Intentionally no anon/authenticated policies.
-- PostgREST requests with anon/authenticated JWT will be denied.

-- Service role benchmark policy
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_training_benchmarks'
      and policyname = 'service_role_full_access_ai_training_benchmarks'
  ) then
    create policy service_role_full_access_ai_training_benchmarks
      on public.ai_training_benchmarks
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end;
$$;

-- Service role profile policy
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_trading_personalization_profiles'
      and policyname = 'service_role_full_access_ai_trading_personalization_profiles'
  ) then
    create policy service_role_full_access_ai_trading_personalization_profiles
      on public.ai_trading_personalization_profiles
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end;
$$;

-- Service role outcomes policy
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_trading_trade_outcomes'
      and policyname = 'service_role_full_access_ai_trading_trade_outcomes'
  ) then
    create policy service_role_full_access_ai_trading_trade_outcomes
      on public.ai_trading_trade_outcomes
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end;
$$;

-- Refresh helper for the optional rollup materialized view.
create or replace function public.refresh_ai_trading_personalization_rollup()
returns void
language sql
security definer
set search_path = public
as $$
  refresh materialized view public.ai_trading_personalization_rollup;
$$;
