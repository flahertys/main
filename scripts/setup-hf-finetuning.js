#!/usr/bin/env node

/**
 * Quick-start script for TradeHax HF Fine-Tuning Setup
 * Usage: node scripts/setup-hf-finetuning.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description}: ${filePath}`, 'green');
    return true;
  } else {
    log(`❌ ${description} NOT FOUND: ${filePath}`, 'red');
    return false;
  }
}

function checkEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    log('✅ .env.local exists', 'green');
    return true;
  } else {
    log('⚠️  .env.local not found. Copy from .env.example:', 'yellow');
    log('   cp .env.example .env.local', 'blue');
    return false;
  }
}

function main() {
  log('\n🚀 TradeHax HF Fine-Tuning Setup Verification\n', 'blue');

  // Check core files
  log('📋 Checking files...', 'blue');
  const files = [
    ['src/app/api/hf-server.ts', 'HF Server API'],
    ['src/components/hf-client.ts', 'HF Client Hook'],
    ['scripts/fine-tune-mistral-lora.py', 'Fine-Tune Script'],
    ['scripts/fine-tune-requirements.txt', 'Python Deps'],
    ['scripts/run-finetune-workflow.js', 'Workflow Orchestrator'],
    ['docs/HF_FINE_TUNING_WORKFLOW.md', 'Documentation'],
    ['.env.example', 'Env Template'],
  ];

  let allFilesExist = true;
  files.forEach(([file, desc]) => {
    if (!checkFile(file, desc)) allFilesExist = false;
  });

  log('');

  // Check environment
  log('⚙️  Checking environment...', 'blue');
  const envExists = checkEnv();

  log('');

  // Summary
  if (allFilesExist && envExists) {
    log('✅ ALL CHECKS PASSED!', 'green');
    log('\nNext steps:', 'blue');
    log('  1. npm install', 'yellow');
    log('  2. npm run llm:finetune:deps', 'yellow');
    log('  3. Set HF_API_TOKEN in .env.local', 'yellow');
    log('  4. npm run llm:finetune:workflow:push', 'yellow');
  } else if (allFilesExist && !envExists) {
    log('⚠️  FILES OK, but environment needs setup', 'yellow');
    log('\nSetup .env.local first:', 'blue');
    log('  1. cp .env.example .env.local', 'yellow');
    log('  2. Edit .env.local and add HF_API_TOKEN', 'yellow');
    log('  3. Then run: npm run llm:finetune:deps', 'yellow');
  } else {
    log('❌ SETUP INCOMPLETE', 'red');
    log('\nMissing files. Ensure all files are in place before proceeding.', 'red');
  }

  log('\n📖 Full guide: docs/HF_FINE_TUNING_WORKFLOW.md', 'blue');
  log('');
}

main();
