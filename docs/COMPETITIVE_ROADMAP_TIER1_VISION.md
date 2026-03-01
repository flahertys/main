# TradeHax AI Hub: Competitive Advantage Roadmap

**Vision:** Build an AI platform where **speed, reliability, and actionable depth** *systematically* surpass ChatGPT, Claude, Perplexity, and specialized trading AI tools.

---

## Tier 1: Critical Foundation (Ship in Weeks 1–2)

### Why Tier 1?: These are blocking features that competitors have; skipping them leaves us behind from day one.

---

### **1. Response Replay Cache + Idempotent Response Serving** ⭐ HIGHEST IMPACT

**Why:**
- **Speed multiplier**: Repeated (user, prompt, SLO, model, tier) tuples return instantly (5–50ms vs 2–5s).
- **Cost reduction**: Eliminate redundant API calls and LLM invocations; massive margin improvement.
- **UX magic**: User hits "ask again" → instant response builds perception of exceptional speed.
- **Competitive gap**: Claude/ChatGPT don't offer session-scoped replay. Perplexity has some caching but no SLO-aware tuning.

**Implementation:**
- Create `lib/ai/response-cache.ts`
  - Keyed by: `sha256(userId | userPrompt | sloProfile | preset | freedomMode)`
  - Store: full response text + quality score + model used + timestamp.
  - TTL: 30 min (user session) or 7 days (user-global, tied to tier).
  - Fallback to DB for premium tiers; in-memory for free tier.
- Emit `replayed: true` in telemetry when cache hit.
- Surface "Quick replay ↻" badge in UI.

**Acceptance Criteria:**
- Cache hit returns response in <100ms.
- Cache miss cost = baseline streaming latency (no penalty).
- 85%+ cache hit rate within first week of cohort rollout.
- Telemetry shows cost savings (fewer LLM calls).

**Estimate:** 3–4 days (cache logic + storage + telemetry wiring).

---

### **2. Telemetry Persistence + Real-Time Analytics Dashboard**

**Why:**
- **Operator visibility**: See live quality, latency, domain distribution, SLO performance **per user tier**.
- **Data-driven ops**: Detect model failures, quality regressions, cost anomalies *immediately*.
- **Competitive moat**: Claude/ChatGPT operators have dashboards; we need *public-facing* (freemium) transparency.
- **Trust**: Show users they're getting what they paid for (SLO targets, credit usage accuracy).

**Implementation:**
- Save every `data-status` event to:
  - Postgres table: `ai_stream_telemetry` (userId, sloProfile, model, tier, latency, quality, costTokens, timestamp).
  - Real-time aggregation: `SELECT sloProfile, AVG(latency), MIN(quality), COUNT(*) FROM ai_stream_telemetry WHERE timestamp > now() - interval '1h' GROUP BY sloProfile`.
- Create `/ai-hub/analytics` page:
  - **Cards**: latency p50/p90, quality distribution (elite/strong/moderate/weak %), model success rate.
  - **Charts**: quality over time, latency trend, SLO adherence (% requests ≤ target).
  - **Filters**: by tier, preset, domain, past 1h/24h/7d.
- Emit alerts: quality drops below 60%, latency > 150% of target.

**Acceptance Criteria:**
- Dashboard loads in <2s.
- Latency data matches stream events ±100ms (validation check).
- <1s query latency for 7-day aggregation window.
- Visual proof that SLO targets are being met (or clearly missing).

**Estimate:** 4–5 days (DB table + aggregation logic + dashboard UI + alert wiring).

---

### **3. Adaptive SLO Fallback** (model degradation on latency overshoot)

**Why:**
- **Reliability magic**: If a model consistently exceeds SLO target, automatically downgrade to a faster alternative mid-stream.
- **Competitive gap**: Most AI tools do *static* fallback; we do *adaptive* fallback tied to real latency + SLO budget.
- **User trust**: "I asked for 2-second answers; you gave me 2-second answers" → predictability.

**Implementation:**
- Track model stream start time per `textPartId`.
- Calculate elapsed time at 50% token emission.
- If `elapsed > targetLatency * 0.7`, emit interrupt signal + switch to next candidate (latency-biased).
- In UI: Show "SLO adaptive fallback triggered: switched to [faster_model]" badge.
- Emit `sloFallbackTriggered: true` + `fromModel` + `toModel` in final telemetry.

