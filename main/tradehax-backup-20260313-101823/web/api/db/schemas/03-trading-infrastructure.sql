/**
 * Multi-Asset Trading Infrastructure Schema (Phase 2 ready)
 * Supports equities, options, futures, and crypto trading
 */

-- Enum for asset classes
CREATE TYPE asset_class AS ENUM ('EQUITY', 'OPTION', 'FUTURE', 'CRYPTO', 'COMMODITY', 'FX');

-- Enum for position sides
CREATE TYPE position_side AS ENUM ('LONG', 'SHORT', 'NEUTRAL');

-- Enum for order types
CREATE TYPE order_type_enum AS ENUM ('MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT', 'ICEBERG');

-- Supported trading venues
CREATE TABLE IF NOT EXISTS trading_venues (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  asset_class asset_class NOT NULL,

  -- API configuration
  api_endpoint VARCHAR(500),
  ws_endpoint VARCHAR(500),
  requires_auth BOOLEAN DEFAULT TRUE,

  -- Rate limits
  rps_limit INTEGER,
  daily_request_limit INTEGER,

  -- Liquidity metrics
  min_notional DECIMAL(18,8),
  avg_spread_bps DECIMAL(5,2),

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Portfolio master data
CREATE TABLE IF NOT EXISTS portfolios (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  manager_id UUID REFERENCES enterprise_users(id),
  team_id VARCHAR(100) REFERENCES teams(id),

  -- Risk parameters
  target_allocation JSONB,
  risk_limit_var DECIMAL(18,8),
  leverage_limit DECIMAL(5,2),
  max_drawdown_pct DECIMAL(5,2),
  max_single_position_pct DECIMAL(5,2),

  -- Asset class exposure limits
  equity_allocation_limit DECIMAL(5,2),
  crypto_allocation_limit DECIMAL(5,2),
  derivatives_allocation_limit DECIMAL(5,2),

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  status VARCHAR(50) DEFAULT 'ACTIVE',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_portfolios_manager ON portfolios(manager_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_team ON portfolios(team_id);

-- Securities/instruments master
CREATE TABLE IF NOT EXISTS instruments (
  id VARCHAR(50) PRIMARY KEY,
  symbol VARCHAR(20) UNIQUE NOT NULL,
  asset_class asset_class NOT NULL,

  -- Instrument details
  name VARCHAR(255),
  exchange VARCHAR(100),
  currency VARCHAR(10) DEFAULT 'USD',

  -- Identifiers
  isin VARCHAR(12),
  cusip VARCHAR(9),
  sedol VARCHAR(7),

  -- Trading parameters
  min_tick_size DECIMAL(18,8),
  lot_size INTEGER DEFAULT 1,
  multiplier DECIMAL(5,2) DEFAULT 1.0,

  -- Risk parameters
  is_marginable BOOLEAN DEFAULT TRUE,
  margin_requirement DECIMAL(5,2),

  -- Market data
  last_price DECIMAL(18,8),
  last_updated TIMESTAMP WITH TIME ZONE,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_instruments_symbol ON instruments(symbol);
CREATE INDEX IF NOT EXISTS idx_instruments_asset_class ON instruments(asset_class);

-- Positions tracking
CREATE TABLE IF NOT EXISTS positions (
  id BIGSERIAL PRIMARY KEY,
  position_id VARCHAR(255) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,

  -- Portfolio and instrument
  portfolio_id VARCHAR(100) NOT NULL REFERENCES portfolios(id),
  instrument_id VARCHAR(50) NOT NULL REFERENCES instruments(id),

  -- Position details
  side position_side NOT NULL,
  quantity DECIMAL(18,8) NOT NULL,
  avg_entry_price DECIMAL(18,8),
  current_price DECIMAL(18,8),

  -- Mark-to-market
  mark_to_market DECIMAL(18,8),
  unrealized_pnl DECIMAL(18,8),

  -- Risk metrics
  var_95 DECIMAL(18,8),
  var_99 DECIMAL(18,8),
  gross_exposure DECIMAL(18,8),
  net_exposure DECIMAL(18,8),

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_positions_portfolio ON positions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_positions_instrument ON positions(instrument_id);
CREATE INDEX IF NOT EXISTS idx_positions_active ON positions(is_active);

-- Orders (including executions)
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  order_id VARCHAR(255) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,

  -- Portfolio and instrument
  portfolio_id VARCHAR(100) NOT NULL REFERENCES portfolios(id),
  instrument_id VARCHAR(50) NOT NULL REFERENCES instruments(id),

  -- Order details
  order_type order_type_enum NOT NULL,
  side position_side NOT NULL,
  quantity DECIMAL(18,8) NOT NULL,
  limit_price DECIMAL(18,8),
  stop_price DECIMAL(18,8),

  -- Execution venue
  venue_id VARCHAR(100),
  venue_order_id VARCHAR(255),

  -- Execution status
  status VARCHAR(50) DEFAULT 'PENDING',
  filled_quantity DECIMAL(18,8) DEFAULT 0,
  filled_price DECIMAL(18,8),
  fill_time TIMESTAMP WITH TIME ZONE,

  -- Costs
  commission DECIMAL(18,8),
  slippage DECIMAL(18,8),

  -- Risk limits at time of order
  estimated_notional DECIMAL(18,8),
  kelly_criterion DECIMAL(5,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (venue_id) REFERENCES trading_venues(id)
);

CREATE INDEX IF NOT EXISTS idx_orders_portfolio ON orders(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

-- Grant permissions
ALTER TABLE trading_venues OWNER TO tradehax_trading;
ALTER TABLE portfolios OWNER TO tradehax_trading;
ALTER TABLE instruments OWNER TO tradehax_trading;
ALTER TABLE positions OWNER TO tradehax_trading;
ALTER TABLE orders OWNER TO tradehax_trading;

