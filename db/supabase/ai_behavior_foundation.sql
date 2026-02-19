-- TradeHax AI behavior + navigator storage foundation
-- Run in Supabase SQL editor (or migration workflow)

create extension if not exists pgcrypto;

create table if not exists public.ai_behavior_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_timestamp timestamptz not null default now(),
  source text not null,
  category text not null,
  user_key text not null,
  session_id text,
  route text,
  prompt text,
  response text,
  metadata jsonb not null default '{}'::jsonb,
  training_eligible boolean not null default false
);

create index if not exists idx_ai_behavior_events_created_at
  on public.ai_behavior_events (created_at desc);

create index if not exists idx_ai_behavior_events_user_key
  on public.ai_behavior_events (user_key);

create index if not exists idx_ai_behavior_events_source
  on public.ai_behavior_events (source);

create index if not exists idx_ai_behavior_events_route
  on public.ai_behavior_events (route);

create index if not exists idx_ai_behavior_events_metadata_gin
  on public.ai_behavior_events using gin (metadata);

create table if not exists public.ai_user_consent (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_key text not null,
  analytics_consent boolean not null default true,
  training_consent boolean not null default false,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_ai_user_consent_user_key
  on public.ai_user_consent (user_key);

create index if not exists idx_ai_user_consent_updated_at
  on public.ai_user_consent (updated_at desc);

create table if not exists public.ai_training_exports (
  id text primary key,
  created_at timestamptz not null default now(),
  source text not null,
  rows integer not null default 0,
  payload_jsonl text not null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_ai_training_exports_created_at
  on public.ai_training_exports (created_at desc);

create materialized view if not exists public.ai_user_behavior_profiles as
select
  user_key,
  min(created_at) as first_seen_at,
  max(created_at) as last_seen_at,
  count(*) as total_events,
  count(*) filter (where training_eligible) as training_eligible_events,
  count(*) filter (where source = 'ai_navigator') as navigator_events,
  count(*) filter (where category = 'BEHAVIOR' or category = 'NAVIGATION') as behavior_events
from public.ai_behavior_events
group by user_key;

create unique index if not exists idx_ai_user_behavior_profiles_user_key
  on public.ai_user_behavior_profiles (user_key);

-- Recommended row level security setup
alter table public.ai_behavior_events enable row level security;
alter table public.ai_user_consent enable row level security;
alter table public.ai_training_exports enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_behavior_events'
      and policyname = 'service_role_full_access_ai_behavior_events'
  ) then
    create policy service_role_full_access_ai_behavior_events
      on public.ai_behavior_events
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_user_consent'
      and policyname = 'service_role_full_access_ai_user_consent'
  ) then
    create policy service_role_full_access_ai_user_consent
      on public.ai_user_consent
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_training_exports'
      and policyname = 'service_role_full_access_ai_training_exports'
  ) then
    create policy service_role_full_access_ai_training_exports
      on public.ai_training_exports
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end;
$$;
