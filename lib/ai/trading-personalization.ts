import { sanitizePlainText } from "@/lib/security";

export type TradingIndicator =
  | "rsi"
  | "volume"
  | "bollinger_bands"
  | "macd"
  | "vwap"
  | "moon_cycles";

export type MarketRegime = "bull" | "bear" | "sideways" | "volatile" | "macro_shock";

export type TradeOutcomeRecord = {
  id: string;
  timestamp: string;
  symbol: string;
  regime: MarketRegime;
  side: "long" | "short";
  pnlPercent: number;
  confidence: number;
  indicatorsUsed: TradingIndicator[];
  notes?: string;
};

export type RegimeStats = {
  trades: number;
  wins: number;
  losses: number;
  avgPnlPercent: number;
};

export type TradingBehaviorProfile = {
  userId: string;
  createdAt: string;
  updatedAt: string;
  favoriteIndicators: Record<TradingIndicator, number>;
  riskProfile: "conservative" | "balanced" | "aggressive";
  preferredTimeframes: string[];
  favoriteSymbols: string[];
  regimes: Record<MarketRegime, RegimeStats>;
  tradesTracked: number;
  wins: number;
  losses: number;
  avgPnlPercent: number;
  confidenceAvg: number;
  recentOutcomes: TradeOutcomeRecord[];
  notes?: string;
};

type PersonalizationStore = {
  profiles: Map<string, TradingBehaviorProfile>;
};

const INDICATORS: TradingIndicator[] = ["rsi", "volume", "bollinger_bands", "macd", "vwap", "moon_cycles"];
const REGIMES: MarketRegime[] = ["bull", "bear", "sideways", "volatile", "macro_shock"];

function nowIso() {
  return new Date().toISOString();
}

function toBounded(value: unknown, min: number, max: number) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.min(max, Math.max(min, parsed));
}

function toIndicator(value: unknown): TradingIndicator | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = sanitizePlainText(value, 40).toLowerCase();
  return INDICATORS.includes(normalized as TradingIndicator) ? (normalized as TradingIndicator) : null;
}

function toRegime(value: unknown): MarketRegime {
  if (typeof value !== "string") {
    return "sideways";
  }
  const normalized = sanitizePlainText(value, 30).toLowerCase();
  return REGIMES.includes(normalized as MarketRegime) ? (normalized as MarketRegime) : "sideways";
}

function getStore(): PersonalizationStore {
  const globalRef = globalThis as typeof globalThis & {
    __TRADEHAX_PERSONALIZATION_STORE__?: PersonalizationStore;
  };

  if (!globalRef.__TRADEHAX_PERSONALIZATION_STORE__) {
    globalRef.__TRADEHAX_PERSONALIZATION_STORE__ = {
      profiles: new Map(),
    };
  }

  return globalRef.__TRADEHAX_PERSONALIZATION_STORE__;
}

function initializeFavoriteIndicators() {
  const base = {} as Record<TradingIndicator, number>;
  for (const indicator of INDICATORS) {
    base[indicator] = indicator === "rsi" || indicator === "volume" ? 0.6 : 0.4;
  }
  return base;
}

function initializeRegimes() {
  const regimes = {} as Record<MarketRegime, RegimeStats>;
  for (const regime of REGIMES) {
    regimes[regime] = {
      trades: 0,
      wins: 0,
      losses: 0,
      avgPnlPercent: 0,
    };
  }
  return regimes;
}

function normalizeUserId(value: unknown) {
  const normalized = sanitizePlainText(String(value || "anonymous"), 80).toLowerCase();
  return normalized || "anonymous";
}

function buildDefaultProfile(userId: string): TradingBehaviorProfile {
  const timestamp = nowIso();
  return {
    userId,
    createdAt: timestamp,
    updatedAt: timestamp,
    favoriteIndicators: initializeFavoriteIndicators(),
    riskProfile: "balanced",
    preferredTimeframes: ["15m", "1h"],
    favoriteSymbols: ["SOL", "BTC"],
    regimes: initializeRegimes(),
    tradesTracked: 0,
    wins: 0,
    losses: 0,
    avgPnlPercent: 0,
    confidenceAvg: 0.5,
    recentOutcomes: [],
  };
}

function updateAverage(previousAverage: number, previousCount: number, nextValue: number) {
  const total = previousAverage * previousCount + nextValue;
  return total / (previousCount + 1);
}

function deriveRiskProfile(profile: TradingBehaviorProfile) {
  const totalTrades = profile.tradesTracked;
  if (totalTrades < 8) {
    return profile.riskProfile;
  }
  const winRate = totalTrades > 0 ? profile.wins / totalTrades : 0;
  const pnl = profile.avgPnlPercent;

  if (winRate >= 0.6 && pnl >= 1.2) {
    return "aggressive";
  }
  if (winRate < 0.45 || pnl < 0) {
    return "conservative";
  }
  return "balanced";
}