**Acceptance Criteria:**
- Fallback decision made within 200ms of threshold breach.
- Fallback model completes within original SLO target (>90% success rate).
- User perceives no quality regression on fallback.

**Estimate:** 2–3 days (latency tracking + fallback decision logic + state wiring).

---

### **4. Multi-Modal Tab System** (text ↔ image ↔ video modality switching)

**Why:**
- **Workflow completion**: Users go from plan (text) → visual (image) → concept video in *one session*.
- **Competitive gap**: ChatGPT requires separate prompts per modality; Perplexity focused on search. We do *seamless handoff*.
- **Retention**: Multi-modal workflows increase session length + engagement.

**Implementation:**
- Add tab UI to ChatStreamPanel:
  - **Text tab**: existing streaming chat (active by default).
  - **Image tab**: "Generate image from last response" button → routes to `/api/ai/image` with context from chat.
  - **Video tab**: "Concept video" (locked until premium tier).
- Modality context passing:
  - Chat response text → auto-populate image prompt: `Extract visual concepts: [text summary]`.
  - Image result → offer image-as-reference for further chat refinement.
- Store modality selection state in session so user can flip back/forth.

**Acceptance Criteria:**
- Tab switching <300ms UX latency.
- Image generation inherits chat context without user re-prompt.
- User can refine image via chat ("more red", "remove background").

**Estimate:** 3–4 days (tabs + modality context passing + image prompt engineering).

---

## Tier 2: Competitive Moats (Ship in Weeks 3–4)

### Why Tier 2?: These features create *defensible* differentiation and lock in power users.

---

### **5. Session Memory + Conversation Threading**

**Why:**
- **Continuity**: User logs out → logs back in → continues exact conversation *without re-prompting*.
- **Context carryover**: All previous domain inferences, SLO targets, personalization survive session break.
- **Competitive gap**: Perplexity has basic session save; we do *full stateful resumption*.

**Implementation:**
- On chat submit: Save conversation state (messages + metadata) to `user_chat_sessions` table.
- On page load: Check for active/recent session → auto-restore messages + UI state (SLO choice, preset, etc.).
- Add session selector: "Resume earlier conversation" dropdown.
- Tie session lifecycle to user tier (free: 1 active, premium: 10 active).

**Acceptance Criteria:**
- Resume session restores all messages + SLO/preset choices in <500ms.
- Conversation picker UX is intuitive (sort by recency, show first 50 chars).

**Estimate:** 3–4 days (session table + state serialization + restore logic + UI picker).

---

### **6. Fine-Tuned Domain Models** (TradeHax-specific personas)

**Why:**
- **Moat**: A model trained on TradeHax trading data is *inherently* better at trading advice than generic LLMs.
- **Competitive gap**: Claude/ChatGPT are generic. We are *domain-specific*.
- **Trust signal**: "Trained on 50k+ TradeHax workflows" → credibility.

**Implementation:**
- Collect labeled training data from high-quality conversations (user + AI response pairs where user rated response ≥80% quality).
- Fine-tune a base model (e.g., Llama 3 8B) on TradeHax trading domain using Hugging Face.
- Deploy fine-tuned model alongside stock models.
- Route to domain model if:
  - Domain prediction confidence > 75%.
  - User is Premium tier.
  - Model availability + health is good.
- Telemetry: track domain model performance separately (quality, latency, cost).

**Acceptance Criteria:**
- Domain model quality score 5–10% higher on trading-specific queries.
- Domain model latency parity with base model (within 100ms).
- Clear telemetry that shows fine-tuned model was used.

**Estimate:** 5–7 days (data collection + fine-tuning + deployment + A/B wiring + monitoring).

---

### **7. Premium Tier SLO Guarantees + Availability SLA**

**Why:**
- **Monetization**: Charge for predictability. Tier structure: free (latency best-effort) → pro ($8/mo, p99 < 3s) → enterprise (99.9% uptime SLA).
- **Competitive gap**: Most AI tools don't publish SLOs; we do.
- **Trust + revenue**: Users pay for what they get (latency, availability, priority queue).

