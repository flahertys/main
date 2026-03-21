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

## Docker-to-Vercel Env Sync

Aligns local Docker/dev env with Vercel without committing secrets.

### Safety Model

- Default mode is `dry-run` (no cloud writes)
- Only keys in `web/scripts/vercel-env-allowlist.txt` are eligible
- Values are sourced from:
  - `web/.env.local`
  - `web/.env.profiles/<profile>.env`
  - `web/.env.profiles/<profile>.<domain>.env`
  - Docker compose env blocks (`docker-compose*.yml`)

### Dry Run

```powershell
cd C:\tradez\main\web
npm run sync:env:vercel:net
npm run sync:env:vercel:tech
```

### Apply to Vercel

```powershell
cd C:\tradez\main\web
npm run sync:env:vercel:net:apply
npm run sync:env:vercel:tech:apply
```

### Advanced Usage

```powershell
cd C:\tradez\main\web
node .\scripts\vercel-env-sync.mjs --target net --profile production --dry-run
node .\scripts\vercel-env-sync.mjs --target tech --profile production --apply --replace
node .\scripts\vercel-env-sync.mjs --project tradehax-ai-assistant --scope production --dry-run
```

If your Vercel projects differ for `net` and `tech`, update `web/scripts/vercel-env-sync.config.json` target mappings.

