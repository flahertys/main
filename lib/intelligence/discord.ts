import { IntelligenceAlert } from "@/lib/intelligence/types";
import { recordAlertDispatchMetric } from "@/lib/intelligence/metrics";
import { SubscriptionTier } from "@/lib/monetization/types";

type StrategyProfile = "options_flow" | "dark_pool" | "crypto_flow" | "catalyst_news";
type RiskProfile = "urgent" | "watch" | "info";

type AlertGroup = {
  strategy: StrategyProfile;
  risk: RiskProfile;
  alerts: IntelligenceAlert[];
};

export type IntelligenceDiscordRoute = {
  tier: SubscriptionTier;
  webhookUrl: string;
  channelLabel: string;
  viaFallback: boolean;
};

export type IntelligenceDiscordGroupDispatch = {
  strategy: StrategyProfile;
  risk: RiskProfile;
  deliveredCount: number;
  ok: boolean;
  threadId?: string;
  error?: string;
};

export type IntelligenceDiscordDispatchResult = {
  ok: boolean;
  route: Omit<IntelligenceDiscordRoute, "webhookUrl"> & {
    webhookConfigured: boolean;
    defaultThreadId?: string;
  };
  deliveredCount: number;
  deliveredAt: string;
  groups: IntelligenceDiscordGroupDispatch[];
  error?: string;
};

function resolveChannelLabel(tier: SubscriptionTier) {
  const value = process.env[`TRADEHAX_DISCORD_CHANNEL_${tier.toUpperCase()}`];
  if (value && value.trim()) {
    return value.trim();
  }
  if (tier === "elite") return "intel-elite";
  if (tier === "pro") return "intel-pro";
  if (tier === "basic") return "intel-basic";
  return "intel-community";
}

function resolveTierWebhook(tier: SubscriptionTier) {
  const direct = process.env[`TRADEHAX_DISCORD_WEBHOOK_${tier.toUpperCase()}`];
  if (direct && direct.trim()) {
    return {
      tier,
      webhookUrl: direct.trim(),
      channelLabel: resolveChannelLabel(tier),
      viaFallback: false,
    } satisfies IntelligenceDiscordRoute;
  }

  const fallback = process.env.TRADEHAX_DISCORD_WEBHOOK;
  if (fallback && fallback.trim()) {
    return {
      tier,
      webhookUrl: fallback.trim(),
      channelLabel: resolveChannelLabel(tier),
      viaFallback: true,
    } satisfies IntelligenceDiscordRoute;
  }

  return null;
}

export function resolveDiscordRouteForTier(tier: SubscriptionTier) {
  return resolveTierWebhook(tier);
}

function resolveStrategy(alert: IntelligenceAlert): StrategyProfile {
  if (alert.source === "flow") return "options_flow";
  if (alert.source === "dark_pool") return "dark_pool";
  if (alert.source === "crypto") return "crypto_flow";
  return "catalyst_news";
}

function resolveRisk(alert: IntelligenceAlert): RiskProfile {
  if (alert.severity === "urgent") return "urgent";
  if (alert.severity === "watch") return "watch";
  return "info";
}

function groupAlerts(alerts: IntelligenceAlert[]) {
  const groups = new Map<string, AlertGroup>();
  for (const alert of alerts) {
    const strategy = resolveStrategy(alert);
    const risk = resolveRisk(alert);
    const key = `${strategy}:${risk}`;
    const existing = groups.get(key);
    if (existing) {
      existing.alerts.push(alert);
    } else {
      groups.set(key, {
        strategy,
        risk,
        alerts: [alert],
      });
    }
  }
  return Array.from(groups.values());
}

function resolveThreadId(strategy: StrategyProfile, risk: RiskProfile) {
  const exact = process.env[
    `TRADEHAX_DISCORD_THREAD_${strategy.toUpperCase()}_${risk.toUpperCase()}`
  ];
  if (exact && exact.trim()) return exact.trim();

  const strategyOnly = process.env[`TRADEHAX_DISCORD_THREAD_${strategy.toUpperCase()}`];
  if (strategyOnly && strategyOnly.trim()) return strategyOnly.trim();

  const riskOnly = process.env[`TRADEHAX_DISCORD_THREAD_${risk.toUpperCase()}`];
  if (riskOnly && riskOnly.trim()) return riskOnly.trim();

  const defaultThread = process.env.TRADEHAX_DISCORD_DEFAULT_THREAD_ID;
  if (defaultThread && defaultThread.trim()) return defaultThread.trim();

  return undefined;
}

function appendThreadQuery(webhookUrl: string, threadId?: string) {
  if (!threadId) return webhookUrl;
  const separator = webhookUrl.includes("?") ? "&" : "?";
  return `${webhookUrl}${separator}thread_id=${encodeURIComponent(threadId)}`;
}

