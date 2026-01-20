# TradeHax - Full Stack Integration Summary

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│              https://tradehax.net (Static)                   │
│  - HTML5 + Tailwind CSS + Vanilla JS + GSAP                 │
│  - Web3 wallet connection (Phantom, Solflare)               │
│  - OAuth buttons (Discord, Gmail)                            │
│  - GitHub Pages hosting                                      │
└─────────────────────────────────────────────────────────────┘
                          │
                    JWT (Bearer Token)
                          │
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                       Backend API                            │
│           https://api.tradehax.net (Node.js)                │
│  - Express server with CORS, rate limiting, JWT auth        │
│  - Web3: Challenge-Response signing (Solana)                │
│  - OAuth: Discord & Gmail social login                      │
│  - User management: Tiers (free/premium/vip)                │
│  - Discord bot integration (role assignment)                │
│  - Security: Input validation, CSRF protection              │
└─────────────────────────────────────────────────────────────┘
                          │
    ┌─────────────────────┼─────────────────────┐
    │                     │                     │
    ↓                     ↓                     ↓
┌─────────────┐  ┌────────────────┐  ┌────────────────┐
│  Discord    │  │   Google/Gmail │  │  Solana Block- │
│  OAuth API  │  │   OAuth API     │  │  chain (RPC)   │
└─────────────┘  └────────────────┘  └────────────────┘

Optional:
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│  (Replace in-memory Map for production data persistence)    │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Frontend Integration Points

### 1. Web3 Wallet Connection
**File**: [script.js](../script.js#L450-L550)

```javascript
// User clicks "Connect Wallet" button
walletBtn.addEventListener('click', async () => {
  const provider = window.solana; // Phantom, Solflare, etc.
  const res = await provider.connect();
  markConnected(res.publicKey);
});

// Request authentication challenge
const challenge = await fetch('https://api.tradehax.net/auth/web3/challenge', {
  method: 'POST',
  body: JSON.stringify({ wallet: publicKey.toString() })
});

// Sign challenge with wallet
const signature = await provider.signMessage(challenge);

// Send signature to backend for verification
const token = await fetch('https://api.tradehax.net/auth/web3/verify', {
  method: 'POST',
  body: JSON.stringify({ wallet, signature, challenge })
});
```

### 2. OAuth Login (Discord)
**File**: [about.html](../about.html) + [script.js](../script.js)

```html
<a href="https://api.tradehax.net/auth/oauth/discord" 
   class="btn btn-discord">
  Sign in with Discord
</a>
```

**Flow**:
1. User clicks link → redirects to `api.tradehax.net/auth/oauth/discord`
2. Backend generates state, redirects to Discord OAuth
3. User authorizes on Discord
4. Discord redirects back: `api.tradehax.net/auth/oauth/discord/callback?code=...&state=...`
5. Backend exchanges code for token, creates user, generates JWT
6. Backend redirects to frontend with JWT in URL hash
7. Frontend stores token in localStorage, user logged in

### 3. JWT Token Management
**File**: [script.js](../script.js#L400-L430)

```javascript
// Store token after OAuth redirect
const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
localStorage.setItem('tradehax_token', token);

// Send token with authenticated requests
const response = await fetch('https://api.tradehax.net/user/wallet-address', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('tradehax_token')}`
  }
});
```

### 4. Floating CTA Mobile Optimization
**File**: [index.html](../index.html#L150) + [enhancements.css](../assets/enhancements.css#L200)

```html
<a href="#estimate" id="floatingCTA" class="md:hidden">
  💡 Estimate
</a>
```

- **Hidden on desktop**: `md:hidden` (Tailwind)
- **Visible on mobile**: Shows sticky button
- **Smart hide**: Uses IntersectionObserver to hide when user scrolls to estimate section

## 🔐 Backend Security Implementation

### 1. Web3 Authentication
**File**: [server.js](./server.js#L150-L200)

```javascript
// 1. Challenge Generation
POST /auth/web3/challenge
- Input: { wallet }
- Output: { challenge, nonce, timestamp }
- Security: Timestamp-based challenge expires after 10 minutes

