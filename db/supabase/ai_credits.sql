-- TradeHax AI Credits persistence schema
-- Applies to tables configured by:
--   TRADEHAX_SUPABASE_AI_CREDITS_TABLE (default: tradehax_ai_credit_balances)
--   TRADEHAX_SUPABASE_AI_CREDITS_LEDGER_TABLE (default: tradehax_ai_credit_ledger)

create table if not exists public.tradehax_ai_credit_balances (
  user_id text primary key,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.tradehax_ai_credit_ledger (
  id text primary key,
  user_id text not null,
  event_type text not null check (event_type in ('purchase', 'spend')),
  tier text null,
  pack_id text null,
  credits integer null,
  price_usd numeric(12, 2) null,
  provider text null,
  balance_after integer not null check (balance_after >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_tradehax_ai_credit_ledger_user_created
  on public.tradehax_ai_credit_ledger (user_id, created_at desc);

create index if not exists idx_tradehax_ai_credit_ledger_event_type
  on public.tradehax_ai_credit_ledger (event_type);
