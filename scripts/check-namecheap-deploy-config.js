#!/usr/bin/env node

const required = [
  "NAMECHEAP_VPS_HOST",
  "NAMECHEAP_VPS_USER",
  "NAMECHEAP_VPS_SSH_KEY",
];

const optional = [
  "NAMECHEAP_VPS_PORT",
  "NAMECHEAP_APP_ROOT",
  "NAMECHEAP_APP_PORT",
  "TRADEHAX_CRON_SECRET",
  "NEXT_PUBLIC_SITE_URL",
];

function value(name) {
  return String(process.env[name] || "").trim();
}

function printStatus(name, isRequired) {
  const present = Boolean(value(name));
  const marker = present ? "✅" : isRequired ? "❌" : "⚪";
  const label = isRequired ? "required" : "optional";
  console.log(`${marker} ${name} (${label})`);
  return present;
}

console.log("\n===============================================");
console.log("🔎 Namecheap VPS Deploy Config Check");
console.log("===============================================\n");

let ok = true;
for (const key of required) {
  const present = printStatus(key, true);
  if (!present) ok = false;
}

for (const key of optional) {
  printStatus(key, false);
}

console.log("\nGitHub Actions secrets required:");
for (const key of required) {
  console.log(`- ${key}`);
}
console.log("\nSuggested additional GitHub secrets:");
for (const key of optional.filter((k) => k.startsWith("NAMECHEAP_"))) {
  console.log(`- ${key}`);
}

if (!ok) {
  console.log("\n❌ Missing required values. Deployment workflow will skip.");
  process.exit(1);
}

console.log("\n✅ Required Namecheap deploy values are present.");
