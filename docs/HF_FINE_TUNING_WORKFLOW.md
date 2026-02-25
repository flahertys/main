# Hugging Face Fine-Tuning Workflow for TradeHax.net

## Overview
This workflow fine-tunes Mistral-7B for multi-purpose AI on TradeHax datasets, using LoRA for efficiency. Integrates with Next.js API for production use.

## Steps
1. Install deps: `pip install -r scripts/fine-tune-requirements.txt`
2. Set HF_API_TOKEN in env.
3. Run: `node scripts/run-finetune-workflow.js` or directly `python scripts/fine-tune-mistral-lora.py`
4. Update .env HF_MODEL_ID to fine-tuned model.
5. Deploy to Vercel.

## Configs
- Dataset: data/custom-llm/*.jsonl
- Model: mistralai/Mistral-7B-Instruct-v0.1 -> irishpride81mf/tradehax-mistral-finetuned
- Params: epochs=3, batch=4, lr=2e-5, LoRA r=16 alpha=32

## Testing
- API call: POST /api/hf-server with {"prompt": "Test trading query"}
- Monitor: Use Hugging Face Hub for model metrics.
