#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "data", "tradebot");

const SOURCE_FILES = [
  "ai-training-set.jsonl",
  "tradehax-training-expanded.jsonl",
  "tradehax-crypto-education.jsonl",
  "tradehax-domain-priority.jsonl",
  "data/custom-llm/train.jsonl",
].map((relativePath) => path.join(ROOT, relativePath));

const MIN_QUALITY_SCORE = Number.parseFloat(process.env.TRADEBOT_MIN_QUALITY_SCORE || "0.28");
const VALIDATION_SHARE = Number.parseFloat(process.env.TRADEBOT_VALIDATION_SHARE || "0.2");
const SHUFFLE_SEED = Number.parseInt(process.env.TRADEBOT_DATASET_SHUFFLE_SEED || "1337", 10);
const SCENARIO_MULTIPLIER = Number.parseInt(process.env.TRADEBOT_SCENARIO_MULTIPLIER || "2", 10);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function seededRandomFactory(seed) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;

  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function seededShuffle(items, seed) {
  const random = seededRandomFactory(seed);
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const lines = fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, index) => {
    try {
      return JSON.parse(line);
    } catch {
      throw new Error(`Invalid JSONL at ${filePath}:${index + 1}`);
    }
  });
}

function normalizeWhitespace(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function firstMessageByRole(messages, role) {
  const found = Array.isArray(messages)
    ? messages.find((m) => m && typeof m === "object" && m.role === role && typeof m.content === "string")
    : null;
  return found ? normalizeWhitespace(found.content) : "";
}

function normalizeRecord(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const instruction = normalizeWhitespace(raw.instruction || raw.instructions || firstMessageByRole(raw.messages, "user"));
  const input = normalizeWhitespace(raw.input || raw.context || "");
  const response = normalizeWhitespace(raw.response || raw.output || firstMessageByRole(raw.messages, "assistant"));
  const category = normalizeWhitespace(raw.category || raw?.metadata?.category || "general").toLowerCase();

  if (!instruction || !response) {
    return null;
  }

  return {
    instruction,
    input,
    response,
    category,
    source: normalizeWhitespace(raw?.metadata?.source || raw?.source || "jsonl"),
  };
}

const TRADEBOT_KEYWORDS = [
  "trade", "trading", "crypto", "stock", "market", "bot", "strategy", "signal", "portfolio", "risk",
  "stop", "entry", "exit", "position", "futures", "defi", "solana", "execution", "slippage", "liquidity",
];

const ACTION_KEYWORDS = [
  "checklist", "step", "steps", "plan", "risk", "position size", "stop-loss", "take-profit", "rebalance",
  "monitor", "entry", "exit", "if", "then", "pause", "review", "journal",
];

function keywordHitCount(text, keywords) {
  const lc = text.toLowerCase();
  return keywords.reduce((count, keyword) => (lc.includes(keyword) ? count + 1 : count), 0);
}

function scoreRecord(record) {
  const joined = `${record.instruction} ${record.input} ${record.response}`;
  const tradebotHits = keywordHitCount(joined, TRADEBOT_KEYWORDS);
  const actionHits = keywordHitCount(record.response, ACTION_KEYWORDS);

  const responseLength = record.response.length;
  const instructionLength = record.instruction.length;

  const lengthScore = clamp((responseLength - 70) / 340, 0, 1) * 0.28;
  const instructionScore = clamp((instructionLength - 20) / 80, 0, 1) * 0.12;
  const domainScore = clamp(tradebotHits / 8, 0, 1) * 0.4;
  const actionScore = clamp(actionHits / 6, 0, 1) * 0.2;

  return Number((lengthScore + instructionScore + domainScore + actionScore).toFixed(4));
}

function isTradebotRelevant(record) {
  const category = record.category;
  if (/(trade|crypto|stock|bot|market|defi|portfolio|risk|signal|hft)/i.test(category)) {
    return true;
  }

  const joined = `${record.instruction} ${record.input} ${record.response}`.toLowerCase();
  return /(trade|trading|crypto|stock|bot|portfolio|signal|market|defi|futures|position|risk)/.test(joined);
}

function dedupe(records) {
  const seen = new Set();
  const out = [];

  for (const row of records) {
    const key = `${row.instruction.toLowerCase()}|${row.response.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }

  return out;
}

const TIMEFRAMES = ["5m", "15m", "1h", "4h", "1d", "1w"];
const MARKET_REGIMES = ["bull_trend", "bear_trend", "range_bound", "high_volatility", "macro_shock"];
const MACRO_SIGNALS = [
  "Fed remains restrictive and real yields are elevated",
  "Disinflation trend accelerates and rate-cut expectations are rising",
  "US labor market is cooling while growth remains positive",
  "Global PMI prints diverge across regions",
  "Liquidity conditions tighten as USD strength persists",
];
const MICRO_SIGNALS = [
  "order book imbalance favors bids",
  "spread widens and top-of-book depth thins",
  "aggressive sells absorbed near prior support",
  "delta and volume diverge from spot momentum",
  "funding rates rise while perp basis stays elevated",
];
const OPTIONS_FLOW_SIGNALS = [
  "unusual call sweep activity near weekly highs",
  "put-call skew rises with heavy downside hedging",
  "large dealer gamma positioning near current spot",
  "increased open interest on out-of-the-money puts",
  "blocks indicate calendar spread accumulation",
];
const HEDGE_FUND_INDICATORS = [
  "VWAP",
  "anchored VWAP",
  "market profile value area",
  "RSI(14)",
  "MACD",
  "ATR",
  "Bollinger Bands",
  "200 EMA",
  "realized volatility",
  "term structure",
  "cross-asset correlation",
  "liquidity regime",
];

function pickBySeed(items, index) {
  return items[index % items.length];
}

function learnerResponseBase(args) {
  return [
    `Timeframe outlook: ${args.timeframe}. Regime: ${args.regime}.`,
    `Macro view: ${args.macro}.`,
    `Microstructure cue: ${args.micro}.`,
    `Options flow cue: ${args.optionsFlow}.`,
    `Indicators to confirm: ${args.indicators.join(", ")}.`,
    "Beginner checklist: define invalidation, size position small, set stop-loss before entry, and take partial profits at predefined levels.",
    "Learning moment: if macro and micro disagree, reduce size and wait for confirmation instead of forcing trades.",
  ].join(" ");
}

function premiumResponseBase(args) {
  return [
    `Desk framework (${args.timeframe}, ${args.regime}): run top-down check (macro -> cross-asset -> microstructure -> options positioning).`,
    `Macro condition: ${args.macro}. Micro condition: ${args.micro}. Options flow: ${args.optionsFlow}.`,
    `Execution stack: ${args.indicators.join(", ")}.`,
    "Execution protocol: pre-define entry bands, dynamic stop via ATR, scale in only on liquidity confirmation, and cap single-idea risk to desk limits.",
    "Risk controls: scenario stress test, correlation shock check, and kill-switch trigger after consecutive failed setups.",
  ].join(" ");
}

function buildScenarioRows(records) {
  const rows = [];
  const source = seededShuffle(records, SHUFFLE_SEED + 97).slice(0, Math.max(10, 20 * Math.max(1, SCENARIO_MULTIPLIER)));

  for (let i = 0; i < source.length; i += 1) {
    const timeframe = pickBySeed(TIMEFRAMES, i);
    const regime = pickBySeed(MARKET_REGIMES, i);
    const macro = pickBySeed(MACRO_SIGNALS, i + 3);
    const micro = pickBySeed(MICRO_SIGNALS, i + 5);
    const optionsFlow = pickBySeed(OPTIONS_FLOW_SIGNALS, i + 7);
    const indicators = [
      pickBySeed(HEDGE_FUND_INDICATORS, i),
      pickBySeed(HEDGE_FUND_INDICATORS, i + 2),
      pickBySeed(HEDGE_FUND_INDICATORS, i + 4),
      pickBySeed(HEDGE_FUND_INDICATORS, i + 6),
    ];

    const basePrompt = `Build a ${timeframe} outlook for a ${regime.replace(/_/g, " ")} market using macro/micro data and unusual options flow.`;
    const context = [
      `Macro: ${macro}`,
      `Micro: ${micro}`,
      `Options flow: ${optionsFlow}`,
      `Required indicators: ${indicators.join(", ")}`,
      "Output must include: bias, trigger, invalidation, and risk sizing guidance.",
    ].join(" | ");

    rows.push({
      instruction: `${basePrompt} Explain it for a learner paying for coaching.`,
      input: context,
      response: learnerResponseBase({ timeframe, regime, macro, micro, optionsFlow, indicators }),
      category: "tradebot_timeframe_learner",
      source: "tradebot-scenario-generator",
    });

    rows.push({
      instruction: `${basePrompt} Provide premium desk-grade execution guidance.`,
      input: context,
      response: premiumResponseBase({ timeframe, regime, macro, micro, optionsFlow, indicators }),
      category: "tradebot_timeframe_premium",
      source: "tradebot-scenario-generator",
    });
  }

  return rows;
}

function toChatTrainingRow(record) {
  const userContent = record.input
    ? `${record.instruction}\n\nContext: ${record.input}`
    : record.instruction;

  return {
    messages: [
      {
        role: "system",
        content:
          "You are TradeHax Tradebot Copilot. Optimize for risk-adjusted execution, explicit constraints, and step-by-step actions. Never promise returns.",
      },
      {
        role: "user",
        content: userContent,
      },
      {
        role: "assistant",
        content: record.response,
      },
    ],
    metadata: {
      category: record.category,
      source: record.source,
      qualityScore: record.qualityScore,
    },
  };
}

function splitDataset(records, validationShare) {
  const validationSize = Math.max(1, Math.floor(records.length * validationShare));
  const validation = records.slice(0, validationSize);
  const train = records.slice(validationSize);

  return { train, validation };
}

function writeJsonl(filePath, rows) {
  const content = rows.map((row) => JSON.stringify(row)).join("\n") + "\n";
  fs.writeFileSync(filePath, content, "utf8");
}

function main() {
  const rawRows = SOURCE_FILES.flatMap((file) => readJsonl(file));
  const normalized = rawRows.map(normalizeRecord).filter(Boolean);
  const relevant = normalized.filter(isTradebotRelevant);
  const scenarioRows = buildScenarioRows(relevant);
  const combinedRelevant = relevant.concat(scenarioRows);

  const scored = combinedRelevant.map((row) => ({
    ...row,
    qualityScore: scoreRecord(row),
  }));

  const filtered = scored.filter((row) => row.qualityScore >= MIN_QUALITY_SCORE);
  const unique = dedupe(filtered);
  const shuffled = seededShuffle(unique, SHUFFLE_SEED);

  if (shuffled.length < 24) {
    throw new Error(
      `Tradebot dataset too small after filtering (${shuffled.length} rows). Lower TRADEBOT_MIN_QUALITY_SCORE or add more source data.`,
    );
  }

  const { train, validation } = splitDataset(shuffled, clamp(VALIDATION_SHARE, 0.1, 0.35));
  const trainChat = train.map(toChatTrainingRow);
  const validationChat = validation.map(toChatTrainingRow);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  writeJsonl(path.join(OUTPUT_DIR, "train.raw.jsonl"), train);
  writeJsonl(path.join(OUTPUT_DIR, "validation.raw.jsonl"), validation);
  writeJsonl(path.join(OUTPUT_DIR, "train.chat.jsonl"), trainChat);
  writeJsonl(path.join(OUTPUT_DIR, "validation.chat.jsonl"), validationChat);

  const categoryCounts = shuffled.reduce((acc, row) => {
    const key = row.category || "general";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const avgQuality =
    shuffled.reduce((sum, row) => sum + row.qualityScore, 0) / Math.max(1, shuffled.length);

  const manifest = {
    generatedAt: new Date().toISOString(),
    sources: SOURCE_FILES.map((file) => path.relative(ROOT, file)).filter((file) => fs.existsSync(path.join(ROOT, file))),
    config: {
      minQualityScore: MIN_QUALITY_SCORE,
      validationShare: clamp(VALIDATION_SHARE, 0.1, 0.35),
      shuffleSeed: SHUFFLE_SEED,
    },
    stats: {
      rawRows: rawRows.length,
      normalizedRows: normalized.length,
      relevantRows: relevant.length,
      syntheticScenarioRows: scenarioRows.length,
      combinedRelevantRows: combinedRelevant.length,
      filteredRows: filtered.length,
      dedupedRows: unique.length,
      finalRows: shuffled.length,
      trainRows: train.length,
      validationRows: validation.length,
      avgQualityScore: Number(avgQuality.toFixed(4)),
      categoryDistribution: categoryCounts,
    },
    outputs: {
      trainRaw: "data/tradebot/train.raw.jsonl",
      validationRaw: "data/tradebot/validation.raw.jsonl",
      trainChat: "data/tradebot/train.chat.jsonl",
      validationChat: "data/tradebot/validation.chat.jsonl",
    },
    trainingNotes: [
      "Use train.chat.jsonl for chat fine-tuning or instruction tuning frameworks.",
      "Use validation.chat.jsonl for early stopping and hyperparameter checks.",
      "Keep model objective focused on risk-adjusted decision support, not guaranteed returns.",
    ],
  };

  fs.writeFileSync(path.join(OUTPUT_DIR, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log("✅ Tradebot training dataset prepared");
  console.log(`Rows (train/val): ${train.length}/${validation.length}`);
  console.log(`Average quality score: ${manifest.stats.avgQualityScore}`);
  console.log(`Manifest: ${path.join(OUTPUT_DIR, "manifest.json")}`);
}

main();
