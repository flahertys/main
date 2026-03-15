/**
 * TradeHax Metrics Database Schema
 * Store AI quality metrics over time for analysis and trending
 *
 * Designed for PostgreSQL with JSON support
 * Can be adapted for MongoDB, DynamoDB, or other DBs
 */

-- ============================================================================
-- TABLE: ai_metrics_snapshots
-- Purpose: Store point-in-time metrics for trend analysis
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_metrics_snapshots (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Request counts
  total_requests INT NOT NULL DEFAULT 0,
  valid_responses INT NOT NULL DEFAULT 0,
  invalid_responses INT NOT NULL DEFAULT 0,
  hallucination_detections INT NOT NULL DEFAULT 0,

  -- Scores and rates
  average_quality_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  validation_rate_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  hallucination_rate_percent DECIMAL(5,2) NOT NULL DEFAULT 0,

  -- Provider performance
  provider_stats JSONB NOT NULL DEFAULT '{}',

  -- Configuration at time of snapshot
  temperature DECIMAL(3,2) NOT NULL DEFAULT 0.7,
  strict_mode BOOLEAN NOT NULL DEFAULT FALSE,
  demo_mode BOOLEAN NOT NULL DEFAULT FALSE,

  -- Metadata
  source VARCHAR(50) DEFAULT 'auto',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_timestamp (timestamp),
  INDEX idx_validation_rate (validation_rate_percent),
  INDEX idx_hallucination_rate (hallucination_rate_percent)
);

-- ============================================================================
-- TABLE: ai_response_logs
-- Purpose: Detailed log of every AI response and validation result
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_response_logs (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(100),
  message_id VARCHAR(100),

  -- Request details
  user_message TEXT NOT NULL,
  user_profile JSONB,
  market_snapshot JSONB,

  -- Response details
  ai_response TEXT NOT NULL,
  provider VARCHAR(20) NOT NULL, -- 'huggingface', 'openai', 'demo'
  model VARCHAR(100),
  response_time_ms INT,

  -- Validation results
  validation_score INT,
  is_valid BOOLEAN,
  validation_errors JSONB,
  validation_warnings JSONB,
  hallucinations_detected JSONB,

  -- Extracted parameters
  signal_type VARCHAR(20), -- BUY, SELL, HOLD
  signal_confidence INT,
  price_target VARCHAR(200),
  stop_loss VARCHAR(200),
  position_size VARCHAR(100),

  -- Metadata
  temperature DECIMAL(3,2),
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (session_id) REFERENCES ai_sessions(id),
  INDEX idx_session (session_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_provider (provider),
  INDEX idx_validation_score (validation_score),
  INDEX idx_signal_type (signal_type)
);

-- ============================================================================
-- TABLE: ai_sessions
-- Purpose: Track individual trading sessions and user context
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_sessions (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100),

  -- Session metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP,
  message_count INT DEFAULT 0,

  -- User profile
  user_profile JSONB,
  risk_tolerance VARCHAR(20),
  trading_style VARCHAR(20),
  portfolio_value DECIMAL(12,2),
  preferred_assets TEXT[],

  -- Session statistics
  total_signals INT DEFAULT 0,
  winning_signals INT DEFAULT 0,
  losing_signals INT DEFAULT 0,
  pending_signals INT DEFAULT 0,

  -- Performance tracking
  average_win_rate DECIMAL(5,2),
  average_roi DECIMAL(5,2),
  largest_win DECIMAL(12,2),
  largest_loss DECIMAL(12,2),

  -- Conversation history
  messages JSONB,

  INDEX idx_user (user_id),
  INDEX idx_created (created_at),
  INDEX idx_activity (last_activity)
);

