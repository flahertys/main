# Personal Trading Assistant Setup (Secure Admin + Webhooks)

This setup gives you:

- Secure owner login via NextAuth credentials.
- Server-side personal assistant vault storage.
- Signed webhook ingestion for scraper/mining/BI pipelines.
- Personal insights endpoint for macro/micro trend interpretation.

## 1) Secure owner login

Configure in `.env.local` or deployment env:

- `NEXTAUTH_SECRET`
- `TRADEHAX_LOGIN_USERNAME`
- `TRADEHAX_LOGIN_PASSWORD_HASH`

Generate password hash:

- `npm run auth:hash-password -- "your-strong-password"`

Then set hash output as `TRADEHAX_LOGIN_PASSWORD_HASH`.

Optional social login providers (for account-linked user profiles):

- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
- `FACEBOOK_CLIENT_ID` + `FACEBOOK_CLIENT_SECRET`
- For X login: `X_CLIENT_ID` + `X_CLIENT_SECRET`

> The discreet portal is available at `/portal` (direct URL).

## 1.5) Encrypted user profile storage

Required env in production:

- `TRADEHAX_USER_DATA_ENCRYPTION_KEY`

What it does:

- Encrypts account profile/context data at rest (AES-256-GCM).
- Stores consent flags to control whether LLM training/personalization is allowed.
- Keeps data scoped to the authenticated user account.

User endpoint:

- `GET/PUT /api/account/profile`

Example PUT body:

```json
{
  "displayName": "Jane Trader",
  "profileNotes": "Swing focus, avoid overtrading around CPI",
  "favoriteSymbols": ["BTC", "ETH", "SOL"],
  "preferredTimeframes": ["15m", "1h", "4h"],
  "macroInterests": ["CPI", "DXY", "US10Y"],
  "llmContext": "Prefer concise trade plans with invalidation first.",
  "consent": {
    "allowLlmTraining": true,
    "allowPersonalization": true
  }
}
```

Policy:

- Data is intended for user-enabled product utility (personalization/training) and is not sold.

## 2) Personal assistant admin API

Endpoint: `GET/PUT /api/admin/personal-assistant`

Auth:

- Owner session login (`/login`) OR
- existing admin header auth (`x-tradehax-admin-key` / `x-tradehax-superuser-code`).

### GET returns

- vault profile (display name, symbols, watchlist, strategy notes)
- trading behavior profile
- ingestion summary
- actionable insights

### PUT accepts

```json
{
  "displayName": "My Trading Desk",
  "strategyNotes": "Focus on macro-driven BTC momentum with strict drawdown rules.",
  "preferredSymbols": ["BTC", "ETH", "SOL"],
  "preferredTimeframes": ["15m", "1h", "4h"],
  "macroWatchlist": ["CPI", "FOMC", "DXY"],
  "riskProfile": "balanced"
}
```

You can also submit a manual outcome:

```json
{
  "manualOutcome": {
    "symbol": "BTC",
    "regime": "volatile",
    "side": "long",
    "pnlPercent": 1.25,
    "confidence": 0.68,
    "indicatorsUsed": ["rsi", "vwap"],
    "notes": "Entry after reclaim + volume confirmation"
  }
}
```

## 3) Signed personal webhook ingestion

Endpoint: `POST /api/intelligence/webhooks/personal`

Required env:

- `TRADEHAX_PERSONAL_WEBHOOK_SECRET`

Headers:

- `x-tradehax-timestamp`: unix seconds
- `x-tradehax-signature`: `sha256=<hex_hmac(timestamp.body)>`

Body example:

```json
{
  "source": "macro-miner-v1",
  "events": [
    {
      "category": "INTELLIGENCE",
      "prompt": "US10Y + DXY divergence alert",
      "response": "Risk-off pressure increasing on growth assets",
      "training": true,
      "analytics": true,
      "metadata": {
        "region": "US",
        "signal_strength": 0.74
      }
    }
  ],
  "tradeOutcomes": [
    {
      "symbol": "ETH",
      "regime": "macro_shock",
      "side": "short",
      "pnlPercent": 0.92,
      "confidence": 0.63,
      "indicatorsUsed": ["volume", "macd"],
      "notes": "fade failed reclaim during macro event"
    }
  ]
}
```

## 4) BI / scraper / mining integration strategy

Use your external tools to emit normalized records to the signed webhook above.

Recommended source buckets:

- `macro-miner` (rates, CPI, labor, central bank events)
- `micro-structure` (order flow, funding, OI, liquidations)
- `sentiment-scraper` (social/news signal extraction)
- `earnings-flow` (cross-asset catalyst mapping)

Normalize upstream data into:

- concise `prompt` (what changed)
- concise `response` (why it matters)
- bounded `metadata` (machine-usable fields)

This keeps your assistant continuously trainable and decision-useful.
