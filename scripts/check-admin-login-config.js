#!/usr/bin/env node

try {
  require("dotenv").config({ path: ".env" });
  require("dotenv").config({ path: ".env.local", override: true });
} catch {
  // dotenv optional in constrained runtime
}

function value(name) {
  return String(process.env[name] || "").trim();
}

function firstValue(...names) {
  for (const name of names) {
    const current = value(name);
    if (current) return current;
  }
  return "";
}

function pass(name, note) {
  console.log(`✅ ${name}${note ? `: ${note}` : ""}`);
}

function fail(name, note) {
  console.log(`❌ ${name}${note ? `: ${note}` : ""}`);
}

function warn(name, note) {
  console.log(`⚠️ ${name}${note ? `: ${note}` : ""}`);
}

function looksLikeScryptHash(input) {
  return /^scrypt\$\d+\$\d+\$\d+\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/.test(input);
}

console.log("\n===============================================");
console.log("🔐 TradeHax Admin Login Config Check");
console.log("===============================================\n");

let ok = true;

const username = firstValue("TRADEHAX_LOGIN_USERNAME", "TRADEHAX_ADMIN_USERNAME") || "admin";
if (username.length >= 3) {
  pass("TRADEHAX_LOGIN_USERNAME/TRADEHAX_ADMIN_USERNAME", username);
} else {
  fail("TRADEHAX_LOGIN_USERNAME/TRADEHAX_ADMIN_USERNAME", "set a non-empty admin username");
  ok = false;
}

const passwordHash = firstValue("TRADEHAX_LOGIN_PASSWORD_HASH", "TRADEHAX_ADMIN_PASSWORD_HASH");
const plainPassword = firstValue("TRADEHAX_LOGIN_PASSWORD", "TRADEHAX_ADMIN_PASSWORD");

if (passwordHash && looksLikeScryptHash(passwordHash)) {
  pass("TRADEHAX_LOGIN_PASSWORD_HASH/TRADEHAX_ADMIN_PASSWORD_HASH", "scrypt hash format detected");
} else if (passwordHash) {
  fail("TRADEHAX_LOGIN_PASSWORD_HASH/TRADEHAX_ADMIN_PASSWORD_HASH", "invalid format; generate with npm run auth:hash-password");
  ok = false;
} else if (plainPassword) {
  warn("TRADEHAX_LOGIN_PASSWORD/TRADEHAX_ADMIN_PASSWORD", "plaintext fallback configured; use hash in production");
  if (process.env.NODE_ENV === "production") {
    ok = false;
  }
} else {
  fail("TRADEHAX_LOGIN_PASSWORD_HASH/TRADEHAX_ADMIN_PASSWORD_HASH", "missing hash; generate with npm run auth:hash-password");
  ok = false;
}

const nextAuthSecret = value("NEXTAUTH_SECRET");
const jwtSecret = value("JWT_SECRET");
const activeSecret = nextAuthSecret || jwtSecret;
if (activeSecret.length >= 32) {
  pass("NEXTAUTH_SECRET/JWT_SECRET", "configured (>=32 chars)");
} else {
  fail("NEXTAUTH_SECRET/JWT_SECRET", "missing or too short (<32)");
  ok = false;
}

const nextAuthUrl = value("NEXTAUTH_URL");
if (nextAuthUrl) {
  pass("NEXTAUTH_URL", nextAuthUrl);
} else {
  warn("NEXTAUTH_URL", "recommended for stable callback/session behavior");
}

if (!ok) {
  console.log("\n❌ Admin login is not fully configured.");
  process.exit(1);
}

console.log("\n✅ Admin login configuration looks ready.");
