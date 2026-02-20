import { getIntelligenceSlaMetrics } from "@/lib/intelligence/metrics";
import { getIntelligenceSnapshot } from "@/lib/intelligence/provider";
import { listAlerts } from "@/lib/intelligence/watchlist-store";
import { verify } from "crypto";

export const DISCORD_INTERACTION_TYPE = {
  PING: 1,
  APPLICATION_COMMAND: 2,
} as const;

export const DISCORD_RESPONSE_TYPE = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
} as const;

type DiscordEmbed = {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: { text: string };
};

type DiscordActionRow = {
  type: 1;
  components: Array<{
    type: 2;
    style: 5;
    label: string;
    url: string;
  }>;
};

type DiscordCommandOption = {
  name?: string;
  value?: string | number | boolean;
};

type DiscordInteractionData = {
  name?: string;
  options?: DiscordCommandOption[];
};

export type DiscordInteraction = {
  type: number;
  data?: DiscordInteractionData;
  user?: {
    id?: string;
  };
  member?: {
    user?: {
      id?: string;
    };
  };
};

function toSpkiFromRawEd25519(rawKey: Buffer) {
  // ASN.1 SubjectPublicKeyInfo prefix for Ed25519 public keys (32-byte raw key)
  const prefix = Buffer.from("302a300506032b6570032100", "hex");
  return Buffer.concat([prefix, rawKey]);
}

export function verifyDiscordSignature(input: {
  signature: string;
  timestamp: string;
  body: string;
  publicKeyHex: string;
}) {
  const signatureHex = input.signature?.trim();
  const timestamp = input.timestamp?.trim();
  const body = input.body ?? "";
  const publicKeyHex = input.publicKeyHex?.trim();

  if (!signatureHex || !timestamp || !publicKeyHex) {
    return false;
  }

  try {
    const message = Buffer.from(`${timestamp}${body}`, "utf8");
    const signature = Buffer.from(signatureHex, "hex");
    const rawPublicKey = Buffer.from(publicKeyHex, "hex");
    if (rawPublicKey.length !== 32) {
      return false;
    }

    const spkiKey = toSpkiFromRawEd25519(rawPublicKey);

    return verify(null, message, { key: spkiKey, format: "der", type: "spki" }, signature);
  } catch {
    return false;
  }
}

function findOption(data: DiscordInteractionData | undefined, name: string) {
  const options = Array.isArray(data?.options) ? data?.options : [];
  return options.find((option) => option?.name === name)?.value;
}

function resolveSiteUrl() {
  const candidate =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://tradehax.net";
  return candidate.replace(/\/$/, "");
}

function message(content: string) {
  return {
    type: DISCORD_RESPONSE_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content,
    },
  };
}

function richMessage(input: {
  content?: string;
  embeds?: DiscordEmbed[];
  components?: DiscordActionRow[];
}) {
  return {
    type: DISCORD_RESPONSE_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: input.content || "",
      embeds: input.embeds || [],
      components: input.components || [],
    },
  };
}

function toLinkButton(label: string, path: string) {
  const site = resolveSiteUrl();
  return {
    type: 2 as const,
    style: 5 as const,
    label,
    url: `${site}${path}`,
  };
}

