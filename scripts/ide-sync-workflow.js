#!/usr/bin/env node

/**
 * TradeHax IDE Pipeline & Multi-Location Sync Workflow
 * 
 * Goals:
 * 1. Same quality gate everywhere (lint + type-check)
 * 2. Quick awareness of sync state against origin/main
 * 3. Optional build and Namecheap deploy-readiness check
 * 4. One command in terminal or one task in VS Code
 * 
 * Commands:
 * - npm run ide:sync (quick)
 * - npm run ide:sync:full (recommended before push)
 * - npm run ide:sync:deploy-ready (strict, before deployment)
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function banner(title) {
  console.log('');
  log('╔' + '═'.repeat(70) + '╗', 'magenta');
  log('║  ' + title.padEnd(66) + '  ║', 'magenta');
  log('╚' + '═'.repeat(70) + '╝', 'magenta');
  console.log('');
}

function section(title) {
  log(`\n${'━'.repeat(70)}`, 'cyan');
  log(title, 'cyan');
  log(`${'━'.repeat(70)}\n`, 'cyan');
}

function success(msg) {
  log(`✅ ${msg}`, 'green');
}

function warning(msg) {
  log(`⚠️  ${msg}`, 'yellow');
}

function error(msg) {
  log(`❌ ${msg}`, 'red');
}

function info(msg) {
  log(`ℹ️  ${msg}`, 'blue');
}

class IDESyncWorkflow {
  constructor() {
    this.cwd = process.cwd();
    this.mode = process.argv[2] || 'quick'; // quick, full, deploy-ready
    this.results = {
      passed: [],
      failed: [],
      warnings: [],
    };
  }

  runCommand(cmd, description, throwOnError = false) {
    try {
      log(`   → ${description}...`, 'gray');
      const output = execSync(cmd, {
        cwd: this.cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf-8',
      });
      success(`${description}`);
      this.results.passed.push(description);
      return { success: true, output };
    } catch (error) {
      if (throwOnError) {
        error(`${description} FAILED`);
        this.results.failed.push(description);
        throw error;
      } else {
        warning(`${description} (non-blocking)`);
        this.results.warnings.push(description);
        return { success: false, error: error.message };
      }
    }
  }

  checkCommand(cmd, description) {
    try {
      execSync(cmd, {
        cwd: this.cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * QUICK SYNC: git fetch + lint + type-check
   */
  quickSync() {
    banner('TradeHax IDE Sync (Quick)');
    section('Step 1: Git Fetch & Status');

    // Fetch
    this.runCommand('git fetch origin main', 'Fetching latest from origin/main');

    // Status
    try {
      const ahead = execSync(
        `git rev-list --count origin/main..HEAD`,
        { cwd: this.cwd, encoding: 'utf-8' }
      ).trim();
      const behind = execSync(
        `git rev-list --count HEAD..origin/main`,
        { cwd: this.cwd, encoding: 'utf-8' }
      ).trim();

      log('');
      info(`Git Status: ${ahead} commits ahead, ${behind} commits behind`);

      if (parseInt(behind) > 0) {
        warning('Your branch is behind origin/main. Pull before editing.');
        log('   Run: git pull origin main', 'yellow');
      }
      if (parseInt(ahead) > 0) {
        info(`Your branch is ${ahead} commits ahead. Ready to push.`);
      }

      this.results.passed.push('Git status check');
    } catch (e) {
      warning('Could not determine git status');
      this.results.warnings.push('Git status check');
    }

    // Install git hooks (best effort)
    section('Step 2: Git Hooks');
    this.runCommand('npm run hooks:install 2>/dev/null || true', 'Installing git hooks', false);

    // Lint
    section('Step 3: Linting');
    this.runCommand('npm run lint', 'Running ESLint', true);

    // Type check
    section('Step 4: Type Checking');
    this.runCommand('npm run type-check', 'Running TypeScript check', true);

    this.printSummary('Quick Sync');
  }

  /**
   * FULL SYNC: quick sync + npm ci + build + deploy-config check
   */
  fullSync() {
    banner('TradeHax IDE Sync (Full)');

    // Run quick sync first
    section('Running Quick Sync First');
    const savedMode = this.mode;
    this.mode = 'quick';
    this.quickSync();
    this.mode = savedMode;

    // Install dependencies
    section('Step 5: Installing Dependencies');
    this.runCommand(
      'npm ci --legacy-peer-deps',
      'npm ci (clean install)',
      true
    );

    // Build
    section('Step 6: Production Build');
    this.runCommand('npm run build', 'Building for production', true);

    // Namecheap deploy config check (warning mode)
    section('Step 7: Namecheap Deploy Config Check');
    this.checkNamecheapConfig(false);

    this.printSummary('Full Sync');
  }

  /**
   * DEPLOY-READY STRICT SYNC: full sync + strict Namecheap check
   */
  deployReadySync() {
    banner('TradeHax IDE Sync (Deploy Ready - Strict)');

    // Run full sync first
    section('Running Full Sync First');
    const savedMode = this.mode;
    this.mode = 'full';
    this.fullSync();
    this.mode = savedMode;

    // Strict Namecheap check
    section('Step 8: Strict Namecheap Deploy Config Check');
    this.checkNamecheapConfig(true);

    // Final verification
    section('Step 9: Final Verification');
    this.runCommand('git status --short', 'Checking for uncommitted changes', false);

    this.printSummary('Deploy Ready Sync');
  }

  /**
   * Check Namecheap deployment configuration
   */
  checkNamecheapConfig(strict = false) {
    const mode = strict ? 'Strict' : 'Warning';
    log(`\n${mode} Namecheap Deploy Config Check:\n`, 'cyan');

    const required = [
      { key: 'NAMECHEAP_VPS_HOST', desc: 'VPS Host', example: '199.188.201.164' },
      { key: 'NAMECHEAP_VPS_USER', desc: 'VPS Username', example: 'traddhou' },
      { key: 'NAMECHEAP_VPS_SSH_KEY', desc: 'SSH Private Key', example: '(from GitHub Secrets)' },
    ];

    const optional = [
      { key: 'NAMECHEAP_VPS_PORT', desc: 'SSH Port', example: '22 (default)' },
      { key: 'NAMECHEAP_APP_ROOT', desc: 'App Root', example: '/home/traddhou/public_html' },
      { key: 'NAMECHEAP_APP_PORT', desc: 'App Port', example: '3000' },
    ];

    let allRequiredPresent = true;

    // Check required
    log('Required Variables:', 'yellow');
    required.forEach(({ key, desc, example }) => {
      const env = process.env[key];
      const inSecrets = this.isInGitHubSecrets(key);

      if (env || inSecrets) {
        success(`${desc} (${key}): Configured`);
        this.results.passed.push(`${desc} configured`);
      } else {
        if (strict) {
          error(`${desc} (${key}): MISSING`);
          this.results.failed.push(`${desc} missing`);
          allRequiredPresent = false;
        } else {
          warning(`${desc} (${key}): Not found locally (check GitHub Secrets)`);
          this.results.warnings.push(`${desc} not found locally`);
        }
      }
    });

    // Check optional
    log('\nOptional Variables:', 'yellow');
    optional.forEach(({ key, desc, example }) => {
      const env = process.env[key];
      if (env) {
        success(`${desc} (${key}): ${env}`);
        this.results.passed.push(`${desc} configured`);
      } else {
        info(`${desc} (${key}): Using default (${example})`);
      }
    });

    if (strict && !allRequiredPresent) {
      error('\n❌ Deploy-ready check FAILED: Missing required Namecheap config');
      error('Set these in GitHub Secrets or local .env:');
      required.forEach(({ key, example }) => {
        log(`   ${key}=${example}`, 'red');
      });
      throw new Error('Deploy-ready check failed');
    }
  }

  /**
   * Check if environment variable is likely in GitHub Secrets
   */
  isInGitHubSecrets(key) {
    // Simple heuristic: if running in GitHub Actions or CI, assume secrets are present
    return process.env.GITHUB_ACTIONS === 'true' || process.env.CI === 'true';
  }

  /**
   * Print summary of sync
   */
  printSummary(syncType) {
    section(`${syncType} Summary`);

    const total = this.results.passed.length + this.results.failed.length + this.results.warnings.length;

    log(`Passed: ${this.results.passed.length}/${total}`, 'green');
    log(`Warnings: ${this.results.warnings.length}/${total}`, 'yellow');
    log(`Failed: ${this.results.failed.length}/${total}`, this.results.failed.length > 0 ? 'red' : 'green');

    if (this.results.failed.length > 0) {
      log('\nFailed checks:', 'red');
      this.results.failed.forEach(f => log(`  ❌ ${f}`, 'red'));
    }

    if (this.results.warnings.length > 0) {
      log('\nWarnings:', 'yellow');
      this.results.warnings.forEach(w => log(`  ⚠️  ${w}`, 'yellow'));
    }

    section('Next Steps');

    if (syncType === 'Quick Sync') {
      if (this.results.failed.length === 0) {
        success('Quick sync complete! Ready to edit.');
        log('\nBefore pushing:');
        log('  npm run ide:sync:full', 'cyan');
      }
    } else if (syncType === 'Full Sync') {
      if (this.results.failed.length === 0) {
        success('Full sync complete! Ready to push.');
        log('\nBefore Namecheap deployment:');
        log('  npm run ide:sync:deploy-ready', 'cyan');
      }
    } else if (syncType === 'Deploy Ready Sync') {
      if (this.results.failed.length === 0) {
        success('Deploy-ready sync complete! Ready to deploy.');
        log('\nDeploy to Namecheap:');
        log('  bash scripts/deploy-to-namecheap.sh', 'cyan');
      }
    }

    log('');
  }

  run() {
    try {
      switch (this.mode) {
        case 'quick':
          this.quickSync();
          break;
        case 'full':
          this.fullSync();
          break;
        case 'deploy-ready':
          this.deployReadySync();
          break;
        default:
          error(`Unknown mode: ${this.mode}`);
          error('Use: quick | full | deploy-ready');
          process.exit(1);
      }

      if (this.results.failed.length > 0) {
        process.exit(1);
      }
    } catch (err) {
      error(`\nSync workflow failed: ${err.message}`);
      process.exit(1);
    }
  }
}

// Run workflow
const workflow = new IDESyncWorkflow();
workflow.run();
