# TradeHax Backend - Security Hardening Guide

## Overview

This document outlines the security measures implemented in the TradeHax backend and deployment best practices.

## 🔒 Implemented Security Features

### 1. Authentication & Authorization

#### Web3 (Solana Wallet) Authentication
- ✅ **Challenge-Response Signing**: Users sign a timestamped challenge
- ✅ **Timestamp Validation**: Challenges expire after 10 minutes
- ✅ **Message Verification**: Signatures verified using nacl.sign.detached.verify()
- ✅ **Nonce Inclusion**: Each challenge includes a random nonce for integrity

#### OAuth (Discord & Gmail)
- ✅ **CSRF Protection**: State parameter validated on callback
- ✅ **State Expiration**: OAuth states expire after 10 minutes
- ✅ **State Reuse Prevention**: States deleted after first use
- ✅ **Secure Token Exchange**: Server-side token exchange (no client exposure)

#### JWT (JSON Web Tokens)
- ✅ **Algorithm**: HS256 (HMAC with SHA-256)
- ✅ **Expiration**: 7-day token lifetime
- ✅ **Signature Verification**: Every endpoint validates JWT signature
- ✅ **Claims**: Include user ID, tier, auth method, issued-at timestamp

### 2. Input Validation

```javascript
// Wallet Address Validation
- Solana: 44 base58 characters
- Social: "provider-id" format (discord-123, google-456)

// Tier Validation
- Allowed: 'free', 'premium', 'vip'
- Rejects: invalid or malicious values

// Email Validation
- RFC 5322 compliant patterns
- Whitespace trimming and normalization
```

### 3. Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Auth endpoints | 10 req | 15 min |
| OAuth callbacks | 5 req | 1 min |
| General endpoints | 100 req | 15 min |

**Implementation**:
```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true // Don't count successful auth
});
```

### 4. CORS Security

```javascript
const allowedOrigins = [
  'https://tradehax.net',
  'https://www.tradehax.net',
  'http://localhost:3000' // Dev only
];

// Enforce:
- credentials: true (allows cookies)
- Specific methods: GET, POST, OPTIONS
- Specific headers: Content-Type, Authorization
```

### 5. HTTP Security Headers

```javascript
X-Content-Type-Options: nosniff           // Prevent MIME sniffing
X-Frame-Options: DENY                     // Prevent clickjacking
X-XSS-Protection: 1; mode=block          // Legacy XSS protection
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self'
```

### 6. Environment Variables

**Critical Secrets** (never commit to git):
```
JWT_SECRET                 - Token signing key
DISCORD_CLIENT_SECRET      - OAuth credential
GOOGLE_CLIENT_SECRET       - OAuth credential
DISCORD_BOT_TOKEN          - Bot authentication
```

**Configuration**:
```
.env                       - Local development only
.env.example              - Template with placeholders
.env.production            - Production secrets (secure storage)
```

## 🚀 Production Deployment

### Pre-Deployment Checklist

- [ ] **Secrets Management**
  ```bash
  # Generate secure JWT_SECRET
  openssl rand -base64 32
  
  # Store in secure environment:
  # - AWS Secrets Manager
  # - Azure Key Vault
  # - Heroku Config Vars
  # - Vercel Environment Variables
  ```

- [ ] **Database Migration** (if applicable)
  ```javascript
  // Migrate from Map to PostgreSQL
  // Implement connection pooling
  // Add database encryption
  ```

- [ ] **Domain & HTTPS**
  ```
  - BACKEND_URL=https://api.tradehax.net
  - FRONTEND_URL=https://tradehax.net
  - Valid SSL certificate
  - HSTS enabled
  ```

- [ ] **OAuth App Registration**
  
  **Discord**:
  1. Go to https://discord.com/developers/applications
  2. Create "TradeHax Production" app
  3. Set OAuth2 Redirect: `https://api.tradehax.net/auth/oauth/discord/callback`
  4. Verify scopes: `identify`, `email`, `guilds`
  
  **Google**:
  1. Go to https://console.cloud.google.com
  2. Create project "TradeHax Production"
  3. Enable Google+ API
  4. Create OAuth 2.0 credential (Web)
  5. Set Redirect URI: `https://api.tradehax.net/auth/oauth/gmail/callback`

- [ ] **API Configuration**
  ```javascript
  NODE_ENV=production
  PORT=3001
  
  // Enable all security features
  ENABLE_RATE_LIMITING=true
  ENABLE_CORS_ORIGIN_CHECK=true
  ENABLE_SECURE_HEADERS=true
  ```

- [ ] **Monitoring & Logging**
  ```javascript
  // Set up error tracking
  SENTRY_DSN=https://key@sentry.io/...
  
  // Configure logging
  LOG_LEVEL=info
  
  // Monitor these events:
  - Failed login attempts
  - Rate limit violations
  - Invalid token signatures
  - CORS rejections
  ```