function shiftIndicatorWeights(
  indicators: Record<TradingIndicator, number>,
  used: TradingIndicator[],
  pnlPercent: number,
) {
  const impact = pnlPercent >= 0 ? 0.03 : -0.025;
  const updated = { ...indicators };
  const set = new Set(used);

  for (const indicator of INDICATORS) {
    const current = updated[indicator] ?? 0.4;
    const delta = set.has(indicator) ? impact : -impact * 0.3;
    updated[indicator] = Number.parseFloat(Math.min(1, Math.max(0.05, current + delta)).toFixed(4));
  }

  return updated;
}

export function getTradingBehaviorProfile(userId: string) {
  const normalized = normalizeUserId(userId);
  const store = getStore();
  if (!store.profiles.has(normalized)) {
    store.profiles.set(normalized, buildDefaultProfile(normalized));
  }
  return store.profiles.get(normalized) as TradingBehaviorProfile;
}

export function hydrateTradingBehaviorProfile(profile: TradingBehaviorProfile) {
  const normalized = normalizeUserId(profile?.userId);
  const existing = getTradingBehaviorProfile(normalized);
  const hydrated: TradingBehaviorProfile = {
    ...existing,
    ...profile,
    userId: normalized,
    updatedAt: typeof profile.updatedAt === "string" ? profile.updatedAt : nowIso(),
  };
  getStore().profiles.set(normalized, hydrated);
  return hydrated;
}

export function listTradingBehaviorProfiles(limit = 100) {
  const bounded = Math.min(1000, Math.max(1, Math.floor(limit)));
  return Array.from(getStore().profiles.values())
    .sort((left, right) => right.tradesTracked - left.tradesTracked)
    .slice(0, bounded);
}

export function upsertTradingBehaviorProfile(input: {
  userId: string;
  riskProfile?: TradingBehaviorProfile["riskProfile"];
  preferredTimeframes?: string[];
  favoriteSymbols?: string[];
  favoriteIndicators?: Partial<Record<TradingIndicator, number>>;
  notes?: string;
}) {
  const existing = getTradingBehaviorProfile(input.userId);
  const timeframes = Array.isArray(input.preferredTimeframes)
    ? input.preferredTimeframes
        .map((value) => sanitizePlainText(String(value || ""), 20).toLowerCase())
        .filter(Boolean)
        .slice(0, 8)
    : existing.preferredTimeframes;

  const symbols = Array.isArray(input.favoriteSymbols)
    ? input.favoriteSymbols
        .map((value) => sanitizePlainText(String(value || ""), 16).toUpperCase())
        .filter(Boolean)
        .slice(0, 12)
    : existing.favoriteSymbols;

  const mergedIndicators = { ...existing.favoriteIndicators };
  if (input.favoriteIndicators && typeof input.favoriteIndicators === "object") {
    for (const [key, value] of Object.entries(input.favoriteIndicators)) {
      const indicator = toIndicator(key);
      const bounded = toBounded(value, 0, 1);
      if (!indicator || bounded === null) {
        continue;
      }
      mergedIndicators[indicator] = Number.parseFloat(bounded.toFixed(4));
    }
  }

  const updated: TradingBehaviorProfile = {
    ...existing,
    riskProfile:
      input.riskProfile === "conservative" || input.riskProfile === "balanced" || input.riskProfile === "aggressive"
        ? input.riskProfile
        : existing.riskProfile,
    preferredTimeframes: timeframes.length > 0 ? timeframes : existing.preferredTimeframes,
    favoriteSymbols: symbols.length > 0 ? symbols : existing.favoriteSymbols,
    favoriteIndicators: mergedIndicators,
    notes: typeof input.notes === "string" ? sanitizePlainText(input.notes, 400) : existing.notes,
    updatedAt: nowIso(),
  };

  getStore().profiles.set(existing.userId, updated);
  return updated;
}

