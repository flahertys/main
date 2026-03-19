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

