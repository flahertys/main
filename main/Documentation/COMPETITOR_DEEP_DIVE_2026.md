# Competitor Deep Dive (2026): Trading Assistant Niche

## Scope
This review focuses on product capabilities, UX patterns, and technical architecture from public information and hands-on observable behavior. It does not copy proprietary code.

## Top 2 Competitors

### 1) TradingView (with AI/automation ecosystem)
**Why it matters**
- Largest active retail trading surface (charting + alerts + social + scripting).
- Strong workflow lock-in via charts, watchlists, alerts, and Pine ecosystem.

**Strengths**
- Best-in-class chart UX and market coverage.
- Massive indicator/script catalog and community discoverability.
- Multi-device consistency and low-friction alert workflows.

**Weaknesses / Opportunity for TradeHax**
- High cognitive load for less technical users.
- Strategy explainability is fragmented (script quality varies).
- AI assistant behavior often depends on external tooling and user setup.

**What to emulate (clean-room)**
- Alert-first workflows with fewer clicks.
- Explainability cards attached to each signal.
- Session memory for user intent and risk profile continuity.

### 2) TrendSpider (AI-assisted technical analysis)
**Why it matters**
- Strong automation around pattern detection and scanner workflows.
- Appeals to users wanting actionable TA automation without deep coding.

**Strengths**
- Structured scanner and strategy concepting tools.
- Practical TA-focused assistant experience.
- Good bridge between discretionary and systematic workflows.

**Weaknesses / Opportunity for TradeHax**
- Narrower ecosystem/community network effects than TradingView.
- Less flexibility for multi-asset narrative + execution context.
- Opportunities to improve conversational signal QA and risk governance.

**What to emulate (clean-room)**
- Scanner templates mapped to user style and risk.
- "Why now" summaries with confidence/risk decomposition.
- Fast path from insight -> plan -> risk limits.

---

## Gap Map vs TradeHax

### Current TradeHax Strengths
- Multi-provider AI with fallback and validation pipeline.
- Structured output and hallucination controls.
- Context manager + signal explainability architecture.

### Priority Gaps
1. **Scanner UX layer**: one-click scanner presets by user profile.
2. **Chart-context grounding**: lightweight technical context snapshots in prompts.
3. **Alert execution loop**: assistant recommendations tied to explicit trigger states.
4. **Cross-session continuity**: stronger memory-backed coaching progression.

---

## 90-Day Build Priorities

### P1 (Weeks 1-3)
- Add signal preset library and scanner preset cards.
- Add explainability scorecards into assistant responses.
- Add confidence/risk decomposition in `signal-explainability-engine.ts`.

### P2 (Weeks 4-7)
- Add alert-state machine and execution checklists.
- Add profile-aware prompt templates in `web/api/ai/chat.ts`.
- Add mobile-first condensed console cards for signal triage.

### P3 (Weeks 8-12)
- Add benchmark tracking: signal win-rate, drawdown adherence, actionability score.
- Add A/B prompt cohorts to improve consistency and conversion.

---

## Success Metrics
- +20% assistant actionability score.
- +15% user return rate in 14 days.
- -30% low-quality output incidents.
- +10% plan-to-execution conversion.

---

## Compliance Note
All implementation should use permissive-licensed OSS and internal clean-room development. No proprietary source cloning.

