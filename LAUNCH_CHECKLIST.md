# ✅ TradeHax Backend - Quick Launch Checklist

## 🎯 Before Going Live

### Phase 1: Preparation (1-2 days)

- [ ] **Secrets Generation**
  ```bash
  openssl rand -base64 32  # JWT_SECRET
  openssl rand -hex 16     # Discord state key
  openssl rand -hex 16     # Google state key
  ```

- [ ] **Discord App Setup**
  - [ ] Go to https://discord.com/developers/applications
  - [ ] Create "TradeHax Production" app
  - [ ] Copy Client ID and Secret
  - [ ] Set OAuth2 Redirect URI to `https://api.tradehax.net/auth/oauth/discord/callback`
  - [ ] Verify scopes: `identify`, `email`, `guilds`

- [ ] **Google App Setup**
  - [ ] Go to https://console.cloud.google.com
  - [ ] Create project "TradeHax Production"
  - [ ] Enable Google+ API
  - [ ] Create OAuth 2.0 Web credential
  - [ ] Copy Client ID and Secret
  - [ ] Set authorized origins: `https://tradehax.net`, `https://www.tradehax.net`
  - [ ] Set redirect URI: `https://api.tradehax.net/auth/oauth/gmail/callback`

- [ ] **Environment Variables Ready**
  ```bash
  cp backend/.env.example backend/.env.production
  
  # Fill in:
  NODE_ENV=production
  JWT_SECRET=<your-secret>
  DISCORD_CLIENT_ID=<id>
  DISCORD_CLIENT_SECRET=<secret>
  GOOGLE_CLIENT_ID=<id>
  GOOGLE_CLIENT_SECRET=<secret>
  ```

### Phase 2: Code Review (1 day)

- [ ] **Security Audit**
  - [ ] Rate limiting enabled (default: 10 auth req/15 min)
  - [ ] CORS restricted to `tradehax.net` domain
  - [ ] JWT validation on protected routes
  - [ ] Input validation for wallet, tier, email
  - [ ] No secrets in code (use .env variables)
  - [ ] HTTPS enforced

- [ ] **Code Quality**
  - [ ] No console.log statements with sensitive data
  - [ ] Error messages don't leak info
  - [ ] All dependencies up-to-date (`npm audit fix`)
  - [ ] No deprecated APIs
  - [ ] TypeScript or JSDoc types (optional)

- [ ] **Documentation**
  - [ ] README.md explains setup
  - [ ] SECURITY_HARDENING.md documents security
  - [ ] DEPLOYMENT_GUIDE.md explains deployment
  - [ ] API endpoints documented
  - [ ] Environment variables documented

### Phase 3: Testing (1 day)

- [ ] **Unit Tests**
  ```bash
  npm test
  # Or manually test each endpoint
  ```

- [ ] **Integration Tests**
  - [ ] Web3 challenge/verify flow works
  - [ ] Discord OAuth complete flow
  - [ ] Gmail OAuth complete flow
  - [ ] JWT token validation
  - [ ] Rate limiting blocks excess requests
  - [ ] CORS allows correct origins
  - [ ] User creation and retrieval

- [ ] **Manual Testing**
  ```bash
  # Test health
  curl https://api.tradehax.net/health
  
  # Test Web3 challenge
  curl -X POST https://api.tradehax.net/auth/web3/challenge \
    -H "Content-Type: application/json" \
    -d '{"wallet":"YOUR_WALLET"}'
  
  # Test OAuth (open in browser)
  https://api.tradehax.net/auth/oauth/discord
  https://api.tradehax.net/auth/oauth/gmail
  ```

- [ ] **Security Testing**
  - [ ] CORS rejects unknown origins
  - [ ] Rate limiting works (>10 requests blocked)
  - [ ] Invalid JWT rejected
  - [ ] Expired challenges rejected
  - [ ] Invalid wallet format rejected
  - [ ] SQL injection attempts fail (if using DB)

### Phase 4: Infrastructure (1-2 days)

- [ ] **Deployment Platform**
  - [ ] Choose: Heroku / AWS / DigitalOcean / Docker
  - [ ] Create account and app
  - [ ] Configure environment variables
  - [ ] Set up auto-deploy from GitHub (optional)

