#!/usr/bin/env node

/**
 * Generate scrypt password hash for TRADEHAX_LOGIN_PASSWORD_HASH.
 *
 * Usage:
 *   node scripts/generate-admin-password-hash.js "your-password"
 *   TRADEHAX_ADMIN_PASSWORD="your-password" node scripts/generate-admin-password-hash.js
 */

const crypto = require("node:crypto");

const password =
  process.argv[2] ||
  process.env.TRADEHAX_ADMIN_PASSWORD ||
  process.env.TRADEHAX_LOGIN_PASSWORD ||
  "";

if (!password || password.trim().length < 12) {
  console.error("❌ Provide a strong password (min 12 chars) via argument or TRADEHAX_ADMIN_PASSWORD env.");
  process.exit(1);
}

const N = 16384;
const r = 8;
const p = 1;
const keyLen = 64;
const salt = crypto.randomBytes(16);

const derived = crypto.scryptSync(password, salt, keyLen, { N, r, p });
const encoded = `scrypt$${N}$${r}$${p}$${salt.toString("base64")}$${derived.toString("base64")}`;

console.log("\n✅ Generated TRADEHAX_LOGIN_PASSWORD_HASH:\n");
console.log(encoded);
console.log("\nAdd this to .env.local / Vercel env and remove TRADEHAX_LOGIN_PASSWORD plaintext.\n");
