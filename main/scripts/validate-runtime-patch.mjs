#!/usr/bin/env node

/**
 * Runtime Validation & Provider Failover Patch - Deployment Validation Script
 * Tests the enhanced provider health detection and failover logic
 */

const fs = require('fs');
const path = require('path');

console.log('=== Runtime Validation Patch - Deployment Verification ===\n');

// Check 1: Verify provider-runtime.ts has been updated
console.log('✓ Check 1: Verify provider-runtime.ts modifications...');
const providerRuntimePath = path.join(__dirname, 'web', 'api', 'ai', 'provider-runtime.ts');
const providerRuntimeContent = fs.readFileSync(providerRuntimePath, 'utf8');

const checks = [
  {
    name: 'invalid_key_format reason type',
    pattern: /invalid_key_format/,
  },
  {
    name: 'keyValid flag in ProviderProbeResult',
    pattern: /keyValid\?:\s*boolean/,
  },
  {
    name: 'isInvalidKeyFormat function',
    pattern: /function isInvalidKeyFormat\(/,
  },
  {
    name: 'HF key format validation (hf_)',
    pattern: /if \(!key\.startsWith\('hf_'\)/,
  },
  {
    name: 'OpenAI key format validation (sk-)',
    pattern: /if \(!key\.match\(\/\^sk\[-_\]/,
  },
];

let providerRuntimeValid = true;
checks.forEach(check => {
  if (check.pattern.test(providerRuntimeContent)) {
    console.log(`  ✓ ${check.name}`);
  } else {
    console.log(`  ✗ ${check.name} - NOT FOUND`);
    providerRuntimeValid = false;
  }
});

// Check 2: Verify chat.ts has been updated
console.log('\n✓ Check 2: Verify chat.ts failover logic modifications...');
const chatPath = path.join(__dirname, 'web', 'api', 'ai', 'chat.ts');
const chatContent = fs.readFileSync(chatPath, 'utf8');

const chatChecks = [
  {
    name: 'Provider failover comments',
    pattern: /Base\/Advanced should try all live providers before demo/,
  },
  {
    name: 'hfValidated variable',
    pattern: /const hfValidated = providerSnapshot\.huggingface\.validated/,
  },
  {
    name: 'oaiValidated variable',
    pattern: /const oaiValidated = providerSnapshot\.openai\.validated/,
  },
  {
    name: 'PROVIDER_FALLBACK logging',
    pattern: /\[PROVIDER_FALLBACK\]/,
  },
  {
    name: 'validatedOrder prioritization',
    pattern: /const validatedOrder = preferredOrder\.filter/,
  },
];

let chatValid = true;
chatChecks.forEach(check => {
  if (check.pattern.test(chatContent)) {
    console.log(`  ✓ ${check.name}`);
  } else {
    console.log(`  ✗ ${check.name} - NOT FOUND`);
    chatValid = false;
  }
});

// Check 3: Verify health.ts has been updated
console.log('\n✓ Check 3: Verify health.ts type updates...');
const healthPath = path.join(__dirname, 'web', 'api', 'ai', 'health.ts');
const healthContent = fs.readFileSync(healthPath, 'utf8');

const healthChecks = [
  {
    name: 'invalid_key_format in ProviderStatus reason type',
    pattern: /reason\?: '.*invalid_key_format/,
  },
];

let healthValid = true;
healthChecks.forEach(check => {
  if (check.pattern.test(healthContent)) {
    console.log(`  ✓ ${check.name}`);
  } else {
    console.log(`  ✗ ${check.name} - NOT FOUND`);
    healthValid = false;
  }
});

// Summary
console.log('\n=== Summary ===');
const allValid = providerRuntimeValid && chatValid && healthValid;

if (allValid) {
  console.log('✓ All code changes verified successfully!');
  console.log('\nReady for deployment. Run:');
  console.log('  cd web');
  console.log('  npm run deploy:net');
  console.log('\nPost-deployment verification:');
  console.log('  curl https://tradehax.net/api/ai/health | jq ".providers"');
  console.log('  # Should show invalid_key_format detection and provider status\n');
  process.exit(0);
} else {
  console.log('✗ Some code changes are missing or invalid!');
  console.log('Please review the modifications and try again.\n');
  process.exit(1);
}

