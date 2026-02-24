import { ingestBehavior } from "@/lib/ai/data-ingestion";
import { SubscriptionTier } from "@/lib/monetization/types";
import { TradebotSignalOutlook } from "@/lib/trading/signal-outlook";

export type DiscordSignalDispatchResult = {
  ok: boolean;
  deliveredAt: string;
  deliveredCount: number;
  webhookConfigured: boolean;
  channelLabel: string;
  error?: string;
  tier?: SubscriptionTier;
  cadenceWindow?: string;
};

type BurstState = {
  timestamps: number[];
};

const DEFAULT_TIERS: SubscriptionTier[] = ["free", "basic", "pro", "elite"];

function getBurstStateStore() {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_DISCORD_SIGNAL_BURST__?: Map<string, BurstState>;
  };

  if (!globalRef.__TRADEHAX_DISCORD_SIGNAL_BURST__) {
    globalRef.__TRADEHAX_DISCORD_SIGNAL_BURST__ = new Map();
  }

  return globalRef.__TRADEHAX_DISCORD_SIGNAL_BURST__;
}

function getBurstConfig() {
  const maxDispatchesRaw = Number.parseInt(String(process.env.TRADEHAX_DISCORD_SIGNAL_BURST_MAX || "4"), 10);
  const windowMsRaw = Number.parseInt(String(process.env.TRADEHAX_DISCORD_SIGNAL_BURST_WINDOW_MS || "60000"), 10);

  return {
    maxDispatches: Number.isFinite(maxDispatchesRaw) ? Math.max(1, Math.min(20, maxDispatchesRaw)) : 4,
    windowMs: Number.isFinite(windowMsRaw) ? Math.max(5_000, Math.min(10 * 60_000, windowMsRaw)) : 60_000,
  };
}

function allowDispatchBurst(routeKey: string) {
  const store = getBurstStateStore();
  const now = Date.now();
  const { maxDispatches, windowMs } = getBurstConfig();

  const state = store.get(routeKey) || { timestamps: [] };
  state.timestamps = state.timestamps.filter((ts) => now - ts <= windowMs);

  if (state.timestamps.length >= maxDispatches) {
    store.set(routeKey, state);
    return false;
  }

  state.timestamps.push(now);
  store.set(routeKey, state);
  return true;
}

function resolveSignalWebhook(tier?: SubscriptionTier) {
  const normalizedTier = tier || "pro";
  const tierKey = normalizedTier.toUpperCase();
  const tierDirect = process.env[`TRADEHAX_DISCORD_SIGNAL_WEBHOOK_${tierKey}` as const];
  if (tierDirect && tierDirect.trim()) return tierDirect.trim();

  const direct = process.env.TRADEHAX_DISCORD_SIGNAL_WEBHOOK;
  if (direct && direct.trim()) return direct.trim();

  const genericTierWebhook = process.env[`TRADEHAX_DISCORD_WEBHOOK_${tierKey}` as const];
  if (genericTierWebhook && genericTierWebhook.trim()) return genericTierWebhook.trim();

  const fallback = process.env.TRADEHAX_DISCORD_WEBHOOK;
  if (fallback && fallback.trim()) return fallback.trim();

  return "";
}

function resolveChannelLabel(tier?: SubscriptionTier) {
  const normalizedTier = tier || "pro";
  const tierKey = normalizedTier.toUpperCase();
  const tierSignalChannel = process.env[`TRADEHAX_DISCORD_SIGNAL_CHANNEL_${tierKey}` as const];
  if (tierSignalChannel && tierSignalChannel.trim()) return tierSignalChannel.trim();

  return process.env.TRADEHAX_DISCORD_SIGNAL_CHANNEL?.trim() || "signals-desk";
}

