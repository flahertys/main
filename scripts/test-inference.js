#!/usr/bin/env node

const path = require('path');
const { spawnSync } = require('child_process');

const target = path.resolve(__dirname, '..', 'tradehax-fresh', 'scripts', 'test-inference.js');

const run = spawnSync(process.execPath, [target], {
  cwd: path.resolve(__dirname, '..', 'tradehax-fresh'),
  stdio: 'inherit',
});

if (run.error) {
  console.error(`❌ Failed to run inference tests: ${run.error.message}`);
  process.exit(1);
}

process.exit(run.status ?? 0);
