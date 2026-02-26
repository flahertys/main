#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
require("dotenv").config();

const root = process.cwd();

const checks = [];

function hasEnvValue(keys) {
  for (const key of keys) {
    if (process.env[key] && String(process.env[key]).trim().length > 0) {
      return { ok: true, key };
    }
  }
  return { ok: false, key: keys[0] };
}

function pushCheck(name, ok, detail) {
  checks.push({ name, ok, detail });
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

const hfToken = hasEnvValue(["HF_API_TOKEN", "HUGGINGFACE_API_TOKEN", "HUGGING_FACE_HUB_TOKEN"]);
pushCheck(
  "HF token configured",
  hfToken.ok,
  hfToken.ok ? `resolved from ${hfToken.key}` : "set HF_API_TOKEN (or alias)",
);

const textModel = hasEnvValue(["HF_MODEL_ID"]);
pushCheck(
  "Text model configured",
  textModel.ok,
  textModel.ok ? String(process.env.HF_MODEL_ID) : "set HF_MODEL_ID",
);

const imageModel = hasEnvValue(["HF_IMAGE_MODEL_ID"]);
pushCheck(
  "Image model configured",
  imageModel.ok,
  imageModel.ok ? String(process.env.HF_IMAGE_MODEL_ID) : "set HF_IMAGE_MODEL_ID",
);

const odinProfile = String(process.env.TRADEHAX_ODIN_PROFILE || "standard").trim().toLowerCase();
pushCheck(
  "ODIN profile valid",
  ["standard", "alpha", "overclock"].includes(odinProfile),
  `TRADEHAX_ODIN_PROFILE=${odinProfile || "(empty)"}`,
);

pushCheck(
  "Market HTTP route present",
  fileExists("app/api/ai/market/route.ts"),
  "app/api/ai/market/route.ts",
);
pushCheck(
  "Market stream route present",
  fileExists("app/api/ai/market/stream/route.ts"),
  "app/api/ai/market/stream/route.ts",
);
pushCheck(
  "ODIN profile helper present",
  fileExists("lib/ai/odin-profile.ts"),
  "lib/ai/odin-profile.ts",
);

const failed = checks.filter((item) => !item.ok);

console.log("\nTradeHax Alpha Sync Preflight\n");
for (const item of checks) {
  const icon = item.ok ? "✅" : "❌";
  console.log(`${icon} ${item.name} — ${item.detail}`);
}

if (failed.length > 0) {
  console.error(`\nPreflight failed (${failed.length} issue${failed.length > 1 ? "s" : ""}).`);
  process.exit(1);
}

console.log("\nPreflight passed. Alpha sync stack is ready.\n");
