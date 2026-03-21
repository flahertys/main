# Final Production Deployment Checklist

**Date:** 2025-01-24  
**Status:** Ready for Production  
**Estimated time:** 15-20 minutes  

---

## ✅ Pre-Deployment (Already Complete)

- [x] Both domains live (tradehax.net + tradehaxai.tech)
- [x] Frontend responding (HTTP 200)
- [x] API endpoints accessible
- [x] Multi-project setup working
- [x] Build process optimized (79.87 kB gzipped)
- [x] All credentials provided
- [x] Environment template created

---

## 🔧 Setup Phase (Next 15 minutes)

### Step 1: Access Vercel Environment Dashboard
```
[ ] Go to https://vercel.com/tradehax
[ ] Select project: tradehax-net
[ ] Navigate to Settings → Environment Variables
[ ] Scope: Production
```

### Step 2: Add Block 1 - Core & Auth
```
[ ] NEXT_PUBLIC_SITE_URL=https://tradehax.net
[ ] NEXTAUTH_SECRET=AiCrU9PAiKzxF12ZI6wGzDvTSWvTrSsdYsVgSQXRPtMtJXq6YZpbqwG+jxro3SIQ
[ ] JWT_SECRET=qIqOT/1A2i/eJcDhhA4sp3ZR+SknWwlK0zk6yDZ/2u2kr6Jy+NMCNd7NI+nsbep6
[ ] TRADEHAX_ADMIN_KEY=rPX3H9L2/f2K9vkNOxc/TbiRonyjywA1Yk0+Nlig0rLXuTk/QtdU7w==
[ ] TRADEHAX_SUPERUSER_CODE=Jed5k6NwtjHlYXLhvZQpy3FunrA2DxqoiKGM
```

### Step 3: Add Block 2 - HuggingFace (Primary AI)
```
[ ] HUGGINGFACE_API_KEY=hf_your_token_here
[ ] HF_API_TOKEN=hf_your_token_here
[ ] HF_API_TOKEN_REICH=hf_your_token_here
[ ] HF_API_TOKEN_ALT1=hf_your_alt_token_1_here
[ ] HF_API_TOKEN_ALT2=hf_your_alt_token_2_here
[ ] HF_API_TOKEN_ALT3=hf_your_alt_token_3_here
[ ] HF_MODEL_ID=Qwen/Qwen2.5-7B-Instruct
```

### Step 4: Add Block 3 - OpenAI (Fallback)
```
[ ] OPENAI_API_KEY=sk-your_openai_key_here
[ ] TRADEHAX_OPENAI_ADMIN_KEY=sk-your_admin_key_here
[ ] GROQ_API_KEY=gsk_your_groq_key_here
```

### Step 5: Add Block 4 - Market Data APIs
```
[ ] ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here
[ ] FINNHUB_API_KEY=your_finnhub_key_here
[ ] VITE_ALPHA_VANTAGE_KEY=your_alpha_vantage_key_here
[ ] REACT_APP_ALPHA_VANTAGE_KEY=your_alpha_vantage_key_here
```

### Step 6: Add Block 5 - File Storage (Massive.com)
```
[ ] MASSIVE_ACCESS_KEY=your_massive_access_key_here
[ ] MASSIVE_BUCKET=tradehax
[ ] MASSIVE_S3_ENDPOINT=https://files.massive.com
[ ] VITE_MASSIVE_ACCESS_KEY=your_massive_access_key_here
[ ] VITE_MASSIVE_S3_ENDPOINT=https://files.massive.com
[ ] VITE_MASSIVE_BUCKET=tradehax
[ ] REACT_APP_MASSIVE_ACCESS_KEY=your_massive_access_key_here
[ ] REACT_APP_MASSIVE_S3_ENDPOINT=https://files.massive.com
[ ] REACT_APP_MASSIVE_BUCKET=tradehax
```

### Step 7: Add Block 6 - Contact Information
```
[ ] NEXT_PUBLIC_CONTACT_EMAIL=irishmikeflaherty@gmail.com
[ ] NEXT_PUBLIC_CONTACT_PHONE_E164=+18563208570
[ ] NEXT_PUBLIC_CONTACT_PHONE_DISPLAY=(856) 320-8570
[ ] NEXT_PUBLIC_EMERGENCY_PHONE_E164=+16094128878
[ ] NEXT_PUBLIC_EMERGENCY_PHONE_DISPLAY=(609) 412-8878
[ ] NEXT_PUBLIC_CASHAPP_TAG=$hackavelli88
```

### Step 8: Add Block 7 - Web3
```
[ ] NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
[ ] NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com
[ ] NEXT_PUBLIC_CLAIM_API_BASE=https://tradehax.net/api/claim
```

