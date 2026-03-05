# 🎉 TradeHax HF Fine-Tuning: COMPLETE AUTOMATION GUIDE

## What's Ready

✅ **Production API Endpoint** (`/api/hf-server`)
- Text generation (Mistral-7B)
- Image generation (Stable Diffusion 2.1)
- Fully configured in latest commit (140f250)

✅ **Fine-Tuning Pipeline**
- Mistral-7B LoRA training
- 4-bit quantization support
- Auto-hub push capability
- CPU fallback guidance included

✅ **Environment Configuration**
- `.env.example` with all required variables
- Payment subscription flag enabled
- Multi-model routing configured
- Canary deployment settings included

✅ **Automation Scripts** (Just Added - Commit 9b57288)
- `scripts/validate-deployment.js` - Pre-deployment validation
- `scripts/setup-vercel-deployment.js` - Vercel configuration
- `scripts/complete-automation.js` - Full orchestration
- `scripts/test-inference.js` - Post-deployment testing
- `scripts/deploy-to-vercel.sh` - Automated deployment

---

## 🚀 COMPLETE AUTOMATION WORKFLOW

### Step 1: Run Comprehensive Automation Audit (1 minute)

```bash
node scripts/complete-automation.js
```

This generates:
- Full repository validation
- Environment configuration review
- Readiness checklist
- File verification
- Deployment workflow guide

**Expected Output:**
```
✅ On main branch
✅ Working tree clean
✅ All required files present
✅ app/api/hf-server/route.ts configured
✅ Environment variables defined
✅ Monetization flag enabled
```

---

### Step 2: Run Pre-Deployment Validation (2 minutes)

```bash
node scripts/validate-deployment.js
```

This checks:
- `.env` file exists and configured
- Git state (branch, commits, clean)
- Required files in place
- Inference endpoint configured
- Fine-tuning setup complete
- Monetization enabled
- Generates inference test checklist
- Provides deployment checklist

**Expected Output:**
```
✅ .env file exists
✅ On main branch
✅ All core files present
✅ API endpoint validated
✅ Fine-tuning script ready
✅ Monetization enabled
```

---

### Step 3: Configure Vercel Deployment (5 minutes)

**Option A: Automated (Requires Vercel CLI)**

```bash
# Install Vercel CLI if needed
npm install -g vercel

# Run setup automation
node scripts/setup-vercel-deployment.js

# Follow the generated script
bash scripts/deploy-to-vercel.sh
```

**Option B: Manual Steps**

1. Go to https://vercel.com/dashboard
2. Select project: **tradehax**
3. Settings → Environment Variables
4. Add these variables:

   ```
   HF_API_TOKEN = your_hf_token_here (KEEP SECRET)
   HF_MODEL_ID = mistralai/Mistral-7B-Instruct-v0.1
   NEXT_PUBLIC_ENABLE_PAYMENTS = true
   LLM_TEMPERATURE = 0.85
   LLM_MAX_LENGTH = 768
   HF_IMAGE_MODEL_ID = stabilityai/stable-diffusion-2-1
   ```

5. Click **Save**

---

### Step 4: Trigger Deployment (5 minutes)

**Option A: Via Vercel CLI**

```bash
vercel deploy --prod
```

**Option B: Via GitHub**

```bash
git add .
git commit -m "chore: finalize HF fine-tuning setup"
git push origin main
# Auto-deploys to Vercel
```

**Option C: Manual**

1. Vercel Dashboard → Deployments
2. Click "Deploy" or redeploy from latest commit
3. Wait for build to complete (green checkmark)

**Monitor Progress:**
```bash
# Watch build logs
vercel logs

# Check deployment status
vercel status
```

---

### Step 5: Post-Deployment Testing (3 minutes)

**Option A: Run Automated Tests**

```bash
node scripts/test-inference.js
```

**Option B: Manual curl Tests**

```bash
# Test 1: Text Generation
curl -X POST https://tradehax.net/api/hf-server \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Give me a concise BTC/ETH market brief.","task":"text-generation"}'

# Expected Response:
# { "output": [ { "generated_text": "..." } ] }

# Test 2: Image Generation
curl -X POST https://tradehax.net/api/hf-server \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Trading chart with candlestick pattern","task":"image-generation"}'

# Expected Response:
# { "output": <image_blob> }
```