-- ============================================================================
-- TABLE: ai_signal_outcomes
-- Purpose: Track actual results of AI-generated signals
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_signal_outcomes (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(100),
  response_log_id INT,

  -- Signal details
  asset_symbol VARCHAR(20) NOT NULL,
  signal_type VARCHAR(20) NOT NULL,
  entry_price DECIMAL(18,8),
  target_price DECIMAL(18,8),
  stop_loss_price DECIMAL(18,8),

  -- Execution
  entry_time TIMESTAMP,
  exit_time TIMESTAMP,
  actual_entry_price DECIMAL(18,8),
  actual_exit_price DECIMAL(18,8),

  -- Outcome
  outcome VARCHAR(20), -- 'win', 'loss', 'breakeven', 'pending'
  profit_loss DECIMAL(12,2),
  profit_loss_percent DECIMAL(5,2),
  roi PERCENT DECIMAL(5,2),

  -- Quality metrics
  signal_accuracy BOOLEAN,
  risk_managed BOOLEAN,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,

  FOREIGN KEY (session_id) REFERENCES ai_sessions(id),
  FOREIGN KEY (response_log_id) REFERENCES ai_response_logs(id),
  INDEX idx_session (session_id),
  INDEX idx_asset (asset_symbol),
  INDEX idx_outcome (outcome),
  INDEX idx_created (created_at)
);

-- ============================================================================
-- TABLE: ai_error_log
-- Purpose: Track validation errors and issues for debugging
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_error_log (
  id SERIAL PRIMARY KEY,

  -- Error details
  error_type VARCHAR(100),
  error_message TEXT,
  error_details JSONB,

  -- Context
  response_log_id INT,
  session_id VARCHAR(100),

  -- Stack trace for debugging
  stack_trace TEXT,

  -- Resolution
  resolved BOOLEAN DEFAULT FALSE,
  resolution_notes TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (response_log_id) REFERENCES ai_response_logs(id),
  INDEX idx_error_type (error_type),
  INDEX idx_resolved (resolved),
  INDEX idx_created (created_at)
);

-- ============================================================================
-- TABLE: ai_alert_rules
-- Purpose: Store configured alert rules for monitoring
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_alert_rules (
  id SERIAL PRIMARY KEY,

  -- Rule definition
  name VARCHAR(200) NOT NULL,
  description TEXT,
  metric_name VARCHAR(50) NOT NULL,
  operator VARCHAR(2), -- '>', '<', '=', '>='
  threshold DECIMAL(10,2) NOT NULL,

  -- Actions
  enabled BOOLEAN DEFAULT TRUE,
  action_type VARCHAR(50), -- 'email', 'slack', 'auto-fix', 'log'
  action_target VARCHAR(200),

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  created_by VARCHAR(100),

  INDEX idx_enabled (enabled),
  INDEX idx_metric (metric_name)
);

-- ============================================================================
-- TABLE: ai_configuration_history
-- Purpose: Track changes to AI configuration over time
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_configuration_history (
  id SERIAL PRIMARY KEY,

  -- Configuration snapshot
  temperature DECIMAL(3,2),
  strict_mode BOOLEAN,
  force_demo BOOLEAN,
  halluc_auto_reject BOOLEAN,

  -- Rationale
  change_reason TEXT,
  changed_by VARCHAR(100),

  -- Impact
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_created (created_at)
);

-- ============================================================================
-- VIEWS FOR ANALYSIS
-- ============================================================================

-- Daily metrics summary
CREATE VIEW daily_metrics_summary AS
SELECT
  DATE(timestamp) as date,
  COUNT(*) as total_requests,
  SUM(CASE WHEN is_valid THEN 1 ELSE 0 END) as valid_responses,
  AVG(validation_score) as avg_quality_score,
  SUM(CASE WHEN hallucinations_detected IS NOT NULL AND array_length(hallucinations_detected, 1) > 0 THEN 1 ELSE 0 END) as hallucination_count,
  provider,
  AVG(response_time_ms) as avg_response_time_ms
FROM ai_response_logs
GROUP BY DATE(timestamp), provider
ORDER BY DATE(timestamp) DESC;

-- Provider performance ranking
CREATE VIEW provider_performance AS
SELECT
  provider,
  COUNT(*) as total_responses,
  SUM(CASE WHEN is_valid THEN 1 ELSE 0 END) as valid_count,
  ROUND(100.0 * SUM(CASE WHEN is_valid THEN 1 ELSE 0 END) / COUNT(*), 2) as validation_rate,
  AVG(validation_score) as avg_quality_score,
  AVG(response_time_ms) as avg_response_time_ms