**Implementation:**
- Define tiered SLOs:
  - **Free**: latency best-effort, 80% monthly availability.
  - **Pro**: p99 latency ≤ 4s, 99% availability, priority model queue.
  - **Enterprise**: p99 ≤ 3s, 99.9% availability, dedicated model replica, SLA penalty credits.
- Implement priority queue:
  - Pro/Enterprise requests jump ahead of free tier requests (Redis queue with tier weights).
- Telemetry: measure actual SLO adherence.
- Publish monthly SLA report (transparency fetches trust + upsell).

**Acceptance Criteria:**
- Pro tier observes p99 latency ≤ 5s in real data (tight enough to be meaningful).
- Free tier requests never starved (fair scheduler, min 10% capacity reserved).
- SLA report generated monthly, published in `/status`.

**Estimate:** 4–5 days (queue isolation + tier weighting + SLA tracking + report automation).

---

## Tier 3: Scaling + Lock-In (Ship in Weeks 5–6)

---

### **8. Advanced Context Retrieval** (RAG + Knowledge Base)

**Why:**
- **Response quality**: Inject live market data + user's own documents → richer, contextual answers.
- **Competitive gap**: Perplexity does web search; we do search + user KB + market data all at once.
- **Stickiness**: User uploads their trading journal → model references it → high switching cost.

