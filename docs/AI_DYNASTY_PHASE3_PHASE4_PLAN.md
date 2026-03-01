# AI Dynasty Phase 3–4 Execution Plan

## Scope

This plan operationalizes the requested Phase 3/4 direction for TradeHax AI Hub with a **modular UX** and a **chat-first architecture**.

- Voice mode: browser Web Speech API (beta)
- Multimodal: text + image now, video generation through provider adapter next
- Context layer: X ecosystem search toggle with API abstraction
- Safety posture: open-prompt UX with explicit illegal-content blocking
- Scale posture: Vercel now, Kubernetes-ready interface contracts

## What is now implemented

1. **Modular voice + context panel**
   - `components/ai/VoiceSearchControlPanel.tsx`
   - Voice capture toggle (beta), open prompts toggle, and X context search toggle.

2. **X ecosystem context endpoint**
   - `app/api/ai/x-ecosystem-search/route.ts`
   - Supports provider proxy via env config and local fallback payload for resilience.

3. **Landing CTA for assistant entry**
   - `app/page.tsx`
   - Added **Enter AI Dynasty** button routing to `/ai-hub#ai-chat`.

4. **AI Hub integration**
   - `app/ai-hub/page.tsx`
   - Added the new modular control panel above Smart Environment Monitor.

5. **Streaming `useChat` beta lane (frontend + backend)**

- `components/ai/ChatStreamPanel.tsx`
- `components/ai/SafetyStateBanner.tsx`
- `components/ai/ContextSignalPanel.tsx`
- `app/api/ai/use-chat/route.ts`
- Added Vercel AI SDK transport with live streaming, preset/style/freedom metadata, retrieval context, and model-routing parity signals.

## Phase 3 backlog (6–12 weeks)

### Frontend

- Replace legacy fetch chat composer with Vercel AI SDK `useChat`-based streaming module.
- Split assistant UX into composable modules:
  - `ChatStreamPanel`
  - `VoiceModePanel`
  - `ContextSignalPanel`
  - `SafetyStateBanner`
- Add multimodal tabs: Text, Image, Video (provider-adapter based).

### Backend/AI

- Add streaming chat endpoint aligned to Vercel AI SDK transport format.
- Add provider adapters:
  - `llmProviderAdapter` (HF/custom model routing)
  - `imageProviderAdapter` (FLUX.1-like defaults)
  - `videoProviderAdapter` (future Veo-like endpoint contract)
- Add Solana signal ingestion service interface with latency/quality telemetry.
- Add Supabase storage profile for non-retained history mode.

### Security

- Client-side encrypted session cache (Web Crypto API + passphrase/device key).
- Open prompt mode policy: block illegal content classes while keeping broad lawful prompts.
- 2FA enhancement path: TOTP + backup codes + device trust.

### Testing

- Onboarding completion within 60 seconds target.
- Streaming stability checks for token order, truncation, and prompt corruption.
- Prompt-resilience tests for “scrambled context” regressions.

## Phase 4 rollout (week 12+)

### Launch

- GitHub beta branch with auto-deploy to Vercel preview/prod.
- Tiering model:
  - Free core usage
  - Premium upgrades (`$8–$20` target band)

### Monitoring

- Track:
  - conversation depth
  - first-value time
  - feature adoption (voice/search/image)
  - quant output consistency
  - retention and satisfaction scores

### Iteration cadence

- Monthly model benchmark pass.
- Quarterly provider refresh and UI refinement.
- Community-driven feature voting for audio/video generation expansions.

## Environment variables

Add these to your deployment environment when enabling external X search provider:

- `X_SEARCH_API_URL=`
- `X_SEARCH_API_KEY=`

If absent, the endpoint falls back to internal sample signal payloads.

## Notes

- “Uncensored” UX language should remain mapped to lawful-use constraints in implementation.
- Keep all high-risk controls server-governed (not client-only flags).
