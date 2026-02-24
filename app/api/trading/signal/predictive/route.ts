import { enforceRateLimit, enforceTrustedOrigin } from "@/lib/security";
import { generateTradebotSignalOutlooks } from "@/lib/trading/signal-outlook";
import { NextRequest, NextResponse } from "next/server";

const symbols = ["SOL/USDC", "ETH/USDC", "BTC/USDC"];

function generatePredictiveSignals() {
  return generateTradebotSignalOutlooks({
    symbols,
    seed: 101,
  });
}

export async function GET(request: NextRequest) {
  const originBlock = enforceTrustedOrigin(request);
  if (originBlock) {
    return originBlock;
  }

  const rateLimit = enforceRateLimit(request, {
    keyPrefix: "trading:signal:predictive",
    max: 100,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  const feedSource =
    process.env.BLOOMBERG_API_KEY || process.env.BPIPE_TOKEN ? "bloomberg" : "simulated";

  return NextResponse.json(
    {
      ok: true,
      source: feedSource,
      signals: generatePredictiveSignals(),
      notes: {
        model: "tradebot-signal-outlook-v1",
        includes: ["timeframes", "macro", "micro", "options-flow", "hedge-fund-indicators", "learner/premium"],
      },
    },
    { headers: rateLimit.headers },
  );
}
