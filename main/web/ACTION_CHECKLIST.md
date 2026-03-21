# ✅ ACTION CHECKLIST: Get Neural Hub APIs Live

Follow these steps in order. Should take **10-15 minutes total**.

---

## Phase 1: Setup (5 minutes)

- [ ] **Read the guides** (already created in your repo):
  - `web/GET_API_KEYS.md` — Where to get each API key
  - `web/ENV_SETUP_GUIDE.md` — Complete setup instructions
  - `web/DEPLOYMENT_WITH_APIS.md` — Deployment guide

- [ ] **Verify Vercel login:**
  ```powershell
  npx vercel login
  # If already logged in, this just confirms
  ```

---

## Phase 2: Set Secrets in Vercel (2 minutes)

**Option A: Use the automated script (Windows) — RECOMMENDED**
```powershell
cd C:\tradez\main\web
.\scripts\setup-vercel-env.ps1
```
When prompted, paste your API keys:
- `HF_API_TOKEN`
- `OPENAI_API_KEY` (optional but recommended)
- `FINNHUB_API_KEY` (optional)

**Option B: Manual Vercel CLI**
```powershell
npx vercel env add HF_API_TOKEN
# Paste your token when prompted
# The script will handle the rest
```

**Option C: Vercel Dashboard (GUI)**
1. Go to https://vercel.com/dashboard/tradehax-ai-assistant
2. Settings → Environment Variables
3. Click "Add"
4. Name: `HF_API_TOKEN`
5. Value: `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` (from your .env)
6. Scope: **Production** ← Important!
7. Save
8. Repeat for `OPENAI_API_KEY`, etc.

- [ ] **Verify keys are set:**
  ```powershell
  npx vercel env ls
  # Should show ✅ HF_API_TOKEN, ✅ OPENAI_API_KEY, etc.
  ```

---

## Phase 3: Deploy (2 minutes)

- [ ] **Deploy to production:**
  ```powershell
  cd C:\tradez\main\web
  npm run deploy:tech
  ```

- [ ] **Wait for build to complete** (watch the output):
  ```
  ✅ Production: https://web-XXXXXXXX-digitaldynasty.vercel.app [2m]
  🔗 Aliased: https://tradehaxai.tech [2m]
  ```

---

## Phase 4: Test (3 minutes)

- [ ] **Check API health:**
  ```powershell
  Invoke-WebRequest -Uri "https://tradehaxai.tech/api/ai/health" -UseBasicParsing | ConvertFrom-Json
  ```

  Should show:
  ```json
  {
    "status": "ok",
    "providers": {
      "huggingface": true,
      "openai": true
    }
  }
  ```

- [ ] **Test the chat endpoint:**
  ```powershell
  $payload = @{
      messages = @(
          @{ role = "user"; content = "Show 3 setups with clear entry, stop, and target." }
      )
      mode = "base"
  } | ConvertTo-Json

  $response = Invoke-WebRequest -Uri "https://tradehaxai.tech/api/chat" `
    -Method POST `
    -ContentType "application/json" `
    -Body $payload -UseBasicParsing

  $response.Content | ConvertFrom-Json
  ```

  Should show:
  ```json
  {
    "response": "**Signal**: BUY-SELECTIVE 69% ...",
    "provider": "huggingface",  // ← This is the key line!
    "model": "meta-llama/Llama-3.3-70B-Instruct",
    "meta": {
      "providerPath": "HUGGINGFACE"  // ← Or "OPENAI" — either is good
    }
  }
  ```

  **If `"provider": "demo"` → APIs not working, check Phase 2**

- [ ] **Test in the browser:**
  1. Go to https://tradehaxai.tech/ai-hub
  2. Type in the input: `"Show 3 setups with clear entry, stop, and target."`
  3. Click SEND
  4. Watch the **Smart Environment Monitor** (right panel):
     - `Provider Path` should show `HUGGINGFACE` or `OPENAI`
     - `Latency` should be under 30 seconds
     - `Effective Mode` should match your selected mode
  5. Response should show 3 concrete trading setups (not generic boilerplate)

---

## Phase 5: Verify & Celebrate (2 minutes)

- [ ] **Check all indicators are green:**
  - [ ] Health endpoint returns `"status": "ok"`
  - [ ] Chat endpoint returns real responses
  - [ ] `Provider Path` is not `DEMO`
  - [ ] Latency is under 30 seconds
  - [ ] "Show 3 setups" returns actual 3 setups

- [ ] **Share the live link:**
  ```
  https://tradehaxai.tech/ai-hub
  ```

---

## 🆘 If Something Doesn't Work

### Problem: "Provider unreachable" or "DEMO mode"

**Diagnose:**
```powershell
npx vercel env ls | findstr HF_API_TOKEN
```

**If missing:**
```powershell
.\scripts\setup-vercel-env.ps1
npm run deploy:tech
# Wait 2-3 minutes
```

**If present but still fails:**
1. Check token is valid: https://huggingface.co/settings/tokens
2. Verify token has **Read** permission (not just repo access)
3. Check quota: https://huggingface.co/settings/billing
4. Try OpenAI fallback — set `OPENAI_API_KEY` too

### Problem: "Chat API returns error 500"

```powershell
# Check Vercel build logs
npx vercel logs --tail
# Look for "provider", "HF", "error" keywords
```

### Problem: "Responses are still generic boilerplate"

The AI improvements from earlier commit should be live. If still seeing generic responses:
```powershell
# Verify latest commit is deployed
npx vercel inspect tradehaxai.tech | grep "created"

# If old, redeploy
npm run deploy:tech
```

---

## 🎯 Success Criteria

| Metric | Target | How to Check |
|--------|--------|-------------|
| API Health | ✅ ok | `/api/ai/health` returns `"status": "ok"` |
| Provider | ✅ HF or OpenAI | Chat response shows `"provider": "huggingface"` |
| Responses | ✅ Setup-specific | "Show 3 setups" returns actual setups, not generic text |
| Latency | ✅ <30 sec | Vercel monitor shows latency |
| UI rendering | ✅ Real-time | Chat streams in chunks (18ms intervals) |

---

## 📞 Next Steps After This Works

1. **Configure other APIs** (optional):
   - FINNHUB for stock data
   - SUPABASE for persistence
   - POLYGON for real-time feeds

2. **Improve response quality:**
   - Adjust system prompts per mode
   - Fine-tune temperature/top_p
   - Add retrieval-augmented generation (RAG)

3. **Scale it:**
   - Set up monitoring/alerts
   - Enable rate limiting
   - Add caching layer

---

**You're ready! 🚀 Follow the checklist above and your Neural Hub will be live with real LLM responses in 15 minutes.**

