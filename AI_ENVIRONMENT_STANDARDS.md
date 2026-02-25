# TradeHax AI Environment Standards

This document defines a practical, production-grade baseline for the TradeHax LLM/GPT stack.

## Core Standards

- **Provider reliability**: configure one primary model (`HF_MODEL_ID`) and at least **2 fallback models** (`HF_FALLBACK_MODELS`).
- **Guardrailed generation**: keep temperature/top-p/max-length bounded and explicit.
- **Domain governance**: route per domain (`stock`, `crypto`, `kalshi`, `general`) and govern canary rollout via gates.
- **Safety in production**: keep open-mode flags off unless explicitly required.
- **Auditable config**: all env settings are validated via an automated doctor script.

## Commands

- `npm run ai:env:doctor`
  - Runs standards checks and fails only on critical issues.
- `npm run ai:env:doctor:strict`
  - Fails on warnings too; ideal for CI/CD gates.
- `npm run hf:sync-assets`
  - Syncs relevant datasets/model cards to the active Hugging Face account.

## Recommended Workflow

1. Copy values from `AI_ENVIRONMENT_TEMPLATE.env` to `.env.local`.
2. Set production values in your deployment environment (Vercel project settings).
3. Run `npm run ai:env:doctor` locally.
4. Run `npm run ai:env:doctor:strict` in CI before deploy.
5. Keep `HF_FALLBACK_MODELS` diversified (different model families where possible).

## Model Guidance (practical)

- **Fast + low cost**: `openai/gpt-5-mini`, `microsoft/phi-4-mini-instruct`
- **Balanced quality**: `openai/gpt-5`, `Qwen/Qwen2.5-7B-Instruct`
- **Reasoning heavy**: `openai/o3`, `deepseek/deepseek-r1-0528`

Use a cost-aware model for baseline and reserve premium models for high-value flows.

## Security Notes

- Never commit real tokens/keys.
- Use least-privilege tokens where possible.
- Rotate provider credentials on a schedule.
- Keep environment values in secret managers (not source control).
