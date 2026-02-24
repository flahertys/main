# TradeHax Hugging Face Fine-Tuning Workflow (LoRA + 4-bit)

This runbook is tailored to the current repo and model loading path in `lib/ai/hf-server.ts`.

## Security first

- Do **not** hardcode Hugging Face tokens in code.
- Use `HF_API_TOKEN` in local environment only.
- If a token was shared in chat/logs, rotate it immediately in Hugging Face settings.

## 1) Prepare dependencies

### Node.js app dependencies

Use your existing workflow:

- `npm install`

### Python training dependencies

Install from the repo file:

- `pip install -r scripts/fine-tune-requirements.txt`

## 2) Prepare dataset

You can fine-tune from:

- `tradehax-training-expanded.jsonl` (root)
- or generated datasets such as `data/custom-llm/train.jsonl`

Supported JSONL row formats by the script:

1. `{ "text": "..." }`
2. `{ "messages": [{"role":"user|assistant|system","content":"..."}, ...] }`
3. `{ "instruction": "...", "input": "...", "output": "..." }`

## 3) Configure environment

Use placeholders in `.env` (already present in repo template):

- `HF_API_TOKEN`
- `HF_MODEL_ID`
- `HF_HUB_MODEL_ID`
- `HF_DATASET_PATH`
- `HF_OUTPUT_DIR`
- `HF_PUSH_TO_HUB`

## 4) Run fine-tuning

Run the script:

- `python scripts/fine-tune-mistral-lora.py --dataset tradehax-training-expanded.jsonl --push-to-hub`

If you want local-only output, omit `--push-to-hub`.

## 5) Output artifacts

The script saves LoRA adapter files under:

- `artifacts/fine-tuned-tradehax-mistral/lora-adapter`

If `--push-to-hub` is enabled, it publishes adapter/tokenizer to your configured Hub repo.

## 6) Integrate into TradeHax runtime

Your server resolver in `lib/ai/hf-server.ts` already reads:

- `HF_MODEL_ID`

So after publishing your fine-tuned model (or merged artifact), set:

- `HF_MODEL_ID=irishpride81mf/tradehax-mistral-finetuned`

Then restart the Next.js server.

## 7) Validate

- Run `npm run type-check`
- Run `npm run lint`
- Hit an existing route using the HF client (`/api/llm` or `/api/ai/chat`) to confirm response path works.

## Practical notes

- Start with smaller subset + fewer epochs for fast iteration.
- LoRA + 4-bit is the right choice for lower cost and memory pressure.
- For production, consider adapter merging or dedicated inference endpoint based on throughput/latency goals.

