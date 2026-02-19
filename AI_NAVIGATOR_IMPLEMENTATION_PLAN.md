# Site AI Navigator + Behavior Intelligence Plan

## What is now implemented (Phase 1)

- Global **Site Navigator widget** available across the site (`Need Help?` launcher).
- New API route: `POST /api/ai/navigator`
  - Interprets intent (onboarding, trading, billing, game, AI tools, etc.)
  - Returns route suggestions with confidence
  - Uses Hugging Face model when available, deterministic fallback when not
  - Logs behavior + metadata (route, intent, suggestion count)
- New API route: `POST /api/ai/behavior/track`
  - Tracks user behavior and metadata events from frontend/backend
- New admin dataset route: `GET /api/ai/admin/site-dataset`
  - `?format=json` for structured rows
  - `?format=jsonl` for fine-tuning export
- New interpreter + site knowledge modules:
  - `lib/ai/site-intent.ts`
  - `lib/ai/site-map.ts`
  - `lib/ai/site-dataset.ts`

## Proper place to store LLM + user input data

### Recommended canonical store (production)

- **Postgres-backed managed database** as system of record
- Schema starter: `db/supabase/ai_behavior_foundation.sql`
- Store only **pseudonymous user keys** (hashed)
- Keep sensitive values redacted before persistence

### Why this is the right first storage layer

- Query-friendly for analytics and model training slices
- Durable across serverless runtime instances (unlike in-memory runtime store)
- Supports RLS and service-role ingestion policy

## New user directions (UX behavior)

The widget is your onboarding chatbot:

1. User clicks **Need Help?**
2. User asks a goal-oriented question (e.g., “Where do I start?”)
3. Navigator returns concise next steps and clickable route chips
4. Click behavior is logged for future model tuning

This makes navigation self-service while collecting structured “intent -> route” data.

## Next upgrades (Phase 2)

1. Wire `ingestBehavior` to a Postgres write-through adapter
2. Add daily ETL to export training sets by intent cluster
3. Add semantic retrieval (RAG) over internal docs and route descriptions
4. Add admin dashboard page for behavior heatmaps + prompt funnels
5. Add consent center toggle UI for analytics/training preferences
