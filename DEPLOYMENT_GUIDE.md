# TradeHax Backend - Production Deployment Guide

## 🎯 Objective

Deploy the TradeHax API (`https://api.tradehax.net`) with:
- ✅ Security hardening (OAuth, Web3, JWT, rate limiting)
- ✅ CORS restricted to production domains
- ✅ Environment variable management
- ✅ Error handling & monitoring
- ✅ Health checks & logging

## 📋 Pre-Deployment Checklist

### 1. Secrets Generation

Generate all required secrets before deployment:

```bash
# Generate JWT_SECRET (32 bytes, base64 encoded)
openssl rand -base64 32
# Output example: "a7xK8nM9pQ2wL5jH4vZ1rX3bG6cD8eF9sT0uY2iO="

# Generate CSRF state keys
openssl rand -hex 16
# Output example: "discord-state-a1b2c3d4e5f6g7h8"
```

### 2. OAuth Application Setup

#### Discord

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create new application: "TradeHax Production"
3. Navigate to OAuth2 → General
4. Copy **Client ID** and **Client Secret**
5. Add redirect URI: `https://api.tradehax.net/auth/oauth/discord/callback`
6. Grant bot permissions if using role assignment:
   - Manage Roles
   - Manage Channels

#### Google/Gmail

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project: "TradeHax Production"
3. Enable Google+ API
4. Create OAuth 2.0 Credential (Web application)
5. Copy **Client ID** and **Client Secret**
6. Add authorized origins: `https://tradehax.net`, `https://www.tradehax.net`
7. Add redirect URI: `https://api.tradehax.net/auth/oauth/gmail/callback`

### 3. Environment Variables

Create `.env.production` file with all required values:

```bash
# Copy template and fill in actual values
cp backend/.env.example backend/.env.production

# Edit with your secrets
cat backend/.env.production
```

**Required variables**:
```
NODE_ENV=production
PORT=3001
BACKEND_URL=https://api.tradehax.net
FRONTEND_URL=https://tradehax.net
JWT_SECRET=<your-secret>
DISCORD_CLIENT_ID=<your-id>
DISCORD_CLIENT_SECRET=<your-secret>
GOOGLE_CLIENT_ID=<your-id>
GOOGLE_CLIENT_SECRET=<your-secret>
SOLANA_NETWORK=mainnet-beta
# Use a dedicated RPC provider (Helius/Triton/QuickNode/etc.)
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
# Optional: Discord alerts for backend errors
# DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### 4. Database Setup (Optional)

If using PostgreSQL instead of in-memory Map:

```bash
# Create database
createdb tradehax

# Create user with limited permissions
createuser tradehax_user -P

# Grant privileges
psql -d tradehax -c "GRANT CONNECT ON DATABASE tradehax TO tradehax_user;"

# Store connection string
DATABASE_URL=postgresql://tradehax_user:password@localhost:5432/tradehax
```

## 🚀 Deployment Options

### Option 1: Heroku (Recommended for Simplicity)

#### Step 1: Install Heroku CLI
```bash
npm install -g heroku
heroku login
```

#### Step 2: Create Heroku App
```bash
heroku create tradehax-api
heroku apps:info tradehax-api
# Note the app URL: tradehax-api.herokuapp.com
```

#### Step 3: Set Environment Variables
```bash
# Set each variable
heroku config:set NODE_ENV=production --app tradehax-api
heroku config:set BACKEND_URL=https://tradehax-api.herokuapp.com --app tradehax-api
heroku config:set FRONTEND_URL=https://tradehax.net --app tradehax-api
heroku config:set JWT_SECRET=$(openssl rand -base64 32) --app tradehax-api
heroku config:set DISCORD_CLIENT_ID=xxx --app tradehax-api
heroku config:set DISCORD_CLIENT_SECRET=xxx --app tradehax-api
heroku config:set GOOGLE_CLIENT_ID=xxx --app tradehax-api
heroku config:set GOOGLE_CLIENT_SECRET=xxx --app tradehax-api

# Or batch set from file
heroku config:set $(cat backend/.env.production) --app tradehax-api
```

#### Step 4: Deploy
```bash
# Deploy from GitHub
heroku git:clone -a tradehax-api
cd tradehax-api
git push heroku main

# Or deploy directly from folder
git push heroku main:main
```

#### Step 5: Verify Deployment
```bash
# Check logs
heroku logs --tail --app tradehax-api

# Test health endpoint
curl https://tradehax-api.herokuapp.com/health

# Monitor app
heroku ps --app tradehax-api
heroku releases --app tradehax-api
```

### Option 2: AWS (ECS + Fargate)

#### Step 1: Create Docker Image
```bash
# Build image
docker build -t tradehax-api:latest .

# Tag for ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

docker tag tradehax-api:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/tradehax-api:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/tradehax-api:latest
```

#### Step 2: Create ECS Cluster
```bash
# Create cluster
aws ecs create-cluster --cluster-name tradehax

# Create task definition with environment variables
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

#### Step 3: Create Fargate Service
```bash
aws ecs create-service \
  --cluster tradehax \
  --service-name tradehax-api \
  --task-definition tradehax-api \
  --desired-count 2 \
  --launch-type FARGATE \
  --load-balancers targetGroupArn=arn:aws:...,containerName=tradehax-api,containerPort=3001
```

### Option 3: DigitalOcean App Platform

#### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### Step 2: Connect App Platform
1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Select GitHub repository: `shamrockstocks/shamrockstocks.github.io`
4. Configure build command: `npm install --production`
5. Configure run command: `cd backend && node server.js`

