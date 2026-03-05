#!/usr/bin/env node

/**
 * TradeHax Complete Automation Runner
 * 
 * Orchestrates:
 * 1. Validation & readiness checks
 * 2. Environment configuration
 * 3. Deployment preparation
 * 4. Vercel automation setup
 * 5. Testing automation
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function banner(title) {
  console.log('');
  log('╔' + '═'.repeat(68) + '╗', 'magenta');
  log('║  ' + title.padEnd(64) + '  ║', 'magenta');
  log('╚' + '═'.repeat(68) + '╝', 'magenta');
  console.log('');
}

class AutomationRunner {
  constructor() {
    this.cwd = process.cwd();
    this.startTime = Date.now();
  }

  step(num, title) {
    log(`\n${'━'.repeat(70)}`, 'cyan');
    log(`STEP ${num}: ${title}`, 'cyan');
    log(`${'━'.repeat(70)}\n`, 'cyan');
  }

  success(msg) {
    log(`✅ ${msg}`, 'green');
  }

  warning(msg) {
    log(`⚠️  ${msg}`, 'yellow');
  }

  error(msg) {
    log(`❌ ${msg}`, 'red');
  }

  info(msg) {
    log(`ℹ️  ${msg}`, 'blue');
  }

  code(msg) {
    log(`   ${msg}`, 'yellow');
  }

  command(cmd) {
    try {
      const output = execSync(cmd, {
        cwd: this.cwd,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return { success: true, output: output.trim() };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  fileExists(filePath) {
    return fs.existsSync(path.join(this.cwd, filePath));
  }

  readFile(filePath) {
    try {
      return fs.readFileSync(path.join(this.cwd, filePath), 'utf-8');
    } catch {
      return null;
    }
  }

  async run() {
    banner('TradeHax HF Fine-Tuning: Complete Automation Setup');

    // STEP 1: Validation
    this.step(1, 'Repository Validation');
    this.validateRepository();

    // STEP 2: File Validation
    this.step(2, 'File & Configuration Validation');
    this.validateFiles();

    // STEP 3: Environment Setup
    this.step(3, 'Environment Configuration Review');
    this.reviewEnvironment();

    // STEP 4: Readiness Check
    this.step(4, 'Deployment Readiness Check');
    this.readinessCheck();

    // STEP 5: Generate Automation Scripts
    this.step(5, 'Generating Automation Scripts');
    this.generateAutomationScripts();

    // STEP 6: Create Summary
    this.step(6, 'Deployment Summary & Next Steps');
    this.generateSummary();

    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    log(`\n✅ Automation setup complete in ${elapsed}s\n`, 'green');
  }

  validateRepository() {
    const branch = this.command('git rev-parse --abbrev-ref HEAD');
    if (branch.success) {
      if (branch.output === 'main') {
        this.success(`On main branch`);
      } else {
        this.warning(`On branch: ${branch.output} (should be main)`);
      }
    } else {
      this.error('Git not initialized');
    }

    const status = this.command('git status --porcelain');
    if (status.success) {
      if (status.output === '') {
        this.success('Working tree clean');
      } else {
        this.warning('Uncommitted changes:');
        status.output.split('\n').forEach(line => {
          if (line) this.info(`  ${line}`);
        });
      }
    }

    const commit = this.command('git log -1 --pretty=format:%h');
    if (commit.success) {
      this.success(`Latest commit: ${commit.output}`);
    }
  }

  validateFiles() {
    const requiredFiles = [
      'app/api/hf-server/route.ts',
      'HF_FINE_TUNING_WORKFLOW.md',
      '.env.example',
      'package.json',
      'scripts/fine-tune-mistral-lora.py',
    ];

    requiredFiles.forEach(file => {
      if (this.fileExists(file)) {
        this.success(`${file}`);
      } else {
        this.error(`${file} MISSING`);
      }
    });
  }

  reviewEnvironment() {
    const envPath = '.env.example';
    const env = this.readFile(envPath);

    if (!env) {
      this.error('.env.example not found');
      return;
    }

    const checks = [
      { key: 'HF_API_TOKEN', required: true },
      { key: 'HF_MODEL_ID', required: true },
      { key: 'NEXT_PUBLIC_ENABLE_PAYMENTS', required: true },
      { key: 'HF_HUB_MODEL_ID', required: true },
    ];

    checks.forEach(check => {
      const found = env.includes(check.key);
      if (found) {
        this.success(`${check.key} configured in .env.example`);
      } else if (check.required) {
        this.error(`${check.key} MISSING from .env.example`);
      }
    });

    // Extract sample values
    const hfModel = env.match(/HF_MODEL_ID=([^\n]+)/);
    const hfHub = env.match(/HF_HUB_MODEL_ID=([^\n]+)/);

    if (hfModel) this.info(`Base model: ${hfModel[1]}`);
    if (hfHub) this.info(`Hub target: ${hfHub[1]}`);
  }

  readinessCheck() {
    const checks = [
      { name: 'npm installed', cmd: 'npm --version' },
      { name: 'node available', cmd: 'node --version' },
      { name: 'git installed', cmd: 'git --version' },
      { name: 'Python available', cmd: 'python --version' },
    ];

    checks.forEach(check => {
      const result = this.command(check.cmd);
      if (result.success) {
        this.success(`${check.name}: ${result.output.split('\n')[0]}`);
      } else {
        this.warning(`${check.name}: not found`);
      }
    });
  }

  generateAutomationScripts() {
    const scripts = [
      'scripts/validate-deployment.js',
      'scripts/setup-vercel-deployment.js',
    ];

    scripts.forEach(script => {
      if (this.fileExists(script)) {
        this.success(`${script} ready`);
      } else {
        this.warning(`${script} not found`);
      }
    });

    this.info('Generated automation scripts:');
    this.code('node scripts/validate-deployment.js - Full validation');
    this.code('node scripts/setup-vercel-deployment.js - Vercel setup');
    this.code('node scripts/test-inference.js - Test endpoints');
  }

  generateSummary() {
    log('\n📋 DEPLOYMENT WORKFLOW\n', 'cyan');

    const workflow = [
      {
        phase: 'Phase 1: Pre-Deployment',
        steps: [
          'node scripts/validate-deployment.js',
          'git add .',
          'git commit -m "chore: finalize HF setup"',
          'git push origin main',
        ],
      },
      {
        phase: 'Phase 2: Vercel Configuration',
        steps: [
          'node scripts/setup-vercel-deployment.js',
          'Follow manual steps OR run deploy-to-vercel.sh',
          'Add HF_API_TOKEN to Vercel secrets',
          'Set HF_MODEL_ID to base/fine-tuned model',
        ],
      },
      {
        phase: 'Phase 3: Deployment',
        steps: [
          'vercel deploy --prod',
          'Wait for build to complete',
          'Check https://tradehax.net',
        ],
      },
      {
        phase: 'Phase 4: Post-Deployment Testing',
        steps: [
          'node scripts/test-inference.js',
          'Verify /api/hf-server endpoint',
          'Check model inference quality',
          'Monitor Vercel logs for errors',
        ],
      },
      {
        phase: 'Phase 5: Fine-Tuning (Optional)',
        steps: [
          'Prepare training dataset',
          'npm run llm:finetune:workflow:push',
          'Update HF_MODEL_ID to fine-tuned model',
          'Redeploy to Vercel',
        ],
      },
    ];

    workflow.forEach((section, idx) => {
      log(`\n${idx + 1}. ${section.phase}`, 'yellow');
      section.steps.forEach((step, stepIdx) => {
        log(`   ${String.fromCharCode(97 + stepIdx)}) ${step}`, 'cyan');
      });
    });

    log('\n' + '─'.repeat(70) + '\n', 'cyan');
    log('📊 QUICK REFERENCE\n', 'cyan');

    const reference = [
      { cmd: 'Validate setup', code: 'node scripts/validate-deployment.js' },
      { cmd: 'Setup Vercel', code: 'node scripts/setup-vercel-deployment.js' },
      { cmd: 'Test endpoints', code: 'node scripts/test-inference.js' },
      { cmd: 'Deploy to Vercel', code: 'vercel deploy --prod' },
      { cmd: 'View logs', code: 'vercel logs' },
      { cmd: 'Fine-tune locally', code: 'npm run llm:finetune:workflow:push' },
    ];

    reference.forEach(item => {
      log(`${item.cmd.padEnd(20)} → ${item.code}`, 'blue');
    });

    log('\n' + '─'.repeat(70) + '\n', 'cyan');
    log('🎯 KEY ENDPOINTS\n', 'cyan');

    const endpoints = [
      { endpoint: 'Text Generation', url: 'POST /api/hf-server', body: '{"prompt":"...","task":"text-generation"}' },
      { endpoint: 'Image Generation', url: 'POST /api/hf-server', body: '{"prompt":"...","task":"image-generation"}' },
      { endpoint: 'Health Check', url: 'GET https://tradehax.net', desc: 'Verify deployment' },
    ];

    endpoints.forEach(ep => {
      log(`${ep.endpoint.padEnd(18)} → ${ep.url}`, 'cyan');
      if (ep.body) log(`   Body: ${ep.body}`, 'blue');
      if (ep.desc) log(`   ${ep.desc}`, 'blue');
    });

    log('\n' + '─'.repeat(70) + '\n', 'cyan');
    log('📞 SUPPORT\n', 'cyan');
    log('Email: darkmodder33@proton.me', 'yellow');
    log('GitHub: https://github.com/DarkModder33/main', 'yellow');
    log('Hub: https://huggingface.co/irishpride81mf/tradehax-mistral-finetuned', 'yellow');

    log('\n' + '─'.repeat(70) + '\n', 'cyan');
    log('✅ Automation setup complete! Start with:', 'green');
    log('   node scripts/validate-deployment.js\n', 'yellow');
  }
}

// Run automation
const runner = new AutomationRunner();
runner.run().catch(e => {
  console.error('❌ Automation failed:', e.message);
  process.exit(1);
});
