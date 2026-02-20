#!/usr/bin/env node

/*
 * Register TradeHax slash commands to Discord.
 *
 * Required env:
 * - DISCORD_BOT_TOKEN
 * - DISCORD_APPLICATION_ID
 *
 * Optional env:
 * - DISCORD_GUILD_ID (if provided, registers guild commands for faster iteration)
 */

const token = process.env.DISCORD_BOT_TOKEN;
const appId = process.env.DISCORD_APPLICATION_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !appId) {
  console.error("Missing DISCORD_BOT_TOKEN or DISCORD_APPLICATION_ID.");
  process.exit(1);
}

const commands = [
  {
    name: "app-help",
    description: "Show TradeHax Discord app command help",
    type: 1,
  },
  {
    name: "app-status",
    description: "Show TradeHax Discord integration status",
    type: 1,
  },
  {
    name: "open",
    description: "Get a direct TradeHax app link",
    type: 1,
    options: [
      {
        name: "area",
        description: "Area to open",
        type: 3,
        required: true,
        choices: [
          { name: "trading", value: "trading" },
          { name: "intelligence", value: "intelligence" },
          { name: "pricing", value: "pricing" },
          { name: "dashboard", value: "dashboard" },
        ],
      },
    ],
  },
  {
    name: "trade-start",
    description: "Get beginner trade quick-start instructions",
    type: 1,
    options: [
      {
        name: "market",
        description: "Market category",
        type: 3,
        required: true,
        choices: [
          { name: "crypto", value: "crypto" },
          { name: "stocks", value: "stocks" },
        ],
      },
      {
        name: "symbol",
        description: "Ticker/symbol, e.g. SOL or AAPL",
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: "market-status",
    description: "Live market status snapshot from TradeHax intelligence",
    type: 1,
  },
  {
    name: "flow-latest",
    description: "Latest unusual options flow",
    type: 1,
    options: [
      {
        name: "symbol",
        description: "Ticker symbol, e.g. AAPL",
        type: 3,
        required: false,
      },
      {
        name: "limit",
        description: "Rows to return (1-10)",
        type: 4,
        required: false,
      },
    ],
  },
  {
    name: "darkpool-latest",
    description: "Latest dark pool prints",
    type: 1,
    options: [
      {
        name: "symbol",
        description: "Ticker symbol, e.g. TSLA",
        type: 3,
        required: false,
      },
      {
        name: "limit",
        description: "Rows to return (1-10)",
        type: 4,
        required: false,
      },
    ],
  },
  {
    name: "stock-news",
    description: "Latest stock-focused news feed",
    type: 1,
    options: [
      {
        name: "symbol",
        description: "Ticker symbol, e.g. NVDA",
        type: 3,
        required: false,
      },
      {
        name: "impact",
        description: "Impact filter",
        type: 3,
        required: false,
        choices: [
          { name: "high", value: "high" },
          { name: "medium", value: "medium" },
          { name: "low", value: "low" },
        ],
      },
      {
        name: "limit",
        description: "Rows to return (1-10)",
        type: 4,
        required: false,
      },
    ],
  },
  {
    name: "top-unusual",
    description: "Rank unusual activity by score and premium/notional",
    type: 1,
    options: [
      {
        name: "source",
        description: "Data source scope",
        type: 3,
        required: false,
        choices: [
          { name: "all", value: "all" },
          { name: "flow", value: "flow" },
          { name: "darkpool", value: "darkpool" },
        ],
      },
      {
        name: "symbol",
        description: "Ticker symbol, e.g. MSFT",
        type: 3,
        required: false,
      },
      {
        name: "limit",
        description: "Rows to return (1-12)",
        type: 4,
        required: false,
      },
      {
        name: "page",
        description: "Result page number (1-25)",
        type: 4,
        required: false,
      },
    ],
  },
  {
    name: "news-brief",
    description: "Condensed market news summary",
    type: 1,
    options: [
      {
        name: "focus",
        description: "News focus scope",
        type: 3,
        required: false,
        choices: [
          { name: "stocks", value: "stocks" },
          { name: "all", value: "all" },
        ],
      },
      {
        name: "theme",
        description: "Theme lens for the brief",
        type: 3,
        required: false,
        choices: [
          { name: "all", value: "all" },
          { name: "earnings", value: "earnings" },
          { name: "macro", value: "macro" },
          { name: "policy", value: "policy" },
          { name: "semis", value: "semis" },
          { name: "ai", value: "ai" },
        ],
      },
      {
        name: "symbol",
        description: "Ticker symbol, e.g. NVDA",
        type: 3,
        required: false,
      },
      {
        name: "limit",
        description: "Rows to include (3-10)",
        type: 4,
        required: false,
      },
    ],
  },
  {
    name: "alerts-latest",
    description: "Latest watchlist alerts for this Discord user",
    type: 1,
    options: [
      {
        name: "limit",
        description: "Rows to return (1-10)",
        type: 4,
        required: false,
      },
    ],
  },
  {
    name: "quick-stats",
    description: "Quick intelligence and delivery metrics snapshot",
    type: 1,
  },
];

const endpoint = guildId
  ? `https://discord.com/api/v10/applications/${appId}/guilds/${guildId}/commands`
  : `https://discord.com/api/v10/applications/${appId}/commands`;

const scope = guildId ? `guild (${guildId})` : "global";

const response = await fetch(endpoint, {
  method: "PUT",
  headers: {
    Authorization: `Bot ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(commands),
});

if (!response.ok) {
  const body = await response.text();
  console.error(`Discord command registration failed (${response.status}): ${body}`);
  process.exit(1);
}

const registered = await response.json();
console.log(`Registered ${Array.isArray(registered) ? registered.length : 0} Discord commands to ${scope}.`);