// 2. Signature Verification
POST /auth/web3/verify
- Input: { wallet, signature, challenge }
- Verify: nacl.sign.detached.verify(signature, message, publicKey)
- Output: { token: JWT }
```

**Why secure**:
- ✅ User never shares private key
- ✅ Signature proves wallet ownership
- ✅ Timestamp prevents replay attacks
- ✅ One-time challenge per request

### 2. OAuth Flow with CSRF Protection
**File**: [server.js](./server.js#L210-L300)

```javascript
// 1. Generate state (anti-CSRF)
GET /auth/oauth/discord
- Generate: state = crypto.randomBytes(16).toString('hex')
- Store: states.set(state, Date.now())
- Redirect to Discord with state parameter

// 2. Verify state on callback
GET /auth/oauth/discord/callback?code=...&state=...
- Validate: states.has(state) and state not expired
- Delete state: states.delete(state) (prevent reuse)
- Exchange code for access token
- Fetch user info
- Create/update user in database
- Generate JWT
- Redirect to frontend with JWT
```

**Why secure**:
- ✅ State parameter proves callback origin
- ✅ State expires after 10 minutes
- ✅ State can only be used once
- ✅ Server-side token exchange (not exposed to client)

### 3. JWT Token Validation
**File**: [server.js](./server.js#L90-L110)

```javascript
// JWT Middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = authHeader.substring(7);
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Applied to protected endpoints
app.get('/user/:wallet', verifyToken, (req, res) => {
  // req.user contains verified claims
});
```

**Why secure**:
- ✅ HS256 signature verification
- ✅ 7-day expiration
- ✅ Claims include user ID and auth method
- ✅ Invalid/expired tokens rejected

### 4. Rate Limiting
**File**: [server.js](./server.js#L60-L80)

```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // 10 requests
  skipSuccessfulRequests: true // Don't count successful auth
});

app.use('/auth/', authLimiter);
```

**Rate Limits**:
| Endpoint | Limit | Window |
|----------|-------|--------|
| Auth | 10 | 15 min |
| OAuth | 5 | 1 min |
| General | 100 | 15 min |

### 5. CORS Security
**File**: [server.js](./server.js#L32-L50)

```javascript
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://tradehax.net',
      'https://www.tradehax.net'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: Origin not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS']
};
```

### 6. Input Validation
**File**: [server.js](./server.js#L120-L140)

```javascript
// Wallet validation
const isValidWalletAddress = (wallet) => {
  // Solana: 44 base58 chars
  if (wallet.length === 44 && /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/.test(wallet)) {
    return true;
  }
  // Social: provider-id format
  if (wallet.startsWith('discord-') || wallet.startsWith('google-')) {
    return true;
  }
  return false;
};

// Tier validation
const isValidTier = (tier) => ['free', 'premium', 'vip'].includes(tier);
```

## 🚀 User Journey

### Scenario 1: New User - Web3 Login

```
User                          Frontend                     Backend
│                               │                            │
├─ Click "Connect Wallet"       │                            │
│                               ├─ Request challenge ────────>
│                               │                    Generate challenge
│                               <─────── { challenge, nonce } ─┤
│                               │                            │
├─ Approve sign in Phantom      │                            │
│                               │                            │
├─ Sign message in Phantom      │                            │
│                               ├─ Send signature ──────────>
│                               │                    Verify signature
│                               <───── { token: JWT } ──────┤
│                               │                            │
├─ Logged in! ✅               │                    Create user
│                               │                    in-memory Map
```

**Result**:
- User created with wallet address
- Tier: "free"
- Token stored in localStorage
- Can call `/user/:wallet` to fetch profile

### Scenario 2: Existing User - Discord Login

```
User                  Frontend                       Backend
│                       │                              │
├─ Click Discord btn     │                              │
│                       ├─ Redirect to Discord ──────>
│                       │  with OAuth URL              │
│                       │                              │
│ (Authorize on Discord)│                              │
│                       │<─ Redirect with code ────────┤
│                       │                    Exchange code
│                       │                    Get Discord user
│                       │                    Create/update user
│                       │<─ JWT in URL hash ──────────┤
│                       │                              │
├─ Logged in! ✅       │                              │
```

**Result**:
- User linked to Discord ID
- Tier: "free" or existing tier if returning user
- Token stored in localStorage
- Can use `/user` endpoints with JWT

### Scenario 3: Authenticated Request

```
User              Frontend                  Backend
│                   │                          │
├─ Request estimate  │                         │
│                   ├─ GET /estimate ────────>
│                   │ Header: Authorization:  │
│                   │ Bearer <JWT>            │
│                   │                  Verify JWT
│                   │                  Extract user claims
│                   │                  Check tier
│                   │                  Apply rate limit
│                   <─── { estimate } ────────┤
│                   │                          │
├─ See estimate     │                         │
```

## 📊 Database Schema (When Using PostgreSQL)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet VARCHAR(255) UNIQUE,
  discord_id VARCHAR(255) UNIQUE,
  google_id VARCHAR(255) UNIQUE,
  email VARCHAR(255),
  tier VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  login_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'
);

-- Authentication log
CREATE TABLE auth_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  method VARCHAR(50), -- 'web3', 'discord', 'google'
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rate limit tracking
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET,
  endpoint VARCHAR(255),
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔄 Deployment Flow

```
Local Development
├─ npm run dev (frontend + backend)
├─ Test Web3, OAuth, rate limiting
└─ Verify CORS, JWT, input validation

        ↓

