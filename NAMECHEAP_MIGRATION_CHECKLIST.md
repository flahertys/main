# Namecheap Migration Checklist (What You Still Need To Complete)

This checklist is the minimum remaining manual work after automation scaffolding.

## 1) GitHub Secrets (required)

In **GitHub → Settings → Secrets and variables → Actions**, add:

- `NAMECHEAP_VPS_HOST`
- `NAMECHEAP_VPS_USER`
- `NAMECHEAP_VPS_SSH_KEY`

Optional but recommended:

- `NAMECHEAP_VPS_PORT` (default 22)
- `NAMECHEAP_APP_ROOT` (default `/var/www/tradehax`)
- `NAMECHEAP_APP_PORT` (default `3000`)

## 2) Server bootstrap (one-time)

On the VPS:

1. Clone or upload repo once.
2. Run: `bash deploy/namecheap/bootstrap-server.sh`
3. Copy `deploy/namecheap/nginx.tradehax.conf` into `/etc/nginx/sites-available/tradehax.conf`
4. Enable site and restart Nginx.
5. Install certificates (certbot) for:
   - tradehax.net
   - www.tradehax.net
   - tradehaxai.tech
   - www.tradehaxai.tech
   - tradehaxai.me
   - www.tradehaxai.me
6. Create server env file from `deploy/namecheap/env.production.example`:
   - `/var/www/tradehax/shared/.env.production`

## 3) DNS cutover at Namecheap

Set records:

- `A` record `@` → **your VPS public IP**
- `CNAME` `www` → `tradehax.net`

For `tradehaxai.tech` and `tradehaxai.me`, either:
- point both to same VPS, or
- URL-redirect to canonical `tradehax.net`

Use TTL = 300 during cutover.

## 4) Cron replacement (replaces Vercel cron)

Run on VPS after app is live:

```bash
BASE_URL=https://tradehax.net TRADEHAX_CRON_SECRET='<same value as env>' bash deploy/namecheap/setup-cron.sh
```

## 5) Trigger deploy

- Push to `main`, or run GitHub workflow manually: **Deploy to Namecheap VPS**.
- Validate:
  - Home page loads
  - `/api/health/snow-removal` (or equivalent health endpoint) responds
  - Auth and key API routes function

## 6) Disable Vercel remnants

Already automated in repo:
- Vercel deploy workflow no longer auto-runs.

Still manual in Vercel dashboard:
- Remove custom domains
- Remove/deactivate project
- Remove billing method if no longer needed

## 7) Final verification

- `https://tradehax.net` returns 200 and app content
- cron endpoints receive successful entries in `/var/log/tradehax-cron.log`
- GitHub deploy workflow succeeds end-to-end