**Implementation:**
- Extend `lib/ai/retriever.ts`:
  - Add dual retrievers: (1) public KB (embedded docs), (2) user KB (vector search on user's uploaded PDFs/note history).
  - Hybrid search: BM25 (lexical) + embedding similarity, blend results.
- New API endpoint: `/api/ai/knowledge-management` (upload PDF, add note, search KBs).
- Context injection: Append top-k user KB results to system prompt.
- Telemetry: track which user KB docs are used (engagement signal).

**Acceptance Criteria:**
- User KB retrieval adds <500ms to round-trip latency.
- User-uploaded docs consistently improve response quality (measured via user ratings).

**Estimate:** 5–6 days (dual retriever + vector DB + upload handler + context blending).

---

### **9. A/B Testing Framework** (feature rollout + experimentation)

**Why:**
- **Rapid iteration**: Test new models, SLO thresholds, UI variants against real users segmented by cohort.
- **Data-driven decisions**: No guessing; measure impact on quality, latency, retention.
- **Competitive velocity**: We iterate faster → outpace competitors.

**Implementation:**
- Create `lib/experiments/ab-testing.ts`:
  - Stable hash function: `stableHash(userId + experimentId) % 100 < treatmentPercent`.
  - Experiment config: `{ experimentId, name, treatmentPercent, variants: { control: {...}, treatment: {...} } }`.
  - At stream time: determine cohort → apply variant params (model, SLO, prompt tweak, etc.).
- Telemetry: tag every event with `experimentId` + `variant`.
- Analytics: daily report on experiment metrics (latency, quality, cost per variant).

**Acceptance Criteria:**
- Can toggle any SLO/model/prompt param via experiment config in real-time.
- Experiment statistics dashboard shows p-values, confidence intervals.

**Estimate:** 3–4 days (A/B framework + telemetry tagging + stats dashboard).

---

### **10. Real-Time Market Context Integration** (live Solana signals + on-chain data)

**Why:**
- **Unique value**: Chat context includes *live market state* (price, volume, whale transactions, funding rates).
- **Competitive gap**: Generic AI tools ignore market state. We inject it automatically.
- **Trust**: Model's advice is grounded in *now*, not historical training data.

**Implementation:**
- Extend `lib/ai/market-freshness.ts`:
  - Add Solana RPC integration: fetch live SOL price, top SPL tokens, network state.
  - Add on-chain signals: whale wallet moves, DEX volume, lending rates.
  - Inject market summary into system prompt automatically (no user action required).
- Cache market data for 30s (balance freshness vs. rate limits).
- Telemetry: track market context utilization (was market data used in final response?).

**Acceptance Criteria:**
- Market context injection adds <100ms to request latency.
- Quality score improves 3–5% when market context is included (validation via user ratings).

**Estimate:** 4–5 days (RPC integration + signal aggregation + context injection + monitoring).

---

## Implementation Priority Matrix

| Feature | Tier | Impact | Effort | Ship Time | Blocker For? |
|---------|------|--------|--------|-----------|------------|
| Response Replay Cache | 1 | ⭐⭐⭐ (speed + cost) | Medium | Week 1 | None (foundational) |
| Telemetry Analytics | 1 | ⭐⭐⭐ (ops + trust) | Medium | Week 1–2 | SLO tuning decisions |
| Adaptive SLO Fallback | 1 | ⭐⭐ (reliability) | Low | Week 2 | Premium SLA |
| Multi-Modal Tabs | 1 | ⭐⭐⭐ (retention) | Medium | Week 2 | N/A |
| Session Memory | 2 | ⭐⭐ (continuity) | Medium | Week 3 | N/A |
| Fine-Tuned Models | 2 | ⭐⭐⭐ (moat) | High | Week 3–4 | None (parallel) |
| Premium SLO Tiers | 2 | ⭐⭐⭐ (revenue) | Medium | Week 4 | Adaptive fallback |
| Advanced Retrieval | 3 | ⭐⭐ (depth) | High | Week 5 | Knowledge UX |
| A/B Testing | 3 | ⭐⭐ (velocity) | Low | Week 5 | Experimentation needs |
| Live Market Context | 3 | ⭐⭐ (unique) | Medium | Week 6 | Data pipeline |

---

## Launch Gates: Readiness Criteria

### **Soft Launch (Week 2):**
- [x] Streaming chat lane (done)
- [x] SLO routing (done)
- [x] Safety panel (done)
- [x] Voice input (done)
- [ ] Response replay cache ← NEXT
- [ ] Telemetry dashboard
- [ ] Adaptive fallback

**Success metric:** 500+ beta users, >60% quality score, <4s p95 latency, <0.5% error rate.

### **Public Beta (Week 4):**
- All soft launch features completed
- [ ] Session memory
- [ ] Multi-modal tabs
- [ ] Premium tier ($8/mo) with SLO guarantees

**Success metric:** 5k users, 10% conversion to paid, NPS > 50.

### **General Availability (Week 6):**
- All above + fine-tuned models + advanced retrieval + A/B testing.

**Success metric:** 50k users, 20% paid tier, <2% churn, NPS > 65, revenue from AI Hub > $10k MRR.

---

## Why This Roadmap Crushes Competitors

| Competitor | Our Advantage |
|---|---|
| **ChatGPT** | SLO guarantees + market context + session persistence + domain fine-tuning |
| **Claude** | Real-time analytics visibility + response replay + trading-specific KB |
| **Perplexity** | Multi-modal workflows + session threading + premium tier SLA guarantees |
| **Specialized trading AI** | Beginner onboarding (not just power users) + audio voice + community features |

---

## Success Metrics (OKRs)

**Q1 Objective:** Establish AI Hub as *the* go-to chat interface for traders (from beginner to institutional).

**Key Results:**
1. 50k weekly active users by end of Q1.
2. 20% free-to-paid conversion by week 6.
3. NPS ≥ 65 (from Net Promoter Score survey).
4. <2% churn rate on paid tier.
5. <2s p95 latency consistently (SLO adherence ≥ 99%).

---

## Rollout Strategy

**Week 1–2: Foundation**
- Replay cache + telemetry dashboard + adaptive fallback + multi-modal tabs.
- Internal testing with 100 beta users.

**Week 3–4: Differentiation**
- Session memory + premium tier + fine-tuned models.
- 5k beta users on staging.

**Week 5–6: Scale + Monetization**
- Advanced retrieval + A/B testing + live market context.
- Public launch with free + premium tiers.
- Marketing push: "AI for traders, by traders."

---

## Contingency Plan

**If we hit delays:**
1. Defer fine-tuned models → use stock models with aggressive prompt engineering.
2. Defer advanced retrieval → keep X-context + market freshness only.
3. Defer A/B testing → use feature flags (simpler, sufficient for MVP).
4. **Never defer:** replay cache, telemetry, SLO commitment (these are customer-facing promises).

---

## Next Immediate Action

**Start Week 1:**
1. Implement response replay cache (highest multiplier for speed + cost).
2. Wire telemetry persistence + dashboard (ops visibility).
3. Ship adaptive SLO fallback (reliability credibility).
4. Add multi-modal tabs (retention + UX polish).

**Owner:** AI Hub tech lead + 2 engineers.

