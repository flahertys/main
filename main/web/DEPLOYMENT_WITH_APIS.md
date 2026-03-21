# ✅ How to Get Neural Hub Live with APIs (Secure Way)

You provided excellent API credentials. **I did NOT commit them to Git** (that would be a security breach), but I created a **secure setup path** so you can deploy them safely.

---

## 🚀 Quick Start (5 minutes)

### Step 1: Prepare Your API Keys
From the credentials you provided, extract these:

```
HF_API_TOKEN = hf_your_hugging_face_token_here
OPENAI_API_KEY = sk-proj-your_openai_key_here
FINNHUB_API_KEY = your_finnhub_key_here
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_ANON_KEY = your_supabase_anon_key_here
```

**See `GET_API_KEYS.md` for details on where to find each one.**

### Step 2: Set Variables in Vercel (Easy — 2 minutes)

**Windows (PowerShell):**
```powershell
cd C:\tradez\main\web
.\scripts\setup-vercel-env.ps1
# Follow prompts to paste your API keys
```

**Or use Vercel Dashboard (GUI):**
1. Go to https://vercel.com/dashboard/tradehax-ai-assistant
2. Settings → Environment Variables
3. Add each key below, set scope to **Production**
4. Save

**Keys to add:**
- `HF_API_TOKEN`
- `OPENAI_API_KEY` (optional but recommended)
- `FINNHUB_API_KEY` (optional)
- `SUPABASE_URL` (if you use database features)
- `SUPABASE_ANON_KEY` (if you use database features)

### Step 3: Deploy (1 minute)
```powershell
cd C:\tradez\main\web
npm run deploy:tech
```

### Step 4: Verify (30 seconds)
```powershell
curl https://tradehaxai.tech/api/ai/health
```

Expected response:
```json
{
  "status": "ok",
  "providers": {
    "huggingface": true,
    "openai": true
  }
}
```

---

## 📖 Full Documentation

I created three guides in your repo:

1. **`web/GET_API_KEYS.md`** — How to get each API key
2. **`web/ENV_SETUP_GUIDE.md`** — Step-by-step setup with alternatives
3. **`web/scripts/setup-vercel-env.ps1`** — Automated script (Windows)

All pushed to GitHub → ready to use.

---

## ⚡ What's Working Now

- ✅ Neural Hub frontend at https://tradehaxai.tech
- ✅ Chat endpoint: `/api/chat`
- ✅ Health endpoint: `/api/ai/health`
- ✅ 3-setup response path (fixed earlier)
- ✅ HF + OpenAI failover logic
- ✅ Demo fallback when providers unreachable

---

## 🔒 Security Details

**What I did NOT do:**
- ❌ Commit `.env` with credentials to Git
- ❌ Store keys in code
- ❌ Expose secrets in documentation

**What I did:**
- ✅ Created `.env.example` with placeholders (safe to commit)
- ✅ Created guides to set secrets in Vercel dashboard
- ✅ Provided automated script for your convenience
- ✅ Verified `.gitignore` protects `.env.local`

**Why this is better:**
- Your keys never appear in Git history (even if repo becomes public)
- Easy to rotate keys later (just update Vercel, no redeploy needed)
- Different keys per environment (dev vs prod)
- Audit trail of who changed what (Vercel logs)

---

## 🎯 Next: Get LLM Responses Working

### Verify HuggingFace is reachable:
```bash
npx vercel env ls
# Should show ✅ HF_API_TOKEN
```

### Test the chat API:
```powershell
$payload = @{
    messages = @(
        @{ role = "user"; content = "Show 3 setups with clear entry, stop, and target." }
    )
    mode = "base"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://tradehaxai.tech/api/chat" `
  -Method POST `
  -ContentType "application/json" `
  -Body $payload | Select-Object -ExpandProperty Content | ConvertFrom-Json
```

**If you see `Provider Path: HUGGINGFACE` in the response → 🎉 LLM is live!**

---

## 🆘 Troubleshooting

### "Provider unreachable" error
```powershell
# Check if key is set
npx vercel env ls | findstr HF_API_TOKEN

# If missing, re-run script
.\scripts\setup-vercel-env.ps1

# Redeploy
npm run deploy:tech
```

### "Chat API returns empty"
- Check that recent AI prompt fix is deployed: `git log --oneline -3`
- Should see: `fix: per-request HF/OpenAI failover...`
- If missing, redeploy: `npm run deploy:tech`

### "OpenAI fallback not working"
- Ensure `OPENAI_API_KEY` is set: `npx vercel env ls`
- Check billing account is active: https://platform.openai.com/account/billing/overview
- OpenAI API sometimes rate limits — add retry logic if needed

---

## 📝 Summary

| Item | Status | Action |
|------|--------|--------|
| Frontend live | ✅ | https://tradehaxai.tech |
| Chat backend | ✅ | `/api/chat` working |
| HF API keys | 🔑 Required | Use `.\scripts\setup-vercel-env.ps1` |
| OpenAI fallback | 🔑 Optional | Same script |
| Database (Supabase) | 🔑 Optional | Same script |
| Responsive design | ✅ | Mobile + web optimized |

---

## 💡 Pro Tips

1. **Test locally first:**
   ```powershell
   cp .env.example .env.local
   # Paste your HF token into .env.local
   npm run dev
   ```

2. **Rotate keys every 3 months:**
   - Create new HF token
   - Update in Vercel
   - No code changes needed

3. **Monitor costs:**
   - OpenAI: ~$0.005 per 1k tokens
   - HuggingFace: Free
   - Set Vercel alerts for unusual traffic

4. **Improve responses** later:
   - Add more system prompt context
   - Fine-tune HF model (advanced)
   - Use temperature tuning per mode (BASE=0.7, ODIN=0.5)

---

**You're ready to deploy! 🚀**

Run the script, deploy, and test. The Neural Hub will have live LLM responses in minutes.


