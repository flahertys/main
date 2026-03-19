-- TradeHax Trading Telemetry Persistence
-- Durable counters + optional event trail for wallet/execution telemetry.

BEGIN;

CREATE TABLE IF NOT EXISTS trading_telemetry_counters (
  event_name TEXT PRIMARY KEY,
  event_count BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trading_telemetry_events (
  id BIGSERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_trading_telemetry_events_event_name
  ON trading_telemetry_events (event_name);

CREATE INDEX IF NOT EXISTS idx_trading_telemetry_events_created_at
  ON trading_telemetry_events (created_at DESC);

COMMIT;

