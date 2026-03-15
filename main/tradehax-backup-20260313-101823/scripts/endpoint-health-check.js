#!/usr/bin/env node
/**
 * Automated Endpoint Health Check Script
 * Checks all critical endpoints for connectivity and reports status
 */
const fetch = require('node-fetch');
const endpoints = [
  { name: 'Hugging Face', url: process.env.HF_INFERENCE_API_ENDPOINT || 'https://api-inference.huggingface.co/models', token: process.env.NEXT_PUBLIC_HF_API_TOKEN },
  { name: 'OpenAI', url: 'https://api.openai.com/v1', token: process.env.OPENAI_API_KEY },
  { name: 'Supabase', url: process.env.VITE_SUPABASE_URL, token: process.env.VITE_SUPABASE_ANON_KEY },
  { name: 'TradeHax AI Chat', url: process.env.TRADEHAX_API_CHAT || 'http://localhost:3000/api/ai/chat' },
  { name: 'Crypto Data', url: process.env.TRADEHAX_API_CRYPTO || 'http://localhost:3000/api/data/crypto' },
  { name: 'Unusual Signals', url: process.env.TRADEHAX_API_UNUSUAL || 'http://localhost:3000/api/signals/unusual' },
];

const stripeEndpoint = {
  name: 'Stripe',
  url: 'https://api.stripe.com/v1/accounts/' + (process.env.STRIPE_ACCOUNT_ID || ''),
  token: process.env.STRIPE_API_KEY
};
endpoints.push(stripeEndpoint);

async function checkEndpoint(ep) {
  if (!ep.url) return { name: ep.name, status: 'missing url' };
  try {
    const headers = ep.token ? { Authorization: `Bearer ${ep.token}` } : {};
    const res = await fetch(ep.url, { headers });
    return { name: ep.name, status: res.ok ? 'connected' : `error ${res.status}` };
  } catch (err) {
    return { name: ep.name, status: 'error', error: err.message };
  }
}

async function runHealthChecks() {
  const results = await Promise.all(endpoints.map(checkEndpoint));
  console.table(results);
}

runHealthChecks();
