#!/usr/bin/env node

/**
 * TradeHax Namecheap cPanel Deployment Automation
 * 
 * Automates:
 * 1. SSH connection & repository setup
 * 2. Environment configuration
 * 3. Node.js app creation via cPanel
 * 4. Apache proxy & HTTPS configuration
 * 5. PM2 process management
 * 6. Deployment verification
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function banner(title) {
  console.log('');
  log('╔' + '═'.repeat(70) + '╗', 'magenta');
  log('║  ' + title.padEnd(66) + '  ║', 'magenta');
  log('╚' + '═'.repeat(70) + '╝', 'magenta');
  console.log('');
}

function section(title) {
  log(`\n${'━'.repeat(70)}`, 'cyan');
  log(title, 'cyan');
  log(`${'━'.repeat(70)}\n`, 'cyan');
}

class NamecheapCPanelDeployment {
  constructor() {
    this.config = {
      host: '199.188.201.164',
      user: 'traddhou',
      domain: 'tradehax.net',
      appRoot: '/home/traddhou/public_html',
      nodeVersion: '20.x',
      port: 3000,
      cpanelUrl: 'https://business188.namecheaphosting.com:2083',
    };
    this.cwd = process.cwd();
  }

  generateDeploymentScript() {
    banner('NAMECHEAP cPANEL DEPLOYMENT SCRIPT GENERATOR');

    section('STEP 1: SSH & REPOSITORY SETUP');

    const sshSetup = `#!/bin/bash
# TradeHax Namecheap cPanel Deployment

set -e

echo "🚀 TradeHax Namecheap cPanel Deployment"
echo ""

# Step 1: SSH Connection & Repo Clone
echo "1. Connecting to Namecheap & cloning repository..."
ssh traddhou@199.188.201.164 << 'SSH_COMMAND'
  cd /home/traddhou/public_html
  
  # Backup existing (if any)
  if [ -d "main" ]; then
    echo "Backing up existing deployment..."
    mv main main.backup.$(date +%s)
  fi
  
  # Clone repository
  echo "Cloning TradeHax repository..."
  git clone https://github.com/DarkModder33/main.git .
  
  # Set permissions
  chmod 600 .env 2>/dev/null || true
  chmod 755 .
  
  echo "✅ Repository cloned"
SSH_COMMAND

echo "✅ SSH & repository setup complete"
echo ""

# Step 2: Build Next.js for cPanel
echo "2. Building Next.js application for standalone deployment..."
ssh traddhou@199.188.201.164 << 'SSH_COMMAND'
  cd /home/traddhou/public_html
  
  # Install dependencies
  echo "Installing dependencies..."
  npm install --production
  
  # Build application
  echo "Building application..."
  npm run build
  
  # Verify standalone build
  if [ -f ".next/standalone/server.js" ]; then
    echo "✅ Standalone build verified"
  else
    echo "❌ Standalone build not found"
    exit 1
  fi
SSH_COMMAND

echo "✅ Build complete"
echo ""

# Step 3: Environment Configuration
echo "3. Configuring environment variables..."
ssh traddhou@199.188.201.164 << 'SSH_COMMAND'
  cd /home/traddhou/public_html
  
  # Create .env if doesn't exist
  if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ .env created from template"
  fi
  
  # Secure .env
  chmod 600 .env
  
  # Show what needs to be configured
  echo ""
  echo "⚠️  IMPORTANT: Configure these in .env:"
  echo "   • HF_API_TOKEN=hf_your_token_here"
  echo "   • NEXT_PUBLIC_SITE_URL=https://tradehax.net"
  echo "   • DATABASE_URL=your_database_url"
  echo "   • NEXTAUTH_SECRET=your_secret_key"
  echo ""
SSH_COMMAND

echo "✅ Environment setup complete"
echo ""

# Step 4: Apache Configuration
echo "4. Configuring Apache proxy & HTTPS..."
ssh traddhou@199.188.201.164 << 'SSH_COMMAND'
  cd /home/traddhou/public_html
  
  cat > .htaccess << 'HTACCESS'
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
HTACCESS

  chmod 644 .htaccess
  echo "✅ Apache configuration applied"
SSH_COMMAND

echo "✅ Apache proxy configured"
echo ""

# Step 5: PM2 Process Management
echo "5. Setting up PM2 process management..."
ssh traddhou@199.188.201.164 << 'SSH_COMMAND'
  cd /home/traddhou/public_html
  
  # Install PM2 globally
  npm install -g pm2
  
  # Create PM2 ecosystem config
  cat > ecosystem.config.js << 'ECOSYSTEM'
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
ECOSYSTEM

  # Create logs directory
  mkdir -p logs
  
  # Start with PM2
  pm2 start ecosystem.config.js
  
  # Save and startup
  pm2 save
  pm2 startup
  
  echo "✅ PM2 configured and started"
SSH_COMMAND

echo "✅ PM2 process management ready"
echo ""

# Step 6: Verification
echo "6. Verifying deployment..."
sleep 5

echo "Checking application status..."
ssh traddhou@199.188.201.164 pm2 status

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Visit https://tradehax.net (may take 30 seconds to start)"
echo "2. Monitor logs: ssh traddhou@199.188.201.164 'pm2 logs tradehax'"
echo "3. Manage app: ssh traddhou@199.188.201.164 'pm2 monit'"
echo ""
`;

    const scriptPath = path.join(this.cwd, 'scripts/deploy-to-namecheap.sh');
    fs.writeFileSync(scriptPath, sshSetup);
    log(`✅ Generated: ${scriptPath}`, 'green');
    log('Run with: bash scripts/deploy-to-namecheap.sh', 'yellow');
  }

  generateCPanelManualGuide() {
    section('STEP 2: cPANEL MANUAL SETUP GUIDE');

    const guide = `
📋 NAMECHEAP cPANEL SETUP (MANUAL STEPS)

═══════════════════════════════════════════════════════════════════════════

1. cPANEL LOGIN
─────────────

URL: https://business188.namecheaphosting.com:2083
Username: traddhou
Password: [Your cPanel password]

═══════════════════════════════════════════════════════════════════════════

2. UPLOAD APPLICATION (Choose One Method)

METHOD A: File Manager (Easiest)
──────────────────────────────────

1. Go to: cPanel > File Manager
2. Navigate to: /home/traddhou/public_html
3. Click "Upload" button
4. Select built TradeHax ZIP file
5. Right-click ZIP → Extract
6. Verify files present

FILES TO VERIFY:
  ✓ .next/standalone/server.js
  ✓ public/
  ✓ .env (or create from .env.example)
  ✓ package.json

METHOD B: FTP/SFTP (FileZilla)
────────────────────────────────

1. Host: ftp.tradehax.net (or 199.188.201.164)
2. Username: traddhou
3. Password: [Your FTP password]
4. Port: 21 (FTP) or 22 (SFTP)
5. Drag & drop files to public_html

METHOD C: SSH Git Clone (Recommended)
──────────────────────────────────────

ssh traddhou@199.188.201.164
cd /home/traddhou/public_html
git clone https://github.com/DarkModder33/main.git .
npm install --production
npm run build

═══════════════════════════════════════════════════════════════════════════

3. CONFIGURE NODE.JS APP IN cPANEL

Path: cPanel > Software > Setup Node.js App

Step A: Create Application
──────────────────────────
1. Click "Create Application"
2. Fill in:
   • Node.js version: 20.x
   • Application mode: Production
   • Application root: /home/traddhou/public_html
   • Application URL: https://tradehax.net
   • Application startup file: .next/standalone/server.js
3. Click "Create"

Step B: Add Environment Variables
─────────────────────────────────
1. In the app list, click "Edit" for tradehax
2. Click "Add Variable" for each:

REQUIRED:
   Name: NODE_ENV        Value: production
   Name: PORT            Value: 3000
   Name: NEXT_PUBLIC_SITE_URL Value: https://tradehax.net

HF CONFIGURATION:
   Name: HF_API_TOKEN         Value: hf_xxxxxxxxxxxxxxx
   Name: HF_MODEL_ID          Value: mistralai/Mistral-7B-Instruct-v0.1
   Name: HF_IMAGE_MODEL_ID    Value: stabilityai/stable-diffusion-2-1

PAYMENTS:
   Name: NEXT_PUBLIC_ENABLE_PAYMENTS Value: true
   Name: STRIPE_SECRET_KEY    Value: sk_live_xxxxx (keep secret!)

SECURITY:
   Name: NEXTAUTH_SECRET      Value: [Generate: openssl rand -base64 32]
   Name: NEXTAUTH_URL         Value: https://tradehax.net

DATABASE (if used):
   Name: DATABASE_URL         Value: your_database_connection_string

3. Click "Save" after each variable

Step C: Install & Start
──────────────────────
1. Click "Run NPM Install"
2. Wait for completion
3. Click "Start Application"
4. Status should show "Running"

═══════════════════════════════════════════════════════════════════════════

4. APACHE PROXY CONFIGURATION

Via cPanel File Manager:
────────────────────────

1. Navigate to: /home/traddhou/public_html
2. Create/Edit: .htaccess

Contents:
─────────
<IfModule mod_rewrite.c>
RewriteEngine On

# Proxy to Node.js
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
</IfModule>
</IfModule>

3. Save & close

TROUBLESHOOTING:
────────────────
If 500 errors: Check cPanel > Service Status > Apache
If proxy fails: Verify mod_proxy is enabled (cPanel > Apache Modules)

═══════════════════════════════════════════════════════════════════════════

5. SSL/HTTPS (AutoSSL)

cPanel > SSL/TLS > AutoSSL:
──────────────────────────
1. Check: tradehax.net is listed
2. Status should be: "ACTIVE" (green)
3. Expires: Check renewal date
4. If expired: Issue new with "Check for new SSL certificates"

Verify HTTPS:
─────────────
• Visit: https://tradehax.net
• Browser should show 🔒 (locked)
• No warnings about certificate

═══════════════════════════════════════════════════════════════════════════

6. VERIFY DEPLOYMENT

Test Live Site:
───────────────
1. Open: https://tradehax.net
2. Check:
   ✓ Page loads (may take 30s on first request)
   ✓ No 502/503 errors
   ✓ HTTPS working (🔒 visible)
   ✓ Navigation works

API Endpoints:
──────────────
Test /api/hf-server:
  curl -X POST https://tradehax.net/api/hf-server \\
    -H "Content-Type: application/json" \\
    -d '{"prompt":"Test","task":"text-generation"}'

Monitor Logs:
──────────────
Via SSH:
  pm2 logs tradehax          (stream logs)
  pm2 status                 (check status)
  pm2 monit                  (resource usage)

Via cPanel:
  cPanel > Metrics > Errors  (error log)
  cPanel > Metrics > Stats   (traffic)

═══════════════════════════════════════════════════════════════════════════

7. PM2 PROCESS MANAGEMENT (SSH)

Install PM2:
────────────
npm install -g pm2
pm2 start .next/standalone/server.js --name tradehax

Manage App:
───────────
pm2 status                 (see status)
pm2 logs tradehax          (view logs)
pm2 monit                  (monitor resources)
pm2 restart tradehax       (restart app)
pm2 stop tradehax          (stop app)
pm2 start tradehax         (start app)
pm2 delete tradehax        (remove from PM2)

Persistent Start:
─────────────────
pm2 save                   (save config)
pm2 startup                (auto-start on reboot)

═══════════════════════════════════════════════════════════════════════════

8. TROUBLESHOOTING

Issue: Application won't start
───────────────────────────────
1. Check logs: pm2 logs tradehax
2. Verify .env variables are set
3. Check Node.js version: node --version
4. Rebuild: npm run build
5. Clear cPanel cache

Issue: 502 Bad Gateway
───────────────────────
1. Check if Node app is running: pm2 status
2. Verify port 3000 is not blocked
3. Check Apache status in cPanel
4. Restart app: pm2 restart tradehax

Issue: HTTPS not working
─────────────────────────
1. Check SSL certificate: cPanel > SSL/TLS
2. Renew if expired: AutoSSL > Check
3. Verify .htaccess has force HTTPS rules
4. Clear browser cache

Issue: API endpoints returning 500
──────────────────────────────────
1. Check HF_API_TOKEN is set correctly
2. Verify HF_MODEL_ID is accessible
3. Check API logs: pm2 logs tradehax
4. Test locally: npm run dev

Issue: Slow loading
────────────────────
1. First request may take 30s (normal)
2. Check memory usage: pm2 monit
3. Monitor CPU: cPanel > Metrics
4. Consider VPS if persistent throttling

═══════════════════════════════════════════════════════════════════════════

9. MONITORING & OPTIMIZATION

Enable Analytics:
─────────────────
1. Set in .env: NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
2. Restart app: pm2 restart tradehax
3. Visit https://analytics.google.com to verify

Monitor Performance:
────────────────────
cPanel > Metrics:
  • CPU Usage
  • Memory Usage
  • Bandwidth
  • Errors

Check Response Times:
─────────────────────
Visit: https://tradehax.net/api/health (if implemented)
Expected: < 500ms for static content
         < 2s for API calls (excluding first request)

Set Alarms:
───────────
cPanel > Maintenance > Resources:
  • Set CPU alarm: 80%
  • Set Memory alarm: 75%
  • Email alerts on threshold

═══════════════════════════════════════════════════════════════════════════

10. ENABLE REVENUE FEATURES

Payment Processing:
────────────────────
1. Set: NEXT_PUBLIC_ENABLE_PAYMENTS=true
2. Configure: STRIPE_SECRET_KEY (in .env)
3. Restart: pm2 restart tradehax
4. Test payment flow at: https://tradehax.net/checkout

Authentication:
─────────────────
1. Verify NEXTAUTH_SECRET is set
2. Check NextAuth callbacks in code
3. Test login at: https://tradehax.net/auth/signin

AI Features:
─────────────
1. Verify HF_API_TOKEN is valid
2. Test at: https://tradehax.net/api/hf-server
3. Monitor token usage on HF Hub

═══════════════════════════════════════════════════════════════════════════

11. MAINTENANCE

Regular Tasks:
───────────────
• Weekly: Check logs for errors
• Weekly: Monitor resource usage
• Monthly: Update dependencies (npm update)
• Monthly: Check certificate expiry
• Quarterly: Review analytics

Backup Strategy:
─────────────────
cPanel > Backup:
  1. Enable automated backups
  2. Backup frequency: Daily
  3. Keep: 14 days of backups
  4. Download: Weekly full backup

Emergency Restart:
────────────────────
If app crashes:
  ssh traddhou@199.188.201.164
  pm2 restart tradehax
  pm2 logs tradehax  (check what went wrong)

═══════════════════════════════════════════════════════════════════════════
`;

    log(guide, 'blue');
  }

  generateVerificationChecklist() {
    section('VERIFICATION CHECKLIST');

    const checklist = `
✅ PRE-DEPLOYMENT CHECKS

Repository:
  [ ] Latest code pushed to GitHub
  [ ] .env.example configured
  [ ] .next/standalone/server.js exists
  [ ] npm install --production successful
  [ ] npm run build successful

Environment:
  [ ] HF_API_TOKEN set and valid
  [ ] NEXTAUTH_SECRET generated
  [ ] DATABASE_URL configured (if needed)
  [ ] NEXT_PUBLIC_SITE_URL=https://tradehax.net

Namecheap Access:
  [ ] cPanel credentials ready
  [ ] SSH key configured (optional but recommended)
  [ ] Domain registered & pointing to server

═══════════════════════════════════════════════════════════════════════════

✅ POST-DEPLOYMENT VERIFICATION

Application Loading:
  [ ] https://tradehax.net loads (may take 30s first time)
  [ ] No 502/503 errors
  [ ] HTTPS working (🔒 visible)
  [ ] No console errors in DevTools

API Endpoints:
  [ ] POST /api/hf-server works
  [ ] Text generation returns JSON
  [ ] Image generation returns blob
  [ ] Response time < 10s

Features:
  [ ] Authentication works (/auth/signin)
  [ ] Payments flag enabled (check DevTools)
  [ ] AI features respond correctly
  [ ] Trading bot endpoints work

Performance:
  [ ] Page load < 3 seconds
  [ ] API response < 2 seconds
  [ ] CPU usage < 50%
  [ ] Memory usage < 200MB

Logs & Monitoring:
  [ ] pm2 logs show "listening on port 3000"
  [ ] cPanel > Metrics shows traffic
  [ ] No 500 errors in logs
  [ ] No permission denied errors

Security:
  [ ] HTTPS enforced (redirects http -> https)
  [ ] .env file not accessible (404)
  [ ] Security headers present

═══════════════════════════════════════════════════════════════════════════

✅ OPTIONAL ENHANCEMENTS

CDN Configuration:
  [ ] CloudFlare enabled (optional)
  [ ] Cache rules optimized
  [ ] Image optimization enabled

Database:
  [ ] Connection tested
  [ ] Migrations run
  [ ] Data accessible

Email:
  [ ] SMTP configured
  [ ] Welcome emails sending
  [ ] Error notifications working

Monitoring:
  [ ] Google Analytics connected
  [ ] Error tracking enabled
  [ ] Performance monitoring active

═══════════════════════════════════════════════════════════════════════════
`;

    log(checklist, 'yellow');
  }

  generateTroubleshootingGuide() {
    section('TROUBLESHOOTING GUIDE');

    const troubleshooting = `
🔧 COMMON ISSUES & SOLUTIONS

════════════════════════════════════════════════════════════════════════

1. APPLICATION WON'T START

Symptom: 502 Bad Gateway / Application not running

Solutions:
──────────
a) Check app status:
   ssh traddhou@199.188.201.164 pm2 status

b) View error logs:
   pm2 logs tradehax (last 50 lines)
   pm2 logs tradehax --lines 100

c) Restart application:
   pm2 restart tradehax
   sleep 5
   pm2 status

d) Check startup file exists:
   ls -la .next/standalone/server.js

e) Rebuild application:
   npm run build
   pm2 restart tradehax

f) Check memory:
   pm2 monit
   If > 500MB: Increase max_memory_restart in ecosystem.config.js

════════════════════════════════════════════════════════════════════════

2. HF_API_TOKEN NOT FOUND / INVALID

Symptom: /api/hf-server returns 400 "API token required"

Solutions:
──────────
a) Verify env variable in cPanel:
   cPanel > Node.js Apps > Edit > Check HF_API_TOKEN

b) Reload env variables:
   pm2 restart tradehax

c) Test token validity:
   curl -H "Authorization: Bearer $HF_API_TOKEN" \\
     https://huggingface.co/api/whoami

d) Generate new token:
   Visit: https://huggingface.co/settings/tokens
   Create: Read access token
   Update in cPanel + restart

════════════════════════════════════════════════════════════════════════

3. HTTPS NOT WORKING / SSL ERROR

Symptom: Browser warning about certificate / Mixed content

Solutions:
──────────
a) Check certificate status:
   cPanel > SSL/TLS > Status should be "ACTIVE"

b) Renew certificate:
   cPanel > SSL/TLS > AutoSSL > Check for new

c) Verify .htaccess forces HTTPS:
   File Manager > .htaccess
   Should contain: RewriteRule ^(.*)$ https://%{HTTP_HOST}$1

d) Test HTTPS:
   curl -I https://tradehax.net
   Should return: 200 OK (not 302)

e) Clear browser cache:
   Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

════════════════════════════════════════════════════════════════════════

4. SLOW LOADING / TIMEOUTS

Symptom: Page takes > 10 seconds to load

Solutions:
──────────
a) Check if first request (normal, up to 30s):
   Second visit should be < 3s

b) Monitor resources:
   pm2 monit
   Check CPU & Memory

c) Check cPanel metrics:
   cPanel > Metrics > CPU Usage
   If high: Consider VPS upgrade

d) Optimize Node.js:
   • Reduce cluster instances (ecosystem.config.js: instances: 1)
   • Check database queries
   • Enable caching

e) Verify upstream API speeds:
   Test HF inference manually:
   curl -X POST https://api-inference.huggingface.co/models/... \\
     -H "Authorization: Bearer $HF_API_TOKEN"

════════════════════════════════════════════════════════════════════════

5. DATABASE CONNECTION ERRORS

Symptom: 500 error / "Cannot connect to database"

Solutions:
──────────
a) Verify DATABASE_URL format:
   Should be: postgresql://user:pass@host:5432/dbname
   Or MySQL: mysql://user:pass@host:3306/dbname

b) Test connection manually:
   psql $DATABASE_URL -c "SELECT 1"

c) Check firewall/IP whitelist:
   Database > Connection rules
   Add: 199.188.201.164

d) Run migrations:
   npm run migrate:latest
   pm2 restart tradehax

e) Check connection pool:
   DATABASE_URL might need: ?sslmode=require

════════════════════════════════════════════════════════════════════════

6. PAYMENT PROCESSING NOT WORKING

Symptom: Payment button disabled / "Not configured"

Solutions:
──────────
a) Verify NEXT_PUBLIC_ENABLE_PAYMENTS=true:
   cPanel > Node.js Apps > Edit
   Should see: NEXT_PUBLIC_ENABLE_PAYMENTS = true

b) Set STRIPE_SECRET_KEY:
   cPanel > Node.js Apps > Add Variable
   Name: STRIPE_SECRET_KEY
   Value: sk_live_xxxxxxxxxxxxx (from Stripe dashboard)

c) Restart application:
   pm2 restart tradehax

d) Test payment flow:
   Visit: https://tradehax.net/checkout
   Check browser console for errors

e) Verify Stripe API keys:
   Stripe Dashboard > API Keys
   Copy: Secret Key (not Publishable)

════════════════════════════════════════════════════════════════════════

7. API RETURNS 404

Symptom: /api/hf-server returns 404 Not Found

Solutions:
──────────
a) Verify application startup file:
   Should point to: .next/standalone/server.js

b) Check .htaccess proxy rules:
   RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]

c) Verify Apache mod_proxy is enabled:
   cPanel > Apache Modules
   Search: proxy
   Should be enabled (green)

d) Test direct connection:
   curl http://127.0.0.1:3000/api/hf-server

e) Check app is running:
   pm2 status tradehax
   If stopped: pm2 start ecosystem.config.js

════════════════════════════════════════════════════════════════════════

8. HIGH MEMORY USAGE

Symptom: pm2 monit shows > 500MB memory

Solutions:
──────────
a) Identify memory leak:
   pm2 logs tradehax (look for warnings)

b) Reduce instances:
   ecosystem.config.js: instances: 1 (not cluster)

c) Set memory limit:
   ecosystem.config.js: max_memory_restart: '300M'

d) Restart on schedule:
   crontab -e
   0 2 * * * pm2 restart tradehax  # Daily at 2 AM

e) Consider upgrade:
   If still high: Upgrade to VPS plan

════════════════════════════════════════════════════════════════════════

9. PM2 NOT STARTING ON REBOOT

Symptom: Application stopped after server reboot

Solutions:
──────────
a) Run PM2 startup command:
   pm2 startup systemd -u traddhou --hp /home/traddhou
   Follow output instructions

b) Verify crontab updated:
   crontab -l | grep pm2
   Should show PM2 startup line

c) Save PM2 state:
   pm2 save

d) Test reboot:
   pm2 restart tradehax
   pm2 save

════════════════════════════════════════════════════════════════════════

10. PERMISSION DENIED ERRORS

Symptom: Logs show "Permission denied" or "EACCES"

Solutions:
──────────
a) Check file permissions:
   ls -la /home/traddhou/public_html/.next

b) Fix permissions:
   chmod -R 755 /home/traddhou/public_html
   chmod 600 /home/traddhou/public_html/.env

c) Check .htaccess:
   chmod 644 /home/traddhou/public_html/.htaccess

d) Verify log directory:
   mkdir -p /home/traddhou/public_html/logs
   chmod 755 /home/traddhou/public_html/logs

════════════════════════════════════════════════════════════════════════

QUICK DIAGNOSTICS

Run these commands to troubleshoot:

ssh traddhou@199.188.201.164

# Check app status
pm2 status

# View recent errors
pm2 logs tradehax --lines 50

# Check resource usage
pm2 monit

# Verify port
netstat -tlnp | grep 3000

# Check connectivity
curl http://127.0.0.1:3000

# View environment
pm2 env tradehax | grep HF_

# Check file permissions
ls -la .next/standalone/server.js

# Verify .htaccess
cat .htaccess

════════════════════════════════════════════════════════════════════════
`;

    log(troubleshooting, 'red');
  }

  run() {
    banner('TRADEHAX NAMECHEAP cPANEL DEPLOYMENT AUTOMATION');

    this.generateDeploymentScript();
    log('');
    this.generateCPanelManualGuide();
    log('');
    this.generateVerificationChecklist();
    log('');
    this.generateTroubleshootingGuide();

    section('DEPLOYMENT SUMMARY');

    log('📋 DEPLOYMENT OPTIONS:', 'cyan');
    log('');
    log('Option 1: FULLY AUTOMATED (Recommended)', 'green');
    log('  bash scripts/deploy-to-namecheap.sh', 'yellow');
    log('  • Clones repo via SSH', 'yellow');
    log('  • Builds application', 'yellow');
    log('  • Configures Apache', 'yellow');
    log('  • Sets up PM2', 'yellow');
    log('  Time: ~10 minutes', 'yellow');
    log('');

    log('Option 2: SEMI-AUTOMATED (Manual + Script)', 'green');
    log('  1. Manual file upload via cPanel File Manager', 'yellow');
    log('  2. Run: bash scripts/deploy-to-namecheap.sh', 'yellow');
    log('  Time: ~15 minutes', 'yellow');
    log('');

    log('Option 3: FULL MANUAL (Complete Control)', 'green');
    log('  Follow the cPANEL MANUAL SETUP GUIDE above', 'yellow');
    log('  Time: ~25 minutes', 'yellow');
    log('');

    section('KEY FILES GENERATED');

    log('scripts/deploy-to-namecheap.sh', 'cyan');
    log('  → Automated deployment script', 'blue');
    log('');
    log('Configuration:', 'cyan');
    log('  Host: 199.188.201.164', 'blue');
    log('  User: traddhou', 'blue');
    log('  App Root: /home/traddhou/public_html', 'blue');
    log('  Domain: https://tradehax.net', 'blue');
    log('  Node Version: 20.x', 'blue');
    log('  Port: 3000', 'blue');
    log('');

    section('QUICK START');

    log('1. Verify prerequisites:', 'yellow');
    log('   • GitHub access token or SSH key', 'cyan');
    log('   • Namecheap SSH credentials', 'cyan');
    log('   • HF_API_TOKEN ready', 'cyan');
    log('');

    log('2. Run automated deployment:', 'yellow');
    log('   bash scripts/deploy-to-namecheap.sh', 'cyan');
    log('');

    log('3. Verify deployment:', 'yellow');
    log('   https://tradehax.net (should load in 30 seconds)', 'cyan');
    log('');

    log('4. Monitor:', 'yellow');
    log('   ssh traddhou@199.188.201.164 \'pm2 logs tradehax\'', 'cyan');
    log('');

    log('✅ Setup complete! Run deployment script now.', 'green');
    log('');
  }
}

const deployment = new NamecheapCPanelDeployment();
deployment.run();
