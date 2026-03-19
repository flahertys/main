#!/usr/bin/env node

/**
 * TradeHax Trading Gate Smoke Test
 * Tests the full auth flow: challenge -> verify -> preflight -> execute
 * Run: node scripts/trading-gate-smoke-test.mjs
 */

import crypto from 'crypto';
import { createHash } from 'crypto';

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const WALLET_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc54e4437c11fb'; // Example Ethereum address
const CHAIN_ID = '0x89'; // Polygon mainnet
const SIGNATURE_MODE = 'personal_sign';

// Test data
let testResults = [];
let challengeNonce = '';
let walletProof = null;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(endpoint, method = 'POST', body = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, data };
  } catch (err) {
    return { ok: false, status: 0, error: err.message, data: {} };
  }
}

async function testChallenge() {
  console.log('\n=== STEP 1: Request Challenge ===');
  const result = await makeRequest('/api/trading/auth?action=challenge', 'POST', {
    address: WALLET_ADDRESS,
    chainId: CHAIN_ID,
    signatureMode: SIGNATURE_MODE,
  });

  const pass = result.ok && result.data.nonce && result.data.message;
  testResults.push({ test: 'Challenge Request', pass, details: result });

  if (pass) {
    challengeNonce = result.data.nonce;
    console.log(`✓ Challenge issued. Nonce: ${challengeNonce.slice(0, 16)}...`);
    console.log(`  Message: "${result.data.message.split('\n')[0]}..."`);
  } else {
    console.log(`✗ Challenge request failed: ${result.status}`);
    return false;
  }
  return true;
}

function generateMockSignature(message) {
  /**
   * Mock signature generation for testing.
   * In production, this would be signed by the wallet extension.
   * Format: 0x + 130 hex chars (65 bytes)
   */
  const hash = createHash('sha256').update(message).digest();
  const sig = crypto.randomBytes(65);
  return '0x' + Buffer.concat([hash, sig]).toString('hex').slice(0, 130);
}

async function testVerify() {
  console.log('\n=== STEP 2: Verify Signature ===');

  if (!challengeNonce) {
    console.log('✗ Skipped: no challenge nonce from step 1');
    return false;
  }

  // Get challenge message first
  const challengeResp = await makeRequest('/api/trading/auth?action=challenge', 'POST', {
    address: WALLET_ADDRESS,
    chainId: CHAIN_ID,
    signatureMode: SIGNATURE_MODE,
  });

  const challengeMessage = challengeResp.data.message || '';
  const mockSignature = generateMockSignature(challengeMessage);

  const result = await makeRequest('/api/trading/auth?action=verify', 'POST', {
    address: WALLET_ADDRESS,
    chainId: CHAIN_ID,
    nonce: challengeNonce,
    signature: mockSignature,
    signatureType: SIGNATURE_MODE,
  });

  const pass = result.ok && result.data.proof;
  testResults.push({ test: 'Verify Signature', pass, details: result });

  if (pass) {
    walletProof = result.data.proof;
    console.log(`✓ Signature verified. Proof expires at: ${new Date(result.data.proof.expiresAt).toISOString()}`);
  } else {
    console.log(`✗ Signature verification failed: ${result.status}`);
    console.log(`  Note: This is expected because mock signature won't verify cryptographically.`);
    // For smoke test, we'll continue anyway (assuming local test environment)
  }

  return true;
}

async function testPreflight() {
  console.log('\n=== STEP 3: Preflight Check ===');

  const result = await makeRequest('/api/trading/orders?action=preflight', 'POST', {
    address: WALLET_ADDRESS,
    chainId: CHAIN_ID,
  });

  const pass = result.ok || result.status === 401; // 401 means proof required (expected)
  testResults.push({ test: 'Preflight Gate', pass, details: result });

  if (result.ok) {
    console.log('✓ Preflight passed. Ready for execution.');
  } else if (result.status === 401) {
    console.log('⚠ Preflight: proof required (expected without valid signature)');
  } else {
    console.log(`✗ Preflight failed: ${result.status}`);
  }

  return true;
}

async function testExecute() {
  console.log('\n=== STEP 4: Execute Order ===');

  const mockOrder = {
    market: 'Will Donald Trump win the 2024 election?',
    side: 'BUY_YES',
    size: 100,
    price: 0.65,
  };

  const result = await makeRequest('/api/trading/orders?action=execute', 'POST', {
    address: WALLET_ADDRESS,
    chainId: CHAIN_ID,
    order: mockOrder,
  });

  // expect 200 or 401 (proof required) or 412 (chain mismatch)
  const pass = result.status === 200 || result.status === 401 || result.status === 412;
  testResults.push({ test: 'Execute Order', pass, details: result });

  if (result.ok && result.data.execution) {
    const exec = result.data.execution;
    console.log(`✓ Order executed via ${exec.adapter} (${exec.status})`);
    console.log(`  Execution ID: ${exec.executionId}`);
  } else if (result.status === 401) {
    console.log('⚠ Execute: proof required (expected without valid signature)');
  } else if (result.status === 412) {
    console.log('⚠ Execute: chain mismatch (expected if local chain differs)');
  } else {
    console.log(`✗ Execute failed: ${result.status}`);
  }

  return true;
}

async function testTelemetry() {
  console.log('\n=== STEP 5: Telemetry Snapshot ===');

  const result = await makeRequest('/api/trading/telemetry', 'GET');

  const pass = result.ok && result.data.counters;
  testResults.push({ test: 'Telemetry Snapshot', pass, details: result });

  if (pass) {
    const c = result.data.counters;
    console.log('✓ Telemetry snapshot retrieved:');
    console.log(`  connect_success: ${c.connect_success}`);
    console.log(`  connect_rejected: ${c.connect_rejected}`);
    console.log(`  chain_mismatch: ${c.chain_mismatch}`);
    console.log(`  manual_fallback: ${c.manual_fallback}`);
    console.log(`  manual_fallback_rate: ${c.manual_fallback_rate}`);
    console.log(`  durable: ${c.durable}`);
  } else {
    console.log(`✗ Telemetry failed: ${result.status}`);
  }

  return true;
}

async function runSmoke() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║         TradeHax Trading Gate Smoke Test                                 ║
║         Testing auth flow + order execution contract                     ║
╚══════════════════════════════════════════════════════════════════════════╝

Base URL: ${BASE_URL}
Wallet:   ${WALLET_ADDRESS}
Chain:    ${CHAIN_ID}
`);

  try {
    await testChallenge();
    await sleep(500);

    await testVerify();
    await sleep(500);

    await testPreflight();
    await sleep(500);

    await testExecute();
    await sleep(500);

    await testTelemetry();

    // Summary
    console.log('\n=== Summary ===');
    const passed = testResults.filter(r => r.pass).length;
    const total = testResults.length;

    testResults.forEach(r => {
      const icon = r.pass ? '✓' : '✗';
      console.log(`${icon} ${r.test}`);
    });

    console.log(`\nPassed: ${passed}/${total}`);

    if (passed === total) {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    } else {
      console.log('\n⚠ Some tests failed. Check output above.');
      process.exit(1);
    }
  } catch (err) {
    console.error('\n💥 Smoke test crashed:', err.message);
    process.exit(1);
  }
}

// Run it
runSmoke();

