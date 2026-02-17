#!/usr/bin/env node
/*
 Cross-platform installer wrapper for git hooks.
 - On Windows it prefers running the PowerShell installer if `pwsh` is available.
 - On POSIX it prefers the shell installer.
 - If installers are missing it falls back to running the equivalent `git` commands directly.

 Usage:
   node ./scripts/install-hooks.js
   or (if executable) ./scripts/install-hooks.js
*/

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: false, ...opts });
  if (res.error) {
    console.error(`[ERROR] Failed to run ${cmd} ${args.join(' ')}:`, res.error);
    process.exit(1);
  }
  if (res.status !== 0) process.exit(res.status);
}

const repoRoot = process.cwd();
const ps = path.join(repoRoot, 'scripts', 'install-hooks.ps1');
const sh = path.join(repoRoot, 'scripts', 'install-hooks.sh');
const hook = path.join('.githooks', 'pre-commit');

if (process.platform === 'win32') {
  // Try to run PowerShell installer if present
  if (fs.existsSync(ps)) {
    // Prefer pwsh if available
    try {
      run('pwsh', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', ps]);
    } catch (e) {
      // fallthrough
    }
  }
}

if (process.platform !== 'win32') {
  if (fs.existsSync(sh)) {
    run('sh', [sh]);
  }
}

// If neither installer ran (or they didn't exist), set the git config and mark hook executable
// This works cross-platform where `git` is available.
try {
  run('git', ['config', 'core.hooksPath', '.githooks']);
  if (fs.existsSync(hook)) {
    run('git', ['add', hook]);
    run('git', ['update-index', '--chmod=+x', hook]);
  }
  // Print current value for verification
  const res = spawnSync('git', ['config', '--local', '--get', 'core.hooksPath'], { encoding: 'utf8' });
  if (res.status === 0) {
    console.log('\ncore.hooksPath=' + res.stdout.trim());
  } else {
    console.warn('Could not read core.hooksPath');
  }
} catch (e) {
  console.error('Failed to apply fallback git config:', e);
  process.exit(1);
}

process.exit(0);
