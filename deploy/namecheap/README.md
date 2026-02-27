# Namecheap VPS Deployment Automation

This folder contains automation to migrate TradeHax off Vercel and deploy on a Namecheap VPS.

## Files

- `bootstrap-server.sh` - one-time VPS bootstrap (Node, PM2, Nginx, dirs)
- `deploy-remote.sh` - idempotent release deploy/restart script (run by CI)
- `setup-cron.sh` - installs cron jobs that replace Vercel cron schedules
- `nginx.tradehax.conf` - Nginx reverse proxy template
- `env.production.example` - env template to copy to server

## One-time server setup

1. SSH into VPS as root.
2. Run:
   - `bash deploy/namecheap/bootstrap-server.sh`
3. Configure Nginx:
   - copy `nginx.tradehax.conf` to `/etc/nginx/sites-available/tradehax.conf`
   - enable site and restart nginx
4. Configure HTTPS with certbot for all domains.
5. Create env file:
   - `/var/www/tradehax/shared/.env.production`

## CI/CD setup (GitHub Actions)

Add these repository secrets:

- `NAMECHEAP_VPS_HOST` - server hostname or IP
- `NAMECHEAP_VPS_USER` - ssh user (e.g., `tradehax`)
- `NAMECHEAP_VPS_SSH_KEY` - private key (PEM)
- `NAMECHEAP_VPS_PORT` - optional (default 22)
- `NAMECHEAP_APP_ROOT` - optional (default `/var/www/tradehax`)
- `NAMECHEAP_APP_PORT` - optional (default `3000`)

Then run workflow: **Deploy to Namecheap VPS**.

## Replace Vercel cron

On server, run:

```bash
BASE_URL=https://tradehax.net TRADEHAX_CRON_SECRET='<same-as-env>' bash deploy/namecheap/setup-cron.sh
```

## DNS cutover checklist

At Namecheap DNS:

- `A` for `@` -> VPS IP
- `CNAME` for `www` -> `tradehax.net`
- Optional: point `tradehaxai.tech` and `tradehaxai.me` similarly or redirect

Use low TTL (300) during migration window.
