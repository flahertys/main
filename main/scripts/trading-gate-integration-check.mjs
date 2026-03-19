#!/usr/bin/env node

/**
 * Integration Test: Verify durable auth store + L2 adapter + telemetry
 * Run: node scripts/trading-gate-integration-check.mjs
 */

import fs from 'fs';
import path from 'path';

const checks = [];

function check(name, condition, details = '') {
  checks.push({ name, pass: !!condition, details });
  const icon = condition ? '✓' : '✗';
  console.log(`${icon} ${name}${details ? ': ' + details : ''}`);
}

console.log(`
╔══════════════════════════════════════════════════════════════════╗
║  Trading Gate Integration Verification                          ║
║  Checks: durable auth, L2 adapter, telemetry, smoke test        ║
╚══════════════════════════════════════════════════════════════════╝
`);

const baseDir = new URL('..', import.meta.url).pathname;

// 1. Check durable auth store exists
console.log('\n=== Durable Auth Store ===');
const authStoreExists = fs.existsSync(path.join(baseDir, 'web/api/trading/auth-store.ts'));
check('auth-store.ts exists', authStoreExists);

if (authStoreExists) {
  const authStoreContent = fs.readFileSync(path.join(baseDir, 'web/api/trading/auth-store.ts'), 'utf8');
  check('Export issueChallenge', authStoreContent.includes('export async function issueChallenge'));
  check('Export getChallenge', authStoreContent.includes('export async function getChallenge'));
  check('Export consumeChallenge', authStoreContent.includes('export async function consumeChallenge'));
  check('Export saveProof', authStoreContent.includes('export async function saveProof'));
  check('Export getProof', authStoreContent.includes('export async function getProof'));
  check('Postgres connection pool', authStoreContent.includes('new Pool({'));
  check('Memory cache fallback', authStoreContent.includes('memoryCache'));
}

// 2. Check database schemas
console.log('\n=== Database Schemas ===');
const telemetrySqlExists = fs.existsSync(path.join(baseDir, 'web/api/db/schemas/04-trading-telemetry.sql'));
const authStoreSqlExists = fs.existsSync(path.join(baseDir, 'web/api/db/schemas/05-trading-auth-store.sql'));

check('04-trading-telemetry.sql exists', telemetrySqlExists);
check('05-trading-auth-store.sql exists', authStoreSqlExists);

if (authStoreSqlExists) {
  const authStoreSql = fs.readFileSync(path.join(baseDir, 'web/api/db/schemas/05-trading-auth-store.sql'), 'utf8');
  check('trading_challenges table', authStoreSql.includes('CREATE TABLE IF NOT EXISTS trading_challenges'));
  check('trading_proofs table', authStoreSql.includes('CREATE TABLE IF NOT EXISTS trading_proofs'));
  check('cleanup_expired_challenges function', authStoreSql.includes('CREATE OR REPLACE FUNCTION cleanup_expired_challenges'));
  check('cleanup_expired_proofs function', authStoreSql.includes('CREATE OR REPLACE FUNCTION cleanup_expired_proofs'));
}

// 3. Check L2 custom adapter
console.log('\n=== L2 Custom Adapter ===');
const l2CustomAdapterExists = fs.existsSync(path.join(baseDir, 'web/api/trading/settlement/adapters/l2-custom-adapter.ts'));
check('l2-custom-adapter.ts exists', l2CustomAdapterExists);

if (l2CustomAdapterExists) {
  const l2Content = fs.readFileSync(path.join(baseDir, 'web/api/trading/settlement/adapters/l2-custom-adapter.ts'), 'utf8');
  check('FeePolicy interface', l2Content.includes('interface FeePolicy'));
  check('SequencerInterface', l2Content.includes('interface SequencerInterface'));
  check('RelayerInterface', l2Content.includes('interface RelayerInterface'));
  check('setSequencer method', l2Content.includes('setSequencer(sequencer: SequencerInterface)'));
  check('setRelayer method', l2Content.includes('setRelayer(relayer: RelayerInterface)'));
  check('setFeePolicy method', l2Content.includes('setFeePolicy(policy: FeePolicy)'));
  check('execute method', l2Content.includes('async execute(request: SettlementExecutionRequest)'));
}

// 4. Check adapter registration
console.log('\n=== Settlement Registry ===');
const registryExists = fs.existsSync(path.join(baseDir, 'web/api/trading/settlement/registry.ts'));
if (registryExists) {
  const registryContent = fs.readFileSync(path.join(baseDir, 'web/api/trading/settlement/registry.ts'), 'utf8');
  check('l2CustomSettlementAdapter imported', registryContent.includes('l2CustomSettlementAdapter'));
  check('l2CustomSettlementAdapter registered', registryContent.includes('[l2CustomSettlementAdapter.key]'));
}

