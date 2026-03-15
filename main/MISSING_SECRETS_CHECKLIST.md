# TradeHax Deployment: Missing Secrets Checklist

Below are the environment variables in `.env.unified` that are currently blank and must be filled for a working deployment. Use the instructions and links to obtain each value.

---

## 1. HuggingFace API Token
- **Variable:** `NEXT_PUBLIC_HF_API_TOKEN`, `HUGGINGFACE_API_KEY`
- **How to get:**
  - Go to https://huggingface.co/settings/tokens
  - Create a new token with "read" permissions
  - Paste the token in both variables

## 2. Polygon.io API Key
- **Variable:** `NEXT_PUBLIC_POLYGON_API_KEY`
- **How to get:**
  - https://polygon.io (sign up, get API key from dashboard)

## 3. Finnhub API Key
- **Variable:** `NEXT_PUBLIC_FINNHUB_API_KEY`
- **How to get:**
  - https://finnhub.io (sign up, get API key from dashboard)

## 4. Alpha Vantage API Key
- **Variable:** `NEXT_PUBLIC_ALPHA_VANTAGE_KEY`
- **How to get:**
  - https://www.alphavantage.co (sign up, get API key from profile)

## 5. Binance API Key/Secret
- **Variables:** `NEXT_PUBLIC_BINANCE_API_KEY`, `NEXT_PUBLIC_BINANCE_SECRET`
- **How to get:**
  - https://www.binance.com (API Management in user dashboard)

## 6. Helius (Solana) API Key
- **Variable:** `NEXT_PUBLIC_HELIUS_API_KEY`
- **How to get:**
  - https://helius.dev (sign up, get API key)

## 7. OpenAI API Key
- **Variable:** `OPENAI_API_KEY`
- **How to get:**
  - https://platform.openai.com/account/api-keys

## 8. Redis URL
- **Variable:** `REDIS_URL`
- **How to get:**
  - From your Redis provider (e.g., Redis Labs, AWS ElastiCache)

## 9. Stripe Keys
- **Variables:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLIC_KEY`, `STRIPE_PRICE_FEATURED`, `STRIPE_PRICE_GUILD`, `STRIPE_PRICE_TELEGRAM`
- **How to get:**
  - https://dashboard.stripe.com/apikeys

## 10. Discord, Telegram, Meta, Instagram, Twitter, X, etc.
- **Variables:**
  - `DISCORD_TOKEN`, `DISCORD_GUILD_ID`, `DISCORD_CHANNEL_ID`, `DISCORD_WEBHOOK_URL`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_BOT_TOKEN`, `DISCORD_PUBLIC_KEY`
  - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_ADMIN_ID`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_MINI_APP_URL`, `TELEGRAM_WEBHOOK_URL`
  - `META_APP_ID`, `META_APP_SECRET`, `META_PAGE_ID`, `META_PAGE_ACCESS_TOKEN`
  - `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_BUSINESS_ACCOUNT_ID`, `INSTAGRAM_WEBHOOK_SECRET`
  - `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_BEARER_TOKEN`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_SECRET`
  - `X_API_KEY`, `X_API_SECRET`
- **How to get:**
  - From respective platform developer portals (Discord, Telegram, Meta/Facebook, Instagram, Twitter/X)

## 11. Analytics & Monitoring
- **Variables:** `ANALYTICS_API_KEY`, `SENTRY_DSN`
- **How to get:**
  - From your analytics/Sentry provider

## 12. Vercel OIDC Token
- **Variable:** `VERCEL_OIDC_TOKEN`
- **How to get:**
  - From Vercel project settings (if required for advanced integrations)

## 13. TradeHax OG API Key
- **Variable:** `TRADEHAX_OG_API_KEY`
- **How to get:**
  - Internal/legacy system (if used)

## 14. Database URL
- **Variable:** `DATABASE_URL`
- **How to get:**
  - From your PostgreSQL provider (Supabase, AWS RDS, etc.)

## 15. Deployment/Server Variables
- **Variables:** `TRADEHAX_VPS_HOST`, `TRADEHAX_VPS_USER`, `TRADEHAX_SSH_KEY_PATH`, `TRADEHAX_REMOTE_APP_PATH`, `TRADEHAX_DOCKER_COMPOSE_FILE`, `TRADEHAX_DOCKER_PROJECT`, `TRADEHAX_HEALTH_URL`
- **How to get:**
  - From your server/hosting configuration

---

**Fill in all blanks in `.env.unified` before syncing to Vercel for a successful deployment!**

