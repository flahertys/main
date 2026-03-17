# TradeHax Backup

## Endpoints
- /api/hf-server: Hugging Face inference
- /api/supabase-health: Supabase health check
- /api/openai: OpenAI integration
- /api/groq: Groq integration
- /api/finnhub: Finnhub integration

## Handshake Scripts
- handshake-check.js: Verifies API connectivity
- supabase-health.mjs: Checks Supabase health
- api-smoke.js: API smoke tests

## Restore Instructions
1. Copy source code to new project directory
2. Restore environment variables from env/
3. Re-add configs from config/
4. Run handshake scripts to verify endpoints
5. Re-deploy to Vercel or new platform
