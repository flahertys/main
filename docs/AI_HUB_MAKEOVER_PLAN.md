<!-- cspell:ignore TradeHax -->

# TradeHax AI Hub Makeover Plan (2026 Alpha)

## Objective

Redesign the AI Hub into a **chat-first, beginner-safe, high-power workspace** that feels as easy as mainstream AI products while preserving TradeHax depth.

North-star outcomes:

- New users can complete first success in under 2 minutes.
- Power users still access advanced controls in under 2 clicks.
- UI is understandable for broad age and experience ranges.

## Why this is needed (current-state audit)

Observed in current implementation (`components/landing/AINeuralHub.tsx`):

- One mega-component with ~4.5k lines and high local-state density.
- 3 tabs (`CHAT`, `IMAGE_GEN`, `MARKET`) contain many nested controls and domain-specific jargon.
- Advanced controls are surfaced too early, before user intent is clear.
- Multiple capability clusters (memory, presets, social ops, datasets, autopilot, market) compete for attention in one viewport.

Result: feature-rich but cognitively heavy for average users.

## External UX patterns worth adopting (inspiration, not cloning)

From benchmarked products:

- **Single conversation surface first**; tools are secondary overlays.
- **Simple pricing/usage language** (clear free limits, clear upgrade path).
- **Mode and model selection are visible but non-blocking**.
- **Quick-start templates** near the composer.
- **Feature tiers and credits** are explained in plain language.
- **API/dev mode is separate from beginner mode**.

## Product principles for new AI Hub

1. **Chat is home**: everything starts in one composer.
2. **Progressive disclosure**: advanced controls hidden by default.
3. **Intent over settings**: ask “What do you want done?” before “Which model?”
4. **All-ages readability**: plain labels, large targets, low-jargon copy.
5. **Safe-open transparency**: explicit mode badges and clear boundary messaging.
6. **One action per screen**: every panel ends with a clear next step CTA.

## New Information Architecture

Primary nav (left rail on desktop, bottom nav on mobile):

- **Chat** (default)
- **Create** (text/image/video)
- **Market** (live feed + market prompts)
- **Automations** (social/autopilot)
- **Library** (memory, presets, snapshots, files)
- **Settings**

Global top bar:

- Workspace selector
- Mode badge (`Standard`, `Open`, `ODIN Alpha`, `ODIN Overclock`)
- Model picker (collapsed by default, searchable)
- Credits/usage pill

Right context rail (collapsible):

- Prompt shortcuts
- Live market snapshot
- “Next best action” card

## UX flows (target)

### Flow A: First-time user (2-minute win)

1. Landing in `Chat` with starter chips.
2. User picks goal chip (`Learn`, `Trade plan`, `Create post`, `Generate image`).
3. Assistant asks 1-2 clarifying questions.
4. System returns answer + one next action button.

### Flow B: Creator workflow

1. Start in chat with objective.
2. Click `Convert to Post` or `Generate Image` quick action.
3. Open split drawer for generated assets.
4. Save to Library or queue to Automation.

### Flow C: Power user workflow

1. Toggle Advanced Mode.
2. Access model routing, temperature, depth, ODIN profile.
3. Persist as named preset.

## UI copy and language rules

- Replace jargon labels (e.g., “NEURAL_DIFF_V4”) with user labels (e.g., “Fast Image Model”).
- Keep helper text under 14 words where possible.
- Use sentence case for labels, not all-caps except badges.
- Show one-line explanations next to every advanced toggle.

## Accessibility + all-ages standards

- WCAG AA contrast minimum for all text and controls.
- Minimum 44px touch targets on mobile.
- Optional **Comfort Mode**:
  - larger text,
  - reduced animation,
  - simplified layout,
  - high-legibility color palette.
- Reading-level target: approximately 6th–8th grade for critical instructions.
- Keyboard-first command navigation retained for advanced users.

## Safety/Open-mode positioning

