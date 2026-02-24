-- TradeHax Social Autopilot persistence tables
-- Run this in Supabase SQL editor (or migration pipeline) before enabling
-- TRADEHAX_SOCIAL_AUTOPILOT_STORAGE=supabase.

create table if not exists public.tradehax_social_autopilot_drafts (
  id text primary key,
  source_url text not null,
  focus text not null,
  channels jsonb not null default '[]'::jsonb,
  content jsonb not null default '{}'::jsonb,
  status text not null check (status in ('draft', 'pending_approval', 'approved', 'published')),
  scheduled_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  performance jsonb not null default '{"impressions":0,"engagements":0,"clicks":0}'::jsonb
);

create index if not exists idx_tradehax_social_autopilot_drafts_updated_at
  on public.tradehax_social_autopilot_drafts (updated_at desc);

create index if not exists idx_tradehax_social_autopilot_drafts_status
  on public.tradehax_social_autopilot_drafts (status);

create table if not exists public.tradehax_social_autopilot_queue (
  id text primary key,
  draft_id text not null references public.tradehax_social_autopilot_drafts(id) on delete cascade,
  channel text not null,
  run_at timestamptz not null,
  status text not null check (status in ('queued', 'running', 'done', 'failed')),
  attempts integer not null default 0,
  last_error text null,
  result text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tradehax_social_autopilot_queue_run_at
  on public.tradehax_social_autopilot_queue (run_at asc);

create index if not exists idx_tradehax_social_autopilot_queue_status
  on public.tradehax_social_autopilot_queue (status);
