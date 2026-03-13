/**
 * TradeHax Audit Trail Schema - Enterprise Compliance Framework
 * Implements immutable event logging for SEC/FINRA compliance
 * All trading decisions, API calls, and configuration changes logged with cryptographic proof
 */

-- Enum for event severity levels
CREATE TYPE event_severity AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- Enum for event types
CREATE TYPE event_type AS ENUM (
  'TRADE_SIGNAL_GENERATED',
  'TRADE_EXECUTED',
  'TRADE_MODIFIED',
  'TRADE_CANCELLED',
  'RISK_LIMIT_BREACH',
  'API_CALL_MADE',
  'DATA_FETCH',
  'MODEL_INFERENCE',
  'PORTFOLIO_REBALANCE',
  'CONFIGURATION_CHANGED',
  'ACCESS_GRANTED',
  'ACCESS_DENIED',
  'SYSTEM_ALERT',
  'BACKTESTING_RUN',
  'COMPLIANCE_CHECK'
);

-- Enum for audit action categories
CREATE TYPE audit_action AS ENUM (
  'CREATE',
  'READ',
  'UPDATE',
  'DELETE',
  'APPROVE',
  'REJECT',
  'EXECUTE',
  'CANCEL'
);

-- Main audit trail table - immutable event log
CREATE TABLE IF NOT EXISTS audit_events (
  id BIGSERIAL PRIMARY KEY,
  event_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  event_type event_type NOT NULL,
  severity event_severity NOT NULL DEFAULT 'INFO',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- User/actor information
  actor_id VARCHAR(255) NOT NULL,
  actor_role VARCHAR(50),
  actor_ip_address INET,

  -- Resource being audited
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  action audit_action NOT NULL,

  -- Detailed event data
  description TEXT,
  details JSONB,

  -- Signal/Trade specific fields
  signal_id VARCHAR(255),
  trade_id VARCHAR(255),
  portfolio_id VARCHAR(255),

  -- Risk metrics at time of event
  risk_data JSONB,

  -- Cryptographic proof
  content_hash VARCHAR(64),
  previous_hash VARCHAR(64),

  -- Compliance annotations
  compliance_status VARCHAR(50),
  compliance_notes TEXT,

  -- Approval/authorization chain
  approved_by VARCHAR(255),
  requires_approval BOOLEAN DEFAULT FALSE,

  -- Immutable flag
  locked_at TIMESTAMP WITH TIME ZONE
) PARTITION BY RANGE (EXTRACT(YEAR FROM timestamp));

-- Create year partitions for audit_events (2024-2030)
CREATE TABLE audit_events_2024 PARTITION OF audit_events
  FOR VALUES FROM (2024) TO (2025);
CREATE TABLE audit_events_2025 PARTITION OF audit_events
  FOR VALUES FROM (2025) TO (2026);
CREATE TABLE audit_events_2026 PARTITION OF audit_events
  FOR VALUES FROM (2026) TO (2027);
CREATE TABLE audit_events_2027 PARTITION OF audit_events
  FOR VALUES FROM (2027) TO (2028);
CREATE TABLE audit_events_2028 PARTITION OF audit_events
  FOR VALUES FROM (2028) TO (2029);
CREATE TABLE audit_events_2029 PARTITION OF audit_events
  FOR VALUES FROM (2029) TO (2030);