function clampInt(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function formatUsd(value: number) {
  if (!Number.isFinite(value)) return "$0";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

function formatImpact(impact: string) {
  if (impact === "high") return "🔴 HIGH";
  if (impact === "medium") return "🟠 MED";
  return "🟢 LOW";
}

function classifyNewsTheme(input: { title: string; summary: string; symbol: string; category: string }) {
  const title = (input.title || "").toLowerCase();
  const summary = (input.summary || "").toLowerCase();
  const symbol = (input.symbol || "").toUpperCase();
  const category = (input.category || "").toLowerCase();
  const text = `${title} ${summary}`;

  const semiSymbols = new Set([
    "NVDA",
    "AMD",
    "TSM",
    "ASML",
    "AVGO",
    "INTC",
    "QCOM",
    "MU",
    "ARM",
    "MRVL",
    "AMAT",
    "LRCX",
    "KLAC",
    "ON",
    "NXPI",
  ]);

  const hasAiKeyword =
    text.includes(" ai ") ||
    text.startsWith("ai ") ||
    text.endsWith(" ai") ||
    text.includes("artificial intelligence") ||
    text.includes("llm") ||
    text.includes("model") ||
    text.includes("inference") ||
    text.includes("datacenter") ||
    text.includes("accelerator");

  const hasSemiKeyword =
    text.includes("semiconductor") ||
    text.includes("chip") ||
    text.includes("foundry") ||
    text.includes("fab") ||
    text.includes("wafer") ||
    semiSymbols.has(symbol);

  if (hasAiKeyword) return "ai";
  if (hasSemiKeyword) return "semis";
  if (category === "earnings") return "earnings";
  if (category === "macro") return "macro";
  if (category === "policy") return "policy";
  return "general";
}

function matchesNewsTheme(
  item: { title: string; summary: string; symbol: string; category: string },
  theme: string,
) {
  const normalized = String(theme || "all").toLowerCase();
  if (!normalized || normalized === "all") return true;
  if (normalized === "earnings" || normalized === "macro" || normalized === "policy") {
    return item.category === normalized;
  }
  if (normalized === "semis" || normalized === "ai") {
    return classifyNewsTheme(item) === normalized;
  }
  return true;
}

function resolveDiscordUserKey(interaction: DiscordInteraction) {
  const id =
    interaction.member?.user?.id ||
    interaction.user?.id ||
    process.env.DISCORD_DEFAULT_ALERTS_USER_ID ||
    "global";
  return `discord_${String(id).slice(0, 64)}`;
}

function handleAppHelp() {
  const site = resolveSiteUrl();
  return message(
    [
      "**TradeHax Discord App Commands**",
      "• `/app-help` — show this help",
      "• `/open area:<trading|intelligence|pricing|dashboard>` — get direct app links",
      "• `/trade-start market:<crypto|stocks> symbol:<ticker>` — beginner trade quick-start",
      "• `/app-status` — basic app integration status",
      "• `/market-status` — live market/overview snapshot",
      "• `/flow-latest symbol:<optional> limit:<optional>` — latest options flow",
      "• `/darkpool-latest symbol:<optional> limit:<optional>` — latest dark pool prints",
      "• `/stock-news symbol:<optional> impact:<optional> limit:<optional>` — latest stock news",
      "• `/top-unusual source:<all|flow|darkpool> symbol:<optional> limit:<optional> page:<optional>` — ranked unusual activity",
      "• `/news-brief focus:<stocks|all> theme:<all|earnings|macro|policy|semis|ai> symbol:<optional> limit:<optional>` — condensed news summary",
      "• `/alerts-latest limit:<optional>` — latest watchlist alerts for this Discord user",
      "• `/quick-stats` — 60m SLA + delivery health",
      `\nWeb app: ${site}`,
    ].join("\n"),
  );
}

function handleOpen(data?: DiscordInteractionData) {
  const area = String(findOption(data, "area") || "trading").toLowerCase();
  const site = resolveSiteUrl();

  const map: Record<string, string> = {
    trading: "/trading",
    intelligence: "/intelligence",
    pricing: "/pricing",
    dashboard: "/dashboard",
  };

  const path = map[area] || "/trading";
  return message(`Open **${area}**: ${site}${path}`);
}

function handleTradeStart(data?: DiscordInteractionData) {
  const market = String(findOption(data, "market") || "crypto").toLowerCase();
  const symbol = String(findOption(data, "symbol") || (market === "stocks" ? "AAPL" : "SOL")).toUpperCase();
  const site = resolveSiteUrl();

  return message(
    [
      `Trade quick-start for **${market}** · **${symbol}**`,
      "1) Open the Trading page",
      "2) Select the market card first",
      "3) Click **Create Trade** and enter your size",
      "4) Review active trades and bot risk controls",
      `\nStart here: ${site}/trading`,
    ].join("\n"),
  );
}

function handleStatus() {
  const mode = process.env.NODE_ENV || "development";
  const hasPublicKey = Boolean(String(process.env.DISCORD_PUBLIC_KEY || "").trim());
  const hasAppId = Boolean(String(process.env.DISCORD_APPLICATION_ID || "").trim());

  return message(
    [
      "**TradeHax Discord Integration Status**",
      `• environment: ${mode}`,
      `• DISCORD_APPLICATION_ID: ${hasAppId ? "configured" : "missing"}`,
      `• DISCORD_PUBLIC_KEY: ${hasPublicKey ? "configured" : "missing"}`,
    ].join("\n"),
  );
}

async function handleMarketStatus() {
  const snapshot = await getIntelligenceSnapshot();
  const overview = snapshot.overview;

  return richMessage({
    embeds: [
      {
        title: `Market Status · ${snapshot.status.vendor} (${snapshot.status.mode || "simulated"})`,
        color: 0x06b6d4,
        fields: [
          { name: "Options Premium 24h", value: formatUsd(overview.optionsPremium24hUsd), inline: true },
          { name: "Dark Pool Notional 24h", value: formatUsd(overview.darkPoolNotional24hUsd), inline: true },
          { name: "Crypto Notional 24h", value: formatUsd(overview.cryptoNotional24hUsd), inline: true },
          { name: "High Impact News", value: String(overview.highImpactNewsCount), inline: true },
          { name: "Unusual Contracts", value: String(overview.unusualContractsCount), inline: true },
        ],
        footer: { text: "TradeHax Intelligence" },
      },
    ],
    components: [
      {
        type: 1,
        components: [
          toLinkButton("Open Overview", "/intelligence/overview"),
          toLinkButton("Open Trading", "/trading"),
        ],
      },
    ],
  });
}

async function handleFlowLatest(data?: DiscordInteractionData) {
  const snapshot = await getIntelligenceSnapshot();
  const symbol = String(findOption(data, "symbol") || "").toUpperCase();
  const limit = clampInt(findOption(data, "limit"), 5, 1, 10);

  const rows = snapshot.flowTape
    .filter((item) => (symbol ? item.symbol === symbol : true))
    .sort((a, b) => Date.parse(b.openedAt) - Date.parse(a.openedAt))
    .slice(0, limit);

  if (rows.length === 0) {
    return message(`No flow rows found${symbol ? ` for ${symbol}` : ""}.`);
  }

  return message(
    [
      `**Latest Options Flow${symbol ? ` · ${symbol}` : ""}**`,
      ...rows.map(
        (item) =>
          `• ${item.symbol} ${item.side.toUpperCase()} ${formatUsd(item.premiumUsd)} score ${item.unusualScore} strike ${item.strike}`,
      ),
    ].join("\n"),
  );
}

async function handleDarkPoolLatest(data?: DiscordInteractionData) {
  const snapshot = await getIntelligenceSnapshot();
  const symbol = String(findOption(data, "symbol") || "").toUpperCase();
  const limit = clampInt(findOption(data, "limit"), 5, 1, 10);

  const rows = snapshot.darkPoolTape
    .filter((item) => (symbol ? item.symbol === symbol : true))
    .sort((a, b) => Date.parse(b.executedAt) - Date.parse(a.executedAt))
    .slice(0, limit);

  if (rows.length === 0) {
    return message(`No dark pool rows found${symbol ? ` for ${symbol}` : ""}.`);
  }

  return message(
    [
      `**Latest Dark Pool Prints${symbol ? ` · ${symbol}` : ""}**`,
      ...rows.map(
        (item) =>
          `• ${item.symbol} ${formatUsd(item.notionalUsd)} ${item.sideEstimate} on ${item.venue} score ${item.unusualScore}`,
      ),
    ].join("\n"),
  );
}

async function handleStockNews(data?: DiscordInteractionData) {
  const snapshot = await getIntelligenceSnapshot();
  const symbol = String(findOption(data, "symbol") || "").toUpperCase();
  const impact = String(findOption(data, "impact") || "").toLowerCase();
  const limit = clampInt(findOption(data, "limit"), 6, 1, 10);

  const rows = snapshot.news
    .filter((item) => item.category !== "crypto")
    .filter((item) => (symbol ? item.symbol === symbol : true))
    .filter((item) => (impact ? item.impact === impact : true))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, limit);

  if (rows.length === 0) {
    return richMessage({
      embeds: [
        {
          title: `Latest Stock News${symbol ? ` · ${symbol}` : ""}`,
          description: "No matching headlines right now.",
          color: 0x64748b,
        },
      ],
      components: [{ type: 1, components: [toLinkButton("Open News", "/intelligence/news")] }],
    });
  }

  return richMessage({
    embeds: [
      {
        title: `Latest Stock News${symbol ? ` · ${symbol}` : ""}`,
        description: rows
          .map((item, index) => `${index + 1}. ${formatImpact(item.impact)} **${item.symbol}** — ${item.title}`)
          .join("\n"),
        color: 0xf59e0b,
        footer: { text: "Filtered from live TradeHax feed" },
      },
    ],
    components: [
      {
        type: 1,
        components: [
          toLinkButton("Open News Feed", "/intelligence/news"),
          toLinkButton("Open Alerts", "/intelligence/watchlist"),
        ],
      },
    ],
  });
}

async function handleTopUnusual(data?: DiscordInteractionData) {
  const snapshot = await getIntelligenceSnapshot();
  const symbol = String(findOption(data, "symbol") || "").toUpperCase();
  const source = String(findOption(data, "source") || "all").toLowerCase();
  const limit = clampInt(findOption(data, "limit"), 7, 1, 12);
  const page = clampInt(findOption(data, "page"), 1, 1, 25);

  const flowRows = snapshot.flowTape.map((item) => ({
    type: "flow" as const,
    symbol: item.symbol,
    unusualScore: item.unusualScore,
    value: item.premiumUsd,
    line: `${item.symbol} ${item.side.toUpperCase()} · ${formatUsd(item.premiumUsd)} · score ${item.unusualScore}`,
  }));

  const darkRows = snapshot.darkPoolTape.map((item) => ({
    type: "darkpool" as const,
    symbol: item.symbol,
    unusualScore: item.unusualScore,
    value: item.notionalUsd,
    line: `${item.symbol} ${item.sideEstimate.toUpperCase()} · ${formatUsd(item.notionalUsd)} · score ${item.unusualScore}`,
  }));

  const merged = [...flowRows, ...darkRows]
    .filter((item) => (symbol ? item.symbol === symbol : true))
    .filter((item) => {
      if (source === "flow") return item.type === "flow";
      if (source === "darkpool") return item.type === "darkpool";
      return true;
    })
    .sort((a, b) => {
      if (b.unusualScore !== a.unusualScore) return b.unusualScore - a.unusualScore;
      return b.value - a.value;
    });

  const total = merged.length;
  const start = (page - 1) * limit;
  const paged = merged.slice(start, start + limit);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (paged.length === 0) {
    if (total === 0) {
      return message(`No unusual rows found${symbol ? ` for ${symbol}` : ""}.`);
    }

    return message(
      `No rows on page ${page}. Available pages: 1-${totalPages}. Try /top-unusual page:${Math.min(totalPages, page - 1)}.`,
    );
  }

  return richMessage({
    embeds: [
      {
        title: `Top Unusual Activity${symbol ? ` · ${symbol}` : ""} (Page ${page}/${totalPages})`,
        description: paged.map((item, index) => `${start + index + 1}. [${item.type}] ${item.line}`).join("\n"),
        color: 0x10b981,
        footer: { text: `Ranked by unusual score, then notional/premium · total rows ${total}` },
      },
    ],
    components: [
      {
        type: 1,
        components: [
          toLinkButton("Options Flow", "/intelligence/flow"),
          toLinkButton("Dark Pool", "/intelligence/dark-pool"),
        ],
      },
    ],
  });
}

async function handleNewsBrief(data?: DiscordInteractionData) {
  const snapshot = await getIntelligenceSnapshot();
  const symbol = String(findOption(data, "symbol") || "").toUpperCase();
  const limit = clampInt(findOption(data, "limit"), 5, 3, 10);
  const focus = String(findOption(data, "focus") || "stocks").toLowerCase();
  const theme = String(findOption(data, "theme") || "all").toLowerCase();

  const scoped = snapshot.news
    .filter((item) => (focus === "all" ? true : item.category !== "crypto"))
    .filter((item) => (symbol ? item.symbol === symbol : true))
    .filter((item) => matchesNewsTheme(item, theme))
    .sort((a, b) => {
      const impactRank = { high: 3, medium: 2, low: 1 } as const;
      const diff = impactRank[b.impact] - impactRank[a.impact];
      if (diff !== 0) return diff;
      return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
    })
    .slice(0, limit);

  if (scoped.length === 0) {
    return message(
      `No brief headlines found${symbol ? ` for ${symbol}` : ""}${theme !== "all" ? ` with theme:${theme}` : ""}.`,
    );
  }

  const high = scoped.filter((item) => item.impact === "high").length;
  const medium = scoped.filter((item) => item.impact === "medium").length;
  const topThemes = scoped.reduce<Record<string, number>>((acc, item) => {
    const key = classifyNewsTheme(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const dominantTheme = Object.entries(topThemes)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || "general";

  return richMessage({
    embeds: [
      {
        title: `Market News Brief${symbol ? ` · ${symbol}` : ""}${theme !== "all" ? ` · theme:${theme}` : ""}`,
        color: 0x3b82f6,
        description: scoped
          .map((item) => `• ${formatImpact(item.impact)} **${item.symbol}** — ${item.title}`)
          .join("\n"),
        fields: [
          { name: "Headlines", value: String(scoped.length), inline: true },
          { name: "High Impact", value: String(high), inline: true },
          { name: "Medium Impact", value: String(medium), inline: true },
          { name: "Dominant Theme", value: dominantTheme.toUpperCase(), inline: true },
        ],
      },
    ],
    components: [
      {
        type: 1,
        components: [
          toLinkButton("Open News", "/intelligence/news"),
          toLinkButton("Open Watchlist", "/intelligence/watchlist"),
        ],
      },
    ],
  });
}

async function handleAlertsLatest(interaction: DiscordInteraction, data?: DiscordInteractionData) {
  const userId = resolveDiscordUserKey(interaction);
  const limit = clampInt(findOption(data, "limit"), 5, 1, 10);
  const alerts = await listAlerts(userId, limit);

  if (alerts.length === 0) {
    return message(
      [
        "No watchlist alerts yet for this Discord user.",
        "Tip: create watchlist items in the app first, then run scans from /intelligence/watchlist.",
      ].join("\n"),
    );
  }

  return message(
    [
      `**Latest Alerts · ${userId}**`,
      ...alerts.slice(0, limit).map((alert) => `• [${alert.severity.toUpperCase()}] ${alert.symbol} — ${alert.title}`),
    ].join("\n"),
  );
}

function handleQuickStats() {
  const metrics = getIntelligenceSlaMetrics(60);
  return message(
    [
      "**Quick Stats (last 60m)**",
      `• Provider success rate: ${metrics.provider.successRatePct.toFixed(2)}%`,
      `• Avg provider latency: ${metrics.provider.avgLatencyMs.toFixed(0)} ms`,
      `• Alerts generated: ${metrics.alerts.generated}`,
      `• Discord delivery success: ${metrics.alerts.deliverySuccessRatePct.toFixed(2)}%`,
      `• Dispatch batches: ${metrics.alerts.dispatchBatches}`,
    ].join("\n"),
  );
}

export async function handleDiscordInteraction(interaction: DiscordInteraction) {
  if (interaction.type === DISCORD_INTERACTION_TYPE.PING) {
    return { type: DISCORD_RESPONSE_TYPE.PONG };
  }

  if (interaction.type !== DISCORD_INTERACTION_TYPE.APPLICATION_COMMAND) {
    return message("Unsupported interaction type.");
  }

  const name = String(interaction.data?.name || "").toLowerCase();

  try {
    if (name === "app-help") return handleAppHelp();
    if (name === "open") return handleOpen(interaction.data);
    if (name === "trade-start") return handleTradeStart(interaction.data);
    if (name === "app-status") return handleStatus();
    if (name === "market-status") return await handleMarketStatus();
    if (name === "flow-latest") return await handleFlowLatest(interaction.data);
    if (name === "darkpool-latest") return await handleDarkPoolLatest(interaction.data);
    if (name === "stock-news") return await handleStockNews(interaction.data);
    if (name === "top-unusual") return await handleTopUnusual(interaction.data);
    if (name === "news-brief") return await handleNewsBrief(interaction.data);
    if (name === "alerts-latest") return await handleAlertsLatest(interaction, interaction.data);
    if (name === "quick-stats") return handleQuickStats();
  } catch (error) {
    const details = error instanceof Error ? error.message : "unknown error";
    return message(`Command failed: ${details}`);
  }

  return message(`Unknown command: ${name || "(none)"}`);
}
