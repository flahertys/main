# TradeHax Local Pipeline Quickstart

A clean, repeatable local workflow from repository root (`c:\tradez\main`).

## Core Commands

- `npm run hf:automation`  
  Runs the full automation orchestrator (validation + setup guidance).

- `npm run hf:validate`  
  Runs deployment/environment validation checks.

- `npm run hf:pipeline`  
  Runs `hf:validate` + code quality checks (`lint` + `type-check`).

- `npm run hf:pipeline:strict`  
  Runs `hf:pipeline` + production build (`next build`).

- `npm run hf:test-inference`  
  Runs inference endpoint tests (supports `TRADEHAX_TEST_BASE_URL`).

## Suggested Daily Flow

1. `npm run hf:pipeline`
2. If release day: `npm run hf:pipeline:strict`
3. If deploying model/API changes: `npm run hf:test-inference`

## Notes

- If your active deployment domain is not `tradehax.net`, set:
  - `TRADEHAX_TEST_BASE_URL=https://<your-active-domain>`
- Validation warnings for unset local secrets are expected on fresh environments.
