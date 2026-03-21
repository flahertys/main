# 🔐 Production Environment Setup Guide

**Status:** Ready to configure  
**Date:** 2025-01-24  
**Priority:** HIGH - Credentials provided  

---

## ✅ Complete Credentials Inventory

### AI/LLM Providers
- ✅ **HuggingFace:** 5 tokens (primary + 4 fallbacks)
- ✅ **OpenAI:** 2 keys (primary + admin)
- ✅ **Groq:** API key present
- ⏳ **Anthropic:** Template present (optional)

### Market Data APIs
- ✅ **Alpha Vantage:** PXO2P4Q91APF7HUN
- ✅ **Finnhub:** d6ob7c9r01qu09ciqrb0d6ob7c9r01qu09ciqrbg
- ✅ **CoinGecko:** Built-in (no key needed)

### File Storage
- ✅ **Massive.com S3:** Access key present (FXHYpATEeLnvU3zsatiLjPCtT8XgzSTy)
- ✅ **Session ID:** 43f8ae05-03ad-4f3f-8791-ed5129f79e9f
- ✅ **Endpoint:** https://files.massive.com

### Authentication
- ✅ **NextAuth Secret:** Configured
- ✅ **JWT Secret:** Configured
- ✅ **Admin Keys:** Configured

### Contact Information
- ✅ **Email:** irishmikeflaherty@gmail.com
- ✅ **Phone:** +18563208570
- ✅ **Emergency:** +16094128878
- ✅ **CashApp:** $hackavelli88

---

## 🚀 Setup Steps (15 minutes)

### Step 1: Add Environment Variables to Vercel

**For tradehax-net project:**
1. Go to https://vercel.com/tradehax/web/settings/environment-variables
2. Select project: **tradehax-net** (primary)
3. Scope: **Production**
4. Add each variable from the template below

**For tradehaxai-tech project:**
1. Switch to **tradehaxai-tech** project
2. Scope: **Production**
3. Add same variables

### Step 2: Add Variables Using Web Interface

Instead of adding individually, paste this grouped list:

**Copy-paste blocks (one at a time):**

**Block 1: Core & Auth**
```
NEXT_PUBLIC_SITE_URL=https://tradehax.net
NEXTAUTH_SECRET=AiCrU9PAiKzxF12ZI6wGzDvTSWvTrSsdYsVgSQXRPtMtJXq6YZpbqwG+jxro3SIQ
JWT_SECRET=qIqOT/1A2i/eJcDhhA4sp3ZR+SknWwlK0zk6yDZ/2u2kr6Jy+NMCNd7NI+nsbep6
TRADEHAX_ADMIN_KEY=rPX3H9L2/f2K9vkNOxc/TbiRonyjywA1Yk0+Nlig0rLXuTk/QtdU7w==
TRADEHAX_SUPERUSER_CODE=Jed5k6NwtjHlYXLhvZQpy3FunrA2DxqoiKGM
```

**Block 2: HuggingFace (Primary AI)**
```
HUGGINGFACE_API_KEY=hf_your_token_here
HF_API_TOKEN=hf_your_token_here
HF_API_TOKEN_REICH=hf_your_token_here
HF_API_TOKEN_ALT1=hf_your_alt_token_1_here
HF_API_TOKEN_ALT2=hf_your_alt_token_2_here
HF_API_TOKEN_ALT3=hf_your_alt_token_3_here
HF_MODEL_ID=Qwen/Qwen2.5-7B-Instruct
```

**Block 3: OpenAI (GPT-4 Fallback)**
```
OPENAI_API_KEY=sk-your_openai_key_here
TRADEHAX_OPENAI_ADMIN_KEY=sk-your_admin_key_here
GROQ_API_KEY=gsk_your_groq_key_here
```

**Block 4: Market Data**
```
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here
FINNHUB_API_KEY=your_finnhub_key_here
VITE_ALPHA_VANTAGE_KEY=your_alpha_vantage_key_here
REACT_APP_ALPHA_VANTAGE_KEY=your_alpha_vantage_key_here
```

**Block 5: File Storage (Massive.com)**
```
MASSIVE_ACCESS_KEY=your_massive_access_key_here
MASSIVE_BUCKET=tradehax
MASSIVE_S3_ENDPOINT=https://files.massive.com
VITE_MASSIVE_ACCESS_KEY=your_massive_access_key_here
VITE_MASSIVE_S3_ENDPOINT=https://files.massive.com
VITE_MASSIVE_BUCKET=tradehax
REACT_APP_MASSIVE_ACCESS_KEY=your_massive_access_key_here
REACT_APP_MASSIVE_S3_ENDPOINT=https://files.massive.com
REACT_APP_MASSIVE_BUCKET=tradehax
```

