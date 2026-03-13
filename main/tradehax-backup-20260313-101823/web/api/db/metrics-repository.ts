/**
 * TradeHax Metrics Repository
 * Data access layer for metrics, signals, and quality tracking
 * Provides high-level methods for database operations
 */

import { db } from './database-client.js';

/**
 * Metrics Snapshot - records aggregate metrics at a point in time
 */
export interface MetricsSnapshot {
  totalRequests: number;
  validResponses: number;
  invalidResponses: number;
  hallucinationDetections: number;
  averageQualityScore: number;
  providerStats: Record<string, { count: number; avgScore: number }>;
  temperature: number;
  strictMode: boolean;
  demoMode: boolean;
}

/**
 * AI Response Log - detailed record of individual responses
 */
export interface ResponseLog {
  sessionId?: string;
  messageId?: string;
  userMessage: string;
  aiResponse: string;
  provider: 'huggingface' | 'openai' | 'demo';
  model: string;
  responseTimeMs: number;
  validationScore: number;
  isValid: boolean;
  validationErrors?: string[];
  validationWarnings?: string[];
  hallucinations?: string[];
  signalType?: 'BUY' | 'SELL' | 'HOLD';
  signalConfidence?: number;
  priceTarget?: string;
  stopLoss?: string;
  positionSize?: string;
}

/**
 * Record a metrics snapshot
 */