function formatSignal(signal: TradebotSignalOutlook) {
  const top = signal.timeframes.slice(0, 3)
    .map((tf) => `${tf.timeframe}: ${tf.bias.toUpperCase()} (conf ${Math.round(tf.confidence * 100)}%)`)
    .join(" | ");

  return [
    `**${signal.symbol}** · regime: ${signal.marketRegime}`,
    `Macro: ${signal.macro}`,
    `Micro: ${signal.micro}`,
    `Options flow: ${signal.unusualOptionsFlow}`,
    `Indicators: ${signal.hedgeFundIndicators.join(", ")}`,
    `Timeframes: ${top}`,
    `Risk: ${signal.riskControls.join(" ")}`,
    `Learner: ${signal.learnerExperience}`,
    `Premium: ${signal.premiumExperience}`,
  ].join("\n");
}

export async function dispatchTradebotSignalsToDiscord(input: {
  userId: string;
  signals: TradebotSignalOutlook[];
  tier?: SubscriptionTier;
  cadenceWindow?: string;
}) {
  const resolvedTier = input.tier || "pro";
  const webhook = resolveSignalWebhook(resolvedTier);
  const channelLabel = resolveChannelLabel(resolvedTier);
  const deliveredAt = new Date().toISOString();

  const routeKey = `${resolvedTier}:${channelLabel}`;
  if (!allowDispatchBurst(routeKey)) {
    return {
      ok: false,
      deliveredAt,
      deliveredCount: 0,
      webhookConfigured: Boolean(webhook),
      channelLabel,
      tier: resolvedTier,
      cadenceWindow: input.cadenceWindow,
      error: "Signal dispatch burst protection triggered. Retry after cooldown window.",
    } satisfies DiscordSignalDispatchResult;
  }

  if (!webhook) {
    return {
      ok: false,
      deliveredAt,
      deliveredCount: 0,
      webhookConfigured: false,
      channelLabel,
      tier: resolvedTier,
      cadenceWindow: input.cadenceWindow,
      error: "No Discord signal webhook configured.",
    } satisfies DiscordSignalDispatchResult;
  }

  const payload = [
    "TradeHax Signal Outlook Dispatch",
    `Cadence: ${input.cadenceWindow || "manual"}`,
    `Tier: ${resolvedTier}`,
    `Channel: ${channelLabel}`,
    `Generated: ${deliveredAt}`,
    "",
    ...input.signals.slice(0, 6).map(formatSignal),
  ].join("\n\n");

  const response = await fetch(webhook, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: payload.slice(0, 1900),
    }),
  });

  const ok = response.ok;

  try {
    await ingestBehavior({
      timestamp: deliveredAt,
      category: "DISCORD",
      source: "discord",
      userId: input.userId,
      prompt: `DISCORD_SIGNAL_DISPATCH count=${input.signals.length}`,
      response: ok ? `DISCORD_SIGNAL_DISPATCH_OK delivered=${input.signals.length}` : `DISCORD_SIGNAL_DISPATCH_FAILED status=${response.status}`,
      metadata: {
        route: "/api/trading/signal/discord",
        ok,
        signal_count: input.signals.length,
        tier: resolvedTier,
        cadence_window: input.cadenceWindow || "manual",
        channel: channelLabel,
        webhook_configured: true,
      },
      consent: {
        analytics: true,
        training: false,
      },
    });
  } catch (error) {
    console.warn("Discord signal ingestion skipped:", error);
  }

  if (!ok) {
    return {
      ok: false,
      deliveredAt,
      deliveredCount: 0,
      webhookConfigured: true,
      channelLabel,
      tier: resolvedTier,
      cadenceWindow: input.cadenceWindow,
      error: `Discord webhook failed with status ${response.status}`,
    } satisfies DiscordSignalDispatchResult;
  }

  return {
    ok: true,
    deliveredAt,
    deliveredCount: Math.min(input.signals.length, 6),
    webhookConfigured: true,
    channelLabel,
    tier: resolvedTier,
    cadenceWindow: input.cadenceWindow,
  } satisfies DiscordSignalDispatchResult;
}

export function resolveCadenceTiers() {
  const raw = String(process.env.TRADEHAX_SIGNAL_CADENCE_TIERS || "").trim();
  if (!raw) {
    return DEFAULT_TIERS;
  }

  const parsed = raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value): value is SubscriptionTier =>
      value === "free" || value === "basic" || value === "pro" || value === "elite",
    );

  return parsed.length > 0 ? parsed : DEFAULT_TIERS;
}
