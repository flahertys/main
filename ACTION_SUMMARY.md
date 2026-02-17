# TradeHax AI Upgrade Action Summary (Planning Kickoff)

## Mission Mined From Prompt
- Preserve the mystical/astral TradeHax identity while raising trust and professionalism.
- Keep existing working features, but organize them into a clearer end-to-end pipeline.
- Make monetization first-class: bookings, subscriptions, NFT minting, and upsells.
- Improve usability hard, especially mobile and first-time user clarity.
- Connect game progression and artifact economy to future Web5/L2 token strategy.

## Non-Negotiable Design Direction
- Dark foundation (`#0A0F1E` range), neon green highlights, purple/pink action gradients.
- Hybrid visual language: matrix + runes + shamrock + surreal maze motifs.
- Strong typography hierarchy: futuristic display + readable body text.
- Intentional motion: glow pulses, guided transitions, puzzle feedback states.

## Current State (Repo-Accurate)
- Homepage, sections, and matrix theme already exist in `app/page.tsx` and `app/globals.css`.
- Main routes already exist: `about`, `crypto-project`, `services`, `pricing`, `schedule`, `game`.
- Solana wallet/provider setup already exists in `app/layout.tsx` and `components/counter/provider/Solana.tsx`.
- Monetization scaffolding exists (`components/monetization/*`, `MONETIZATION_GUIDE.md`).
- Game has first-person puzzle framework and mobile controls in `components/game/HyperboreaGame.tsx`.

## Gaps To Close Next
- Brand asset pass: old-site banner/runes/gallery still partial placeholders.
- Stronger funnel consistency between Home -> Services/Pricing/Schedule/Crypto Project.
- Production-grade mint/payment backend paths and conversion tracking.
- Structured level pipeline for game content (Zelda-like puzzle cadence + artifact economy loops).
- Final mobile/browser polish matrix and formal accessibility audit.

## Prioritized Implementation Plan

### P0: Brand + Conversion Foundations (Week 1)
- Replace remaining placeholder media with curated legacy/HYPERBOREA assets under `public/`.
- Normalize CTA stack across key pages (`/`, `/services`, `/pricing`, `/schedule`, `/crypto-project`).
- Add persistent top-level conversion strip (Book, Mint, Subscribe, Contact).
- Create a single source of truth for theme tokens and component variants.
- Deliverable: coherent visual/CTA system that matches family-brand tone and old-site DNA.

### P1: Service Monetization Pipeline (Week 2)
- Upgrade `services`, `pricing`, `schedule` pages into a unified booking funnel.
- Add structured service cards: Repair, Lessons, Digital/Web3 with explicit upsell links.
- Add conversion events for click-through, checkout start, and booking submit.
- Wire Stripe checkout stubs to secure API routes (no client secrets).
- Deliverable: measurable service-to-revenue flow with analytics events.

### P2: Crypto + Membership Pipeline (Week 3)
- Expand `/crypto-project` with guided wallet onboarding and clear mint states.
- Add free mint + premium upgrade UX states (queued, pending, confirmed, failed).
- Add membership tier messaging tied to NFT utility and gated perks.
- Validate Solana Devnet path first; isolate Mainnet config behind env gating.
- Deliverable: stable mint onboarding loop linked to monetization messaging.

### P3: Game Content Pipeline (Week 4)
- Introduce level authoring schema and content pipeline docs in `lib/game/` + `public/levels/`.
- Add curated level progression: intro -> lock/key -> pressure plate -> pedestal -> portal.
- Add clearer in-game objectives and reward telemetry per artifact.
- Connect artifact claim queue to token/reward roadmap messaging (Web5/L2 ready design).
- Deliverable: user-friendly puzzle progression with collectible economy hooks.

### P4: Trust, SEO, Accessibility, and Deployment Hardening (Week 5)
- Accessibility pass: keyboard paths, focus order, ARIA labels, contrast checks.
- SEO pass: metadata consistency, OG images, sitemap/robots verification.
- Security pass aligned to `SECURITY.md`: env hygiene, endpoint validation, rate guardrails.
- Deployment verification against `VERCEL_DOMAIN_SETUP.md` and analytics dashboards.
- Deliverable: production readiness checklist completed with evidence.

## File-Level Execution Map
- Theme system: `tailwind.config.ts`, `app/globals.css`
- Layout + global trust/conversion components: `app/layout.tsx`, `components/shamrock/*`
- Homepage funnel: `app/page.tsx`
- Service funnel: `app/services/page.tsx`, `app/pricing/page.tsx`, `app/schedule/page.tsx`
- Crypto funnel: `app/crypto-project/page.tsx`, related Solana utilities in `lib/`
- Game pipeline: `app/game/GamePageClient.tsx`, `components/game/HyperboreaGame.tsx`, `public/levels/*`, `lib/game/*`
- Monetization telemetry: `components/monetization/*`, `lib/analytics.ts`, API routes under `app/api/*`

## Required Assets + Inputs
- Final banner image set (desktop + mobile crops).
- Gallery pack (legacy site captures + curated HYPERBOREA visuals).
- Final family-brand copy blocks (about statement, service guarantees, response SLA).
- Payment product IDs, wallet/mint policy, and token nomenclature decisions.

## Immediate Next Build Steps
1. Create `public/brand/` and `public/gallery/` finalized asset manifest and mapping.
2. Implement shared CTA rail component and inject into home/services/crypto pages.
3. Build the service conversion event map and hook it into all high-intent buttons.
4. Add level-content authoring guide and ship one polished tutorial level iteration.