**Expected Results:**
- ✅ Status 200
- ✅ Valid JSON response
- ✅ No errors in Vercel logs
- ✅ Response time < 10s

---

### Step 6: Switch to Fine-Tuned Model (Optional, After Training)

After successful fine-tuning and Hub push:

```bash
# 1. Update Vercel environment
vercel env set HF_MODEL_ID=irishpride81mf/tradehax-mistral-finetuned

# 2. Trigger redeployment
vercel deploy --prod

# 3. Re-test
node scripts/test-inference.js
```

---

## 📋 AUTOMATED CHECKLISTS

### Pre-Deployment Checklist

```bash
# 1. Validate setup
node scripts/validate-deployment.js

# 2. Check git state
git status
git log -1

# 3. Verify environment
cat .env.example | grep "HF_\|NEXT_PUBLIC_ENABLE"

# 4. Test locally (optional)
npm run dev
# curl -X POST http://localhost:3000/api/hf-server ...
```

### Vercel Deployment Checklist

```bash
# 1. Verify repository pushed
git push origin main

# 2. Check environment variables in Vercel
vercel env list

# 3. Trigger production deployment
vercel deploy --prod

# 4. Monitor build
vercel logs --follow

# 5. Verify live deployment
curl https://tradehax.net
```

### Post-Deployment Checklist

```bash
# 1. Run inference tests
node scripts/test-inference.js

# 2. Check Vercel metrics
vercel analytics

# 3. Monitor logs for errors
vercel logs | grep -i error

# 4. Verify monetization flag
curl https://tradehax.net/api/monetization/check

# 5. Test model switching (post fine-tune)
vercel env set HF_MODEL_ID=irishpride81mf/tradehax-mistral-finetuned
vercel deploy --prod
```

---

## 🔑 KEY FILES & WHAT THEY DO

| File | Purpose | Latest Change |
|------|---------|----------------|
| `app/api/hf-server/route.ts` | Live inference endpoint | 140f250 |
| `.env.example` | Configuration template | 140f250 |
| `HF_FINE_TUNING_WORKFLOW.md` | Training documentation | 140f250 |
| `scripts/validate-deployment.js` | Pre-deployment validation | 9b57288 |
| `scripts/setup-vercel-deployment.js` | Vercel automation | 9b57288 |
| `scripts/complete-automation.js` | Full orchestration | 9b57288 |
| `scripts/test-inference.js` | Endpoint testing | 9b57288 |
| `scripts/deploy-to-vercel.sh` | Automated deployment | 9b57288 |

---

## 🎯 COMMAND QUICK REFERENCE

| Task | Command |
|------|---------|
| **Pre-deployment audit** | `node scripts/complete-automation.js` |
| **Validate setup** | `node scripts/validate-deployment.js` |
| **Setup Vercel** | `node scripts/setup-vercel-deployment.js` |
| **Deploy** | `vercel deploy --prod` or `bash scripts/deploy-to-vercel.sh` |
| **Test endpoints** | `node scripts/test-inference.js` |
| **View logs** | `vercel logs` |
| **Check status** | `vercel status` |
| **Fine-tune locally** | `npm run llm:finetune:workflow:push` |
| **Check environment** | `vercel env list` |
| **Update env var** | `vercel env set KEY=value` |

---

## 📊 DEPLOYMENT FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│  1. Run Automation Audit                                    │
│  node scripts/complete-automation.js                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Pre-Deployment Validation                               │
│  node scripts/validate-deployment.js                        │
│  ✅ Check: git state, files, env, endpoints                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Push to GitHub & Configure Vercel                       │
│  git push origin main                                       │
│  node scripts/setup-vercel-deployment.js                    │
│  • Set HF_API_TOKEN (secret)                                │
│  • Set HF_MODEL_ID                                          │
│  • Enable NEXT_PUBLIC_ENABLE_PAYMENTS                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Deploy to Production                                    │
│  vercel deploy --prod                                       │
│  [Wait for build completion]                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Post-Deployment Testing                                 │
│  node scripts/test-inference.js                             │
│  ✅ Test: /api/hf-server endpoints                          │
│  ✅ Verify: response quality, latency                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  6. Monitor & Optimize (Optional)                           │
│  vercel logs                                                │
│  vercel analytics                                           │
│  • Track error rates, latency                               │
│  • Monitor model performance                                │
│  • Fine-tune as needed                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 TROUBLESHOOTING

