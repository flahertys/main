import { Pool } from 'pg';

export type TelemetryEvent =
  | 'connect_success'
  | 'connect_rejected'
  | 'chain_mismatch'
  | 'manual_fallback';

const KNOWN_EVENTS: TelemetryEvent[] = [
  'connect_success',
  'connect_rejected',
  'chain_mismatch',
  'manual_fallback',
];

const connectionString = process.env.TELEMETRY_DATABASE_URL || process.env.DATABASE_URL || '';
const pool = connectionString
  ? new Pool({
      connectionString,
      max: 8,
      idleTimeoutMillis: 15000,
      connectionTimeoutMillis: 3000,
    })
  : null;

let initialized = false;
const memoryFallback: Record<TelemetryEvent, number> = {
  connect_success: 0,
  connect_rejected: 0,
  chain_mismatch: 0,
  manual_fallback: 0,
};

async function ensureSchema(): Promise<void> {
  if (!pool || initialized) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS trading_telemetry_counters (
      event_name TEXT PRIMARY KEY,
      event_count BIGINT NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS trading_telemetry_events (
      id BIGSERIAL PRIMARY KEY,
      event_name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb
    );
  `);

  initialized = true;
}

function snapshotFromRecord(record: Record<TelemetryEvent, number>, durable: boolean) {
  const extensionConnectAttempts = record.connect_success + record.connect_rejected;
  const manualPathEvents = record.manual_fallback;
  const denominator = extensionConnectAttempts + manualPathEvents;

  return {
    ...record,
    manual_fallback_rate: denominator > 0 ? Number((manualPathEvents / denominator).toFixed(4)) : 0,
    total_events: extensionConnectAttempts + manualPathEvents + record.chain_mismatch,
    durable,
  };
}

export async function incrementCounter(eventName: TelemetryEvent): Promise<void> {
  if (!pool) {
    memoryFallback[eventName] += 1;
    return;
  }

  try {
    await ensureSchema();

    await pool.query(
      `INSERT INTO trading_telemetry_counters (event_name, event_count, updated_at)
       VALUES ($1, 1, NOW())
       ON CONFLICT (event_name)
       DO UPDATE SET
         event_count = trading_telemetry_counters.event_count + 1,
         updated_at = NOW()`,
      [eventName],
    );

    await pool.query(
      `INSERT INTO trading_telemetry_events (event_name, metadata)
       VALUES ($1, $2::jsonb)`,
      [eventName, JSON.stringify({ source: 'trading-gate' })],
    );
  } catch {
    // Preserve API availability even if persistence is temporarily unavailable.
    memoryFallback[eventName] += 1;
  }
}

export async function getSnapshot() {
  if (!pool) {
    return snapshotFromRecord(memoryFallback, false);
  }

  try {
    await ensureSchema();

    const result = await pool.query(
      `SELECT event_name, event_count
       FROM trading_telemetry_counters
       WHERE event_name = ANY($1::text[])`,
      [KNOWN_EVENTS],
    );

    const counters: Record<TelemetryEvent, number> = {
      connect_success: 0,
      connect_rejected: 0,
      chain_mismatch: 0,
      manual_fallback: 0,
    };

    for (const row of result.rows) {
      const key = row.event_name as TelemetryEvent;
      if (key in counters) counters[key] = Number(row.event_count || 0);
    }

    return snapshotFromRecord(counters, true);
  } catch {
    return snapshotFromRecord(memoryFallback, false);
  }
}

export function isDurableTelemetryConfigured(): boolean {
  return !!pool;
}

