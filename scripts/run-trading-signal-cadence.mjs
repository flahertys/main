#!/usr/bin/env node

/*
 * Local helper to trigger trading signal cadence cron route.
 */

import process from "node:process";

const baseUrl = process.env.TRADEHAX_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const cronSecret = process.env.TRADEHAX_CRON_SECRET;

if (!cronSecret) {
  console.error("Missing TRADEHAX_CRON_SECRET in env. Cannot authorize cadence route.");
  process.exit(1);
}

const url = new URL("/api/cron/trading/signal-cadence", baseUrl);
const forcedWindow = process.argv.find((arg) => arg.startsWith("--window="));
if (forcedWindow) {
  url.searchParams.set("window", forcedWindow.split("=")[1] || "");
}

const dryRun = process.argv.includes("--dry-run");
if (dryRun) {
  url.searchParams.set("dryRun", "1");
}

const response = await fetch(url.toString(), {
  method: "GET",
  headers: {
    Authorization: `Bearer ${cronSecret}`,
  },
});

const payload = await response.json().catch(() => ({}));
if (!response.ok) {
  console.error("Cadence run failed", response.status, payload);
  process.exit(1);
}

console.log("Cadence run success");
if (dryRun) {
  console.log("Dry run mode: no Discord webhooks were called.");
}
console.log(JSON.stringify(payload, null, 2));
