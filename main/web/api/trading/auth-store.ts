import { Pool } from 'pg';

export interface ChallengeRecord {
  nonce: string;
  address: string;
  chainId: string;
  signatureType: 'personal_sign' | 'eip712';
  message: string;
  typedData?: Record<string, any>;
  issuedAt: number;
  expiresAt: number;
}

export interface ProofRecord {
  address: string;
  chainId: string;
  nonce: string;
  signatureType: 'personal_sign' | 'eip712';
  verifiedAt: number;
  expiresAt: number;
}

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_URL || '';
const pool = connectionString
  ? new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 5000,
    })
  : null;

let memoryCache: Map<string, ChallengeRecord> = new Map();
let proofCache: Map<string, ProofRecord> = new Map();
let initialized = false;

async function ensureSchema(): Promise<void> {
  if (!pool || initialized) return;

  await pool.query(`
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
  `);

  await pool.query(`
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
  `);

  initialized = true;
}

export async function issueChallenge(record: ChallengeRecord): Promise<void> {
  memoryCache.set(record.nonce, record);

  if (!pool) return;

  try {
    await ensureSchema();

    await pool.query(
      `INSERT INTO trading_challenges (nonce, address, chain_id, signature_type, message, typed_data, issued_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        record.nonce,
        record.address,
        record.chainId,
        record.signatureType,
        record.message,
        record.typedData ? JSON.stringify(record.typedData) : null,
        record.issuedAt,
        record.expiresAt,
      ],
    );
  } catch {
    // Fallback to memory-only if DB fails.
  }
}

export async function getChallenge(nonce: string): Promise<ChallengeRecord | null> {
  const cached = memoryCache.get(nonce);
  if (cached) return cached;

  if (!pool) return null;

  try {
    await ensureSchema();

    const result = await pool.query(
      `SELECT nonce, address, chain_id, signature_type, message, typed_data, issued_at, expires_at
       FROM trading_challenges
       WHERE nonce = $1 AND expires_at > EXTRACT(EPOCH FROM NOW())::BIGINT * 1000`,
      [nonce],
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    const record: ChallengeRecord = {
      nonce: row.nonce,
      address: row.address,
      chainId: row.chain_id,
      signatureType: row.signature_type,
      message: row.message,
      typedData: row.typed_data ? JSON.parse(row.typed_data) : undefined,
      issuedAt: Number(row.issued_at),
      expiresAt: Number(row.expires_at),
    };

    memoryCache.set(nonce, record);
    return record;
  } catch {
    return null;
  }
}

export async function consumeChallenge(nonce: string): Promise<ChallengeRecord | null> {
  const record = await getChallenge(nonce);
  memoryCache.delete(nonce);

  if (!pool) return record;

  try {
    await ensureSchema();
    await pool.query(`DELETE FROM trading_challenges WHERE nonce = $1`, [nonce]);
  } catch {
    // Fallback OK: challenge remains in DB, will expire naturally.
  }

  return record;
}

export async function saveProof(record: ProofRecord): Promise<void> {
  const key = `${record.address.toLowerCase()}:${record.chainId}`;
  proofCache.set(key, record);

  if (!pool) return;

  try {
    await ensureSchema();

    await pool.query(
      `INSERT INTO trading_proofs (address, chain_id, nonce, signature_type, verified_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (address, chain_id)
       DO UPDATE SET nonce = $3, signature_type = $4, verified_at = $5, expires_at = $6`,
      [
        record.address.toLowerCase(),
        record.chainId,
        record.nonce,
        record.signatureType,
        record.verifiedAt,
        record.expiresAt,
      ],
    );
  } catch {
    // Fallback to memory-only if DB fails.
  }
}

/**
 * Atomically consume challenge and persist proof in one durable transaction.
 * Returns null when challenge is missing/expired/already consumed.
 */
export async function finalizeChallengeProof(params: {
  nonce: string;
  proof: ProofRecord;
}): Promise<ProofRecord | null> {
  const { nonce, proof } = params;

  // Memory-first fallback path when durable auth is not configured.
  if (!pool) {
    const challenge = memoryCache.get(nonce);
    if (!challenge || challenge.expiresAt <= Date.now()) {
      memoryCache.delete(nonce);
      return null;
    }

    memoryCache.delete(nonce);
    proofCache.set(`${proof.address.toLowerCase()}:${proof.chainId}`, proof);
    return proof;
  }

  const client = await pool.connect();
  try {
    await ensureSchema();
    await client.query('BEGIN');

    const consumed = await client.query(
      `DELETE FROM trading_challenges
       WHERE nonce = $1 AND expires_at > EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
       RETURNING nonce`,
      [nonce],
    );

    if (consumed.rowCount === 0) {
      await client.query('ROLLBACK');
      memoryCache.delete(nonce);
      return null;
    }

    await client.query(
      `INSERT INTO trading_proofs (address, chain_id, nonce, signature_type, verified_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (address, chain_id)
       DO UPDATE SET nonce = $3, signature_type = $4, verified_at = $5, expires_at = $6`,
      [
        proof.address.toLowerCase(),
        proof.chainId,
        proof.nonce,
        proof.signatureType,
        proof.verifiedAt,
        proof.expiresAt,
      ],
    );

    await client.query('COMMIT');

    memoryCache.delete(nonce);
    proofCache.set(`${proof.address.toLowerCase()}:${proof.chainId}`, proof);
    return proof;
  } catch {
    try {
      await client.query('ROLLBACK');
    } catch {
      // no-op
    }
    return null;
  } finally {
    client.release();
  }
}

export async function getProof(address: string): Promise<ProofRecord | null> {
  const key = `${address.toLowerCase()}:*`;

  // Memory check (chain-agnostic for now, assume latest proof)
  for (const [cacheKey, proof] of proofCache.entries()) {
    if (cacheKey.startsWith(address.toLowerCase())) {
      if (proof.expiresAt > Date.now()) return proof;
      proofCache.delete(cacheKey);
    }
  }

  if (!pool) return null;

  try {
    await ensureSchema();

    const result = await pool.query(
      `SELECT address, chain_id, nonce, signature_type, verified_at, expires_at
       FROM trading_proofs
       WHERE LOWER(address) = LOWER($1) AND expires_at > EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
       ORDER BY verified_at DESC
       LIMIT 1`,
      [address],
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    const proof: ProofRecord = {
      address: row.address,
      chainId: row.chain_id,
      nonce: row.nonce,
      signatureType: row.signature_type,
      verifiedAt: Number(row.verified_at),
      expiresAt: Number(row.expires_at),
    };

    const cacheKey = `${proof.address.toLowerCase()}:${proof.chainId}`;
    proofCache.set(cacheKey, proof);
    return proof;
  } catch {
    return null;
  }
}

export async function isProofFresh(address: string, nowMs = Date.now()): Promise<boolean> {
  const proof = await getProof(address);
  return !!proof && proof.expiresAt > nowMs;
}

export function isDurableAuthConfigured(): boolean {
  return !!pool;
}