### Step 9: Repeat for tradehaxai-tech Project
```
[ ] Switch to tradehaxai-tech project in Vercel
[ ] Repeat steps 1-8 for second project
[ ] Use NEXT_PUBLIC_SITE_URL=https://tradehaxai.tech for that project
```

---

## 🚀 Deployment Phase

### Step 10: Redeploy Both Projects
```bash
[ ] npm run deploy:tech    # Deploy tradehaxai.tech
[ ] npm run deploy:net     # Deploy tradehax.net

# Or from command line:
[ ] cd web
[ ] npm run deploy:tech && npm run deploy:net
```

**Expected output:**
```
✅ Production: https://web-dcqbo7c40-digitaldynasty.vercel.app
🔗 Aliased: https://tradehaxai.tech

✅ Production: https://web-c8nv6da7e-digitaldynasty.vercel.app
🔗 Aliased: https://tradehax.net
```

---

## ✅ Verification Phase

### Step 11: Health Checks
```bash
[ ] curl https://tradehax.net/api/health
[ ] curl https://tradehaxai.tech/api/health

# Expected: 200 OK with environment status
```

### Step 12: AI Provider Status
```bash
[ ] curl https://tradehax.net/api/ai/health | jq .

# Expected:
# {
#   "status": "ok",
#   "providers": [
#     {"name": "huggingface", "reachable": true},
#     {"name": "openai", "reachable": true},
#     {"name": "demo", "reachable": true}
#   ]
# }
```

### Step 13: Test AI Response
```bash
[ ] curl -X POST https://tradehax.net/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role":"user","content":"analyze BTC"}]}'

# Expected: Structured trading analysis from HuggingFace Qwen model
```

### Step 14: Verify All Endpoints
```bash
[ ] curl https://tradehax.net/api/data/crypto?symbol=BTC
    # Expected: Crypto price data

[ ] curl https://tradehax.net/api/account/profile -H "Authorization: Bearer user123"
    # Expected: 404 or profile response

[ ] curl -X POST https://tradehax.net/api/sessions?action=create
    # Expected: New session ID
```

---

## 🎯 Final Checks

### Security
- [ ] All keys properly scoped to Production
- [ ] No keys exposed in logs
- [ ] CORS headers correct
- [ ] SSL certificates valid

### Performance
- [ ] Build size normal (79.87 kB gzipped)
- [ ] Response times < 500ms
- [ ] No 5xx errors in logs

### Functionality
- [ ] Both domains responding
- [ ] AI models accessible
- [ ] Market data available
- [ ] File storage working

---

## 📊 Status After Completion

```
TRADEHAX.NET
├─ ✅ Frontend: Live
├─ ✅ API: Responding
├─ ✅ AI: HuggingFace active
├─ ✅ Market data: Available
└─ ✅ File storage: Ready

TRADEHAXAI.TECH
├─ ✅ Frontend: Live
├─ ✅ API: Responding
├─ ✅ AI: HuggingFace active
├─ ✅ Market data: Available
└─ ✅ File storage: Ready
```

---

## 📋 Rollback Plan (If needed)

```bash
[ ] Go to Vercel → Deployments
[ ] Find previous successful deployment
[ ] Click three dots → Promote to Production
[ ] Verify health endpoints
```

---

## 🎉 Post-Deployment

- [ ] Monitor logs for errors
- [ ] Check analytics
- [ ] Test user workflows
- [ ] Document any issues
- [ ] Schedule follow-up review

---

## ⏱️ Timeline

| Step | Time | Status |
|------|------|--------|
| Add variables (tradehax-net) | 3 min | ⏳ TODO |
| Add variables (tradehaxai-tech) | 3 min | ⏳ TODO |
| Redeploy both | 2 min | ⏳ TODO |
| Wait for deployment | 2-3 min | ⏳ TODO |
| Health checks | 2 min | ⏳ TODO |
| Full verification | 3-5 min | ⏳ TODO |
| **TOTAL** | **~15-20 min** | ⏳ TODO |

---

## 🔐 Security Reminders

✅ **Do:**
- Use strong passwords for Vercel account
- Enable 2FA on Vercel
- Rotate keys monthly
- Monitor API usage

❌ **Don't:**
- Commit .env files to Git
- Share credentials in chat/email
- Use same keys for multiple projects
- Ignore security warnings

---

## 📞 Support

**If environment variables don't load:**
1. Check Vercel deployment logs
2. Verify no special characters in values
3. Clear browser cache
4. Restart deployment

**If AI providers still unreachable:**
1. Verify token expiration
2. Check token permissions
3. Test token directly on provider website
4. Try regenerating token

---

**When this checklist is complete:**
✅ Both domains fully operational with all APIs connected  
✅ AI responses from real models (not demo)  
✅ Market data available  
✅ File storage ready  
✅ Production ready  

**Next step:** Start from "Setup Phase" above