export async function recordMetricsSnapshot(
  metrics: MetricsSnapshot
): Promise<number | null> {
  try {
    const result = await db.query(
      `INSERT INTO ai_metrics_snapshots (
        total_requests,
        valid_responses,
        invalid_responses,
        hallucination_detections,
        average_quality_score,
        provider_stats,
        temperature,
        strict_mode,
        demo_mode
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        metrics.totalRequests,
        metrics.validResponses,
        metrics.invalidResponses,
        metrics.hallucinationDetections,
        metrics.averageQualityScore,
        JSON.stringify(metrics.providerStats),
        metrics.temperature,
        metrics.strictMode,
        metrics.demoMode,
      ]
    );

    return result.rows[0]?.id || null;
  } catch (error) {
    console.error('Failed to record metrics snapshot:', error);
    return null;
  }
}

/**
 * Log an AI response
 */
export async function logResponse(log: ResponseLog): Promise<number | null> {
  try {
    const result = await db.query(
      `INSERT INTO ai_response_logs (
        session_id,
        message_id,
        user_message,
        ai_response,
        provider,
        model,
        response_time_ms,
        validation_score,
        is_valid,
        validation_errors,
        validation_warnings,
        hallucinations_detected,
        signal_type,
        signal_confidence,
        price_target,
        stop_loss,
        position_size,
        timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
      RETURNING id`,
      [
        log.sessionId,
        log.messageId,
        log.userMessage,
        log.aiResponse,
        log.provider,
        log.model,
        log.responseTimeMs,
        log.validationScore,
        log.isValid,
        JSON.stringify(log.validationErrors || []),
        JSON.stringify(log.validationWarnings || []),
        JSON.stringify(log.hallucinations || []),
        log.signalType,
        log.signalConfidence,
        log.priceTarget,
        log.stopLoss,
        log.positionSize,
      ]
    );

    return result.rows[0]?.id || null;
  } catch (error) {
    console.error('Failed to log response:', error);
    return null;
  }
}

/**
 * Get metrics for last N hours
 */
export async function getRecentMetrics(hours: number = 24) {
  try {
    const result = await db.query(
      `SELECT * FROM ai_metrics_snapshots
       WHERE timestamp > NOW() - INTERVAL '${hours} hours'
       ORDER BY timestamp DESC`
    );
    return result.rows;
  } catch (error) {
    console.error('Failed to get recent metrics:', error);
    return [];
  }
}

/**
 * Get quality trend over days
 */
export async function getQualityTrend(days: number = 7) {
  try {
    const result = await db.query(
      `SELECT
        DATE(timestamp) as date,
        COUNT(*) as total_requests,
        ROUND(AVG(average_quality_score)::numeric, 2) as avg_quality,
        ROUND(AVG((valid_responses::float / NULLIF(total_requests, 0))::numeric * 100), 2) as validation_rate
       FROM ai_metrics_snapshots
       WHERE timestamp > NOW() - INTERVAL '${days} days'
       GROUP BY DATE(timestamp)
       ORDER BY date DESC`
    );
    return result.rows;
  } catch (error) {
    console.error('Failed to get quality trend:', error);
    return [];
  }
}

/**
 * Compare provider performance
 */
export async function getProviderComparison(hours: number = 24) {
  try {
    const result = await db.query(
      `SELECT
        provider,
        COUNT(*) as total_responses,
        ROUND(AVG(validation_score)::numeric, 2) as avg_quality_score,
        ROUND(AVG(response_time_ms)::numeric, 0) as avg_latency_ms,
        COUNT(CASE WHEN is_valid THEN 1 END)::float / COUNT(*) * 100 as validation_pass_rate
       FROM ai_response_logs
       WHERE timestamp > NOW() - INTERVAL '${hours} hours'
       GROUP BY provider
       ORDER BY avg_quality_score DESC`
    );
    return result.rows;
  } catch (error) {
    console.error('Failed to get provider comparison:', error);
    return [];
  }
}

/**
 * Get high-quality signals
 */
export async function getHighQualitySignals(
  minScore: number = 85,
  days: number = 7,
  limit: number = 50
) {
  try {
    const result = await db.query(
      `SELECT
        id,
        message_id,
        user_message,
        ai_response,
        signal_type,
        signal_confidence,
        price_target,
        stop_loss,
        position_size,
        validation_score,
        response_time_ms,
        timestamp
       FROM ai_response_logs
       WHERE validation_score >= $1
         AND signal_type IS NOT NULL
         AND timestamp > NOW() - INTERVAL '${days} days'
       ORDER BY validation_score DESC, timestamp DESC
       LIMIT $2`,
      [minScore, limit]
    );
    return result.rows;
  } catch (error) {
    console.error('Failed to get high-quality signals:', error);
    return [];
  }
}

/**
 * Signal accuracy analysis
 */
export async function getSignalAccuracy(days: number = 30) {
  try {
    const result = await db.query(
      `SELECT
        signal_type,
        COUNT(*) as total_signals,
        ROUND(AVG(signal_confidence)::numeric, 1) as avg_confidence,
        ROUND(AVG(validation_score)::numeric, 1) as avg_quality,
        COUNT(CASE WHEN is_valid THEN 1 END)::float / COUNT(*) * 100 as validation_pass_rate,
        ROUND(AVG(response_time_ms)::numeric, 0) as avg_latency_ms
       FROM ai_response_logs
       WHERE signal_type IS NOT NULL
         AND timestamp > NOW() - INTERVAL '${days} days'
       GROUP BY signal_type
       ORDER BY total_signals DESC`
    );
    return result.rows;
  } catch (error) {
    console.error('Failed to get signal accuracy:', error);
    return [];
  }
}

/**
 * Get detailed logs for specific session
 */
export async function getSessionLogs(sessionId: string) {
  try {
    const result = await db.query(
      `SELECT * FROM ai_response_logs
       WHERE session_id = $1
       ORDER BY timestamp DESC`,
      [sessionId]
    );
    return result.rows;
  } catch (error) {
    console.error('Failed to get session logs:', error);
    return [];
  }
}

/**
 * Calculate system health metrics
 */
export async function getSystemHealth() {
  try {
    const last24h = await db.query(
      `SELECT
        COUNT(*) as total_responses,
        COUNT(CASE WHEN is_valid THEN 1 END)::float / COUNT(*) * 100 as validation_pass_rate,
        ROUND(AVG(validation_score)::numeric, 2) as avg_quality_score,
        ROUND(AVG(response_time_ms)::numeric, 0) as avg_latency_ms,
        COUNT(DISTINCT provider) as active_providers
       FROM ai_response_logs
       WHERE timestamp > NOW() - INTERVAL '24 hours'`
    );

    const errors24h = await db.query(
      `SELECT COUNT(*) as error_count FROM ai_response_logs
       WHERE timestamp > NOW() - INTERVAL '24 hours' AND is_valid = false`
    );

    const hallucinations24h = await db.query(
      `SELECT COUNT(*) as hallucination_count FROM ai_response_logs
       WHERE timestamp > NOW() - INTERVAL '24 hours'
         AND jsonb_array_length(hallucinations_detected) > 0`
    );

    const row = last24h.rows[0] || {};

    return {
      totalResponses: row.total_responses || 0,
      validationPassRate: parseFloat(row.validation_pass_rate) || 0,
      averageQualityScore: parseFloat(row.avg_quality_score) || 0,
      averageLatencyMs: parseInt(row.avg_latency_ms) || 0,
      activeProviders: row.active_providers || 0,
      errorCount: parseInt(errors24h.rows[0]?.error_count || 0),
      hallucinationCount: parseInt(hallucinations24h.rows[0]?.hallucination_count || 0),
      status:
        (parseFloat(row.validation_pass_rate) || 0) > 85
          ? 'HEALTHY'
          : (parseFloat(row.validation_pass_rate) || 0) > 70
            ? 'DEGRADED'
            : 'UNHEALTHY',
    };
  } catch (error) {
    console.error('Failed to get system health:', error);
    return null;
  }
}

export default {
  recordMetricsSnapshot,
  logResponse,
  getRecentMetrics,
  getQualityTrend,
  getProviderComparison,
  getHighQualitySignals,
  getSignalAccuracy,
  getSessionLogs,
  getSystemHealth,
};

