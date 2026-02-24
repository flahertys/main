#!/usr/bin/env node

/**
 * Checks core LLM environment configuration used by /api/llm and existing AI routes.
 */

const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const REQUIRED = ["HF_API_TOKEN", "HF_MODEL_ID"];
const OPTIONAL = [
  "LLM_TEMPERATURE",
  "LLM_MAX_LENGTH",
  "LLM_TOP_P",
  "HF_USE_LOCAL_MODEL",
  "TRADEHAX_LLM_OPEN_MODE",
  "HF_IMAGE_MODEL_ID",
  "TRADEHAX_IMAGE_OPEN_MODE",
];

function statusForEnv(key) {
  const value = process.env[key];
  if (!value || String(value).trim().length === 0) {
    return { key, present: false, preview: "<missing>" };
  }

  const masked = key.toLowerCase().includes("token") || key.toLowerCase().includes("key");
  if (masked) {
    const v = String(value);
    const preview = v.length <= 8 ? "********" : `${v.slice(0, 4)}...${v.slice(-4)}`;
    return { key, present: true, preview };
  }

  return { key, present: true, preview: String(value) };
}

function printTable(title, rows) {
  console.log(`\n${title}`);
  for (const row of rows) {
    const mark = row.present ? "✅" : "❌";
    console.log(`${mark} ${row.key}: ${row.preview}`);
  }
}

function main() {
  const requiredRows = REQUIRED.map(statusForEnv);
  const optionalRows = OPTIONAL.map(statusForEnv);

  printTable("Required LLM env", requiredRows);
  printTable("Optional tuning env", optionalRows);

  const missingRequired = requiredRows.filter((r) => !r.present);
  if (missingRequired.length > 0) {
    console.error("\nLLM config check failed. Missing required environment variables.");
    process.exit(1);
  }

  console.log("\nLLM config check passed.");
}

main();