#### Step 3: Add Environment Variables
In App Platform dashboard:
```
NODE_ENV=production
JWT_SECRET=xxx
DISCORD_CLIENT_ID=xxx
... (all variables)
```

#### Step 4: Deploy
Click "Deploy" and wait for deployment to complete.

### Option 4: Docker Compose (Self-Hosted)

#### Step 1: Create docker-compose.yml
```yaml
version: '3.8'
services:
  api:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      JWT_SECRET: ${JWT_SECRET}
      DISCORD_CLIENT_ID: ${DISCORD_CLIENT_ID}
      # ... other variables
    restart: always
    networks:
      - tradehax
  
  nginx:
    image: nginx:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt
    depends_on:
      - api
    networks:
      - tradehax

networks:
  tradehax:
    driver: bridge
```

#### Step 2: Deploy
```bash
docker-compose up -d

# Check status
docker-compose logs -f api
```

## 🔗 Domain & SSL Configuration

### Step 1: Update DNS Records

Point your domain to your backend:

```bash
# For Heroku
# Add CNAME record:
api.tradehax.net CNAME tradehax-api.herokuapp.com

# For AWS/DigitalOcean/Self-Hosted
# Add A record:
api.tradehax.net A 1.2.3.4
```

### Step 2: SSL Certificate

#### Option A: Heroku (Automatic)
```bash
# Heroku automatically provisions SSL
heroku certs:auto:enable --app tradehax-api
```

#### Option B: Let's Encrypt
```bash
sudo certbot certonly -d api.tradehax.net

# Renew automatically
sudo certbot renew --quiet --no-self-upgrade
```

#### Option C: AWS Certificate Manager
```bash
aws acm request-certificate \
  --domain-name api.tradehax.net \
  --validation-method DNS
```

### Step 3: HTTPS Redirect

In your web server (nginx):
```nginx
server {
    listen 80;
    server_name api.tradehax.net;
    
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.tradehax.net;
    
    ssl_certificate /etc/letsencrypt/live/api.tradehax.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.tradehax.net/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🧪 Post-Deployment Testing

### 1. Health Check
```bash
curl -i https://api.tradehax.net/health
# Expected: 200 OK
```

### 2. Web3 Authentication Flow
```bash
# Get challenge
curl -X POST https://api.tradehax.net/auth/web3/challenge \
  -H "Content-Type: application/json" \
  -d '{"wallet":"YOUR_WALLET_ADDRESS"}'

# Sign challenge with wallet and verify token
```

### 3. OAuth Flow
```bash
# Test Discord OAuth
curl -i "https://api.tradehax.net/auth/oauth/discord"

# Follow redirect to Discord
# After authorization, should redirect to frontend with token
```

### 4. Rate Limiting
```bash
# Make 11 requests quickly to auth endpoint
for i in {1..11}; do
  curl -X POST https://api.tradehax.net/auth/web3/challenge \
    -H "Content-Type: application/json" \
    -d '{"wallet":"test"}' \
    -w "\nStatus: %{http_code}\n"
done

# Expect: First 10 succeed, 11th returns 429 (Too Many Requests)
```

### 5. CORS Validation
```bash
# Test CORS from allowed origin
curl -H "Origin: https://tradehax.net" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS https://api.tradehax.net/auth/web3/challenge \
  -v

# Test CORS from forbidden origin
curl -H "Origin: https://evil.com" \
  -X OPTIONS https://api.tradehax.net/auth/web3/challenge \
  -v
# Expected: 403 Forbidden
```

## 📊 Monitoring & Logging

### 1. Set Up Error Tracking

#### Sentry
```bash
npm install @sentry/node

# In server.js
import * as Sentry from '@sentry/node';
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

#### Heroku
```bash
# Built-in log drain to Papertrail
heroku addons:create papertrail --app tradehax-api

# View logs
heroku logs --tail --app tradehax-api
```

### 2. Monitor Key Metrics

Track in your monitoring dashboard:
- Request rate (req/sec)
- Error rate (%)
- Response time (ms)
- Rate limit violations
- Failed authentications

### 3. Set Up Alerts

Alert when:
- Error rate > 5%
- Response time > 1000ms
- Rate limit violations > 10/min
- Server down for > 5 minutes

## 🔄 Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
    paths: ['backend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: tradehax-api
          heroku_email: ${{ secrets.HEROKU_EMAIL }}
          appdir: "backend"
```

## 🚨 Troubleshooting

### OAuth Callback Fails

**Issue**: `Invalid state parameter`

**Solution**:
1. Verify DISCORD_STATE_KEY and GOOGLE_STATE_KEY are set
2. Check state parameter not expiring too quickly
3. Ensure time is synchronized on server

### JWT Token Rejection

**Issue**: `Invalid or expired token`

**Solution**:
1. Verify JWT_SECRET matches across environment
2. Check token expiration (7 days)
3. Verify Bearer prefix in Authorization header

### CORS Rejection

**Issue**: `CORS policy: Origin not allowed`

**Solution**:
1. Verify origin in FRONTEND_URL
2. Check allowedOrigins array includes exact domain
3. Ensure https:// scheme is used

### Database Connection Error

**Issue**: Cannot connect to database

**Solution**:
1. Verify DATABASE_URL is correct
2. Check firewall allows connection
3. Verify database user permissions

## 📞 Support

For deployment issues, check:
1. [TradeHax Documentation](https://tradehax.net/docs)
2. [Node.js Deployment Guide](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
3. [OAuth 2.0 Spec](https://tools.ietf.org/html/rfc6749)

---

**Last Updated**: 2025
**Deployment Target**: Production (`https://api.tradehax.net`)
