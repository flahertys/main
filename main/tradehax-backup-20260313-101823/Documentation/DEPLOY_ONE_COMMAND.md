# One-command deployment (safe by default)

Use `scripts/deploy-tradehax.ps1` to check today's branch activity, merge only when needed, push to `main`, and optionally deploy to `tradehax.net`.

## What it does

- Reviews `main`, `backup-before-pin-069c31c`, and `copilot-worktree-2026-03-01T04-53-03`
- Prints commits since `midnight`
- Merges review branches into `main` only if they contain new commits not in `main`
- Pushes `main` after merge
- Optionally runs remote deployment over SSH
- Supports Docker Compose deployment mode (`-UseDocker`)
- Runs a post-deploy health check and fails if HTTP 200 is not returned

## First run (dry-run)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-tradehax.ps1
```

## Real run (git actions enabled)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-tradehax.ps1 -DryRun:$false
```

## Real run with server deploy (PM2 mode)

```powershell
$env:TRADEHAX_VPS_HOST="199.188.201.164"
$env:TRADEHAX_VPS_USER="tradehax"
$env:TRADEHAX_SSH_KEY_PATH="C:\Users\<you>\.ssh\id_ed25519"
$env:TRADEHAX_REMOTE_APP_PATH="/home/tradehax/public_html"
$env:TRADEHAX_PM2_APP_NAME="tradehax"

powershell -ExecutionPolicy Bypass -File .\scripts\deploy-tradehax.ps1 -DryRun:$false -DeployRemote
```

## Real run with server deploy (Docker mode)

```powershell
$env:TRADEHAX_VPS_HOST="199.188.201.164"
$env:TRADEHAX_VPS_USER="tradehax"
$env:TRADEHAX_SSH_KEY_PATH="C:\Users\<you>\.ssh\id_ed25519"
$env:TRADEHAX_REMOTE_APP_PATH="/home/tradehax/public_html"
$env:TRADEHAX_DOCKER_COMPOSE_FILE="docker-compose.social.yml"
$env:TRADEHAX_DOCKER_PROJECT="tradehax"
$env:TRADEHAX_DOCKER_SERVICES=""

powershell -ExecutionPolicy Bypass -File .\scripts\deploy-tradehax.ps1 -DryRun:$false -DeployRemote -UseDocker
```

## Optional: narrower scope

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-tradehax.ps1 -Since "8 hours ago"
```

## Health check behavior

After `-DeployRemote`, the script validates `https://tradehax.net/__health` by default.
It retries and fails the run if no HTTP 200 is returned.

```powershell
# Optional tuning
$env:TRADEHAX_HEALTH_URL="https://tradehax.net/__health"
$env:TRADEHAX_HEALTH_RETRIES="5"
$env:TRADEHAX_HEALTH_TIMEOUT_SEC="15"
$env:TRADEHAX_HEALTH_RETRY_DELAY_SEC="5"
```

## Notes

- The script stops if your working tree is dirty.
- Dry-run is on by default to prevent accidental deploys.
- Keep secrets and SSH key paths out of Git; use environment variables.
- `-UseDocker` runs `docker compose` remotely (falls back to `docker-compose` when needed).
- Health check runs only when `-DeployRemote` is used.
