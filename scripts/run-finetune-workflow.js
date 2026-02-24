#!/usr/bin/env node

/**
 * Fine-tuning workflow runner for TradeHax
 *
 * Usage:
 *   node ./scripts/run-finetune-workflow.js
 *   node ./scripts/run-finetune-workflow.js --push
 *   node ./scripts/run-finetune-workflow.js --dataset tradehax-training-expanded.jsonl --push
 */

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const args = process.argv.slice(2);
const pushToHub = args.includes("--push");

function readArg(flag, fallback = "") {
  const index = args.findIndex((item) => item === flag);
  if (index >= 0 && args[index + 1]) {
    return args[index + 1];
  }
  return fallback;
}

const dataset = readArg("--dataset", process.env.HF_DATASET_PATH || "tradehax-training-expanded.jsonl");

function run(command, commandArgs) {
  const pretty = [command, ...commandArgs].join(" ");
  console.log(`\n[run] ${pretty}`);
  const result = spawnSync(command, commandArgs, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
}

function ensureToken() {
  if (!process.env.HF_API_TOKEN || !process.env.HF_API_TOKEN.trim()) {
    console.error("HF_API_TOKEN is missing. Set it in your environment (or .env loader) before running fine-tune workflow.");
    process.exit(1);
  }
}

function main() {
  console.log("TradeHax fine-tuning workflow starting...");
  ensureToken();

  const requirementsPath = path.join("scripts", "fine-tune-requirements.txt");
  run("python", ["-m", "pip", "install", "-r", requirementsPath]);

  const trainArgs = ["./scripts/fine-tune-mistral-lora.py", "--dataset", dataset];
  if (pushToHub) {
    trainArgs.push("--push-to-hub");
  }
  run("python", trainArgs);

  console.log("\nTradeHax fine-tuning workflow complete.");
}

main();
