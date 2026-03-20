# Script Runners

## API Smoke Test

Runs lightweight live checks for core endpoints.

- `GET /__health`
- `GET /api/data/crypto?symbol=BTC`
- `POST /api/ai/chat`
- `GET /api/supabase/health` (accepts 200 or 500 as reachable)

### Usage

```powershell
cd C:\tradez\main\web
npm run test:api:smoke
```

### Optional Base URL Override

```powershell
$env:API_BASE_URL="https://tradehax.net"
npm run test:api:smoke
```

## Deployment Bundle Freshness Check

Generates a commit marker during build and verifies the live site is serving the expected bundle.

### Build Metadata Generation

This runs automatically via `prebuild` and writes `public/__build.json`.

```powershell
cd C:\tradez\main\web
npm run build
```

### Verify Live Deployment

```powershell
cd C:\tradez\main\web
npm run verify:deploy-bundle -- --url https://tradehax.net
```

### Verify Against Expected Commit

```powershell
cd C:\tradez\main\web
npm run verify:deploy-bundle -- --url https://tradehax.net --expected-commit b9933b8
```

## L2 Settlement Routing Smoke Test

Checks sequencer + relayer endpoint reachability using the same local/cloud fallback policy used by the `l2-custom` adapter.

### Self-Test (No External Services)

```powershell
cd C:\tradez\main\web
npm run test:l2:routing:self
```

### Live Endpoint Check

```powershell
cd C:\tradez\main\web
npm run test:l2:routing
```

Expected envs (see `web/.env.example`):

- `SETTLEMENT_L2_MODE` (`auto`, `local`, `cloud`)
- `SETTLEMENT_L2_TIMEOUT_MS`
- `SETTLEMENT_L2_API_KEY` (optional)
- `SETTLEMENT_L2_SEQUENCER_LOCAL_URL`
- `SETTLEMENT_L2_SEQUENCER_CLOUD_URL`
- `SETTLEMENT_L2_RELAYER_LOCAL_URL`
- `SETTLEMENT_L2_RELAYER_CLOUD_URL`