FROM ai_response_logs
WHERE timestamp > CURRENT_TIMESTAMP - INTERVAL '24 hours'
GROUP BY provider
ORDER BY avg_quality_score DESC;

-- Signal accuracy by asset
CREATE VIEW signal_accuracy_by_asset AS
SELECT
  asset_symbol,
  COUNT(*) as total_signals,
  SUM(CASE WHEN outcome = 'win' THEN 1 ELSE 0 END) as winning_signals,
  ROUND(100.0 * SUM(CASE WHEN outcome = 'win' THEN 1 ELSE 0 END) / COUNT(*), 2) as win_rate,
  AVG(profit_loss_percent) as avg_return_percent,
  SUM(CASE WHEN profit_loss > 0 THEN profit_loss ELSE 0 END) as total_gains,
  SUM(CASE WHEN profit_loss < 0 THEN ABS(profit_loss) ELSE 0 END) as total_losses
FROM ai_signal_outcomes
WHERE outcome IN ('win', 'loss')
GROUP BY asset_symbol
ORDER BY win_rate DESC;

-- Quality trend (last 7 days)
CREATE VIEW quality_trend_7days AS
SELECT
  DATE(timestamp) as date,
  AVG(validation_score) as avg_score,
  COUNT(*) as response_count,
  SUM(CASE WHEN hallucinations_detected IS NOT NULL AND array_length(hallucinations_detected, 1) > 0 THEN 1 ELSE 0 END) as hallucination_count
FROM ai_response_logs
WHERE timestamp > CURRENT_TIMESTAMP - INTERVAL '7 days'
GROUP BY DATE(timestamp)
ORDER BY DATE(timestamp);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_response_logs_composite ON ai_response_logs(timestamp, is_valid, provider);
CREATE INDEX idx_response_logs_user_session ON ai_response_logs(session_id, timestamp);
CREATE INDEX idx_signal_outcomes_win_rate ON ai_signal_outcomes(outcome, created_at);
CREATE INDEX idx_metrics_snapshots_quality ON ai_metrics_snapshots(average_quality_score, timestamp);

-- ============================================================================
-- STORED PROCEDURE: Record Metrics Snapshot
-- ============================================================================

CREATE OR REPLACE FUNCTION record_metrics_snapshot(
  p_total_requests INT,
  p_valid_responses INT,
  p_invalid_responses INT,
  p_hallucination_detections INT,
  p_average_quality_score DECIMAL,
  p_provider_stats JSONB,
  p_temperature DECIMAL,
  p_strict_mode BOOLEAN,
  p_demo_mode BOOLEAN
)
RETURNS INTEGER AS $$
DECLARE
  v_snapshot_id INTEGER;
BEGIN
  INSERT INTO ai_metrics_snapshots (
    total_requests,
    valid_responses,
    invalid_responses,
    hallucination_detections,
    average_quality_score,
    validation_rate_percent,
    hallucination_rate_percent,
    provider_stats,
    temperature,
    strict_mode,
    demo_mode
  ) VALUES (
    p_total_requests,
    p_valid_responses,
    p_invalid_responses,
    p_hallucination_detections,
    p_average_quality_score,
    CASE WHEN p_total_requests > 0 THEN ROUND(100.0 * p_valid_responses / p_total_requests, 2) ELSE 0 END,
    CASE WHEN p_total_requests > 0 THEN ROUND(100.0 * p_hallucination_detections / p_total_requests, 2) ELSE 0 END,
    p_provider_stats,
    p_temperature,
    p_strict_mode,
    p_demo_mode
  ) RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STORED PROCEDURE: Clean Old Data
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_metrics(p_days INT DEFAULT 30)
RETURNS INT AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM ai_response_logs
  WHERE timestamp < CURRENT_TIMESTAMP - (p_days || ' days')::INTERVAL
  AND validation_score < 50;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

