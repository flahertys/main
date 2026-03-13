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

