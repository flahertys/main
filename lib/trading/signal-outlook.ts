export type Timeframe = "5m" | "15m" | "1h" | "4h" | "1d" | "1w";

export type SignalBias = "long" | "short" | "neutral";

export type TimeframeOutlook = {
  timeframe: Timeframe;
  bias: SignalBias;
  trigger: string;
  invalidation: string;
  positionSizing: string;
  confidence: number;
};

export type TradebotSignalOutlook = {
  symbol: string;
  generatedAt: string;
  marketRegime: "bull_trend" | "bear_trend" | "range_bound" | "high_volatility" | "macro_shock";
  macro: string;
  micro: string;
  unusualOptionsFlow: string;
  hedgeFundIndicators: string[];
  timeframes: TimeframeOutlook[];
  learnerExperience: string;
  premiumExperience: string;
  riskControls: string[];
};

const REGIMES: TradebotSignalOutlook["marketRegime"][] = [
  "bull_trend",
  "bear_trend",
  "range_bound",
  "high_volatility",
  "macro_shock",
];

const MACRO = [
  "Fed speakers remain restrictive while real yields stay elevated.",
  "Disinflation trend continues with rising probability of policy easing.",
  "Global PMI divergence suggests uneven growth and sector rotation.",
  "USD strength and tighter liquidity are pressuring high-beta assets.",
  "Employment softening with stable growth keeps macro regime mixed.",
];

const MICRO = [
  "Order-book imbalance shows aggressive bids absorbing sell pressure.",
  "Spread widening and thinning depth indicate fragile liquidity.",
  "Delta diverges from spot momentum, signaling possible reversal.",
  "Perp funding rises while basis holds elevated above spot.",
  "Volume clusters around prior value area with failed breakouts.",
];

const OPTIONS_FLOW = [
  "Unusual call sweeps are lifting near-term upside skew.",
  "Put hedging demand increased with downside OI concentration.",
  "Dealer gamma appears pinned near current spot levels.",
  "Large block trades suggest calendar spread positioning.",
  "Call/put imbalance normalizing after volatility spike.",
];

const INDICATORS = [
  "VWAP",
  "anchored VWAP",
  "market profile value area",
  "RSI(14)",
  "MACD",
  "ATR",
  "Bollinger Bands",
  "200 EMA",
  "realized volatility",
  "cross-asset correlation",
];

const TIMEFRAME_ORDER: Timeframe[] = ["5m", "15m", "1h", "4h", "1d", "1w"];

function seededRandomFactory(seed: number) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function pick<T>(arr: T[], index: number) {
  return arr[index % arr.length];
}

function buildTimeframeOutlook(seed: number, baseBias: SignalBias): TimeframeOutlook[] {
  const rnd = seededRandomFactory(seed);

  return TIMEFRAME_ORDER.map((tf, idx) => {
    const confidence = Number((0.56 + rnd() * 0.34 - idx * 0.01).toFixed(2));
    const bias = idx < 2 ? baseBias : idx % 3 === 0 ? "neutral" : baseBias;
    return {
      timeframe: tf,
      bias,
      trigger: `Enter on ${tf} confirmation above/below regime pivot with volume support.`,
      invalidation: `Exit if ${tf} closes against bias beyond ATR-based threshold.`,
      positionSizing: idx < 2 ? "0.35R" : idx < 4 ? "0.50R" : "0.75R",
      confidence: Math.max(0.35, Math.min(0.95, confidence)),
    };
  });
}

export function generateTradebotSignalOutlooks(input: {
  symbols?: string[];
  seed?: number;
}) {
  const symbols = input.symbols && input.symbols.length > 0 ? input.symbols : ["SOL/USDC", "BTC/USDC", "ETH/USDC"];
  const seed = Number.isFinite(input.seed) ? Number(input.seed) : 77;

  return symbols.map((symbol, index) => {
    const localSeed = seed + index * 31;
    const regime = pick(REGIMES, localSeed);
    const macro = pick(MACRO, localSeed + 1);
    const micro = pick(MICRO, localSeed + 2);
    const unusualOptionsFlow = pick(OPTIONS_FLOW, localSeed + 3);
    const indicatorSet = [pick(INDICATORS, localSeed), pick(INDICATORS, localSeed + 2), pick(INDICATORS, localSeed + 4), pick(INDICATORS, localSeed + 6)];

    const baseBias: SignalBias = regime === "bear_trend" || regime === "macro_shock" ? "short" : regime === "range_bound" ? "neutral" : "long";

    return {
      symbol,
      generatedAt: new Date().toISOString(),
      marketRegime: regime,
      macro,
      micro,
      unusualOptionsFlow,
      hedgeFundIndicators: indicatorSet,
      timeframes: buildTimeframeOutlook(localSeed + 5, baseBias),
      learnerExperience:
        "Learner mode: start with one timeframe, use checklist-based risk controls, and journal why entry/exit decisions were made.",
      premiumExperience:
        "Premium mode: run multi-timeframe confluence with macro/micro/options alignment and desk-grade risk budgeting before execution.",
      riskControls: [
        "Cap risk per idea to 0.5-1.0% of account.",
        "Use ATR-informed invalidation and avoid widening stops after entry.",
        "Pause after 2 consecutive failed setups in the same regime.",
      ],
    } satisfies TradebotSignalOutlook;
  });
}
