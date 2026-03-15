#!/usr/bin/env node
/**
 * TradeHax Endpoint Health Check
 * Checks all critical endpoints: Stripe, AI Chat, Crypto Data, Unusual Signals, etc.
 * Extend as needed for new endpoints.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });
const https = require('https');
const http = require('http');

function checkHttps({ hostname, path, headers = {}, timeout = 10000 }) {
  return new Promise((resolve) => {
    const options = { hostname, path, headers, timeout, method: 'GET' };
    const req = https.request(options, (res) => {
      resolve({ status: res.statusCode, ok: res.statusCode < 400 });
    });
    req.on('error', (e) => resolve({ status: 0, ok: false, error: e.message }));
    req.end();
  });
}

async function main() {
  const results = [];

  // Stripe
  if (process.env.STRIPE_SECRET_KEY) {
    const stripe = await checkHttps({
      hostname: 'api.stripe.com',
      path: '/v1/charges',
      headers: { 'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}` },
    });
    results.push({ name: 'Stripe', ...stripe });
  } else {
    results.push({ name: 'Stripe', ok: false, error: 'STRIPE_SECRET_KEY not set' });
  }

  // TradeHax AI Chat (example endpoint)
  if (process.env.TRADEHAX_AI_CHAT_URL) {
    const url = new URL(process.env.TRADEHAX_AI_CHAT_URL);
    const ai = await checkHttps({ hostname: url.hostname, path: url.pathname });
    results.push({ name: 'TradeHax AI Chat', ...ai });
  } else {
    results.push({ name: 'TradeHax AI Chat', ok: false, error: 'TRADEHAX_AI_CHAT_URL not set' });
  }

  // Crypto Data (example endpoint)
  if (process.env.CRYPTO_DATA_URL) {
    const url = new URL(process.env.CRYPTO_DATA_URL);
    const crypto = await checkHttps({ hostname: url.hostname, path: url.pathname });
    results.push({ name: 'Crypto Data', ...crypto });
  } else {
    results.push({ name: 'Crypto Data', ok: false, error: 'CRYPTO_DATA_URL not set' });
  }

  // Unusual Signals (example endpoint)
  if (process.env.UNUSUAL_SIGNALS_URL) {
    const url = new URL(process.env.UNUSUAL_SIGNALS_URL);
    const signals = await checkHttps({ hostname: url.hostname, path: url.pathname });
    results.push({ name: 'Unusual Signals', ...signals });
  } else {
    results.push({ name: 'Unusual Signals', ok: false, error: 'UNUSUAL_SIGNALS_URL not set' });
  }

  // Output results
  for (const r of results) {
    if (r.ok) {
      console.log(`\x1b[32m[OK]\x1b[0m ${r.name}`);
    } else {
      console.log(`\x1b[31m[FAIL]\x1b[0m ${r.name}: ${r.error || 'Status ' + r.status}`);
    }
  }

  // Exit with error if any failed
  if (results.some(r => !r.ok)) process.exit(1);
}

main();

