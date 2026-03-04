#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");

const envLocalPath = path.resolve(process.cwd(), ".env.local");
const strictMode = process.argv.includes("--strict");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: envLocalPath, override: true });

const providerRequirements = {
  x: ["X_API_KEY", "X_API_KEY_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET"],
  instagram: [
    "INSTAGRAM_APP_ID",
    "INSTAGRAM_APP_SECRET",
    "INSTAGRAM_ACCESS_TOKEN",
    "INSTAGRAM_BUSINESS_ACCOUNT_ID",
  ],
  tiktok: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET", "TIKTOK_ACCESS_TOKEN"],
  youtube: ["YOUTUBE_API_KEY", "YOUTUBE_CHANNEL_ID"],
  facebook: ["FACEBOOK_APP_ID", "FACEBOOK_APP_SECRET", "FACEBOOK_PAGE_ACCESS_TOKEN", "FACEBOOK_PAGE_ID"],
  linkedin: [
    "LINKEDIN_CLIENT_ID",
    "LINKEDIN_CLIENT_SECRET",
    "LINKEDIN_ACCESS_TOKEN",
    "LINKEDIN_ORGANIZATION_ID",
  ],
  reddit: ["REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET", "REDDIT_USER_AGENT"],
  discord: ["DISCORD_BOT_TOKEN", "DISCORD_GUILD_ID", "DISCORD_ANNOUNCEMENTS_CHANNEL_ID"],
};

function parseEnvFile(raw) {
  const result = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    result[key] = value;
  }
  return result;
}

function normalizeProviders(raw) {
  if (!raw) {
    return Object.keys(providerRequirements);
  }

  const normalizedRaw = String(raw).trim().toLowerCase();
  if (["none", "off", "disabled", "false", "0"].includes(normalizedRaw)) {
    return [];
  }

  return raw
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter((v) => v.length > 0 && providerRequirements[v]);
}

function getEnvMap() {
  const map = { ...process.env };
  if (fs.existsSync(envLocalPath)) {
    const raw = fs.readFileSync(envLocalPath, "utf8");
    Object.assign(map, parseEnvFile(raw));
  }
  return map;
}

(function main() {
  const env = getEnvMap();
  const providers = normalizeProviders(env.TRADEHAX_SOCIAL_PROVIDERS || "");

  process.stdout.write("\n===============================================\n");
  process.stdout.write("🔎 TradeHax Social API Configuration Check\n");
  process.stdout.write("===============================================\n\n");

  process.stdout.write(`Providers in scope: ${providers.join(", ")}\n\n`);
  process.stdout.write(
    strictMode
      ? "Mode: STRICT (missing variables will fail this check)\n\n"
      : "Mode: WARN-ONLY (missing variables are informational and will not block deploy)\n\n",
  );

  if (providers.length === 0) {
    process.stdout.write("ℹ️  No social providers are in scope (TRADEHAX_SOCIAL_PROVIDERS=none/off).\n");
    process.stdout.write("✅ Social API strict check passed because social publishing is intentionally disabled.\n");
    process.exit(0);
  }

  let warningCount = 0;

  for (const provider of providers) {
    const requirements = providerRequirements[provider] || [];
    const missing = requirements.filter((key) => !String(env[key] || "").trim());

    if (missing.length === 0) {
      process.stdout.write(`✅ ${provider}: configured\n`);
    } else {
      warningCount += missing.length;
      process.stdout.write(`⚠️  ${provider}: missing ${missing.join(", ")}\n`);
    }
  }

  process.stdout.write("\n");

  if (warningCount === 0) {
    process.stdout.write("✅ All selected social API providers look configured.\n");
    process.exit(0);
  }

  process.stdout.write("ℹ️  Add missing values in .env.local or Vercel Environment Variables.\n");
  process.stdout.write("ℹ️  Run npm run social:setup to scaffold templates.\n");
  process.stdout.write(
    strictMode
      ? "ℹ️  Strict mode is enabled. CI/deploy should fail until missing values are provided.\n"
      : "ℹ️  This check is non-blocking by default. Use --strict only when you intentionally want to gate deployment.\n",
  );

  if (strictMode) {
    process.stderr.write("\n❌ Strict mode enabled and missing social API variables were detected.\n");
    process.exit(1);
  }

  process.exit(0);
})();
