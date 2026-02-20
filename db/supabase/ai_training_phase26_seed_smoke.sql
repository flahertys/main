-- TradeHax AI training phase 2.6 seed + smoke checks
-- Run AFTER: db/supabase/ai_training_phase25.sql
-- Purpose:
--   1) Seed minimal benchmark/profile/outcome data (idempotent)
--   2) Verify constraints/index-ready query paths
--   3) Refresh and validate materialized rollup

begin;

-- ---------------------------------------------------------------------------
-- 1) Seed: benchmark stages (safe upsert)
-- ---------------------------------------------------------------------------
insert into public.ai_training_benchmarks (id, updated_at, payload)
values
  (
    'dataset_quality',
    now(),
    jsonb_build_object(
      'id', 'dataset_quality',
      'title', 'Stage 1 · Dataset quality',
      'description', 'Validate dataset cleanliness, consent eligibility, and schema consistency.',
      'targetScore', 0.9,
      'score', 0.82,
      'status', 'in_progress',
      'metrics', jsonb_build_array(
        jsonb_build_object('name', 'schema_validity', 'value', 0.96, 'target', 0.98),
        jsonb_build_object('name', 'consent_coverage', 'value', 0.88, 'target', 0.90),
        jsonb_build_object('name', 'redaction_integrity', 'value', 0.99, 'target', 0.99)
      ),
      'updatedAt', now()::text,
      'notes', 'seed row for smoke validation'
    )
  ),
  (
    'personalization_lift',
    now(),
    jsonb_build_object(
      'id', 'personalization_lift',
      'title', 'Stage 5 · Personalization lift',
      'description', 'Track user-specific win-rate and confidence lift from personalized recommendations.',
      'targetScore', 0.82,
      'score', 0.74,
      'status', 'in_progress',
      'metrics', jsonb_build_array(
        jsonb_build_object('name', 'profile_adoption', 'value', 0.70, 'target', 0.75),
        jsonb_build_object('name', 'user_lift', 'value', 0.10, 'target', 0.12),
        jsonb_build_object('name', 'feedback_match', 'value', 0.76, 'target', 0.80)
      ),
      'updatedAt', now()::text,
      'notes', 'seed row for smoke validation'
    )
  )
on conflict (id) do update
set updated_at = excluded.updated_at,
    payload = excluded.payload;

-- ---------------------------------------------------------------------------
-- 2) Seed: one profile (safe upsert)
-- ---------------------------------------------------------------------------
insert into public.ai_trading_personalization_profiles (
  id,
  user_id,
  updated_at,
  profile_json,
  trades_tracked,
  wins,
  losses,
  avg_pnl_percent,
  confidence_avg,
  user_lift
)
values (
  'profile_smoke_user_001',
  'smoke_user_001',
  now(),
  jsonb_build_object(
    'userId', 'smoke_user_001',
    'createdAt', now()::text,
    'updatedAt', now()::text,
    'favoriteIndicators', jsonb_build_object('rsi', 0.64, 'volume', 0.58, 'macd', 0.47, 'vwap', 0.55, 'bollinger_bands', 0.44, 'moon_cycles', 0.20),
    'riskProfile', 'balanced',
    'preferredTimeframes', jsonb_build_array('15m', '1h'),
    'favoriteSymbols', jsonb_build_array('SOL', 'BTC'),
    'regimes', jsonb_build_object(
      'bull', jsonb_build_object('trades', 4, 'wins', 3, 'losses', 1, 'avgPnlPercent', 1.5),
      'bear', jsonb_build_object('trades', 3, 'wins', 2, 'losses', 1, 'avgPnlPercent', 0.9),
      'sideways', jsonb_build_object('trades', 2, 'wins', 1, 'losses', 1, 'avgPnlPercent', 0.1),
      'volatile', jsonb_build_object('trades', 1, 'wins', 1, 'losses', 0, 'avgPnlPercent', 2.0),
      'macro_shock', jsonb_build_object('trades', 0, 'wins', 0, 'losses', 0, 'avgPnlPercent', 0)
    ),
    'tradesTracked', 10,
    'wins', 7,
    'losses', 3,
    'avgPnlPercent', 1.06,
    'confidenceAvg', 0.63,
    'recentOutcomes', jsonb_build_array(),
    'notes', 'phase26 smoke seed'
  ),
  10,
  7,
  3,
  1.06,
  0.63,
  0.276
)
on conflict (id) do update
set user_id = excluded.user_id,
    updated_at = excluded.updated_at,
    profile_json = excluded.profile_json,
    trades_tracked = excluded.trades_tracked,
    wins = excluded.wins,
    losses = excluded.losses,
    avg_pnl_percent = excluded.avg_pnl_percent,
    confidence_avg = excluded.confidence_avg,
    user_lift = excluded.user_lift;