Staging Deployment (optional)
├─ Deploy to staging environment
├─ Test with real Discord/Google apps
└─ Verify SSL, DNS, monitoring

        ↓

Production Deployment
├─ GitHub Actions: Push to main → Deploy to Heroku/AWS/DigitalOcean
├─ Set environment variables
├─ Create SSL certificate (Let's Encrypt)
├─ Configure DNS (CNAME/A record)
└─ Run post-deployment tests

        ↓

Monitor & Maintain
├─ Watch error logs (Sentry)
├─ Monitor rate limits and performance
├─ Rotate secrets periodically
└─ Update dependencies monthly
```

## 🎯 Key Files Reference

| File | Purpose | Key Functions |
|------|---------|---------------|
| [index.html](../index.html) | Main landing page | Web3 wallet connection, estimate calculator, affiliate links |
| [script.js](../script.js) | Frontend logic | OAuth token handling, wallet connection, matrix animation |
| [backend/server.js](./server.js) | API server | Authentication endpoints, user management, security middleware |
| [backend/.env.example](./backend/.env.example) | Config template | OAuth credentials, JWT secret, database URL |
| [SECURITY_HARDENING.md](./SECURITY_HARDENING.md) | Security guide | Authentication flows, vulnerability mitigation |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Deployment docs | Heroku, AWS, Docker, SSL setup |

## 🧪 Testing Checklist

```bash
# Frontend tests
- [ ] Web3 wallet connect works
- [ ] Discord OAuth flow completes
- [ ] Gmail OAuth flow completes
- [ ] JWT token stored in localStorage
- [ ] Authenticated requests include JWT

# Backend tests
- [ ] /health returns 200
- [ ] /auth/web3/challenge generates valid challenge
- [ ] /auth/web3/verify validates signature
- [ ] /auth/oauth/discord/callback creates user
- [ ] /auth/oauth/gmail/callback creates user
- [ ] Rate limiting blocks >10 auth requests
- [ ] CORS rejects unknown origins
- [ ] Protected endpoints require JWT

# Integration tests
- [ ] User can signup with Web3
- [ ] User can login with Discord
- [ ] User can login with Gmail
- [ ] User profile accessible after login
- [ ] Tier system works (free/premium/vip)
- [ ] Discord role assignment queued
```

## 📞 Support & Troubleshooting

**Common Issues**:
1. OAuth redirect mismatch → Check BACKEND_URL and OAuth app settings
2. JWT token rejected → Verify JWT_SECRET in .env
3. CORS blocked → Check allowedOrigins includes your domain
4. Rate limit triggered → Wait 15 minutes or use different IP

**Getting Help**:
- Check [SECURITY_HARDENING.md](./SECURITY_HARDENING.md) for security issues
- Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for deployment issues
- Check [server.js](./server.js) comments for endpoint details
- Check browser console for client-side errors
- Check `heroku logs --tail` for server-side errors

---

**Status**: ✅ Production Ready
**Last Updated**: 2025
**Maintained By**: TradeHax Team