| Issue | Cause | Solution |
|-------|-------|----------|
| `HF_API_TOKEN not found` | Secret not set in Vercel | `vercel env set HF_API_TOKEN=hf_...` |
| `Model not found` | Wrong model ID | Check HF Hub, update `HF_MODEL_ID` |
| `POST 500 error` | Inference failed | Check Vercel logs: `vercel logs` |
| `Deploy fails` | Missing env var | Run `vercel env list`, add missing vars |
| `Inference slow` | Model loading | First call warm-up normal (~5-10s) |
| `Model unauthorized` | Permissions | Check model is public or token has access |

---

## ✅ SUCCESS CRITERIA

**Deployment is successful when:**

- ✅ `node scripts/validate-deployment.js` shows all green
- ✅ Build succeeds on Vercel (green checkmark)
- ✅ `node scripts/test-inference.js` passes all tests
- ✅ `https://tradehax.net` responds 200
- ✅ `/api/hf-server` returns valid JSON for prompts
- ✅ Vercel logs show no errors
- ✅ Response time < 10 seconds
- ✅ Monetization flag enabled and tested

---

## 📞 SUPPORT

**For automation help or issues:**
- Email: darkmodder33@proton.me
- GitHub: https://github.com/DarkModder33/main
- Hugging Face: https://huggingface.co/irishpride81mf/tradehax-mistral-finetuned

---

## 🎓 COMPLETE WORKFLOW (Copy & Paste)

```bash
# Step 1: Validate
echo "Step 1: Validation..."
node scripts/validate-deployment.js

# Step 2: Push to GitHub
echo "Step 2: Push to GitHub..."
git add .
git commit -m "chore: finalize HF setup" || true
git push origin main

# Step 3: Configure Vercel (automated)
echo "Step 3: Setup Vercel..."
node scripts/setup-vercel-deployment.js

# Or manual (uncomment):
# echo "Step 3: Manual Vercel config"
# echo "Go to https://vercel.com/dashboard"
# echo "Add HF_API_TOKEN and HF_MODEL_ID"
# read -p "Press enter when done..."

# Step 4: Deploy
echo "Step 4: Deploy to Vercel..."
vercel deploy --prod

# Step 5: Test
echo "Step 5: Testing..."
sleep 5  # Wait for deployment
node scripts/test-inference.js

echo "✅ Deployment complete!"
```

---

## 📈 MONITORING & OPTIMIZATION

After deployment, monitor:

```bash
# View all logs
vercel logs

# Watch live logs
vercel logs --follow

# Check analytics
vercel analytics

# Monitor specific function
vercel logs /api/hf-server
```

---

## 🎁 WHAT YOU GET

✅ **Live API Endpoint** - `/api/hf-server`
- Text generation via Mistral-7B
- Image generation via Stable Diffusion
- Full production support

✅ **Monetization** - Premium subscriptions ready
- `NEXT_PUBLIC_ENABLE_PAYMENTS=true`
- `/api/monetization/*` routes enabled
- Billing integration ready

✅ **Fine-Tuning** - Custom model training
- LoRA adapters for efficiency
- 4-bit quantization support
- Auto Hub push

✅ **Automation** - Complete deployment workflow
- Pre-deployment validation
- Vercel configuration automation
- Post-deployment testing
- Monitoring scripts

---

**Status:** 🚀 **PRODUCTION READY**

**Latest Commits:**
- `9b57288` - Automation scripts added
- `140f250` - API endpoint & config finalized
- `b3ca648` - Windows compatibility & fixes

**Quick Start:**
```bash
node scripts/complete-automation.js
```

**Ready to deploy!**
