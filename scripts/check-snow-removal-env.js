#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const strictMode = process.argv.includes("--strict");
const envFiles = [".env.local", ".env"];

const checks = [
  {
    key: "NEXT_PUBLIC_EMAILJS_SERVICE_ID",
    source: "EmailJS dashboard -> Email Services -> Service ID",
  },
  {
    key: "NEXT_PUBLIC_EMAILJS_TEMPLATE_ID",
    source: "EmailJS dashboard -> Email Templates -> Template ID",
  },
  {
    key: "NEXT_PUBLIC_EMAILJS_PUBLIC_KEY",
    source: "EmailJS dashboard -> Account -> API Keys -> Public Key",
  },
  {
    key: "SMTP_HOST",
    source: "SMTP provider settings (host)",
  },
  {
    key: "SMTP_PORT",
    source: "SMTP provider settings (port, e.g. 587 or 465)",
  },
  {
    key: "SMTP_USER",
    source: "SMTP account username/login",
  },
  {
    key: "SMTP_PASS",
    source: "SMTP account password/app password",
  },
  {
    key: "SMTP_FROM",
    source: "Sender email address for SMTP",
  },
  {
    key: "SMTP_TO",
    source: "Destination inbox for SMTP delivery (or use SNOW_REMOVAL_TO_EMAIL)",
  },
  {
    key: "RESEND_API_KEY",
    source: "Resend dashboard -> API Keys",
  },
  {
    key: "SNOW_REMOVAL_FROM_EMAIL",
    source: "A verified sender/domain in Resend",
  },
  {
    key: "SNOW_REMOVAL_TO_EMAIL",
    source: "The inbox that should receive leads (ex: njsnowremoval26@gmail.com)",
  },
];

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

function readLocalEnv() {
  const merged = {};
  for (const envFile of envFiles) {
    const fullPath = path.resolve(process.cwd(), envFile);
    if (!fs.existsSync(fullPath)) continue;

    const raw = fs.readFileSync(fullPath, "utf8");
    Object.assign(merged, parseEnvFile(raw));
  }
  return merged;
}

function getValue(envMap, key) {
  const processValue = String(process.env[key] || "").trim();
  if (processValue) return processValue;
  return String(envMap[key] || "").trim();
}

function isPlaceholder(value) {
  const normalized = value.toLowerCase();
  return (
    !normalized ||
    normalized.includes("your_") ||
    normalized.includes("replace_") ||
    normalized.endsWith("_id") ||
    normalized.endsWith("_key")
  );
}

(function main() {
  const localEnv = readLocalEnv();

  process.stdout.write("\n========================================================\n");
  process.stdout.write("❄️  Snow Removal Env Check\n");
  process.stdout.write("========================================================\n\n");
  process.stdout.write(
    strictMode
      ? "Mode: STRICT (missing required vars fail this check)\n\n"
      : "Mode: WARN-ONLY (advisory check, does not block)\n\n",
  );

  const configuredMap = new Map();
  for (const item of checks) {
    const value = getValue(localEnv, item.key);
    const hasValue = value.length > 0 && !isPlaceholder(value);
    configuredMap.set(item.key, hasValue);

    if (hasValue) {
      process.stdout.write(`✅ ${item.key}\n`);
    } else {
      process.stdout.write(`⚪ ${item.key}\n`);
      process.stdout.write(`   ↳ source: ${item.source}\n`);
    }
  }

  const emailJsReady =
    configuredMap.get("NEXT_PUBLIC_EMAILJS_SERVICE_ID") &&
    configuredMap.get("NEXT_PUBLIC_EMAILJS_TEMPLATE_ID") &&
    configuredMap.get("NEXT_PUBLIC_EMAILJS_PUBLIC_KEY");

  const smtpReady =
    configuredMap.get("SMTP_HOST") &&
    configuredMap.get("SMTP_PORT") &&
    configuredMap.get("SMTP_USER") &&
    configuredMap.get("SMTP_PASS") &&
    configuredMap.get("SMTP_FROM") &&
    (configuredMap.get("SMTP_TO") || configuredMap.get("SNOW_REMOVAL_TO_EMAIL"));

  const resendReady =
    configuredMap.get("RESEND_API_KEY") &&
    configuredMap.get("SNOW_REMOVAL_FROM_EMAIL") &&
    configuredMap.get("SNOW_REMOVAL_TO_EMAIL");

  const anyRouteReady = Boolean(emailJsReady || smtpReady || resendReady);

  process.stdout.write("\nDelivery route readiness:\n");
  process.stdout.write(`- EmailJS: ${emailJsReady ? "READY" : "NOT READY"}\n`);
  process.stdout.write(`- SMTP: ${smtpReady ? "READY" : "NOT READY"}\n`);
  process.stdout.write(`- Resend: ${resendReady ? "READY" : "NOT READY"}\n\n`);

  if (!anyRouteReady) {
    process.stdout.write("❌ No email delivery route is fully configured yet.\n");
    process.stdout.write("   Configure one complete route: EmailJS OR SMTP OR Resend.\n");
  } else {
    process.stdout.write("✅ At least one email delivery route is configured.\n");
  }

  process.stdout.write("\n");
  process.stdout.write("Next step for deploy: add these values in Vercel -> Project Settings -> Environment Variables.\n");
  process.stdout.write("Reference doc: SNOW_REMOVAL_VERCEL_SETUP.md\n\n");

  if (!anyRouteReady && strictMode) {
    process.stderr.write("❌ No complete Snow Removal delivery route configured in strict mode.\n");
    process.exit(1);
  }

  if (!anyRouteReady) {
    process.stdout.write("⚠️  Route config is incomplete, but warn-only mode allows continuing.\n");
    process.exit(0);
  }

  process.stdout.write("✅ Snow Removal env setup looks usable.\n");
  process.exit(0);
})();
