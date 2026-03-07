# TradeHax Final JSX Merge

This folder packages your provided file `tradehax-final.jsx` into a runnable web module so it can be merged and deployed from the repository.

## Included

- `src/TradeHaxFinal.jsx` - merged app component with local quant AI fallback (no direct Anthropic dependency)
- `src/App.jsx` - router shell with pages `/` and `/tradehax`
- `src/main.jsx` - app entry point
- `package.json` - dependency manifest (includes `ethers`, `react-router-dom`)
- `vite.config.js` - dev/build config
- `scripts/smoke-test.js` - verification harness

## Routes

- `/` - lightweight launcher page
- `/tradehax` - full TradeHax GPT interface page
- External future option link is included to `https://tradehaxai.tech`

## Features

### 📊 Paper Trading Mode (NEW!)
- **VIEW-ONLY MODE** enabled by default for safe learning
- Analyze markets and test strategies without risking real funds
- Simulated order execution with P&L tracking
- Toggle between paper and live trading with one click
- Perfect for learning, strategy testing, and market research
- See `PAPER_TRADING_MODE.md` for complete documentation

### 🎯 Full Quant Stack

## Quick Validate

```bash
cd web
node scripts/smoke-test.js
```

## Run Locally

```bash
cd web
npm install
npm run dev
```

## Production Build

```bash
cd web
npm run build
npm run preview
```

## AI Runtime Mode

- Default behavior is fully local and deterministic (no external LLM call required).
- Optional adapter endpoint can be enabled with:
  - `VITE_AI_CHAT_ENDPOINT`
  - `VITE_AI_MODEL`
- If adapter calls fail, the app automatically falls back to local quant responses/signals.

## Wallet / Chain

- Wallet verification now uses `ethers` with Polygon RPC.
- Addresses are checksummed via `ethers.getAddress` before balance checks.

## Integration Into Existing Next.js App (if/when your main website source is available)

1. Copy `src/TradeHaxFinal.jsx` into your Next app component folder (for example `app/components/TradeHaxFinal.jsx`).
2. Create a route page and render it:

```jsx
// app/tradehax-final/page.jsx
import TradeHaxFinal from "@/app/components/TradeHaxFinal";

export default function Page() {
  return <TradeHaxFinal />;
}
```

## Notes

- This repo currently does not contain your full website source tree (`app/`, `src/`, `package.json` at root), so this merge is delivered as a deployable module under `web/`.
- Once your main web app files are present, this component can be moved into that app directly.
