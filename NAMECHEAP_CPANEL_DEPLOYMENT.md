# 🚀 TradeHax Namecheap cPanel Deployment Guide

## Quick Reference

**Server Details:**
- Host: `199.188.201.164`
- User: `traddhou`
- Domain: `https://tradehax.net`
- cPanel: `https://business188.namecheaphosting.com:2083`
- App Root: `/home/traddhou/public_html`
- Node Version: `20.x`
- Port: `3000`

---

## 5-Minute Quick Start

```bash
# 1. Generate deployment automation guide
node scripts/namecheap-cpanel-deployment.js

# 2. Review the generated guide

# 3. Run automated deployment
bash scripts/deploy-to-namecheap.sh

# 4. Verify
https://tradehax.net
```

---

## Step-by-Step Deployment

### Step 1: Prepare Application

```bash
# Ensure latest build
npm run build

# Verify standalone build exists
ls -la .next/standalone/server.js

# Create deployment directory
mkdir -p deployment
cp -r .next public package.json .env.example ecosystem.config.js deployment/
```

### Step 2: SSH & Upload (Choose One)

#### Option A: SSH Git Clone (Easiest)

```bash
ssh traddhou@199.188.201.164

cd /home/traddhou/public_html

# Backup existing (if any)
mv main main.backup.$(date +%s) 2>/dev/null || true

# Clone
git clone https://github.com/DarkModder33/main.git .

# Install & build
npm install --production
npm run build

# Set permissions
chmod 600 .env
```

#### Option B: File Manager Upload

1. Go to: cPanel → File Manager
2. Navigate to: `/home/traddhou/public_html`
3. Upload ZIP file
4. Right-click → Extract
5. Verify files present

#### Option C: SFTP (FileZilla)

```
Host: ftp.tradehax.net
User: traddhou
Port: 21 (FTP) or 22 (SFTP)
```

### Step 3: Configure Node.js App in cPanel

1. **Go to:** cPanel → Software → Setup Node.js App
2. **Click:** Create Application
3. **Fill in:**
   - Node.js version: `20.x`
   - Application mode: `Production`
   - Application root: `/home/traddhou/public_html`
   - Application URL: `https://tradehax.net`
   - Application startup file: `.next/standalone/server.js`

4. **Add Environment Variables:**
   
   Click "Add Variable" for each:

   ```
   NODE_ENV = production
   PORT = 3000
   NEXT_PUBLIC_SITE_URL = https://tradehax.net
   
   HF_API_TOKEN = hf_xxxxxxxxxxxxxxx
   HF_MODEL_ID = mistralai/Mistral-7B-Instruct-v0.1
   HF_IMAGE_MODEL_ID = stabilityai/stable-diffusion-2-1
   
   NEXT_PUBLIC_ENABLE_PAYMENTS = true
   STRIPE_SECRET_KEY = sk_live_xxxxx
   
   NEXTAUTH_SECRET = [generate: openssl rand -base64 32]
   NEXTAUTH_URL = https://tradehax.net
   ```

5. **Click:** Save
6. **Click:** Run NPM Install
7. **Click:** Start Application

### Step 4: Configure Apache & HTTPS

**Via File Manager:**

1. Navigate to: `/home/traddhou/public_html`
2. Create/Edit: `.htaccess`

```apache
<IfModule mod_rewrite.c>
RewriteEngine On

# Proxy to Node.js app
RewriteBase /
RewriteRule ^$ http://127.0.0.1:3000/ [P,L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}$1 [R=301,L]

# Security headers
<IfModule mod_headers.c>
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-Content-Type-Options "nosniff"
  Header set X-XSS-Protection "1; mode=block"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
</IfModule>
```

### Step 5: Setup PM2 Process Management (SSH)

```bash
ssh traddhou@199.188.201.164

cd /home/traddhou/public_html

# Install PM2
npm install -g pm2

# Create ecosystem config
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'tradehax',
    script: './.next/standalone/server.js',
    instances: 1,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
  }],
};
EOF

# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js

# Save and enable startup
pm2 save
pm2 startup
```

### Step 6: Verify Deployment

```bash
# Check status
pm2 status

# View logs
pm2 logs tradehax

# Monitor resources
pm2 monit

# Test application
curl https://tradehax.net
```

Visit: **https://tradehax.net**
- Should load in ~30 seconds (first time)
- Should show HTTPS lock 🔒
- No errors in browser console

---

## Testing Endpoints

### Test Text Generation

```bash
curl -X POST https://tradehax.net/api/hf-server \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Give me a concise BTC/ETH market brief.",
    "task": "text-generation"
  }'
```

Expected response:
```json
{
  "output": [
    {
      "generated_text": "..."
    }
  ]
}
```

### Test Image Generation

```bash
curl -X POST https://tradehax.net/api/hf-server \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Trading chart with candlestick pattern",
    "task": "image-generation"
  }'
```

Expected: Image blob returned

---

## Monitoring & Logs

### Via SSH

```bash
# Stream logs
pm2 logs tradehax

# View specific number of lines
pm2 logs tradehax --lines 100

# Monitor resources
pm2 monit

# Get process info
pm2 info tradehax

# Check if running
pm2 status
```

### Via cPanel