The product can support “open” experiences while remaining clear and responsible:

- Mode banner always visible.
- Plain-language disclosure of what the mode changes.
- Age gate + explicit consent for open modes.
- Strong privacy and data-use disclosure.

## Feature parity map (Gab-style capabilities → TradeHax implementation)

1. Unified chat for many tools → Keep, but route via quick actions.
2. Multi-model access → Keep with simplified model browser.
3. Images/media generation → Keep, move into `Create` lane.
4. Memory and history → Keep, move to `Library` lane.
5. Web/market freshness → Keep with trust badge and source timestamp.
6. Credits/usage visibility → Elevate to top bar and response footer.
7. API/developer access → Keep on separate developer page, not in beginner flow.

## Engineering refactor plan

### Phase 1 (1-2 weeks): UX shell + low-risk wins

- Make `/ai-hub` the canonical entry for beginners.
- Add mode/usage badges to top bar.
- Default to chat-first layout and collapse advanced settings.
- Replace hard technical labels with plain-language aliases.
- Add starter chips and one-click guided goals.

### Phase 2 (2-4 weeks): Component decomposition

- Split `AINeuralHub` into:
  - `HubShell`
  - `ChatWorkspace`
  - `CreateWorkspace`
  - `MarketWorkspace`
  - `AutomationWorkspace`
  - `LibraryWorkspace`
  - shared `HubState` (context/reducer or store)
- Move persistence and side effects into dedicated hooks.

### Phase 3 (3-5 weeks): Differentiated intelligence layer

Goal: ship the capabilities users consistently miss in mainstream AI products — reliability under pressure, grounded reasoning, role-aware guidance, and privacy-controlled memory.

#### Phase 3 feature set (must include)

- **Next-best-action engine (context + confidence aware):** Recommend 1-3 concrete next moves after each response, show confidence band (`high`, `medium`, `low`) with rationale, and provide a fallback action when confidence is low.
- **Adaptive cognitive layer (age/skill/intent aware):** Dynamically shape outputs by profile (`new`, `intermediate`, `power`) and behavior; auto-adjust between simple step plans and operator-depth detail; include one-click “Explain like I’m new” rewrites.
- **Grounded reasoning + source integrity rail:** Add source badges with freshness timestamps, separate facts vs assumptions vs hypotheses, and flag contradictions when sources conflict.
- **Memory with user sovereignty controls:** Support `session`, `workspace`, and `personal vault` memory classes with per-item visibility controls, one-click revoke/delete, and a “why this was remembered” line.
- **Multi-model orchestration (quality + latency routing):** Route by task type (chat, summarize, generate, analyze), include retry/fallback ladders for provider degradation, and show human-readable route metadata in the response footer.
- **Operator-grade quality loop (self-critique + repair):** Add optional second-pass self-check for high-stakes prompts, structured partial-output recovery, and one-click post-processing actions (`tighten`, `verify`, `simplify`).
- **Automation copilot with safety checkpoints:** Enforce draft → approve → schedule flows, add guardrails for irreversible actions, and require preview diffs before execution.
- **Coach overlay v2 (first 3 sessions + contextual recurrence):** Trigger guided overlays based on confusion signals (retries, abandonments, idle time) and track milestone completion memory.

#### ODIN lane (superuser capabilities, mandatory)

- **Mission Control console:** One surface to orchestrate multi-step objectives (research → draft → verify → publish) with explicit stage state, retries, and rollback.
- **Agentic runbooks + macros:** Save repeatable workflows as named runbooks (inputs, tools, checks, outputs) and execute with one command.
- **Reasoning trace controls:** Toggle concise/expanded rationale views with provenance links and confidence deltas between revisions.
- **Deterministic mode for critical tasks:** Re-runs with fixed parameters should produce stable outputs within bounded variance and explicit drift notes.
- **Policy simulator + preflight checks:** Simulate policy/risk outcomes before sensitive actions and block unsafe execution without override permissions.
- **Multi-model arbitration panel:** Compare model candidates side-by-side (quality, latency, cost, reliability), then auto-route by policy.
- **Tool execution sandbox:** Require scoped permissions for privileged actions, with approval checkpoints and auditable action logs.
- **Live recovery and self-healing:** Detect failed tool steps, auto-suggest repair paths, and preserve partial progress instead of hard resets.
- **Memory graph explorer:** Query what the system knows, why it knows it, and remove or relabel nodes with immediate propagation.
- **Superuser command palette:** Natural-language plus slash-command control for routing, debugging, replay, and runbook invocation.