function formatAlertLine(alert: IntelligenceAlert) {
  return `- [${alert.severity.toUpperCase()}][${alert.source}] ${alert.symbol}: ${alert.summary}`;
}

function buildDiscordMessage(input: {
  userId: string;
  tier: SubscriptionTier;
  channelLabel: string;
  strategy: StrategyProfile;
  risk: RiskProfile;
  alerts: IntelligenceAlert[];
}) {
  const lines = input.alerts.slice(0, 15).map(formatAlertLine);
  const remaining = input.alerts.length - lines.length;
  if (remaining > 0) {
    lines.push(`- ...${remaining} additional alerts not shown`);
  }

  return [
    "TradeHax Intelligence Alert Batch",
    `Tier: ${input.tier}`,
    `Channel: ${input.channelLabel}`,
    `User: ${input.userId}`,
    `Strategy: ${input.strategy}`,
    `Risk: ${input.risk}`,
    `Alerts: ${input.alerts.length}`,
    "",
    ...lines,
    "",
    "Open dashboard: https://www.tradehax.net/intelligence/watchlist",
  ].join("\n");
}

async function postGroupToDiscord(input: {
  route: IntelligenceDiscordRoute;
  userId: string;
  strategy: StrategyProfile;
  risk: RiskProfile;
  tier: SubscriptionTier;
  alerts: IntelligenceAlert[];
}) {
  const threadId = resolveThreadId(input.strategy, input.risk);
  const webhookUrl = appendThreadQuery(input.route.webhookUrl, threadId);
  const content = buildDiscordMessage({
    userId: input.userId,
    tier: input.tier,
    channelLabel: input.route.channelLabel,
    strategy: input.strategy,
    risk: input.risk,
    alerts: input.alerts,
  });

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content,
    }),
  });

  if (!response.ok) {
    throw new Error(`Discord webhook failed with status ${response.status}`);
  }

  return {
    threadId,
  };
}

export async function dispatchAlertsToDiscord(input: {
  userId: string;
  tier: SubscriptionTier;
  alerts: IntelligenceAlert[];
}): Promise<IntelligenceDiscordDispatchResult> {
  const startedAtMs = Date.now();
  const deliveredAt = new Date().toISOString();
  const route = resolveDiscordRouteForTier(input.tier);
  const defaultThreadId = process.env.TRADEHAX_DISCORD_DEFAULT_THREAD_ID || undefined;

  if (!route) {
    recordAlertDispatchMetric({
      ok: false,
      latencyMs: Date.now() - startedAtMs,
      attempted: input.alerts.length,
      delivered: 0,
    });
    return {
      ok: false,
      route: {
        tier: input.tier,
        channelLabel: resolveChannelLabel(input.tier),
        viaFallback: false,
        webhookConfigured: false,
        defaultThreadId,
      },
      deliveredCount: 0,
      deliveredAt,
      groups: [],
      error: "No Discord webhook configured for this tier route.",
    };
  }

  if (input.alerts.length === 0) {
    recordAlertDispatchMetric({
      ok: true,
      latencyMs: Date.now() - startedAtMs,
      attempted: 0,
      delivered: 0,
    });
    return {
      ok: true,
      route: {
        tier: route.tier,
        channelLabel: route.channelLabel,
        viaFallback: route.viaFallback,
        webhookConfigured: true,
        defaultThreadId,
      },
      deliveredCount: 0,
      deliveredAt,
      groups: [],
    };
  }

  const grouped = groupAlerts(input.alerts);
  const groupResults: IntelligenceDiscordGroupDispatch[] = [];
  let deliveredCount = 0;

  for (const group of grouped) {
    try {
      const result = await postGroupToDiscord({
        route,
        userId: input.userId,
        strategy: group.strategy,
        risk: group.risk,
        tier: input.tier,
        alerts: group.alerts,
      });
      deliveredCount += group.alerts.length;
      groupResults.push({
        strategy: group.strategy,
        risk: group.risk,
        deliveredCount: group.alerts.length,
        ok: true,
        threadId: result.threadId,
      });
    } catch (error) {
      groupResults.push({
        strategy: group.strategy,
        risk: group.risk,
        deliveredCount: 0,
        ok: false,
        threadId: resolveThreadId(group.strategy, group.risk),
        error: error instanceof Error ? error.message : "Group dispatch failure.",
      });
    }
  }

  const success = groupResults.every((item) => item.ok);
  recordAlertDispatchMetric({
    ok: success,
    latencyMs: Date.now() - startedAtMs,
    attempted: input.alerts.length,
    delivered: deliveredCount,
  });
  return {
    ok: success,
    route: {
      tier: route.tier,
      channelLabel: route.channelLabel,
      viaFallback: route.viaFallback,
      webhookConfigured: true,
      defaultThreadId,
    },
    deliveredCount,
    deliveredAt,
    groups: groupResults,
    error: success ? undefined : "One or more alert groups failed dispatch.",
  };
}