1. **cPanel → Metrics:**
   - CPU Usage
   - Memory Usage
   - Bandwidth
   - Errors

2. **cPanel → Error Log:**
   - Tail errors
   - Search for issues

---

## Environment Variables Reference

| Variable | Value | Required | Notes |
|----------|-------|----------|-------|
| `NODE_ENV` | `production` | ✅ | Must be production |
| `PORT` | `3000` | ✅ | Default Node port |
| `NEXT_PUBLIC_SITE_URL` | `https://tradehax.net` | ✅ | For NextAuth |
| `HF_API_TOKEN` | `hf_xxx...` | ✅ | From HF Hub |
| `HF_MODEL_ID` | `mistralai/Mistral-7B-Instruct-v0.1` | ✅ | Base model |
| `HF_IMAGE_MODEL_ID` | `stabilityai/stable-diffusion-2-1` | ✅ | Image model |
| `NEXT_PUBLIC_ENABLE_PAYMENTS` | `true` | ✅ | Enable monetization |
| `STRIPE_SECRET_KEY` | `sk_live_xxx` | ⚠️ | If using Stripe |
| `NEXTAUTH_SECRET` | Random 32-byte string | ✅ | Security key |
| `NEXTAUTH_URL` | `https://tradehax.net` | ✅ | Auth URL |
| `DATABASE_URL` | Connection string | ⚠️ | If using database |

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs tradehax

# Check file exists
ls -la .next/standalone/server.js

# Restart
pm2 restart tradehax

# Force rebuild
npm run build
pm2 restart tradehax
```

### 502 Bad Gateway

```bash
# Check if Node app is running
pm2 status

# Check Apache mod_proxy
# cPanel > Apache Modules > search "proxy"

# Verify .htaccess proxy rules
cat .htaccess

# Test direct connection
curl http://127.0.0.1:3000
```

### HTTPS Not Working

```bash
# Check certificate
# cPanel > SSL/TLS > Status should be "ACTIVE"

# Renew if needed
# cPanel > SSL/TLS > AutoSSL > Check

# Force HTTPS redirect should be in .htaccess
grep "Force HTTPS" .htaccess
```

### HF API Token Error

```bash
# Verify token is set
pm2 env tradehax | grep HF_API_TOKEN

# Test token validity
curl -H "Authorization: Bearer $HF_API_TOKEN" \
  https://huggingface.co/api/whoami

# Get new token from
# https://huggingface.co/settings/tokens

# Update in cPanel and restart
pm2 restart tradehax
```

### High Memory Usage

```bash
# Check memory
pm2 monit

# Restart with memory limit
# Edit ecosystem.config.js: max_memory_restart: '300M'
pm2 restart tradehax

# Set cron job to restart daily
crontab -e
# Add: 0 2 * * * pm2 restart tradehax
```

---

## Maintenance

### Daily

- Check: `pm2 status tradehax`
- Monitor: `pm2 logs tradehax` for errors

### Weekly

- Review: cPanel > Metrics > CPU/Memory
- Check: API response times
- Verify: HTTPS certificate valid

### Monthly

- Update dependencies: `npm update`
- Review: Application logs
- Backup: cPanel > Backups

### Quarterly

- Test failover: Restart app
- Review: Security settings
- Optimize: Performance settings

---

## Scaling Considerations

### Current Setup Limitations

- Single instance on shared hosting
- Limited CPU/Memory
- Suitable for: < 1000 daily users
- HF inference: Rate limited by free tier

### When to Upgrade

**Upgrade to VPS if:**
- Consistent high CPU usage (> 80%)
- Memory frequently > 400MB
- Response times > 2 seconds
- More than 5000 daily users

**Recommended VPS Setup:**
- Node: 4+ vCPU
- Memory: 4-8 GB
- Storage: 50GB SSD
- Dedicated database

---

## Rollback Procedure

If deployment fails:

```bash
ssh traddhou@199.188.201.164

cd /home/traddhou/public_html

# Stop current app
pm2 stop tradehax

# Restore backup
rm -rf .next node_modules package-lock.json
mv main.backup.[timestamp] main
# OR
git checkout HEAD -- .

# Rebuild
npm install --production
npm run build

# Start
pm2 start tradehax
```

---

## Support & Contact

**For deployment issues:**
- Email: darkmodder33@proton.me
- GitHub: https://github.com/DarkModder33/main

**Helpful Commands:**

```bash
# Generate full deployment guide
node scripts/namecheap-cpanel-deployment.js

# SSH quick connect
ssh traddhou@199.188.201.164

# Quick diagnostics
pm2 status
pm2 logs tradehax --lines 50
pm2 monit

# Restart everything
pm2 restart tradehax
pm2 save
```

---

## Success Criteria

✅ **Deployment Complete When:**

- [ ] Application loads at https://tradehax.net
- [ ] HTTPS certificate valid (🔒 showing)
- [ ] Response time < 3 seconds
- [ ] `/api/hf-server` returns 200
- [ ] Text generation works
- [ ] Image generation works
- [ ] cPanel metrics show normal usage
- [ ] pm2 logs show no errors
- [ ] Payments flag enabled

---

**Status:** 🚀 Ready to Deploy

**Latest:** See `scripts/namecheap-cpanel-deployment.js` for full automation

**Time to Live:** 10-30 minutes (depending on method)