-- ---------------------------------------------------------------------------
-- 3) Seed: two outcomes (safe upsert)
-- ---------------------------------------------------------------------------
insert into public.ai_trading_trade_outcomes (
  id,
  user_id,
  timestamp,
  symbol,
  regime,
  side,
  pnl_percent,
  confidence,
  indicators_used,
  notes,
  payload
)
values
(
  'out_smoke_user_001_01',
  'smoke_user_001',
  now() - interval '5 minutes',
  'SOL',
  'bull',
  'long',
  1.9,
  0.71,
  '["rsi", "volume", "vwap"]'::jsonb,
  'phase26 smoke seed +',
  jsonb_build_object(
    'id', 'out_smoke_user_001_01',
    'timestamp', (now() - interval '5 minutes')::text,
    'symbol', 'SOL',
    'regime', 'bull',
    'side', 'long',
    'pnlPercent', 1.9,
    'confidence', 0.71,
    'indicatorsUsed', jsonb_build_array('rsi', 'volume', 'vwap'),
    'notes', 'phase26 smoke seed +'
  )
),
(
  'out_smoke_user_001_02',
  'smoke_user_001',
  now() - interval '2 minutes',
  'BTC',
  'volatile',
  'short',
  -0.6,
  0.58,
  '["macd", "bollinger_bands"]'::jsonb,
  'phase26 smoke seed -',
  jsonb_build_object(
    'id', 'out_smoke_user_001_02',
    'timestamp', (now() - interval '2 minutes')::text,
    'symbol', 'BTC',
    'regime', 'volatile',
    'side', 'short',
    'pnlPercent', -0.6,
    'confidence', 0.58,
    'indicatorsUsed', jsonb_build_array('macd', 'bollinger_bands'),
    'notes', 'phase26 smoke seed -'
  )
)
on conflict (id) do update
set user_id = excluded.user_id,
    timestamp = excluded.timestamp,
    symbol = excluded.symbol,
    regime = excluded.regime,
    side = excluded.side,
    pnl_percent = excluded.pnl_percent,
    confidence = excluded.confidence,
    indicators_used = excluded.indicators_used,
    notes = excluded.notes,
    payload = excluded.payload;

-- ---------------------------------------------------------------------------
-- 4) Refresh rollup view + smoke assertions (raise if not met)
-- ---------------------------------------------------------------------------
select public.refresh_ai_trading_personalization_rollup();

do $$
declare
  v_benchmarks integer;
  v_profiles integer;
  v_outcomes integer;
  v_rollup integer;
begin
  select count(*) into v_benchmarks
  from public.ai_training_benchmarks
  where id in ('dataset_quality', 'personalization_lift');

  select count(*) into v_profiles
  from public.ai_trading_personalization_profiles
  where user_id = 'smoke_user_001';

  select count(*) into v_outcomes
  from public.ai_trading_trade_outcomes
  where user_id = 'smoke_user_001';

  select count(*) into v_rollup
  from public.ai_trading_personalization_rollup
  where user_id = 'smoke_user_001';

  if v_benchmarks < 2 then
    raise exception 'Smoke fail: expected >=2 seeded benchmark rows, got %', v_benchmarks;
  end if;

  if v_profiles <> 1 then
    raise exception 'Smoke fail: expected 1 seeded profile row, got %', v_profiles;
  end if;

  if v_outcomes < 2 then
    raise exception 'Smoke fail: expected >=2 seeded outcomes, got %', v_outcomes;
  end if;

  if v_rollup <> 1 then
    raise exception 'Smoke fail: expected 1 rollup row, got %', v_rollup;
  end if;
end
$$;

commit;

-- ---------------------------------------------------------------------------
-- Optional post-check queries (run manually)
-- ---------------------------------------------------------------------------
-- select id, updated_at from public.ai_training_benchmarks order by updated_at desc limit 10;
-- select user_id, trades_tracked, wins, losses, avg_pnl_percent, user_lift from public.ai_trading_personalization_profiles where user_id='smoke_user_001';
-- select user_id, symbol, regime, side, pnl_percent, confidence, timestamp from public.ai_trading_trade_outcomes where user_id='smoke_user_001' order by timestamp desc;
-- select * from public.ai_trading_personalization_rollup where user_id='smoke_user_001';

-- Optional cleanup (manual):
-- delete from public.ai_trading_trade_outcomes where id in ('out_smoke_user_001_01', 'out_smoke_user_001_02');
-- delete from public.ai_trading_personalization_profiles where id = 'profile_smoke_user_001';
-- delete from public.ai_training_benchmarks where id in ('dataset_quality', 'personalization_lift') and payload->>'notes' = 'seed row for smoke validation';
-- select public.refresh_ai_trading_personalization_rollup();
