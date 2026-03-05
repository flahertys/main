# TradeHax HF Fine-Tuning Setup Verification

## ✅ Files Status

All required files are in place:

### API & Client Files

- [x] `app/api/hf-server/route.ts` — Server-side HF Inference endpoint
- [x] `components/hf-client.ts` — React hook for client API calls

### Fine-Tuning Scripts
- [x] `scripts/fine-tune-mistral-lora.py` — Mistral-7B LoRA trainer
- [x] `scripts/fine-tune-requirements.txt` — Python dependencies (pinned)
- [x] `scripts/run-finetune-workflow.js` — Node.js orchestrator

### Documentation & Config
- [x] `docs/HF_FINE_TUNING_WORKFLOW.md` — Full workflow guide
- [x] `.env.example` — Environment variable template

### npm Scripts (in package.json)
- [x] `npm run llm:finetune:deps` — Install Python dependencies
- [x] `npm run llm:finetune` — Run fine-tuning directly
- [x] `npm run llm:finetune:push` — Fine-tune + push to Hub
- [x] `npm run llm:finetune:workflow` — Orchestrated fine-tuning
- [x] `npm run llm:finetune:workflow:push` — Orchestrated + Hub push

## 📋 Setup Checklist

### Step 1: Clone & Navigate
```bash
git clone https://github.com/DarkModder33/main.git
cd main
```
✅ **Status:** Repository cloned with commit 29b8ee9

### Step 2: Install Node Dependencies
```bash
npm install
```
Required: `@huggingface/inference` (already in package.json)

### Step 3: Install Python Dependencies
```bash
npm run llm:finetune:deps
```
This installs:
- transformers 4.38.2
- datasets 2.17.1
- peft 0.9.0
- accelerate 0.27.2
- bitsandbytes 0.42.0
- evaluate 0.4.1
- huggingface-hub 0.21.3
- torch 2.2.1

### Step 4: Configure Environment
Create `.env.local` (copy from `.env.example`):
```bash
HF_API_TOKEN=hf_YOUR_TOKEN_HERE
HF_MODEL_ID=mistralai/Mistral-7B-Instruct-v0.1
HF_HUB_MODEL_ID=irishpride81mf/tradehax-mistral-finetuned
DATASET_PATH=data/custom-llm/tradehax-training-expanded.jsonl
TRAIN_EPOCHS=3
TRAIN_BATCH_SIZE=4
TRAIN_LR=2e-5
LORA_R=16
LORA_ALPHA=32
```

**Getting HF_API_TOKEN:**
1. Visit https://huggingface.co/settings/tokens
2. Create new token (write access)
3. Add to `.env.local`

### Step 5: Prepare Training Data
Ensure `data/custom-llm/tradehax-training-expanded.jsonl` exists with format:
```json
{"text": "Your training text here"}
```

### Step 6: Run Fine-Tuning

**Option A: Direct Python**
```bash
npm run llm:finetune
```

**Option B: With Hub Push**
```bash
npm run llm:finetune:push
```

**Option C: Node Orchestrator**
```bash
npm run llm:finetune:workflow
```

**Option D: Orchestrator + Hub Push**
```bash
npm run llm:finetune:workflow:push
```

### Step 7: Verify Training Output
After training completes:
- Check `./fine-tuned-tradehax-mistral/` directory
- Verify model uploaded to Hub: https://huggingface.co/irishpride81mf/tradehax-mistral-finetuned

### Step 8: Test API Endpoint

**Local Test (curl):**
```bash
curl -X POST http://localhost:3000/api/hf-server \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Generate a trading strategy", "task": "text-generation"}'
```

**Frontend Test:**
Import in React component:
```typescript
import { useHfClient } from '@/components/hf-client';

export function MyComponent() {
  const { callHfApi, loading, error } = useHfClient();
  
  const handleGenerate = async () => {
    const result = await callHfApi('Your prompt', 'text-generation');
    console.log(result);
  };
  
  return <button onClick={handleGenerate}>Generate</button>;
}
```

### Step 9: Deploy to Vercel

1. Update Vercel environment variables:
   - Add `HF_API_TOKEN` (keep private)
   - Add other HF_* variables from `.env.example`

2. Deploy:
```bash
git push origin main
```
(Auto-deploys to Vercel)

3. Test live endpoint:
```bash
curl -X POST https://tradehax.net/api/hf-server \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Trading bot signals", "task": "text-generation"}'
```

## 🧪 Testing Matrix

| Component | Local | Vercel | Status |
|-----------|-------|--------|--------|
| API endpoint | ✅ | ✅ | Ready |
| Client hook | ✅ | ✅ | Ready |
| Fine-tuning script | ⏳ | - | Install deps first |
| Model upload | ⏳ | - | Requires HF token |
| TypeScript types | ✅ | ✅ | All passing |
| npm scripts | ✅ | ✅ | All defined |

## 📊 Current Configuration

```yaml
Base Model: mistralai/Mistral-7B-Instruct-v0.1
LoRA Config:
  r: 16
  alpha: 32
  target_modules: [q_proj, v_proj]
Training:
  epochs: 3
  batch_size: 4
  learning_rate: 2e-5
  max_length: 512
Output Hub: irishpride81mf/tradehax-mistral-finetuned
```

## 🚀 Next Steps

1. **Prepare Dataset**: Create or upload `data/custom-llm/tradehax-training-expanded.jsonl`
2. **Run Fine-Tuning**: `npm run llm:finetune:workflow:push`
3. **Test API**: Call `/api/hf-server` with sample prompt
4. **Deploy**: Push to GitHub → Auto-deploy to Vercel
5. **Monitor**: Check Hub for model metrics & training logs

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| `HF_API_TOKEN not found` | Set in `.env.local`: `export HF_API_TOKEN=hf_...` |
| `Dataset not found` | Check path: `ls data/custom-llm/tradehax-training-expanded.jsonl` |
| `CUDA out of memory` | Reduce `TRAIN_BATCH_SIZE` or use `load_in_4bit=True` (already enabled) |
| `API returns 500` | Check server logs: `npm run dev` and inspect `/api/hf-server` |
| `Type errors` | Run `npm run type-check` and fix imports |

## 📞 Support

For setup issues or consultations: **darkmodder33@proton.me**

---

**Last Updated:** 2026-02-24  
**Commit:** 29b8ee9  
**Status:** ✅ Ready to deploy