- [ ] **Domain & SSL**
  - [ ] DNS CNAME/A record points to backend
  - [ ] `api.tradehax.net` resolves correctly
  - [ ] SSL certificate installed (Let's Encrypt or ACM)
  - [ ] HTTPS redirect enabled
  - [ ] HSTS header set (after 30 days)

- [ ] **Monitoring**
  - [ ] Error tracking (Sentry) configured
  - [ ] Log aggregation (CloudWatch / LogRocket)
  - [ ] Uptime monitoring enabled
  - [ ] Alerts set up for critical errors

### Phase 5: Go Live (1 day)

- [ ] **Pre-Launch Verification**
  ```bash
  # Test all endpoints one final time
  curl https://api.tradehax.net/health              # Should: 200 OK
  curl https://api.tradehax.net/auth/oauth/discord # Should: Redirect to Discord
  curl https://api.tradehax.net/auth/oauth/gmail   # Should: Redirect to Google
  ```

- [ ] **Frontend Configuration**
  - [ ] Update `script.js` to use `https://api.tradehax.net`
  - [ ] Remove localhost references
  - [ ] Update OAuth redirect expectations
  - [ ] Test OAuth flows from frontend
  - [ ] Deploy frontend to GitHub Pages

- [ ] **Final Checks**
  - [ ] Backend responding from production domain
  - [ ] Frontend can reach backend API
  - [ ] Web3 wallet connection works
  - [ ] Discord login works end-to-end
  - [ ] Gmail login works end-to-end
  - [ ] Error handling doesn't leak secrets

- [ ] **Post-Launch**
  - [ ] Monitor error logs (first 24 hours)
  - [ ] Check rate limiting metrics
  - [ ] Verify user authentication working
  - [ ] Test on multiple browsers/devices
  - [ ] Announce on social media

## 📋 Daily Operations Checklist

### Daily (5 min)
- [ ] Check uptime status: `curl https://api.tradehax.net/health`
- [ ] Review error logs in monitoring dashboard
- [ ] Check for rate limit violations

### Weekly (15 min)
- [ ] Review authentication logs
- [ ] Check dependency updates (`npm outdated`)
- [ ] Verify SSL certificate expiry
- [ ] Check database performance (if applicable)

### Monthly (30 min)
- [ ] Rotate secrets (JWT_SECRET, OAuth keys)
- [ ] Update dependencies (`npm update`)
- [ ] Run security audit (`npm audit`)
- [ ] Review user growth and tier distribution
- [ ] Backup user data (if database)

### Quarterly (1-2 hours)
- [ ] Full security audit
- [ ] Performance review and optimization
- [ ] Disaster recovery test
- [ ] Update documentation if needed

## 🚨 Emergency Procedures

### If Backend is Down
```bash
# Check status
heroku status

# Restart app
heroku restart --app tradehax-api

# Check logs
heroku logs --tail --app tradehax-api

# Rollback if needed
heroku releases --app tradehax-api
heroku rollback v123 --app tradehax-api
```

### If JWT_SECRET is Exposed
```bash
# Immediately rotate secret
heroku config:set JWT_SECRET=$(openssl rand -base64 32) --app tradehax-api

# Force all users to re-authenticate
# (Optional: clear all existing tokens in database)

# Monitor for unauthorized access
```

### If OAuth Credentials are Leaked
```bash
# Regenerate in provider dashboard
# Discord: https://discord.com/developers/applications
# Google: https://console.cloud.google.com

# Update environment variables
heroku config:set DISCORD_CLIENT_SECRET=xxx --app tradehax-api
heroku config:set GOOGLE_CLIENT_SECRET=xxx --app tradehax-api

# Restart server
heroku restart --app tradehax-api
```

## 📊 Success Metrics

After launch, track these KPIs:

| Metric | Target | Tool |
|--------|--------|------|
| Uptime | >99.9% | Uptime robot |
| Response Time | <500ms | Datadog / New Relic |
| Error Rate | <1% | Sentry |
| Auth Success Rate | >95% | Custom logging |
| Rate Limit Violations | <5/day | API logs |
| User Signups | | Google Analytics |

## 🎉 Launch Complete!

Once you've verified everything:

1. **Celebrate!** 🎊
2. **Update docs** with production URLs
3. **Announce** to users (social media, email)
4. **Monitor** closely first week
5. **Iterate** based on feedback

---

## Quick Reference

### Production URLs
- **Frontend**: `https://tradehax.net`
- **Backend**: `https://api.tradehax.net`
- **Health Check**: `https://api.tradehax.net/health`

### Key Files
- `.env.production` - Environment variables (NEVER commit)
- `backend/server.js` - API server code
- `backend/SECURITY_HARDENING.md` - Security documentation
- `backend/DEPLOYMENT_GUIDE.md` - Detailed deployment steps

### Support Channels
- GitHub Issues: Bug reports
- Email: contact@tradehax.net (optional)
- Discord: Community support

### Estimated Timeline
- **Preparation**: 1-2 days
- **Code Review**: 1 day
- **Testing**: 1 day
- **Infrastructure**: 1-2 days
- **Go Live**: 1 day
- **Total**: 5-7 days

---

**Last Updated**: 2025
**Status**: Ready for production deployment
**Questions?** Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) or [SECURITY_HARDENING.md](./SECURITY_HARDENING.md)
