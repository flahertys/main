#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROOT = process.cwd();
const DATASET_PATH = path.join(ROOT, "data", "custom-llm", "train.jsonl");

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function readDatasetRows(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`Dataset not found: ${filePath}. Run npm run llm:prepare-dataset first.`);
  }

  const lines = fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    fail("Dataset is empty.");
  }

  return lines.map((line, index) => {
    try {
      return JSON.parse(line);
    } catch {
      fail(`Invalid JSON at train.jsonl:${index + 1}`);
      return null;
    }
  });
}

function normalizeCategory(value) {
  return String(value || "GENERAL").trim().toUpperCase();
}

function groupBucket(category) {
  const normalized = normalizeCategory(category);
  if (
    normalized.includes("KALSHI") ||
    normalized.includes("PREDICTION_MARKET") ||
    normalized.includes("EVENT_CONTRACT") ||
    normalized.includes("ELECTION_ODDS") ||
    normalized.includes("FED_PROBABILITY")
  ) {
    return "kalshi";
  }

  if (
    normalized.includes("STOCK") ||
    normalized.includes("CRYPTO") ||
    normalized.includes("TRADING") ||
    normalized.includes("DEFI") ||
    normalized.includes("PORTFOLIO") ||
    normalized.includes("HFT") ||
    normalized.includes("BOT") ||
    normalized.includes("MARKET") ||
    normalized.includes("SOLANA")
  ) {
    return "stock_crypto";
  }

  if (normalized.includes("MUSIC") || normalized.includes("GUITAR") || normalized.includes("TECH")) {
    return "music_tech";
  }

  return "general";
}

function validateStructure(row, index) {
  if (!row || typeof row !== "object") {
    fail(`Row ${index + 1}: invalid object.`);
  }

  if (!Array.isArray(row.messages) || row.messages.length < 3) {
    fail(`Row ${index + 1}: messages must contain at least system/user/assistant.`);
  }

  const [system, user, assistant] = row.messages;

  if (system?.role !== "system" || typeof system?.content !== "string" || system.content.length < 20) {
    fail(`Row ${index + 1}: missing valid system message.`);
  }

  if (user?.role !== "user" || typeof user?.content !== "string" || user.content.length < 3) {
    fail(`Row ${index + 1}: missing valid user message.`);
  }

  if (
    assistant?.role !== "assistant" ||
    typeof assistant?.content !== "string" ||
    assistant.content.length < 3
  ) {
    fail(`Row ${index + 1}: missing valid assistant message.`);
  }

  if (!row.metadata || typeof row.metadata !== "object") {
    fail(`Row ${index + 1}: metadata missing.`);
  }

  if (typeof row.metadata.integrityHash !== "string" || !/^[a-f0-9]{64}$/i.test(row.metadata.integrityHash)) {
    fail(`Row ${index + 1}: metadata.integrityHash missing or invalid (expected sha256 hex).`);
  }

  if (
    typeof row.metadata.integrityBaseHash !== "string" ||
    !/^[a-f0-9]{64}$/i.test(row.metadata.integrityBaseHash)
  ) {
    fail(`Row ${index + 1}: metadata.integrityBaseHash missing or invalid (expected sha256 hex).`);
  }

  const expectedBaseHash = crypto
    .createHash("sha256")
    .update(`${user.content}||${assistant.content}||${normalizeCategory(row.metadata.category)}`)
    .digest("hex");

  if (typeof expectedBaseHash !== "string" || expectedBaseHash.length !== 64) {
    fail(`Row ${index + 1}: failed to compute integrity hash.`);
  }

  if (row.metadata.integrityBaseHash !== expectedBaseHash) {
    fail(`Row ${index + 1}: integrityBaseHash mismatch.`);
  }
}

function main() {
  const rows = readDatasetRows(DATASET_PATH);

  const bucketCounts = {
    kalshi: 0,
    stock_crypto: 0,
    music_tech: 0,
    general: 0,
  };

  const categoryCounts = new Map();

  rows.forEach((row, index) => {
    validateStructure(row, index);

    const category = normalizeCategory(row.metadata.category);
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);

    const bucket = groupBucket(category);
    bucketCounts[bucket] += 1;
  });

  const stockCryptoShare = bucketCounts.stock_crypto / rows.length;
  const kalshiShare = bucketCounts.kalshi / rows.length;
  const coreMarketsShare = (bucketCounts.stock_crypto + bucketCounts.kalshi) / rows.length;
  const musicTechShare = bucketCounts.music_tech / rows.length;
  const minKalshiShare = Number.parseFloat(process.env.TRADEHAX_MIN_KALSHI_SHARE || "0");

  if (coreMarketsShare < 0.45) {
    fail(
      `Core market share too low (${(coreMarketsShare * 100).toFixed(1)}%). Expected >= 45% across stock/crypto/kalshi.`,
    );
  }

  if (stockCryptoShare < 0.30) {
    fail(
      `Stock/Crypto share too low (${(stockCryptoShare * 100).toFixed(1)}%). Expected >= 30% even with Kalshi blend.`,
    );
  }

  if (musicTechShare < 0.12) {
    fail(
      `Music/Tech share too low (${(musicTechShare * 100).toFixed(1)}%). Expected >= 12%.`,
    );
  }

  if (Number.isFinite(minKalshiShare) && minKalshiShare > 0 && kalshiShare < minKalshiShare) {
    fail(
      `Kalshi share too low (${(kalshiShare * 100).toFixed(1)}%). Expected >= ${(minKalshiShare * 100).toFixed(1)}%.`,
    );
  }

  console.log("✅ Dataset validation passed.");
  console.log(`Samples: ${rows.length}`);
  console.log(
    `Bucket share: core_markets=${(coreMarketsShare * 100).toFixed(1)}% kalshi=${(kalshiShare * 100).toFixed(1)}% stock_crypto=${(stockCryptoShare * 100).toFixed(1)}% music_tech=${(
      musicTechShare * 100
    ).toFixed(1)}% general=${((bucketCounts.general / rows.length) * 100).toFixed(1)}%`,
  );

  if (kalshiShare < 0.03) {
    console.warn(
      `⚠️ Kalshi coverage is ${(kalshiShare * 100).toFixed(1)}% (recommended >= 3.0% for prediction-market specialization).`,
    );
  }
  console.log("Top categories:");

  [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .forEach(([category, count]) => {
      console.log(`  - ${category}: ${count}`);
    });
}

main();
