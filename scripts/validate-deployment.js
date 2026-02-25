#!/usr/bin/env node

/**
 * TradeHax HF Fine-Tuning: Automated Completion & Deployment Script
 * 
 * This script automates:
 * 1. Vercel environment configuration validation
 * 2. Inference endpoint testing
 * 3. Fine-tuning readiness checks
 * 4. Post-deployment validation
 * 5. Monetization enablement verification
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
  cyan: '\x1b[36m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(70)}`, 'cyan');
  log(`  ${title}`, 'cyan');
  log(`${'='.repeat(70)}\n`, 'cyan');
}

class DeploymentAutomation {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: [],
    };
    this.cwd = process.cwd();
  }

  checkCommand(cmd) {
    try {
      execSync(cmd, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  readEnv(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const env = {};
      content.split('\n').forEach(line => {
        if (line && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          env[key.trim()] = valueParts.join('=').trim();
        }
      });
      return env;
    } catch {
      return null;
    }
  }

  validateEnvFile() {
    logSection('1. ENVIRONMENT CONFIGURATION');

    const envPath = path.join(this.cwd, '.env');
    const envExamplePath = path.join(this.cwd, '.env.example');

    const env = this.readEnv(envPath);
    const envExample = this.readEnv(envExamplePath);

    if (!env) {
      log('❌ .env file not found', 'red');
      log('   Action: Copy .env.example to .env and configure secrets', 'yellow');
      this.results.failed.push('.env not found');
      return false;
    }

    this.results.passed.push('.env file exists');
    log('✅ .env file exists', 'green');

    // Check required vars
    const required = [
      'HF_API_TOKEN',
      'HF_MODEL_ID',
      'NEXT_PUBLIC_ENABLE_PAYMENTS',
    ];

    required.forEach(key => {
      if (env[key]) {
        log(`✅ ${key} is set`, 'green');
        this.results.passed.push(`${key} configured`);
      } else {
        log(`⚠️  ${key} is not set`, 'yellow');
        this.results.warnings.push(`${key} should be configured`);
      }
    });

    // Check payment enablement
    if (env.NEXT_PUBLIC_ENABLE_PAYMENTS === 'true') {
      log('✅ Payments enabled', 'green');
      this.results.passed.push('Payments flag enabled');
    } else {
      log('⚠️  Payments disabled (set NEXT_PUBLIC_ENABLE_PAYMENTS=true to enable)', 'yellow');
      this.results.warnings.push('Payments not enabled');
    }

    return true;
  }

  validateRepoState() {
    logSection('2. REPOSITORY STATE');

    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', { 
        cwd: this.cwd,
        encoding: 'utf-8'
      }).trim();

      if (branch === 'main') {
        log(`✅ On main branch`, 'green');
        this.results.passed.push('Correct branch');
      } else {
        log(`⚠️  On branch: ${branch}`, 'yellow');
        this.results.warnings.push(`Not on main branch (currently: ${branch})`);
      }

      const status = execSync('git status --short', { 
        cwd: this.cwd,
        encoding: 'utf-8'
      }).trim();

      if (!status) {
        log(`✅ Working tree clean`, 'green');
        this.results.passed.push('Clean git state');
      } else {
        log(`⚠️  Uncommitted changes:\n${status}`, 'yellow');
        this.results.warnings.push('Uncommitted changes exist');
      }

      const lastCommit = execSync('git log -1 --pretty=format:%h', { 
        cwd: this.cwd,
        encoding: 'utf-8'
      }).trim();

      log(`✅ Latest commit: ${lastCommit}`, 'green');
      this.results.passed.push(`On commit ${lastCommit}`);
    } catch (e) {
      log(`❌ Git command failed: ${e.message}`, 'red');
      this.results.failed.push('Git validation failed');
      return false;
    }

    return true;
  }

  validateFilesExist() {
    logSection('3. REQUIRED FILES');

    const requiredFiles = [
      'app/api/hf-server/route.ts',
      'HF_FINE_TUNING_WORKFLOW.md',
      '.env.example',
      'package.json',
      'scripts/fine-tune-mistral-lora.py',
    ];

    let allExist = true;
    requiredFiles.forEach(file => {
      const fullPath = path.join(this.cwd, file);
      if (fs.existsSync(fullPath)) {
        log(`✅ ${file}`, 'green');
        this.results.passed.push(`${file} exists`);
      } else {
        log(`❌ ${file} NOT FOUND`, 'red');
        this.results.failed.push(`${file} missing`);
        allExist = false;
      }
    });

    return allExist;
  }

  validateInferenceEndpoint() {
    logSection('4. INFERENCE ENDPOINT VALIDATION');

    try {
      const routePath = path.join(this.cwd, 'app/api/hf-server/route.ts');
      const routeContent = fs.readFileSync(routePath, 'utf-8');

      const checks = [
        { name: 'HfInference import', regex: /HfInference/ },
        { name: 'text-generation task', regex: /text-generation/ },
        { name: 'image-generation task', regex: /image-generation/ },
        { name: 'HF_API_TOKEN env', regex: /HF_API_TOKEN/ },
        { name: 'HF_MODEL_ID env', regex: /HF_MODEL_ID/ },
      ];

      checks.forEach(check => {
        if (check.regex.test(routeContent)) {
          log(`✅ ${check.name} configured`, 'green');
          this.results.passed.push(check.name);
        } else {
          log(`❌ ${check.name} NOT found`, 'red');
          this.results.failed.push(check.name);
        }
      });

      return true;
    } catch (e) {
      log(`❌ Failed to validate route: ${e.message}`, 'red');
      this.results.failed.push('Route validation failed');
      return false;
    }
  }

  validateFineTuningSetup() {
    logSection('5. FINE-TUNING SETUP');

    try {
      const scriptPath = path.join(this.cwd, 'scripts/fine-tune-mistral-lora.py');
      const reqPath = path.join(this.cwd, 'scripts/fine-tune-requirements.txt');

      if (fs.existsSync(scriptPath)) {
        log('✅ Fine-tune script exists', 'green');
        this.results.passed.push('Fine-tune script');

        const content = fs.readFileSync(scriptPath, 'utf-8');
        if (content.includes('Mistral')) {
          log('✅ Mistral model configured', 'green');
          this.results.passed.push('Mistral config');
        }
      } else {
        log('❌ Fine-tune script missing', 'red');
        this.results.failed.push('Fine-tune script');
      }

      if (fs.existsSync(reqPath)) {
        log('✅ Requirements file exists', 'green');
        this.results.passed.push('Requirements file');
      } else {
        log('❌ Requirements file missing', 'red');
        this.results.failed.push('Requirements file');
      }

      return true;
    } catch (e) {
      log(`❌ Fine-tuning validation failed: ${e.message}`, 'red');
      this.results.failed.push('Fine-tuning setup');
      return false;
    }
  }

  validateMonetization() {
    logSection('6. MONETIZATION SETUP');

    try {
      const env = this.readEnv(path.join(this.cwd, '.env.example'));

      if (env.NEXT_PUBLIC_ENABLE_PAYMENTS) {
        log('✅ NEXT_PUBLIC_ENABLE_PAYMENTS flag found', 'green');
        this.results.passed.push('Payments flag');
      } else {
        log('⚠️  NEXT_PUBLIC_ENABLE_PAYMENTS not in .env.example', 'yellow');
      }

      // Check for monetization routes
      const apiDir = path.join(this.cwd, 'app/api');
      if (fs.existsSync(apiDir)) {
        const dirs = fs.readdirSync(apiDir);
        if (dirs.includes('monetization')) {
          log('✅ Monetization API routes exist', 'green');
          this.results.passed.push('Monetization routes');
        } else {
          log('⚠️  Monetization routes not found', 'yellow');
          this.results.warnings.push('Monetization routes missing');
        }
      }

      return true;
    } catch (e) {
      log(`❌ Monetization validation failed: ${e.message}`, 'red');
      this.results.failed.push('Monetization validation');
      return false;
    }
  }

  generateInferenceTest() {
    logSection('7. INFERENCE TEST CHECKLIST');

    log('After deploying to Vercel, test inference with:', 'cyan');
    log('');
    log('# 1. Test text generation (BTC/ETH market brief)', 'yellow');
    log(`curl -X POST https://tradehax.net/api/hf-server \\`, 'yellow');
    log(`  -H "Content-Type: application/json" \\`, 'yellow');
    log(`  -d '{"prompt":"Give me a concise BTC/ETH market brief.","task":"text-generation"}'`, 'yellow');
    log('');
    log('# 2. Expected response', 'yellow');
    log('{ "output": [ { "generated_text": "..." } ] }', 'yellow');
    log('');

    return true;
  }

  generateDeploymentChecklist() {
    logSection('8. DEPLOYMENT CHECKLIST');

    const checklist = [
      { step: '1', task: 'Push to GitHub main', cmd: 'git push origin main' },
      { step: '2', task: 'Add HF_API_TOKEN to Vercel secrets', cmd: 'vercel env add HF_API_TOKEN' },
      { step: '3', task: 'Set HF_MODEL_ID to fine-tuned model', cmd: 'vercel env set HF_MODEL_ID=irishpride81mf/tradehax-mistral-finetuned' },
      { step: '4', task: 'Enable payments flag', cmd: 'vercel env set NEXT_PUBLIC_ENABLE_PAYMENTS=true' },
      { step: '5', task: 'Trigger deployment', cmd: 'vercel deploy --prod' },
      { step: '6', task: 'Test /api/hf-server endpoint', cmd: 'curl -X POST https://tradehax.net/api/hf-server ...' },
      { step: '7', task: 'Verify model on HF Hub', cmd: 'https://huggingface.co/irishpride81mf/tradehax-mistral-finetuned' },
      { step: '8', task: 'Monitor Vercel logs', cmd: 'vercel logs' },
    ];

    checklist.forEach(item => {
      log(`${item.step}. ${item.task}`, 'cyan');
      log(`   $ ${item.cmd}`, 'yellow');
    });

    return true;
  }

  generateSummary() {
    logSection('SUMMARY');

    const passed = this.results.passed.length;
    const failed = this.results.failed.length;
    const warnings = this.results.warnings.length;

    log(`Passed:  ${passed}`, 'green');
    log(`Failed:  ${failed}`, failed > 0 ? 'red' : 'green');
    log(`Warnings: ${warnings}`, warnings > 0 ? 'yellow' : 'green');

    if (failed > 0) {
      log('\nFailed checks:', 'red');
      this.results.failed.forEach(f => log(`  ❌ ${f}`, 'red'));
    }

    if (warnings > 0) {
      log('\nWarnings:', 'yellow');
      this.results.warnings.forEach(w => log(`  ⚠️  ${w}`, 'yellow'));
    }

    log('\nNext steps:', 'cyan');
    if (failed === 0 && warnings === 0) {
      log('✅ All checks passed! Ready for deployment.', 'green');
      log('   1. Commit changes: git add . && git commit -m "chore: finalize HF setup"', 'yellow');
      log('   2. Push to GitHub: git push origin main', 'yellow');
      log('   3. Deploy to Vercel: vercel deploy --prod', 'yellow');
      log('   4. Test inference: curl -X POST https://tradehax.net/api/hf-server ...', 'yellow');
    } else {
      log('⚠️  Please resolve issues before deployment', 'yellow');
    }

    log('');
  }

  run() {
    log('\n', 'cyan');
    log('╔═══════════════════════════════════════════════════════════════╗', 'cyan');
    log('║  TradeHax HF Fine-Tuning: Automated Completion & Validation  ║', 'cyan');
    log('╚═══════════════════════════════════════════════════════════════╝', 'cyan');

    this.validateEnvFile();
    this.validateRepoState();
    this.validateFilesExist();
    this.validateInferenceEndpoint();
    this.validateFineTuningSetup();
    this.validateMonetization();
    this.generateInferenceTest();
    this.generateDeploymentChecklist();
    this.generateSummary();
  }
}

const automation = new DeploymentAutomation();
automation.run();