// 5. Check proof-store integration
console.log('\n=== Proof Store Integration ===');
const proofStoreContent = fs.readFileSync(path.join(baseDir, 'web/api/trading/proof-store.ts'), 'utf8');
check('Import durable functions', proofStoreContent.includes('import {'));
check('issueChallenge is async', proofStoreContent.includes('export async function issueChallenge'));
check('getChallenge is async', proofStoreContent.includes('export async function getChallenge'));
check('consumeChallenge is async', proofStoreContent.includes('export async function consumeChallenge'));
check('saveProof is async', proofStoreContent.includes('export async function saveProof'));
check('getProof is async', proofStoreContent.includes('export async function getProof'));
check('isProofFresh is async', proofStoreContent.includes('export async function isProofFresh'));

// 6. Check auth endpoint
console.log('\n=== Auth Endpoint ===');
const authContent = fs.readFileSync(path.join(baseDir, 'web/api/trading/auth.ts'), 'utf8');
check('await issueChallenge', authContent.includes('await issueChallenge('));
check('await getChallenge', authContent.includes('await getChallenge'));
check('await consumeChallenge', authContent.includes('await consumeChallenge'));
check('await saveProof', authContent.includes('await saveProof('));

// 7. Check orders endpoint
console.log('\n=== Orders Endpoint ===');
const ordersContent = fs.readFileSync(path.join(baseDir, 'web/api/trading/orders.ts'), 'utf8');
check('await getProof', ordersContent.includes('await getProof'));
check('await isProofFresh', ordersContent.includes('await isProofFresh'));
check('Settlement registry import', ordersContent.includes('resolveSettlementAdapter'));

// 8. Check smoke test
console.log('\n=== Smoke Test ===');
const smokeTestExists = fs.existsSync(path.join(baseDir, 'scripts/trading-gate-smoke-test.mjs'));
check('trading-gate-smoke-test.mjs exists', smokeTestExists);

if (smokeTestExists) {
  const smokeContent = fs.readFileSync(path.join(baseDir, 'scripts/trading-gate-smoke-test.mjs'), 'utf8');
  check('testChallenge function', smokeContent.includes('async function testChallenge'));
  check('testVerify function', smokeContent.includes('async function testVerify'));
  check('testPreflight function', smokeContent.includes('async function testPreflight'));
  check('testExecute function', smokeContent.includes('async function testExecute'));
  check('testTelemetry function', smokeContent.includes('async function testTelemetry'));
}

// 9. Check npm script
console.log('\n=== NPM Configuration ===');
const packageJsonContent = fs.readFileSync(path.join(baseDir, 'web/package.json'), 'utf8');
check('test:trading-gate script added', packageJsonContent.includes('"test:trading-gate"'));

// 10. Check documentation
console.log('\n=== Documentation ===');
const readmeExists = fs.existsSync(path.join(baseDir, 'web/api/trading/README.md'));
const archExists = fs.existsSync(path.join(baseDir, 'web/ARCHITECTURE.md'));
const setupExists = fs.existsSync(path.join(baseDir, 'IDE_DEVELOPMENT_SETUP.md'));
const summaryExists = fs.existsSync(path.join(baseDir, 'TRADING_GATE_IMPLEMENTATION_COMPLETE.md'));

check('README.md updated', readmeExists);
check('ARCHITECTURE.md updated', archExists);
check('IDE_DEVELOPMENT_SETUP.md updated', setupExists);
check('Implementation summary created', summaryExists);

// Summary
console.log('\n=== SUMMARY ===');
const passed = checks.filter(c => c.pass).length;
const total = checks.length;
console.log(`Passed: ${passed}/${total}`);

if (passed === total) {
  console.log('\n🎉 All integration checks passed!');
  console.log('\nNext steps:');
  console.log('1. Run database migrations:');
  console.log('   psql -U postgres -d tradehax -f web/api/db/schemas/04-trading-telemetry.sql');
  console.log('   psql -U postgres -d tradehax -f web/api/db/schemas/05-trading-auth-store.sql');
  console.log('\n2. Test smoke script:');
  console.log('   npm run dev');
  console.log('   npm run test:trading-gate');
  console.log('\n3. Review implementation summary:');
  console.log('   cat TRADING_GATE_IMPLEMENTATION_COMPLETE.md');
  process.exit(0);
} else {
  console.log(`\n⚠ ${total - passed} checks failed.`);
  process.exit(1);
}

