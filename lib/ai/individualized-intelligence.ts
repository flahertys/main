import { getTradingBehaviorProfile, hydrateTradingBehaviorProfile, type TradingBehaviorProfile } from "@/lib/ai/trading-personalization";
import { getPersistedTradingBehaviorProfile } from "@/lib/ai/training-persistence";

type PredictionDomain = "stock" | "crypto" | "kalshi" | "general";
type SloProfile = "latency" | "balanced" | "quality";

export type PersonalizedIntelligenceContext = {
  enabled: boolean;
  userId: string;
  profileSource: "persisted" | "memory";
  profile: {
    riskProfile: TradingBehaviorProfile["riskProfile"];
    tradesTracked: number;
    winRate: number;
    avgPnlPercent: number;
    confidenceAvg: number;
    favoriteSymbols: string[];
    preferredTimeframes: string[];
    topIndicators: string[];
  };
  tuningHints: {
    preferredSloProfile: SloProfile;
    tokenMultiplier: number;
    temperatureMultiplier: number;
    topPMultiplier: number;
    styleBias: "concise" | "coach" | "operator";
    reasons: string[];
  };
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function parseBooleanEnv(name: string, fallback: boolean) {
  const raw = String(process.env[name] || "").trim().toLowerCase();
  if (!raw) return fallback;
  if (["1", "true", "yes", "on"].includes(raw)) return true;
  if (["0", "false", "no", "off"].includes(raw)) return false;
  return fallback;
}

function topIndicators(profile: TradingBehaviorProfile, limit = 3) {
  return Object.entries(profile.favoriteIndicators || {})
    .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
    .slice(0, Math.max(1, limit))
    .map(([name]) => name);
}

function deriveTuningHints(input: {
  profile: TradingBehaviorProfile;
  domain: PredictionDomain;
  requestedSlo: SloProfile;
}) {
  const trades = Math.max(1, input.profile.tradesTracked);
  const winRate = input.profile.wins / trades;
  const avgPnl = input.profile.avgPnlPercent;
  const confidenceAvg = clamp(input.profile.confidenceAvg || 0.5, 0, 1);

  let preferredSloProfile: SloProfile = input.requestedSlo;
  let tokenMultiplier = 1;
  let temperatureMultiplier = 1;
  let topPMultiplier = 1;
  let styleBias: "concise" | "coach" | "operator" = "operator";
  const reasons: string[] = [];

  if (input.profile.riskProfile === "conservative") {
    tokenMultiplier *= 0.95;
    temperatureMultiplier *= 0.9;
    topPMultiplier *= 0.95;
    styleBias = "operator";
    reasons.push("risk_conservative_stability_bias");
  } else if (input.profile.riskProfile === "aggressive") {
    tokenMultiplier *= 1.05;
    temperatureMultiplier *= 1.08;
    topPMultiplier *= 1.02;
    styleBias = "coach";
    reasons.push("risk_aggressive_exploration_bias");
  }

  if (trades >= 25 && winRate >= 0.58 && avgPnl >= 0.8) {
    preferredSloProfile = input.requestedSlo === "latency" ? "balanced" : "quality";
    tokenMultiplier *= 1.08;
    reasons.push("profile_high_performance_quality_expand");
  }

  if (trades >= 16 && (winRate <= 0.45 || avgPnl < 0)) {
    preferredSloProfile = "latency";
    tokenMultiplier *= 0.9;
    temperatureMultiplier *= 0.9;
    reasons.push("profile_drawdown_stability_guard");
  }

  if (confidenceAvg <= 0.45) {
    temperatureMultiplier *= 0.93;
    reasons.push("profile_low_confidence_guard");
  } else if (confidenceAvg >= 0.72 && input.requestedSlo !== "latency") {
    tokenMultiplier *= 1.04;
    reasons.push("profile_high_confidence_expand");
  }

  if (input.domain === "general" && trades < 10) {
    styleBias = "concise";
    reasons.push("profile_low_history_general_concise");
  }

  return {
    preferredSloProfile,
    tokenMultiplier: clamp(tokenMultiplier, 0.78, 1.2),
    temperatureMultiplier: clamp(temperatureMultiplier, 0.78, 1.18),
    topPMultiplier: clamp(topPMultiplier, 0.85, 1.08),
    styleBias,
    reasons,
  };
}

export async function resolvePersonalizedIntelligenceContext(input: {
  userId: string;
  domain: PredictionDomain;
  requestedSlo: SloProfile;
}) {
  const enabled = parseBooleanEnv("TRADEHAX_INDIVIDUALIZED_AI_ENABLED", true);
  if (!enabled) {
    return null as PersonalizedIntelligenceContext | null;
  }

  let profile = getTradingBehaviorProfile(input.userId);
  let profileSource: "persisted" | "memory" = "memory";

  try {
    const persisted = await getPersistedTradingBehaviorProfile(input.userId);
    if (persisted) {
      profile = hydrateTradingBehaviorProfile(persisted);
      profileSource = "persisted";
    }
  } catch {
    profileSource = "memory";
  }

  const trades = Math.max(1, profile.tradesTracked);
  const winRate = profile.wins / trades;
  const hints = deriveTuningHints({
    profile,
    domain: input.domain,
    requestedSlo: input.requestedSlo,
  });

  return {
    enabled,
    userId: profile.userId,
    profileSource,
    profile: {
      riskProfile: profile.riskProfile,
      tradesTracked: profile.tradesTracked,
      winRate: Number.parseFloat(winRate.toFixed(4)),
      avgPnlPercent: Number.parseFloat(profile.avgPnlPercent.toFixed(4)),
      confidenceAvg: Number.parseFloat((profile.confidenceAvg || 0.5).toFixed(4)),
      favoriteSymbols: (profile.favoriteSymbols || []).slice(0, 6),
      preferredTimeframes: (profile.preferredTimeframes || []).slice(0, 5),
      topIndicators: topIndicators(profile, 3),
    },
    tuningHints: hints,
  } satisfies PersonalizedIntelligenceContext;
}

export function buildPersonalizedDirective(context: PersonalizedIntelligenceContext | null) {
  if (!context) return "";

  const symbols = context.profile.favoriteSymbols.join(", ") || "none";
  const timeframes = context.profile.preferredTimeframes.join(", ") || "none";
  const indicators = context.profile.topIndicators.join(", ") || "none";

  return [
    "Personalization directive:",
    `User risk profile: ${context.profile.riskProfile}.`,
    `Historical performance: trades=${context.profile.tradesTracked}, win_rate=${(context.profile.winRate * 100).toFixed(1)}%, avg_pnl=${context.profile.avgPnlPercent.toFixed(2)}%.`,
    `Preferred symbols: ${symbols}. Preferred timeframes: ${timeframes}.`,
    `Top indicators to prioritize in reasoning: ${indicators}.`,
    "Adapt response detail and actionability to this user profile while keeping assumptions explicit and risk controls concrete.",
  ].join("\n");
}