CREATE TABLE audit_events_2030 PARTITION OF audit_events
  FOR VALUES FROM (2030) TO (2031);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp ON audit_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor_id ON audit_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_event_type ON audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_resource ON audit_events(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_signal_id ON audit_events(signal_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_trade_id ON audit_events(trade_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_compliance_status ON audit_events(compliance_status);

-- Signal confidence audit trail (detailed factor breakdown)
CREATE TABLE IF NOT EXISTS signal_confidence_audit (
  id BIGSERIAL PRIMARY KEY,
  signal_id VARCHAR(255) UNIQUE NOT NULL,
  event_id UUID REFERENCES audit_events(event_id),

  -- Factor contributions to confidence score
  momentum_factor DECIMAL(5,2),
  sentiment_factor DECIMAL(5,2),
  volatility_factor DECIMAL(5,2),
  correlation_factor DECIMAL(5,2),
  macro_factor DECIMAL(5,2),

  -- Raw data sources
  momentum_data JSONB,
  sentiment_data JSONB,
  volatility_data JSONB,

  -- Final confidence score
  final_confidence DECIMAL(5,2) NOT NULL,
  confidence_reasoning TEXT,

  -- Backtesting performance
  backtested_win_rate DECIMAL(5,2),
  backtested_returns DECIMAL(10,4),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_signal_confidence_signal_id ON signal_confidence_audit(signal_id);
CREATE INDEX IF NOT EXISTS idx_signal_confidence_created ON signal_confidence_audit(created_at);

-- Trade execution audit trail
CREATE TABLE IF NOT EXISTS trade_execution_audit (
  id BIGSERIAL PRIMARY KEY,
  trade_id VARCHAR(255) UNIQUE NOT NULL,
  event_id UUID REFERENCES audit_events(event_id),

  -- Trade details
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL,
  quantity DECIMAL(18,8) NOT NULL,
  price DECIMAL(18,8) NOT NULL,
  order_type VARCHAR(50),

  -- Risk metrics at execution time
  portfolio_var_before DECIMAL(18,8),
  portfolio_var_after DECIMAL(18,8),
  position_size_pct DECIMAL(5,2),
  kelly_criterion DECIMAL(5,2),

  -- Execution details
  venue VARCHAR(100),
  filled_quantity DECIMAL(18,8),
  filled_price DECIMAL(18,8),
  execution_time TIMESTAMP WITH TIME ZONE,
  latency_ms INTEGER,

  -- Approval chain
  approved_by VARCHAR(255),
  approval_time TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trade_execution_trade_id ON trade_execution_audit(trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_execution_symbol ON trade_execution_audit(symbol);
CREATE INDEX IF NOT EXISTS idx_trade_execution_time ON trade_execution_audit(execution_time);

-- Compliance violations log
CREATE TABLE IF NOT EXISTS compliance_violations (
  id BIGSERIAL PRIMARY KEY,
  violation_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES audit_events(event_id),

  -- Violation details
  violation_type VARCHAR(100) NOT NULL,
  severity event_severity NOT NULL,
  description TEXT,
  affected_trade_id VARCHAR(255),

  -- Regulatory framework
  regulation VARCHAR(50),
  rule_code VARCHAR(100),

  -- Status
  status VARCHAR(50) DEFAULT 'OPEN',
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_compliance_violations_status ON compliance_violations(status);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_created ON compliance_violations(created_at);

-- API call audit trail (for regulatory investigation)
CREATE TABLE IF NOT EXISTS api_call_audit (
  id BIGSERIAL PRIMARY KEY,
  event_id UUID REFERENCES audit_events(event_id),

  -- Request details
  method VARCHAR(10) NOT NULL,
  endpoint VARCHAR(500) NOT NULL,
  query_params JSONB,

  -- Response details
  status_code INTEGER,
  response_time_ms INTEGER,

  -- User information
  user_id VARCHAR(255),
  api_key_hash VARCHAR(64),

  -- Rate limiting
  requests_in_window INTEGER,
  rate_limit_exceeded BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_call_user ON api_call_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_api_call_endpoint ON api_call_audit(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_call_timestamp ON api_call_audit(created_at);

-- Immutable audit log function (prevents deletion/modification)
CREATE OR REPLACE FUNCTION lock_audit_event(event_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE audit_events
  SET locked_at = CURRENT_TIMESTAMP
  WHERE event_id = event_id_param AND locked_at IS NULL;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent modification of locked events
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.locked_at IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot modify locked audit event %', OLD.event_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_events_immutable
BEFORE UPDATE OR DELETE ON audit_events
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_modification();

-- Grant appropriate permissions (configure per environment)
ALTER TABLE audit_events OWNER TO tradehax_audit;
ALTER TABLE signal_confidence_audit OWNER TO tradehax_audit;
ALTER TABLE trade_execution_audit OWNER TO tradehax_audit;
ALTER TABLE compliance_violations OWNER TO tradehax_audit;
ALTER TABLE api_call_audit OWNER TO tradehax_audit;

