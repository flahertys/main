# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in TradeHax, please email security@tradehax.net with:

- Description of the vulnerability
- Affected components (frontend, backend, main site)
- Steps to reproduce (if applicable)
- Potential impact

Do **not** open public GitHub issues for security vulnerabilities.

---

## Security Status

### ✅ Frontend (tradehax-frontend)
- **Status:** Secure
- **Vulnerabilities:** 0
- **Last Audit:** December 29, 2025
- **Next Audit:** Automatic via GitHub Actions

### ✅ Main Site (shamrockstocks.github.io)
- **Status:** Secure
- **Vulnerabilities:** 0
- **Last Audit:** December 29, 2025

### ⚠️ Backend (tradehax-backend)
- **Status:** Safe for Development/Devnet
- **Vulnerabilities:** 13 (known legacy NFT ecosystem issues)
- **Last Audit:** December 29, 2025
- **Details:** See `SECURITY_AUDIT_REPORT_2025.md`
- **Recommendation:** Do not deploy to mainnet without additional hardening

---

## Security Measures

### Code
- ✅ Input validation on all user submissions
- ✅ Environment variables for secrets
- ✅ No hardcoded credentials
- ✅ CORS properly configured
- ✅ HTTPS only in production

### Dependencies
- ✅ Automated npm audit checks
- ✅ Regular security updates
- ✅ Lock files committed
- ✅ Node engine version pinned

### API
- ✅ No sensitive data in logs
- ✅ Proper HTTP status codes
- ✅ Error messages don't expose internals
- ✅ Wallet validation on all endpoints

### Data
- ⚠️ Optional MongoDB for task history
- ✅ No personal information stored
- ✅ Transaction signatures public (blockchain design)
- ✅ Temporary file uploads cleaned up

---

## Supported Versions

### Node.js
- **Backend:** 18.x (required)
- **Frontend:** 18+ (recommended 20+)
- **Main Site:** No Node.js (static HTML)

### npm
- **Minimum:** 9.0.0
- **Recommended:** Latest LTS

---

## Known Issues

### Backend Legacy Vulnerabilities

The backend has 13 known vulnerabilities from deprecated Solana NFT ecosystem packages:

**Affected Packages:**
- @metaplex-foundation/js (deprecated)
- crypto-js < 4.2.0 (weak PBKDF2)
- axios <= 0.30.1 (CSRF, DoS)
- bigint-buffer (buffer overflow risk)

**Mitigation:**
- Only used for devnet NFT minting
- No upstream patches available
- Isolated from production blockchain

**For Mainnet:** Additional security hardening required

See `SECURITY_AUDIT_REPORT_2025.md` for full details.

---

## Deployment Security Checklist

### Frontend (GitHub Pages)
- [ ] HTTPS enabled (automatic via GitHub)
- [ ] CSP headers configured
- [ ] Dependencies up to date
- [ ] npm audit shows 0 vulnerabilities
- [ ] Environment variables not in code

### Backend (Vercel/Production)
- [ ] Environment variables set in Vercel Dashboard
- [ ] SHAMROCK_MINT verified correct
- [ ] AUTHORITY_SECRET stored securely
- [ ] Rate limiting implemented
- [ ] CORS configured to trusted origins
- [ ] Request logging enabled
- [ ] Incident response plan documented
- [ ] npm audit resolved (frontend: 0 vulns)

### Main Site (GitHub Pages)
- [ ] HTTPS enabled (automatic via GitHub)
- [ ] CSP headers configured
- [ ] Dependencies up to date
- [ ] No sensitive data in HTML/JS

---

## Security Best Practices for Users

### For Users of the Game
- ✅ Only play on devnet (test network)
- ✅ Don't share your wallet seed phrase
- ✅ Use test wallets (Phantom devnet mode)
- ✅ Verify URLs before connecting wallets
- ✅ Don't grant apps more permissions than needed

### For Developers
- ✅ Store secrets in `.env` (not in code)
- ✅ Use `npm audit` regularly
- ✅ Keep dependencies updated
- ✅ Review dependency changes
- ✅ Use git commit signing

### For DevOps
- ✅ Enable two-factor authentication (GitHub, Vercel)
- ✅ Rotate credentials regularly
- ✅ Monitor API logs for suspicious activity
- ✅ Set up alerts for failed deployments
- ✅ Test backup/recovery procedures

---

## Future Security Roadmap

### Q1 2026
- [ ] Monitor @metaplex-foundation/js for updates
- [ ] Evaluate alternative NFT minting libraries
- [ ] Implement API rate limiting
- [ ] Add request signing verification

### Q2 2026
- [ ] Third-party security audit
- [ ] Complete dependency audit
- [ ] Implement monitoring/alerting
- [ ] Security training for team

### Q3+ 2026
- [ ] Migrate from deprecated Metaplex library
- [ ] Full mainnet security hardening
- [ ] Upgrade to crypto-js 4.2+
- [ ] Replace legacy dependencies

---

## Contact

**Security Email:** security@tradehax.net  
**Security Reports:** Private disclosure preferred  
**Response Time:** 48-72 hours  

---

## References

- [GitHub Security Advisories](https://github.com/advisories)
- [OWASP Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Solana Security Guide](https://docs.solana.com/security)
- [Node.js Security](https://nodejs.org/en/docs/guides/security/)
- [npm Security](https://docs.npmjs.com/security)

---

**Last Updated:** December 29, 2025  
**Next Review:** January 29, 2026
