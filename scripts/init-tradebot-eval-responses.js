#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const SUITE_PATH = path.join(ROOT, "data", "tradebot", "eval-suite.jsonl");
const OUT_PATH = path.join(ROOT, "data", "tradebot", "eval-responses.jsonl");

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function parseJsonl(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`Missing file: ${path.relative(ROOT, filePath)}. Run npm run tradebot:generate-eval-suite first.`);
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
      fail(`Invalid JSON at ${path.relative(ROOT, filePath)}:${index + 1}`);
      return null;
    }
  });
}

function main() {
  const suite = parseJsonl(SUITE_PATH);
  const templateRows = suite.map((row) => ({
    id: row.id,
    persona: row.persona,
    timeframe: row.timeframe,
    response: "",
  }));

  fs.writeFileSync(OUT_PATH, `${templateRows.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");

  console.log("✅ Tradebot eval response template initialized");
  console.log(`Rows: ${templateRows.length}`);
  console.log(`Output: ${OUT_PATH}`);
}

main();