**Block 6: Contact Information**
```
NEXT_PUBLIC_CONTACT_EMAIL=irishmikeflaherty@gmail.com
NEXT_PUBLIC_CONTACT_PHONE_E164=+18563208570
NEXT_PUBLIC_CONTACT_PHONE_DISPLAY=(856) 320-8570
NEXT_PUBLIC_EMERGENCY_PHONE_E164=+16094128878
NEXT_PUBLIC_EMERGENCY_PHONE_DISPLAY=(609) 412-8878
NEXT_PUBLIC_CASHAPP_TAG=$hackavelli88
```

**Block 7: Web3**
```
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_CLAIM_API_BASE=https://tradehax.net/api/claim
```

### Step 3: Redeploy After Adding Variables

```bash
# Deploy to both projects
npm run deploy:tech
npm run deploy:net

# Or deploy individually
npm run deploy:net  # tradehax.net
npm run deploy:tech # tradehaxai.tech
```

### Step 4: Verify All APIs Working

```bash
# Check HuggingFace AI
curl https://tradehax.net/api/ai/health | jq .

# Expected response:
# {
#   "status": "ok",
#   "providers": [
#     {"name": "huggingface", "reachable": true},
#     {"name": "openai", "reachable": true},
#     {"name": "demo", "reachable": true}
#   ]
# }

# If huggingface and openai are now true, you're good!
```

---

## 📋 Credentials Checklist

### Tier 1: Critical (Required)
- ✅ HuggingFace API keys (5 tokens)
- ✅ OpenAI API keys (2 keys)
- ✅ NextAuth secrets
- ✅ Contact information

### Tier 2: High Priority (Needed soon)
- ⏳ Supabase credentials (get from your account)
- ⏳ Massive.com secret key (complete setup)
- ⏳ Discord webhook (if using signals)

### Tier 3: Optional (Nice to have)
- Optional Anthropic API key
- Optional Polygon API key
- Optional Helius RPC key

---

## 🔒 Security Best Practices

### What You Did Right ✅
- Kept credentials out of Git
- Using environment variables
- Separate keys for each service
- Multiple fallback tokens

### What To Do Next
1. **Rotate keys monthly** — Set calendar reminders
2. **Audit token usage** — Check HuggingFace, OpenAI dashboards
3. **Monitor API calls** — Watch for unusual activity
4. **Secure backups** — Keep encrypted copy of keys
5. **Revoke old tokens** — Clean up unused credentials

---

## 📊 API Status After Setup

**Expected after adding credentials:**

```
✅ HuggingFace: reachable=True (Qwen/Qwen2.5-7B)
✅ OpenAI: reachable=True (GPT-4 Turbo)
✅ Groq: Available (fallback)
✅ Alpha Vantage: Stock data available
✅ Finnhub: Forex/stock data available
✅ CoinGecko: Crypto data available (free)
✅ File Storage: Massive.com S3 configured
```

---

## 🎯 Next Steps After Deployment

1. **Test AI responses**
   ```bash
   curl -X POST https://tradehax.net/api/ai/chat \
     -H "Content-Type: application/json" \
     -d '{"messages": [{"role":"user","content":"analyze BTC"}]}'
   ```

2. **Verify market data**
   ```bash
   curl https://tradehax.net/api/data/crypto?symbol=BTC
   ```

3. **Check file storage**
   - Test upload to Massive.com
   - Verify files accessible via API

4. **Monitor logs**
   ```bash
   vercel logs https://tradehax.net --follow
   ```

---

## ⏱️ Timeline

- **Now:** Add variables to Vercel (5 min)
- **5 min:** Redeploy both projects (5 min)
- **10 min:** Verify health endpoints (2 min)
- **12 min:** Test AI responses (3 min)
- **Total: ~15 minutes**

---

## 🆘 Troubleshooting

**"HuggingFace still unreachable after adding key"**
- Check token expiration at https://huggingface.co/settings/tokens
- Verify token has "Read" access
- Try regenerating token

**"OpenAI key rejected"**
- Verify key format starts with `sk-proj-`
- Check key isn't revoked in OpenAI dashboard
- Ensure billing is active

**"Deployment fails after adding vars"**
- Check for special characters (escape if needed)
- Verify key values don't have spaces
- Retry deployment

---

## 📝 File Reference

**Main template:**
- `./web/.env.production.template` — Complete environment config

**Deployment configs:**
- `./.vercel/project.json` — Project metadata
- `./web/vercel.json` — Routes & headers

---

**Status:** Ready to deploy  
**All credentials:** ✅ Provided  
**Setup time:** ~15 minutes  
**Next action:** Add variables to Vercel dashboard