export function recordTradingOutcome(input: {
  userId: string;
  symbol: string;
  regime: MarketRegime;
  side: "long" | "short";
  pnlPercent: number;
  confidence?: number;
  indicatorsUsed?: TradingIndicator[];
  notes?: string;
}) {
  const existing = getTradingBehaviorProfile(input.userId);
  const pnlPercent = toBounded(input.pnlPercent, -100, 100) ?? 0;
  const confidence = toBounded(input.confidence ?? 0.5, 0, 1) ?? 0.5;
  const symbol = sanitizePlainText(String(input.symbol || ""), 16).toUpperCase() || "UNKNOWN";
  const regime = toRegime(input.regime);
  const side = input.side === "short" ? "short" : "long";
  const indicators = Array.isArray(input.indicatorsUsed)
    ? input.indicatorsUsed
        .map((value) => toIndicator(value))
        .filter((value): value is TradingIndicator => Boolean(value))
    : [];

  const outcome: TradeOutcomeRecord = {
    id: `out_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: nowIso(),
    symbol,
    regime,
    side,
    pnlPercent: Number.parseFloat(pnlPercent.toFixed(4)),
    confidence: Number.parseFloat(confidence.toFixed(4)),
    indicatorsUsed: indicators,
    notes: typeof input.notes === "string" ? sanitizePlainText(input.notes, 320) : undefined,
  };

  const previousTrades = existing.tradesTracked;
  const nextTrades = previousTrades + 1;
  const didWin = pnlPercent >= 0;

  const regimeStats = existing.regimes[regime];
  const nextRegimeTrades = regimeStats.trades + 1;
  const nextRegimeAvg = updateAverage(regimeStats.avgPnlPercent, regimeStats.trades, pnlPercent);

  existing.regimes[regime] = {
    trades: nextRegimeTrades,
    wins: regimeStats.wins + (didWin ? 1 : 0),
    losses: regimeStats.losses + (didWin ? 0 : 1),
    avgPnlPercent: Number.parseFloat(nextRegimeAvg.toFixed(4)),
  };

  existing.tradesTracked = nextTrades;
  existing.wins += didWin ? 1 : 0;
  existing.losses += didWin ? 0 : 1;
  existing.avgPnlPercent = Number.parseFloat(updateAverage(existing.avgPnlPercent, previousTrades, pnlPercent).toFixed(4));
  existing.confidenceAvg = Number.parseFloat(updateAverage(existing.confidenceAvg, previousTrades, confidence).toFixed(4));
  existing.favoriteIndicators = shiftIndicatorWeights(existing.favoriteIndicators, indicators, pnlPercent);
  existing.riskProfile = deriveRiskProfile(existing);
  existing.recentOutcomes = [outcome, ...existing.recentOutcomes].slice(0, 160);

  const normalizedSymbol = symbol.toUpperCase();
  if (!existing.favoriteSymbols.includes(normalizedSymbol)) {
    existing.favoriteSymbols = [normalizedSymbol, ...existing.favoriteSymbols].slice(0, 12);
  }

  existing.updatedAt = nowIso();
  getStore().profiles.set(existing.userId, existing);

  return {
    profile: existing,
    outcome,
  };
}

function buildTrainingRow(input: {
  profile: TradingBehaviorProfile;
  outcome: TradeOutcomeRecord;
}) {
  const indicators = input.outcome.indicatorsUsed.length > 0 ? input.outcome.indicatorsUsed.join(", ") : "none";
  const regimeStats = input.profile.regimes[input.outcome.regime];
  const winRate =
    regimeStats.trades > 0 ? Number.parseFloat(((regimeStats.wins / regimeStats.trades) * 100).toFixed(2)) : 0;

  const instruction = `Analyze ${input.outcome.symbol} in a ${input.outcome.regime} regime using ${indicators}.`;
  const context = [
    `risk_profile=${input.profile.riskProfile}`,
    `avg_pnl=${input.profile.avgPnlPercent.toFixed(2)}%`,
    `regime_win_rate=${winRate}%`,
    `confidence_avg=${input.profile.confidenceAvg.toFixed(2)}`,
    `favorite_timeframes=${input.profile.preferredTimeframes.join("|")}`,
  ].join("; ");
  const output =
    input.outcome.pnlPercent >= 0
      ? `Outcome was profitable (${input.outcome.pnlPercent.toFixed(2)}%). Keep emphasizing ${indicators} with disciplined sizing.`
      : `Outcome was a loss (${input.outcome.pnlPercent.toFixed(2)}%). Tighten risk controls and validate ${indicators} against higher-timeframe structure.`;

  return {
    instruction,
    input: context,
    output,
    category: "MARKET",
  };
}

export function exportPersonalizedTrainingJsonl(input?: {
  userId?: string;
  maxRows?: number;
}) {
  const maxRows = Math.min(10_000, Math.max(0, Math.floor(input?.maxRows || 800)));
  const rows: { instruction: string; input: string; output: string; category: string }[] = [];
  const profiles = input?.userId
    ? [getTradingBehaviorProfile(input.userId)]
    : listTradingBehaviorProfiles(500);

  for (const profile of profiles) {
    for (const outcome of profile.recentOutcomes) {
      rows.push(buildTrainingRow({ profile, outcome }));
      if (rows.length >= maxRows) {
        break;
      }
    }
    if (rows.length >= maxRows) {
      break;
    }
  }

  return rows.map((row) => JSON.stringify(row)).join("\n");
}
