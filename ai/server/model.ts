type TradeModelInput = {
  symbol?: string;
  price?: number;
  momentum?: number;
  volatility?: number;
  sentiment?: number;
  confidence?: number;
};

type TradeSignal = {
  signal: "buy" | "hold" | "sell";
  confidence: number;
  riskLevel: "low" | "medium" | "high";
  rationale: string;
  timestamp: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export async function runTradeModel(input: TradeModelInput): Promise<TradeSignal> {
  const momentum = Number(input?.momentum ?? 0);
  const sentiment = Number(input?.sentiment ?? 0);
  const volatility = Math.abs(Number(input?.volatility ?? 0));
  const baselineConfidence = Number(input?.confidence ?? 62);

  const score = momentum * 0.45 + sentiment * 0.4 - volatility * 0.25;

  let signal: TradeSignal["signal"] = "hold";
  if (score >= 0.4) signal = "buy";
  if (score <= -0.4) signal = "sell";

  const confidence = clamp(Math.round(baselineConfidence + score * 20 - volatility * 8), 5, 99);

  const riskLevel: TradeSignal["riskLevel"] =
    volatility >= 0.75 ? "high" : volatility >= 0.35 ? "medium" : "low";

  return {
    signal,
    confidence,
    riskLevel,
    rationale:
      signal === "buy"
        ? "Momentum and sentiment are supportive relative to volatility."
        : signal === "sell"
          ? "Negative composite pressure with elevated downside risk."
          : "Signal strength is mixed; waiting for confirmation is preferred.",
    timestamp: new Date().toISOString(),
  };
}
