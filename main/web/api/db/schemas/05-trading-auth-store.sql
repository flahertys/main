-- Trading Challenges and Proofs for Durable Wallet Auth
-- Survives serverless cold starts and concurrent request handling

BEGIN;

-- Store issued challenges (nonce-based)
CREATE TABLE IF NOT EXISTS trading_challenges (
  id BIGSERIAL PRIMARY KEY,
  nonce TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  chain_id TEXT NOT NULL,
  signature_type TEXT NOT NULL DEFAULT 'personal_sign',
  message TEXT NOT NULL,
  typed_data JSONB,
  issued_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trading_challenges_nonce
  ON trading_challenges (nonce);

CREATE INDEX IF NOT EXISTS idx_trading_challenges_address_chain
  ON trading_challenges (address, chain_id);

CREATE INDEX IF NOT EXISTS idx_trading_challenges_expires_at
  ON trading_challenges (expires_at);

-- Store verified proofs (one per address per chain)
CREATE TABLE IF NOT EXISTS trading_proofs (
  id BIGSERIAL PRIMARY KEY,
  address TEXT NOT NULL,
  chain_id TEXT NOT NULL,
  nonce TEXT NOT NULL,
  signature_type TEXT NOT NULL,
  verified_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(address, chain_id)
);

CREATE INDEX IF NOT EXISTS idx_trading_proofs_address_chain
  ON trading_proofs (address, chain_id);

CREATE INDEX IF NOT EXISTS idx_trading_proofs_expires_at
  ON trading_proofs (expires_at);

-- Cleanup expired challenges (run hourly)
CREATE OR REPLACE FUNCTION cleanup_expired_challenges()
RETURNS TABLE(deleted_count INT) AS $$
DECLARE
  _count INT;
BEGIN
  DELETE FROM trading_challenges WHERE expires_at < (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN QUERY SELECT _count;
END;
$$ LANGUAGE plpgsql;

-- Cleanup expired proofs (run hourly)
CREATE OR REPLACE FUNCTION cleanup_expired_proofs()
RETURNS TABLE(deleted_count INT) AS $$
DECLARE
  _count INT;
BEGIN
  DELETE FROM trading_proofs WHERE expires_at < (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN QUERY SELECT _count;
END;
$$ LANGUAGE plpgsql;

COMMIT;

