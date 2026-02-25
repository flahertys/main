# TradeHax HF Fine-Tuning: Local to Production Deployment

## ✅ Complete Deployment Checklist

### Phase 1: Local Setup (You Are Here)

#### Files & Dependencies
- [x] All HF files present (API, client, scripts, docs)
- [x] Setup verification script working
- [ ] `npm install` completed locally
- [ ] `npm run llm:finetune:deps` completed locally
- [ ] `.env.local` created with `HF_API_TOKEN` set

#### Verification Commands
```bash
# Run verification script
node scripts/setup-hf-finetuning.js

# Check TypeScript
npm run type-check

# Check linting
npm run lint

# Start dev server (should show no errors)
npm run dev
```

#### Testing Locally
- [ ] API endpoint responds: `curl -X POST http://localhost:3000/api/hf-server ...`
- [ ] React component compiles without TypeScript errors
- [ ] `useHfClient()` hook works in browser console

---

### Phase 2: Training (Optional but Recommended)

#### Prepare Dataset
```bash
# Ensure this file exists with JSONL format:
# data/custom-llm/tradehax-training-expanded.jsonl

# Each line should be:
# {"text": "Training example text here"}
```

#### Run Fine-Tuning
```bash
# Install Hugging Face CLI (optional)
pip install huggingface-hub

# Run fine-tuning with model upload to Hub
npm run llm:finetune:workflow:push
```

Expected output:
- Model checkpoints saved to `./fine-tuned-tradehax-mistral/`
- Model uploaded to Hub: `https://huggingface.co/irishpride81mf/tradehax-mistral-finetuned`
- Training metrics logged

#### Update Env (After Training)
```bash
# Update .env.local to use fine-tuned model:
HF_MODEL_ID=irishpride81mf/tradehax-mistral-finetuned
```

---

### Phase 3: Vercel Deployment

#### Add Environment Variables to Vercel Dashboard

1. Go to: `https://vercel.com/dashboard`
2. Select project: `tradehax`
3. Settings → Environment Variables

Add these variables:
```
HF_API_TOKEN=hf_YOUR_TOKEN_HERE  [Mark as SECRET]
HF_MODEL_ID=mistralai/Mistral-7B-Instruct-v0.1
HF_HUB_MODEL_ID=irishpride81mf/tradehax-mistral-finetuned
DATASET_PATH=data/custom-llm/tradehax-training-expanded.jsonl
TRAIN_EPOCHS=3
TRAIN_BATCH_SIZE=4
TRAIN_LR=2e-5
LORA_R=16
LORA_ALPHA=32
```

#### Deploy
```bash
# Commit & push
git add .
git commit -m "deployment: configure HF fine-tuning for production"
git push origin main

# Vercel auto-deploys (watch: https://vercel.com/dashboard)
```

#### Verify Production
```bash
# Test live endpoint
curl -X POST https://tradehax.net/api/hf-server \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Trading signal", "task": "text-generation"}'

# Check logs
# Vercel Dashboard → Deployments → View Build Logs
```

---

### Phase 4: Integration & Testing

#### API Integration
- [ ] `/api/hf-server` responds with valid output
- [ ] Error handling works (test with invalid prompt)
- [ ] Rate limiting considered (if needed)

#### Frontend Integration
- [ ] React components compile with `useHfClient()`
- [ ] API calls succeed from UI
- [ ] Loading states work correctly
- [ ] Error states display properly

#### Performance Testing
- [ ] Response time < 10s (first call may be slower due to model load)
- [ ] Multiple concurrent requests handled
- [ ] Memory usage stable on Vercel

---

### Phase 5: Monitoring & Optimization

#### Hugging Face Hub Monitoring
- Check model metrics: https://huggingface.co/irishpride81mf/tradehax-mistral-finetuned
- Monitor download counts & community feedback

#### Vercel Monitoring
- Function logs: `vercel logs`
- Performance: Vercel Dashboard → Analytics
- Error tracking

#### Optimization Opportunities
- [ ] Cache frequent prompts (Redis/KV)
- [ ] Batch requests for efficiency
- [ ] Add request validation
- [ ] Implement rate limiting
- [ ] Monitor token usage costs

---

## 🚀 Quick Start Commands

### Minimal Setup (5 minutes)
```bash
# Clone
git clone https://github.com/DarkModder33/main.git
cd main

# Setup
cp .env.example .env.local
# Edit .env.local and add HF_API_TOKEN

# Install
npm install
npm run llm:finetune:deps

# Test locally
npm run dev
# Then: curl -X POST http://localhost:3000/api/hf-server ...
```

### Full Setup with Training (30-60 minutes)
```bash
# Setup (above)

# Prepare training data
# Place data in: data/custom-llm/tradehax-training-expanded.jsonl

# Train and push
npm run llm:finetune:workflow:push

# Deploy
git add .
git commit -m "feat: fine-tuned Mistral model"
git push origin main
# Wait for Vercel deployment (~2-5 minutes)

# Test
curl -X POST https://tradehax.net/api/hf-server ...
```

---

## 📊 Current Git Status

```
Latest Commits:
636dda8 - docs: add HF fine-tuning setup guides and verification script
29b8ee9 - feat: add Hugging Face fine-tuning workflow and API integrations

Files Ready:
✅ src/app/api/hf-server.ts
✅ src/components/hf-client.ts
✅ scripts/fine-tune-mistral-lora.py
✅ scripts/fine-tune-requirements.txt
✅ scripts/run-finetune-workflow.js
✅ scripts/setup-hf-finetuning.js
✅ docs/HF_FINE_TUNING_WORKFLOW.md
✅ HF_INTEGRATION_GUIDE.md
✅ SETUP_VERIFICATION.md
✅ .env.example (with all HF configs)
```

---

## 🎯 Success Criteria

### Local
- [ ] All 10 files present
- [ ] No TypeScript errors
- [ ] API endpoint returns valid response
- [ ] React component compiles

### Vercel
- [ ] Environment variables set
- [ ] Deployment succeeds
- [ ] Live API endpoint responds
- [ ] No runtime errors in logs

### Training (Optional)
- [ ] Fine-tuning completes without errors
- [ ] Model uploaded to Hub
- [ ] Custom model loaded on API endpoint

---

## 🆘 Support & Contact

**For setup assistance or consultations:**
- Email: irishmikeflaherty@gmail.com
- Repo: https://github.com/DarkModder33/main

---

**Status:** ✅ Ready for deployment  
**Last Updated:** 2026-02-24  
**Commits:** 29b8ee9, 636dda8
