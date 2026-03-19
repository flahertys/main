# Trading Gate API (Wallet Ownership + Execution Preflight)

This module adds a minimal, chain-policy-aware gate for live execution:

- `POST /api/trading/auth?action=challenge` - issue nonce challenge
- `POST /api/trading/auth?action=verify` - verify signed challenge and store short-lived proof
- `POST /api/trading/orders?action=preflight` - enforce chain policy + proof freshness
- `POST /api/trading/orders?action=execute` - route order to settlement adapter contract
- `GET|POST /api/trading/telemetry` - counters for connect outcomes and fallback rate

## Why this design

- Keeps wallet access, chain policy, and settlement routing separate from token economics.
- Supports near-term Polygon execution while preserving room for future custom L1/L2 profile swaps.
- Avoids clutter: one preflight gate, one execute contract, and small telemetry counters.

Telemetry counters are persisted to Postgres when `TELEMETRY_DATABASE_URL` (or `DATABASE_URL`) is configured.
Wallet challenges and proofs are persisted to Postgres for serverless cold-start resilience when `DATABASE_URL` is configured.

## Environment knobs

- `EXECUTION_PROFILE_ID` (`polygon-evm` or `agnostic-sandbox`)
- `WALLET_CHALLENGE_TTL_MS` (default 300000)
- `WALLET_PROOF_TTL_MS` (default 600000)
- `TELEMETRY_DATABASE_URL` (optional explicit telemetry DB URL)
- `SETTLEMENT_POLYGON_MODE` (`simulate` by default)

## Durable Auth (Serverless Resilience)

Challenge/proof store falls back gracefully:
- **Primary:** Durable Postgres store (survives cold starts)
- **Fallback:** In-memory cache (instant, per-process)

Set `DATABASE_URL` or `TELEMETRY_DATABASE_URL` to enable durable persistence.
Cleanup functions remove expired challenges/proofs hourly via SQL triggers.

## L2 Custom Settlement Adapter

The `l2-custom-adapter` provides interface stubs for building a custom L2 settlement layer:

- **SequencerInterface** — Order submission, batching, MEV protection
- **RelayerInterface** — Finality confirmation, L1 settlement relay
- **FeePolicy** — Pluggable fees: flat, percentage, or dynamic block-based

Example (in your adapter setup code):
```typescript
import { l2CustomSettlementAdapter } from './adapters/l2-custom-adapter';

l2CustomSettlementAdapter.setSequencer({
  submitOrder: async (req) => ({ sequencerOrderId: '...', estimatedLatency: 500 }),
});

l2CustomSettlementAdapter.setRelayer({
  relayBatch: async (orderIds) => ({ transactionHash: '0x...', status: 'pending' }),
});

l2CustomSettlementAdapter.setFeePolicy({
  kind: 'dynamic',
  estimateGas: async (req) => ({ gasCost: 50000, totalFee: 0.5 }),
});
```

## Smoke Test

Run the trading gate auth flow locally:

```bash
npm run test:trading-gate
# or directly:
BASE_URL=http://localhost:3000 node scripts/trading-gate-smoke-test.mjs
```

Tests: challenge → verify → preflight → execute → telemetry snapshot.

## Manual API smoke notes

Auth endpoints depend on real wallet signatures. Typical sequence:

1. Request challenge with wallet address + chain.
2. Sign challenge message using extension wallet.
3. Submit signature to verify endpoint.
4. Call preflight with address + chain.

Telemetry examples:

- `connect_success`
- `connect_rejected`
- `chain_mismatch`
- `manual_fallback`

