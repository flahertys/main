#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "data", "tradebot");
const OUT_FILE = path.join(OUT_DIR, "eval-suite.jsonl");

const scenarios = [
  {
    id: "eval_001",
    persona: "learner",
    asset: "SOL",
    timeframe: "15m",
    regime: "high_volatility",
    macro: "US CPI surprise came in hot while yields moved higher",
    micro: "order book depth is thin with frequent spread widening",
    optionsFlow: "put-call skew spiked with downside put blocks",
    indicators: ["VWAP", "ATR", "RSI(14)", "Bollinger Bands"],
  },
  {
    id: "eval_002",
    persona: "premium",
    asset: "BTC",
    timeframe: "4h",
    regime: "bull_trend",
    macro: "Risk-on broadens after dovish central bank commentary",
    micro: "aggressive buys absorb offers near breakout level",
    optionsFlow: "unusual call sweep activity and rising call OI",
    indicators: ["anchored VWAP", "MACD", "200 EMA", "realized volatility"],
  },
  {
    id: "eval_003",
    persona: "learner",
    asset: "SPY",
    timeframe: "1d",
    regime: "range_bound",
    macro: "PMI data mixed and growth expectations flatten",
    micro: "intraday delta flips while volume remains average",
    optionsFlow: "dealer gamma concentrated near spot creating pin risk",
    indicators: ["market profile value area", "RSI(14)", "MACD", "ATR"],
  },
  {
    id: "eval_004",
    persona: "premium",
    asset: "QQQ",
    timeframe: "1w",
    regime: "macro_shock",
    macro: "Liquidity tightens amid USD strength and credit spread widening",
    micro: "book imbalance rotates quickly around key levels",
    optionsFlow: "large downside hedge rolls with elevated put OI",
    indicators: ["cross-asset correlation", "term structure", "200 EMA", "VWAP"],
  },
];

function buildPrompt(s) {
  return [
    `Construct a ${s.timeframe} outlook for ${s.asset} in a ${s.regime.replace(/_/g, " ")} regime.`,
    `Persona: ${s.persona}.`,
    `Macro context: ${s.macro}.`,
    `Microstructure context: ${s.micro}.`,
    `Unusual options flow: ${s.optionsFlow}.`,
    `Use these indicators: ${s.indicators.join(", ")}.`,
    "Output format required: Bias, Trigger, Invalidation, Position Size, Risk Controls, and Next Learning/Execution Step.",
    "Do not promise returns.",
  ].join(" ");
}

function buildRow(s) {
  return {
    id: s.id,
    persona: s.persona,
    timeframe: s.timeframe,
    asset: s.asset,
    prompt: buildPrompt(s),
    expected: {
      mustMention: [
        "bias",
        "trigger",
        "invalidation",
        "position",
        "risk",
        "macro",
        "micro",
        "options",
      ],
      requiredIndicators: s.indicators,
      personaTone: s.persona,
    },
    rubricWeights: {
      structure: 0.2,
      riskDiscipline: 0.2,
      macroMicroAlignment: 0.2,
      optionsFlowUse: 0.15,
      indicatorGrounding: 0.15,
      personaQuality: 0.1,
    },
  };
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const rows = scenarios.map(buildRow);
  fs.writeFileSync(OUT_FILE, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");

  console.log("✅ Tradebot eval suite generated");
  console.log(`Scenarios: ${rows.length}`);
  console.log(`Output: ${OUT_FILE}`);
}

main();
