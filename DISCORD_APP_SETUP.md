# Discord App Setup for TradeHax Apps

This project now includes a verified Discord interactions endpoint and slash command handlers.

## Included code

- `app/api/interactions/route.ts`
  - Handles Discord interaction webhooks
  - Verifies Ed25519 signatures using `DISCORD_PUBLIC_KEY`
  - Supports command + ping interaction responses
- `lib/discord/interactions.ts`
  - Signature verification helper
  - Command handler implementations
- `scripts/discord/register-commands.mjs`
  - Registers slash commands to Discord (global or guild scope)

## Commands included

- `/app-help`
- `/app-status`
- `/open area:<trading|intelligence|pricing|dashboard>`
- `/trade-start market:<crypto|stocks> symbol:<optional>`
- `/market-status`
- `/flow-latest symbol:<optional> limit:<optional>`
- `/darkpool-latest symbol:<optional> limit:<optional>`
- `/stock-news symbol:<optional> impact:<optional> limit:<optional>`
- `/top-unusual source:<all|flow|darkpool> symbol:<optional> limit:<optional> page:<optional>`
- `/news-brief focus:<stocks|all> theme:<all|earnings|macro|policy|semis|ai> symbol:<optional> limit:<optional>`
- `/alerts-latest limit:<optional>`
- `/quick-stats`

Most live commands now respond with Discord embeds + link buttons for easier scanning and one-click navigation back into the app.

Examples:

- `/top-unusual source:all page:2 limit:8`
- `/news-brief focus:stocks theme:semis limit:6`
- `/news-brief focus:stocks theme:ai symbol:NVDA`

## Environment variables required

- `DISCORD_BOT_TOKEN`
- `DISCORD_APPLICATION_ID`
- `DISCORD_PUBLIC_KEY`
- `DISCORD_INTERACTIONS_ENDPOINT_URL` (Discord Developer Portal URL)
- Optional: `DISCORD_GUILD_ID` (for faster guild-scope command iteration)

## Setup steps

1. In Discord Developer Portal, set Interactions Endpoint URL to:
   - `https://your-domain.com/api/interactions`
2. Ensure env vars above are configured in your deployment.
3. Register commands:
   - `npm run discord:register-commands`
4. Test in Discord:
   - `/app-help`
   - `/trade-start market:crypto symbol:SOL`

## Notes

- Global command propagation may take time.
- Guild-scoped commands update quickly for development.
- If Discord says endpoint verification failed, check `DISCORD_PUBLIC_KEY` and deployed endpoint URL.
- Live command depth depends on configured upstream providers (`UNUSUALWHALES_API_KEY`, `POLYGON_API_KEY`, etc.).
- Without vendor keys, commands still work against the deterministic TradeHax simulated intelligence feed.
