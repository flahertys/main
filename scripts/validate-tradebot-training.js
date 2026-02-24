#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const MANIFEST_PATH = path.join(ROOT, "data", "tradebot", "manifest.json");
const TRAIN_PATH = path.join(ROOT, "data", "tradebot", "train.chat.jsonl");
const VAL_PATH = path.join(ROOT, "data", "tradebot", "validation.chat.jsonl");

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function parseJsonl(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`Missing file: ${path.relative(ROOT, filePath)}. Run npm run tradebot:prepare-training first.`);
  }

  const lines = fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    fail(`Dataset file is empty: ${path.relative(ROOT, filePath)}`);
  }

  return lines.map((line, index) => {
    try {
      return JSON.parse(line);
    } catch {
      fail(`Invalid JSON at ${path.relative(ROOT, filePath)}:${index + 1}`);
      return null;
    }
  });
}

function validateChatRow(row, index, label) {
  if (!row || typeof row !== "object" || !Array.isArray(row.messages)) {
    fail(`${label} row ${index + 1}: invalid row structure.`);
  }

  if (row.messages.length < 3) {
    fail(`${label} row ${index + 1}: requires at least 3 messages.`);
  }

  const [system, user, assistant] = row.messages;

  if (system?.role !== "system" || typeof system?.content !== "string" || system.content.length < 16) {
    fail(`${label} row ${index + 1}: invalid system message.`);
  }

  if (user?.role !== "user" || typeof user?.content !== "string" || user.content.length < 10) {
    fail(`${label} row ${index + 1}: invalid user message.`);
  }

  if (assistant?.role !== "assistant" || typeof assistant?.content !== "string" || assistant.content.length < 16) {
    fail(`${label} row ${index + 1}: invalid assistant message.`);
  }

  const quality = row?.metadata?.qualityScore;
  if (typeof quality !== "number" || !Number.isFinite(quality) || quality < 0.28) {
    fail(`${label} row ${index + 1}: invalid qualityScore ${quality}`);
  }
}

function keywordCoverage(rows) {
  const keyTerms = [
    "risk", "trade", "entry", "exit", "strategy", "portfolio", "market", "bot", "position", "stop",
  ];

  const joined = rows
    .map((row) => `${row?.messages?.[1]?.content || ""} ${row?.messages?.[2]?.content || ""}`.toLowerCase())
    .join(" ");

  const hits = keyTerms.reduce((sum, term) => (joined.includes(term) ? sum + 1 : sum), 0);
  return {
    hits,
    total: keyTerms.length,
    ratio: hits / keyTerms.length,
  };
}

function textFromRows(rows) {
  return rows
    .map((row) => `${row?.messages?.[1]?.content || ""} ${row?.messages?.[2]?.content || ""}`.toLowerCase())
    .join(" ");
}

function requiredSignalCoverage(rows) {
  const corpus = textFromRows(rows);

  const coverage = {
    timeframe: /(5m|15m|1h|4h|1d|1w|timeframe)/.test(corpus),
    macro: /(macro|fed|inflation|yield|pmi|rates|liquidity)/.test(corpus),
    micro: /(microstructure|order book|spread|depth|funding|basis|delta)/.test(corpus),
    optionsFlow: /(options flow|put-call|skew|gamma|open interest|call sweep|puts)/.test(corpus),
    indicators: /(vwap|ema|rsi|macd|atr|bollinger|market profile|correlation|volatility)/.test(corpus),
    learner: /(beginner|learning|checklist|coaching)/.test(corpus),
    premium: /(premium|desk|execution protocol|risk controls)/.test(corpus),
  };

  return coverage;
}

function main() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    fail("Missing manifest.json. Run npm run tradebot:prepare-training first.");
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const train = parseJsonl(TRAIN_PATH);
  const validation = parseJsonl(VAL_PATH);

  train.forEach((row, index) => validateChatRow(row, index, "train"));
  validation.forEach((row, index) => validateChatRow(row, index, "validation"));

  if (train.length < 18) {
    fail(`Training set too small: ${train.length} rows.`);
  }

  if (validation.length < 5) {
    fail(`Validation set too small: ${validation.length} rows.`);
  }

  const total = train.length + validation.length;
  const valRatio = validation.length / total;
  if (valRatio < 0.1 || valRatio > 0.35) {
    fail(`Validation ratio out of bounds: ${(valRatio * 100).toFixed(1)}%`);
  }

  const coverage = keywordCoverage(train.concat(validation));
  if (coverage.ratio < 0.7) {
    fail(`Keyword coverage too low: ${(coverage.ratio * 100).toFixed(1)}%`);
  }

  const avgQuality = manifest?.stats?.avgQualityScore;
  if (typeof avgQuality !== "number" || avgQuality < 0.28) {
    fail(`Average quality score too low: ${avgQuality}`);
  }

  const signalCoverage = requiredSignalCoverage(train.concat(validation));
  const missing = Object.entries(signalCoverage)
    .filter(([, ok]) => !ok)
    .map(([key]) => key);

  if (missing.length > 0) {
    fail(`Missing required strategy coverage: ${missing.join(", ")}`);
  }

  console.log("✅ Tradebot training validation passed");
  console.log(`Train rows: ${train.length}`);
  console.log(`Validation rows: ${validation.length}`);
  console.log(`Validation ratio: ${(valRatio * 100).toFixed(1)}%`);
  console.log(`Keyword coverage: ${coverage.hits}/${coverage.total}`);
  console.log(`Average quality score: ${avgQuality}`);
  const signalHitCount = Object.values(signalCoverage).filter(Boolean).length;
  console.log(`Required signal coverage: ${signalHitCount}/${Object.keys(signalCoverage).length}`);
}

main();
