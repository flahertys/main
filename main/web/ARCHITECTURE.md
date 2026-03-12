# TradeHax Architecture (Stabilization Phase)

This phase keeps the current `tradehax.net` look and behavior while introducing a maintainable structure.

## Frontend Structure

- `src/app/` - App composition and shell wiring
- `src/features/` - Feature-centric modules (`neural-hub` first)
- `src/shared/` - Shared providers/components/utilities
- `src/lib/` - Existing lower-level helpers (to be migrated gradually)

Current routing intentionally stays simple and renders the existing NeuralHub UI unchanged.

## Backend Structure

- `api/sessions/index.ts` - HTTP handler only (transport layer)
- `api/sessions/session-service.ts` - Session business logic orchestration
- `api/sessions/store.ts` - Current in-memory store and primitives

This split allows future migration to durable storage (Supabase/Postgres) without changing API routes.

## Migration Rules

1. Preserve visible UI behavior first.
2. Move logic behind service layers before deeper rewrites.
3. Keep endpoint contracts stable during refactors.
4. Add small, incremental changes so each deployment is safe.

## Next Safe Steps

1. Move `src/lib/api-client.ts` to `src/services/api/` with re-export shim.
2. Create `api/_shared/http.ts` for CORS/method guards and reuse across handlers.
3. Add basic API tests for `/api/sessions` and `/api/supabase/health`.
4. Add feature-level style tokens and replace inline styles gradually.

