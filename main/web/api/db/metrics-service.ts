/**
 * TradeHax Metrics Persistence Service
 * Store metrics to database for historical analysis and trending
 */

import { Pool, QueryResult } from 'pg';

// Initialize database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/tradehax',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export interface MetricsSnapshot {
  timestamp: Date;
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

export interface ResponseLogEntry {
  sessionId?: string;
  messageId?: string;
  userMessage: string;
  aiResponse: string;
  provider: 'huggingface' | 'openai' | 'demo';
  model: string;
  responseTimeMs: number;
  validationScore: number;
  isValid: boolean;
  validationErrors: string[];
  validationWarnings: string[];
  hallucinations: string[];
  signalType?: string;
  signalConfidence?: number;
  priceTarget?: string;
  stopLoss?: string;
  positionSize?: string;
}

/**
 * Record metrics snapshot to database
 */
export async function recordMetricsSnapshot(metrics: MetricsSnapshot): Promise<number | null> {
  try {
    const result = await pool.query(
      `SELECT record_metrics_snapshot($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
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

    return result.rows[0]?.record_metrics_snapshot || null;
  } catch (error) {
    console.error('Failed to record metrics snapshot:', error);
    return null;
  }
}

/**
 * Log individual AI response for audit trail
 */
export async function logResponseToDatabase(entry: ResponseLogEntry): Promise<number | null> {
  try {
    const result = await pool.query(
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, CURRENT_TIMESTAMP)
      RETURNING id`,
      [
        entry.sessionId || null,
        entry.messageId || null,
        entry.userMessage,
        entry.aiResponse,
        entry.provider,
        entry.model,
        entry.responseTimeMs,
        entry.validationScore,
        entry.isValid,
        JSON.stringify(entry.validationErrors),
        JSON.stringify(entry.validationWarnings),
        JSON.stringify(entry.hallucinations),
        entry.signalType || null,
        entry.signalConfidence || null,
        entry.priceTarget || null,
        entry.stopLoss || null,
        entry.positionSize || null,
      ]
    );

    return result.rows[0]?.id || null;
  } catch (error) {
    console.error('Failed to log response:', error);
    return null;
  }
}

/**
 * Get metrics trend for a date range
 */
export async function getMetricsTrend(
  daysBack: number = 7
): Promise<any[]> {
  try {
    const result = await pool.query(
      `SELECT
        date,
        total_requests,
        valid_responses,
        avg_quality_score,
        hallucination_count,
        avg_response_time_ms
      FROM daily_metrics_summary
      WHERE date >= CURRENT_DATE - INTERVAL '${daysBack} days'
      ORDER BY date DESC`
    );

    return result.rows;
  } catch (error) {
    console.error('Failed to get metrics trend:', error);
    return [];
  }
}

/**
 * Get provider performance comparison
 */
export async function getProviderPerformance(): Promise<any[]> {
  try {
    const result = await pool.query(
      `SELECT * FROM provider_performance ORDER BY avg_quality_score DESC`
    );

    return result.rows;
  } catch (error) {
    console.error('Failed to get provider performance:', error);
    return [];
  }
}

/**
 * Get signal accuracy by asset
 */
export async function getSignalAccuracyByAsset(): Promise<any[]> {
  try {
    const result = await pool.query(
      `SELECT * FROM signal_accuracy_by_asset ORDER BY win_rate DESC`
    );

    return result.rows;
  } catch (error) {
    console.error('Failed to get signal accuracy:', error);
    return [];
  }
}

/**
 * Record signal outcome (after trade execution)
 */
