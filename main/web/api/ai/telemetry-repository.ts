/**
 * AI Chat Telemetry Repository
 * Tracks chat events, mode decisions, latency, and gating outcomes
 * Pattern mirrors web/api/trading/telemetry-repository.ts: Postgres + in-memory fallback
 */

import type { VercelRequest } from '@vercel/node';

export interface AIChatTelemetryEvent {
  eventId?: string;
  timestamp: number;
  eventType: 'chat_started' | 'chat_completed' | 'gating_applied' | 'api_fallback' | 'hallucination_detected' | 'guardrail_retry';
  sessionId?: string;
  userId?: string;
  mode?: 'base' | 'advanced' | 'odin';
  requestedMode?: string;
  effectiveMode?: string;
  providerPath?: 'huggingface' | 'openai' | 'demo';
  latencyMs?: number;
  model?: string;
  cached?: boolean;
  gated?: boolean;
  guardedRetryCount?: number;
  userMessageLength?: number;
  responseLength?: number;
  hallucinated?: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

let inMemoryEvents: AIChatTelemetryEvent[] = [];
const MAX_IN_MEMORY_EVENTS = 10000;

/**
 * Check if Postgres is configured and available for telemetry
 */
function hasPostgresConfig(): boolean {
  const url = process.env.TELEMETRY_DATABASE_URL || process.env.DATABASE_URL;
  return !!(url && url.trim().length > 0);
}

/**
 * Record a telemetry event
 * Falls back to in-memory storage if database unavailable
 */
export async function recordAIChatEvent(event: AIChatTelemetryEvent): Promise<boolean> {
  const normalizedEvent: AIChatTelemetryEvent = {
    timestamp: event.timestamp || Date.now(),
    eventId: event.eventId || `evt-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    ...event,
  };

  // Try database first
  if (hasPostgresConfig()) {
    try {
      const dbResult = await recordToDatabase(normalizedEvent);
      if (dbResult) return true;
    } catch (err) {
      console.warn('[TELEMETRY] Database write failed, falling back to memory:', (err as Error)?.message);
    }
  }

  // Fallback to in-memory
  return recordToMemory(normalizedEvent);
}

/**
 * Record event to PostgreSQL (if configured)
 */
async function recordToDatabase(event: AIChatTelemetryEvent): Promise<boolean> {
  const dbUrl = process.env.TELEMETRY_DATABASE_URL || process.env.DATABASE_URL;
  if (!dbUrl) return false;

  try {
    // Lazy-import pg only if needed
    // eslint-disable-next-line global-require,@typescript-eslint/no-var-requires
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SECRET_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      return false;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('ai_chat_telemetry')
      .insert([
        {
          event_id: event.eventId,
          timestamp: new Date(event.timestamp).toISOString(),
          event_type: event.eventType,
          session_id: event.sessionId,
          user_id: event.userId,
          mode: event.mode,
          requested_mode: event.requestedMode,
          effective_mode: event.effectiveMode,
          provider_path: event.providerPath,
          latency_ms: event.latencyMs,
          model: event.model,
          cached: event.cached,
          gated: event.gated,
          guarded_retry_count: event.guardedRetryCount,
          user_message_length: event.userMessageLength,
          response_length: event.responseLength,
          hallucinated: event.hallucinated,
          error_message: event.errorMessage,
          metadata: event.metadata,
        },
      ]);

    if (error) {
      console.warn('[TELEMETRY] Supabase insert failed:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('[TELEMETRY] Database error:', (err as Error)?.message);
    return false;
  }
}

/**
 * Record event to in-memory store
 */
function recordToMemory(event: AIChatTelemetryEvent): boolean {
  try {
    inMemoryEvents.push(event);

    // Keep only recent events to prevent memory leak
    if (inMemoryEvents.length > MAX_IN_MEMORY_EVENTS) {
      inMemoryEvents = inMemoryEvents.slice(-MAX_IN_MEMORY_EVENTS);
    }

    return true;
  } catch (err) {
    console.warn('[TELEMETRY] In-memory write failed:', (err as Error)?.message);
    return false;
  }
}

/**
 * Query recent events from in-memory store
 * (Database queries would be more sophisticated in production)
 */
export function getRecentEventsInMemory(limit = 100): AIChatTelemetryEvent[] {
  return inMemoryEvents.slice(-limit);
}

/**
 * Calculate latency percentiles for a given mode
 */
export function calculateLatencyPercentiles(
  mode: string,
  events = inMemoryEvents,
  percentiles = [50, 95, 99]
): Record<number, number | null> {
  const modeLatencies = events
    .filter((e) => e.effectiveMode === mode && typeof e.latencyMs === 'number')
    .map((e) => e.latencyMs as number)
    .sort((a, b) => a - b);

  if (modeLatencies.length === 0) {
    return percentiles.reduce((acc, p) => ({ ...acc, [p]: null }), {});
  }

  return percentiles.reduce((acc, p) => {
    const idx = Math.ceil((p / 100) * modeLatencies.length) - 1;
    return { ...acc, [p]: modeLatencies[idx] ?? null };
  }, {});
}

/**
 * Calculate success rate for a given mode
 */
export function calculateSuccessRate(mode: string, events = inMemoryEvents): number {
  const modeEvents = events.filter((e) => e.effectiveMode === mode);
  if (modeEvents.length === 0) return 0;

  const successful = modeEvents.filter((e) => e.eventType === 'chat_completed' && !e.hallucinated);
  return Math.round((successful.length / modeEvents.length) * 10000) / 100;
}

/**
 * Count events by type
 */
export function countEventsByType(events = inMemoryEvents): Record<string, number> {
  return events.reduce(
    (acc, e) => ({
      ...acc,
      [e.eventType]: (acc[e.eventType] ?? 0) + 1,
    }),
    {} as Record<string, number>
  );
}

/**
 * Check if telemetry is healthy (at least some events recorded)
 */
export function isTelemetryHealthy(): boolean {
  // In-memory telemetry is always healthy if we've recorded anything
  return inMemoryEvents.length > 0;
}