#### Market-void coverage map (what others often miss)

- **Black-box answers** → solve with source integrity rail + assumptions split.
- **Weak personalization** → solve with adaptive cognitive layer + profile-aware outputs.
- **Memory distrust** → solve with user sovereignty controls + revoke transparency.
- **Provider fragility/outages** → solve with multi-model routing + fallback ladder.
- **Hallucination under ambiguity** → solve with confidence bands + low-confidence fallback actions.
- **Beginner abandonment** → solve with coach overlay + “new-user rewrite” control.
- **Power-user frustration** → solve with operator-grade quality loop + advanced action post-processing.

#### Acceptance criteria (Phase 3 exit gates)

- 95%+ of grounded responses include source timestamp metadata when sources are used.
- 90%+ of responses include at least one actionable next step.
- 99.5% automation actions show a pre-execution preview.
- 100% memories are user-visible and user-removable from UI.
- 25% reduction in “I don’t know what to do next” feedback events.
- 20% reduction in first-week abandonment for new users.

#### ODIN exit gates (superuser readiness)

- 95%+ of runbook executions complete with full stage-level logs and replay support.
- 99%+ privileged tool actions require explicit permission context and are audit-recorded.
- 90%+ failed automation/tool runs surface at least one actionable auto-repair option.
- Deterministic mode re-run variance stays within defined thresholds for supported task classes.
- 100% memory graph entries are inspectable for source/provenance and user-removable.
- 30% reduction in power-user multi-step task completion time vs pre-ODIN baseline.

#### Implementation notes

- Build behind feature flags (`hub_phase3_*`) for controlled rollout.
- Use experiment cohorts for onboarding and recommendation variants.
- Log recommendation acceptance/rejection and fallback usage for tuning.
- Gate superuser features by role/capability flags (`hub_odin_*`) with progressive rollout.
- Maintain dual UX lanes: beginner-safe defaults, superuser console opt-in.
- Emit structured telemetry for runbook success, arbitration choices, and repair path outcomes.

### Phase 4 (1-2 weeks): polish + experiments

- A/B test simplified vs advanced-first controls.
- Tune copy, spacing, and mobile nav from telemetry.

## Metrics (must-track)

- Time-to-first-success (TFS)
- Completion rate of first guided flow
- Prompt-to-response iteration count per successful session
- Error/abandonment rate by step
- Upgrade conversion from free usage wall
- Retention day 1/day 7 for new users

Success targets:

- 30% reduction in first-session abandonment
- 40% increase in first-session completion
- 20% reduction in support requests related to “how to use the hub”

## Immediate quick wins (this sprint)

1. Route homepage AI CTA to `/ai-hub` beginner flow by default.
2. In `AINeuralHub`, hide advanced controls behind `Advanced` accordion.
3. Add starter prompt chips directly above composer.
4. Rename technical model IDs in UI to plain names + “best for” hint.
5. Add persistent “What to do next” card under every AI response.
6. Add mobile bottom action bar: `Chat`, `Create`, `Market`, `Help`.

## Delivery artifacts to produce next

- High-fidelity wireframes (desktop + mobile) for `Chat`, `Create`, `Market`.
- Component map + migration checklist from existing `AINeuralHub` sections.
- UX copy deck (beginner, neutral, advanced tone variants).
- Telemetry spec for funnel and feature discoverability.

