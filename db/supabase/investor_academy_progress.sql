-- TradeHax Investor Academy progress persistence
-- Apply in Supabase SQL editor before enabling TRADEHAX_ACADEMY_STORAGE=supabase

create table if not exists public.tradehax_investor_academy_progress (
  user_id text primary key,
  snapshot_json jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists tradehax_investor_academy_progress_updated_idx
  on public.tradehax_investor_academy_progress (updated_at desc);

alter table public.tradehax_investor_academy_progress enable row level security;

-- Service-role writes are used by API routes.
-- Keep RLS strict for anon/auth users unless you later expose direct client access.

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tradehax_investor_academy_progress'
      and policyname = 'academy_progress_service_role_only'
  ) then
    create policy academy_progress_service_role_only
      on public.tradehax_investor_academy_progress
      as permissive
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end$$;

create or replace function public.tradehax_purge_expired_investor_academy_replay()
returns integer
language plpgsql
security definer
as $$
declare
  deleted_count integer;
begin
  delete from public.tradehax_investor_academy_admin_replay
  where expires_at <= now();

  get diagnostics deleted_count = row_count;
  return coalesce(deleted_count, 0);
end;
$$;

create table if not exists public.tradehax_investor_academy_admin_replay (
  replay_key text primary key,
  action text not null,
  target_user_id text,
  status_code integer not null,
  response_body jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create index if not exists tradehax_investor_academy_admin_replay_expires_idx
  on public.tradehax_investor_academy_admin_replay (expires_at asc);

alter table public.tradehax_investor_academy_admin_replay enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tradehax_investor_academy_admin_replay'
      and policyname = 'academy_admin_replay_service_role_only'
  ) then
    create policy academy_admin_replay_service_role_only
      on public.tradehax_investor_academy_admin_replay
      as permissive
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end$$;

create table if not exists public.tradehax_investor_academy_admin_audit (
  id text primary key,
  action text not null,
  target_user_id text,
  admin_mode text not null,
  request_ip text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists tradehax_investor_academy_admin_audit_created_idx
  on public.tradehax_investor_academy_admin_audit (created_at desc);

alter table public.tradehax_investor_academy_admin_audit enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tradehax_investor_academy_admin_audit'
      and policyname = 'academy_admin_audit_service_role_only'
  ) then
    create policy academy_admin_audit_service_role_only
      on public.tradehax_investor_academy_admin_audit
      as permissive
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end$$;

create table if not exists public.tradehax_investor_academy_economy_ledger (
  id text primary key,
  user_id text not null,
  feature text not null,
  units integer not null default 1,
  unit_cost_hax integer not null,
  total_cost_hax integer not null,
  source text not null,
  transaction_ref text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists tradehax_investor_academy_economy_ledger_user_created_idx
  on public.tradehax_investor_academy_economy_ledger (user_id, created_at desc);

alter table public.tradehax_investor_academy_economy_ledger enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tradehax_investor_academy_economy_ledger'
      and policyname = 'academy_economy_ledger_service_role_only'
  ) then
    create policy academy_economy_ledger_service_role_only
      on public.tradehax_investor_academy_economy_ledger
      as permissive
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end$$;
