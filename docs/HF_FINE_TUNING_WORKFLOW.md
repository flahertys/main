# Hugging Face Fine-Tuning Workflow for TradeHax.net

## Overview

This workflow fine-tunes Mistral-7B for multi-purpose AI on TradeHax datasets, using LoRA for efficiency. Integrates with Next.js API for production use.

## Steps

1. Install Python **3.10 or 3.11** (required for `torch`/`transformers` in this workflow).
2. Set `HF_API_TOKEN` in env (required if pushing to Hub).
3. Run automated workflow:
   - Install deps + train: `npm run fine-tune -- --install-deps`
   - Train + push adapter: `npm run fine-tune -- --push`
4. Update `.env` `HF_MODEL_ID` to the fine-tuned model.
5. Redeploy to Vercel.

## Configs

- Dataset: data/custom-llm/*.jsonl
- Model: mistralai/Mistral-7B-Instruct-v0.1 -> irishpride81mf/tradehax-mistral-finetuned
- Params: epochs=3, batch=4, lr=2e-5, LoRA r=16 alpha=32

## Testing

- API call: POST /api/hf-server with {"prompt": "Test trading query"}
- Monitor: Use Hugging Face Hub for model metrics.

## Notes for Windows

- `bitsandbytes` is disabled on Windows by default in this setup.
- If your machine only has Python 3.14+, the workflow will stop early and prompt you to install Python 3.11.
