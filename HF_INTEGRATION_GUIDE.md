# Quick Integration Guide: HF Fine-Tuning in TradeHax

## 🚀 5-Minute Setup

### 1. Clone the repo (if needed)
```bash
git clone https://github.com/DarkModder33/main.git
cd main
```

### 2. Setup environment
```bash
cp .env.example .env.local
```

Then edit `.env.local` and set:
```bash
HF_API_TOKEN=hf_YOUR_TOKEN_HERE  # Get from https://huggingface.co/settings/tokens
```

### 3. Install dependencies
```bash
npm install
npm run llm:finetune:deps
```

### 4. Run fine-tuning (optional, requires training data)
```bash
npm run llm:finetune:workflow:push
```

This will:
- Load training data from `data/custom-llm/tradehax-training-expanded.jsonl`
- Fine-tune Mistral-7B with LoRA
- Push model to Hugging Face Hub

### 5. Start development server
```bash
npm run dev
```

Test the API:
```bash
curl -X POST http://localhost:3000/api/hf-server \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Generate a trading strategy", "task": "text-generation"}'
```

---

## 📝 Using the HF Client in React Components

```typescript
import { useHfClient } from '@/components/hf-client';

export function TradeAnalyzer() {
  const { callHfApi, loading, error } = useHfClient();
  const [result, setResult] = useState(null);

  const analyze = async () => {
    try {
      const output = await callHfApi(
        'Analyze BTC/USD technical indicators for buy signals',
        'text-generation',
        { max_length: 512, temperature: 0.7 }
      );
      setResult(output);
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  return (
    <div>
      <button onClick={analyze} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze Market'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
```

---

## 🖼️ Image Generation Example

```typescript
const imageOutput = await callHfApi(
  'Trading chart with bull flag pattern, financial dashboard style',
  'image-generation',
  {
    steps: 30,
    guidance_scale: 7.5,
    negative_prompt: 'low quality, blurry, distorted'
  }
);

// imageOutput is a Blob (image data)
const imageUrl = URL.createObjectURL(imageOutput);
```

---

## 🔧 API Endpoint Reference

### POST `/api/hf-server`

**Request Body:**
```json
{
  "prompt": "Your text or image prompt",
  "task": "text-generation|image-generation",
  "parameters": {
    "max_length": 768,
    "temperature": 0.85,
    "top_p": 0.95,
    "steps": 30,
    "guidance_scale": 6.5
  }
}
```

**Response (Text):**
```json
{
  "output": [
    {
      "generated_text": "Your generated trading strategy..."
    }
  ]
}
```

**Response (Image):**
```json
{
  "output": <Blob>
}
```

---

## 📊 Environment Variables

Copy to `.env.local`:

```bash
# Hugging Face API Token (REQUIRED - keep secret!)
HF_API_TOKEN=hf_YOUR_TOKEN_HERE

# Text Generation Model
HF_MODEL_ID=mistralai/Mistral-7B-Instruct-v0.1
LLM_MAX_LENGTH=768
LLM_TEMPERATURE=0.85
LLM_TOP_P=0.95

# Image Generation Model
HF_IMAGE_MODEL_ID=stabilityai/stable-diffusion-2-1
HF_IMAGE_STEPS=30
HF_IMAGE_GUIDANCE_SCALE=6.5
HF_IMAGE_NEGATIVE_PROMPT_DEFAULT=low quality, blurry

# Fine-Tuning Config
HF_HUB_MODEL_ID=irishpride81mf/tradehax-mistral-finetuned
DATASET_PATH=data/custom-llm/tradehax-training-expanded.jsonl
TRAIN_EPOCHS=3
TRAIN_BATCH_SIZE=4
TRAIN_LR=2e-5
LORA_R=16
LORA_ALPHA=32
```

---

## 🧪 Testing Checklist

- [ ] `.env.local` created with valid `HF_API_TOKEN`
- [ ] `npm install` completed
- [ ] `npm run llm:finetune:deps` completed
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `npm run dev` starts without errors
- [ ] API endpoint responds: `curl -X POST http://localhost:3000/api/hf-server ...`
- [ ] React component successfully calls `useHfClient()`

---

## 🚀 Production Deployment (Vercel)

1. Add environment variables to Vercel dashboard:
   - `HF_API_TOKEN` (keep marked as secret)
   - All other `HF_*` variables

2. Push to main:
   ```bash
   git add .
   git commit -m "feat: configure HF fine-tuning for production"
   git push origin main
   ```

3. Vercel auto-deploys. Test live endpoint:
   ```bash
   curl -X POST https://tradehax.net/api/hf-server \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Trading signal", "task": "text-generation"}'
   ```

---

## 💰 Monetization Opportunities

### Premium AI Queries
- Charge per API call for advanced LLM outputs
- Implement rate limiting + billing system
- Examples: custom trading analysis, market predictions

### Fine-Tuned Model Access
- Offer API access to fine-tuned Mistral model
- Subscription tiers (starter, pro, enterprise)

### Training Data Services
- Collect high-quality trading data
- Fine-tune models for other traders/platforms
- Sell model access via Hub

### Contact for Consultations
**Email:** irishmikeflaherty@gmail.com

---

## 📚 Full Documentation

- `docs/HF_FINE_TUNING_WORKFLOW.md` — Complete workflow guide
- `SETUP_VERIFICATION.md` — Detailed setup checklist
- `scripts/fine-tune-mistral-lora.py` — Training implementation

---

## 🆘 Troubleshooting

| Error | Solution |
|-------|----------|
| `HF_API_TOKEN is not defined` | Add to `.env.local`: `HF_API_TOKEN=hf_...` |
| `Module not found: @huggingface/inference` | Run: `npm install @huggingface/inference` |
| `Python module not found` | Run: `npm run llm:finetune:deps` |
| `CUDA out of memory` | Fine-tuning uses 4-bit quantization, should work on 8GB+ GPU |
| `API returns 500` | Check server logs: `npm run dev` and inspect `/api/hf-server` |

---

**Status:** ✅ Ready to integrate  
**Last Updated:** 2026-02-24  
**Commit:** 29b8ee9