export async function recordSignalOutcome(
  sessionId: string,
  assetSymbol: string,
  signalType: string,
  outcome: 'win' | 'loss' | 'breakeven' | 'pending',
  profitLoss: number,
  profitLossPercent: number,
  entryPrice?: number,
  exitPrice?: number
): Promise<number | null> {
  try {
    const result = await pool.query(
      `INSERT INTO ai_signal_outcomes (
        session_id,
        asset_symbol,
        signal_type,
        outcome,
        profit_loss,
        profit_loss_percent,
        actual_entry_price,
        actual_exit_price
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
      [
        sessionId,
        assetSymbol,
        signalType,
        outcome,
        profitLoss,
        profitLossPercent,
        entryPrice || null,
        exitPrice || null,
      ]
    );

    return result.rows[0]?.id || null;
  } catch (error) {
    console.error('Failed to record signal outcome:', error);
    return null;
  }
}

/**
 * Get recent validation errors for debugging
 */
export async function getRecentErrors(limit: number = 10): Promise<any[]> {
  try {
    const result = await pool.query(
      `SELECT
        id,
        error_type,
        error_message,
        created_at,
        resolved
      FROM ai_error_log
      WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT $1`,
      [limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Failed to get recent errors:', error);
    return [];
  }
}

/**
 * Clean up old metrics data
 */
export async function cleanupOldMetrics(daysToKeep: number = 30): Promise<number> {
  try {
    const result = await pool.query(
      `SELECT cleanup_old_metrics($1)`,
      [daysToKeep]
    );

    return result.rows[0]?.cleanup_old_metrics || 0;
  } catch (error) {
    console.error('Failed to cleanup old metrics:', error);
    return 0;
  }
}

/**
 * Get system health summary
 */
export async function getSystemHealthSummary(): Promise<any> {
  try {
    const [metricsResult, providerResult, errorResult] = await Promise.all([
      pool.query(
        `SELECT
          AVG(average_quality_score) as avg_quality,
          AVG(validation_rate_percent) as avg_validation_rate,
          AVG(hallucination_rate_percent) as avg_hallucination_rate
        FROM ai_metrics_snapshots
        WHERE timestamp > CURRENT_TIMESTAMP - INTERVAL '24 hours'`
      ),
      pool.query(`SELECT * FROM provider_performance LIMIT 1`),
      pool.query(
        `SELECT COUNT(*) as unresolved_errors
        FROM ai_error_log
        WHERE resolved = FALSE AND created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'`
      ),
    ]);

    return {
      metrics: metricsResult.rows[0] || {},
      topProvider: providerResult.rows[0] || {},
      unresolvedErrors: errorResult.rows[0]?.unresolved_errors || 0,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Failed to get system health summary:', error);
    return null;
  }
}

/**
 * Update configuration history
 */
export async function logConfigurationChange(
  config: any,
  reason: string,
  changedBy: string
): Promise<boolean> {
  try {
    await pool.query(
      `INSERT INTO ai_configuration_history (
        temperature,
        strict_mode,
        force_demo,
        halluc_auto_reject,
        change_reason,
        changed_by
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        config.temperature || 0.7,
        config.strictMode || false,
        config.forceDemo || false,
        config.hallucAutoReject || true,
        reason,
        changedBy,
      ]
    );

    return true;
  } catch (error) {
    console.error('Failed to log configuration change:', error);
    return false;
  }
}

/**
 * Export database for backup
 */
export async function exportMetricsData(startDate: Date, endDate: Date): Promise<any> {
  try {
    const result = await pool.query(
      `SELECT
        session_id,
        timestamp,
        provider,
        validation_score,
        is_valid,
        signal_type,
        signal_confidence
      FROM ai_response_logs
      WHERE timestamp BETWEEN $1 AND $2
      ORDER BY timestamp DESC`,
      [startDate, endDate]
    );

    return {
      exportDate: new Date(),
      dateRange: { start: startDate, end: endDate },
      recordCount: result.rows.length,
      data: result.rows,
    };
  } catch (error) {
    console.error('Failed to export metrics data:', error);
    return null;
  }
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT 1');
    return result.rowCount === 1;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Close database connections (for graceful shutdown)
 */
export async function closeDatabaseConnections(): Promise<void> {
  try {
    await pool.end();
    console.log('Database connections closed');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
}