### Deployment Steps

#### Option 1: Heroku

```bash
# Create app
heroku create tradehax-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set DISCORD_CLIENT_ID=xxx
heroku config:set DISCORD_CLIENT_SECRET=xxx
# ... continue with other variables

# Deploy
git push heroku main

# Verify
curl https://tradehax-api.herokuapp.com/health
```

#### Option 2: AWS Lambda + API Gateway

```javascript
// Wrap Express app with serverless adapter
const serverless = require('serverless-http');
module.exports.handler = serverless(app);
```

#### Option 3: Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001
CMD ["node", "server.js"]
```

```bash
# Build and push
docker build -t tradehax-api .
docker push registry.example.com/tradehax-api

# Deploy with environment variables
docker run \
  -e NODE_ENV=production \
  -e JWT_SECRET=xxx \
  -e DISCORD_CLIENT_ID=xxx \
  -p 3001:3001 \
  tradehax-api
```

## 🛡️ Runtime Security

### Monitoring & Alerting

**Events to monitor**:
```javascript
// High priority
- Multiple failed login attempts (>5 in 15 min)
- Invalid JWT signature attempts
- CORS rejections from unknown origins
- Rate limit violations

// Medium priority
- Expired challenge tokens
- Invalid wallet address formats
- Missing OAuth credentials

// Low priority
- Successful logins
- Tier updates
- Health check pings
```

### Log Sanitization

```javascript
// NEVER log these values:
- JWT_SECRET
- OAuth secrets
- User passwords
- Private keys
- Credit card numbers

// DO log these:
- User ID (anonymized wallet address)
- Auth method (web3, discord, gmail)
- Timestamp
- IP address (with GDPR consent)
- Error type and message (sanitized)
```

### Incident Response

**If JWT_SECRET is compromised**:
1. Immediately rotate the secret
2. Invalidate all existing tokens
3. Force users to re-authenticate
4. Audit logs for unauthorized access

**If OAuth secret is exposed**:
1. Regenerate credential in provider dashboard
2. Update environment variable
3. Restart API server
4. Monitor for abuse

## 📊 Security Testing

### Manual Testing Checklist

```bash
# 1. Test authentication flows
curl -X POST http://localhost:3001/auth/web3/challenge \
  -H "Content-Type: application/json" \
  -d '{"wallet": "YOUR_WALLET_ADDRESS"}'

# 2. Test JWT validation
curl -H "Authorization: Bearer INVALID_TOKEN" \
  http://localhost:3001/user/YOUR_WALLET

# 3. Test CORS rejection
curl -H "Origin: https://evil.com" \
  -X OPTIONS http://localhost:3001/health

# 4. Test rate limiting
for i in {1..15}; do
  curl http://localhost:3001/auth/web3/challenge \
    -H "Content-Type: application/json" \
    -d '{"wallet": "test"}'
done

# 5. Test input validation
curl -X POST http://localhost:3001/user/INVALID_WALLET/tier \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tier": "hacker"}'
```

### Automated Testing

```javascript
// test/security.test.js
describe('Security', () => {
  it('rejects invalid JWT', async () => {
    const res = await request(app)
      .get('/user/invalid-wallet')
      .set('Authorization', 'Bearer invalid');
    expect(res.status).toBe(401);
  });

  it('validates wallet address format', async () => {
    const res = await request(app)
      .post('/auth/web3/challenge')
      .send({ wallet: 'invalid-address' });
    expect(res.status).toBe(400);
  });

  it('prevents CORS from untrusted origins', async () => {
    const res = await request(app)
      .options('/health')
      .set('Origin', 'https://evil.com');
    expect(res.status).toBe(403);
  });
});
```

## 🔍 Common Vulnerabilities & Mitigations

| Vulnerability | Mitigation |
|---|---|
| SQL Injection | Parameterized queries (when using DB) |
| XSS | Content-Security-Policy header |
| CSRF | State parameter in OAuth flow |
| Brute Force | Rate limiting + account lockout |
| Man-in-the-Middle | HTTPS + HSTS header |
| Token Hijacking | Secure HttpOnly cookies |
| Expired Challenges | 10-minute expiration enforced |
| JWT Forgery | HMAC signature verification |

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/Top10/)
- [Node.js Security Checklist](https://nodejs.org/en/docs/guides/security/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)

## 🚨 Security Incident Reporting

If you discover a security vulnerability, please email `security@tradehax.net` instead of creating a public issue.

Include:
- Vulnerability description
- Steps to reproduce
- Impact assessment
- Suggested fix (if available)

---

**Last Updated**: 2025
**Maintained By**: TradeHax Security Team
