#!/usr/bin/env node

/**
 * TradeHax Vercel Deployment Automation
 * 
 * Automates:
 * 1. Environment variable configuration
 * 2. Secret management
 * 3. Deployment triggers
 * 4. Post-deployment validation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

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

class VercelDeploymentAutomation {
  constructor() {
    this.projectId = 'prj_LDmkGrAq06c1DJcH98BeN6GYhZpW';
    this.cwd = process.cwd();
  }

  hasVercelCLI() {
    try {
      execSync('vercel --version', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  checkCommand(cmd) {
    try {
      execSync(cmd, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  generateDeploymentScript() {
    logSection('AUTOMATED VERCEL DEPLOYMENT SCRIPT');

    const script = `#!/bin/bash
# TradeHax Vercel Deployment Script

set -e

echo "🚀 TradeHax Vercel Deployment"
echo ""

# Step 1: Check prerequisites
echo "1. Checking prerequisites..."
if ! command -v vercel &> /dev/null; then
    echo "ERROR: Vercel CLI not installed"
    echo "Install with: npm install -g vercel"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo "ERROR: Git not installed"
    exit 1
fi

# Step 2: Push to GitHub
echo "2. Pushing to GitHub..."
git add .
git commit -m "chore: finalize HF fine-tuning setup" || true
git push origin main

echo "✅ Pushed to GitHub"
echo ""

# Step 3: Configure environment variables
echo "3. Configuring environment variables..."
echo ""

# List of environment variables to configure
ENV_VARS=(
    "HF_MODEL_ID:mistralai/Mistral-7B-Instruct-v0.1"
    "LLM_TEMPERATURE:0.85"
    "LLM_MAX_LENGTH:768"
    "LLM_TOP_P:0.95"
    "NEXT_PUBLIC_ENABLE_PAYMENTS:true"
    "HF_IMAGE_MODEL_ID:stabilityai/stable-diffusion-2-1"
    "HF_IMAGE_STEPS:30"
    "HF_IMAGE_GUIDANCE_SCALE:6.5"
)

for env_var in "\${ENV_VARS[@]}"; do
    key="\${env_var%:*}"
    value="\${env_var#*:}"
    echo "Setting \$key..."
    vercel env add "\$key" --yes "\$value" 2>/dev/null || true
done

# Step 4: Prompt for secrets
echo ""
echo "4. Configuring secrets (interactive)..."
echo ""
echo "Enter HF_API_TOKEN (will be hidden):"
read -s HF_API_TOKEN
if [ -n "\$HF_API_TOKEN" ]; then
    echo "\$HF_API_TOKEN" | vercel env add HF_API_TOKEN --yes || true
fi

# Step 5: Trigger deployment
echo ""
echo "5. Triggering production deployment..."
vercel deploy --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Wait for deployment to finish (check Vercel dashboard)"
echo "2. Test inference endpoint:"
echo "   curl -X POST https://tradehax.net/api/hf-server \\\\"
echo "     -H 'Content-Type: application/json' \\\\"
echo "     -d '{\"prompt\":\"Trading signal\",\"task\":\"text-generation\"}'"
echo "3. Monitor logs: vercel logs"
`;

    log('Save this script as: deploy.sh', 'yellow');
    log('Run with: bash deploy.sh', 'yellow');
    log('');
    log(script, 'yellow');
    log('');

    // Also save to file
    const scriptPath = path.join(this.cwd, 'scripts/deploy-to-vercel.sh');
    fs.writeFileSync(scriptPath, script);
    log(`✅ Saved to: ${scriptPath}`, 'green');
  }

  generateManualSteps() {
    logSection('MANUAL VERCEL DEPLOYMENT STEPS');

    const steps = [
      {
        num: '1',
        title: 'Verify local state',
        actions: [
          'git status (should be clean)',
          'git log -1 (should show latest commit)',
        ],
      },
      {
        num: '2',
        title: 'Push to GitHub',
        actions: [
          'git add .',
          'git commit -m "chore: finalize HF fine-tuning setup"',
          'git push origin main',
        ],
      },
      {
        num: '3',
        title: 'Configure Vercel environment',
        actions: [
          'Go to: https://vercel.com/dashboard',
          'Select project: tradehax',
          'Settings → Environment Variables',
          'Add: HF_API_TOKEN (secret, keep private)',
          'Add: HF_MODEL_ID = mistralai/Mistral-7B-Instruct-v0.1',
          'Add: NEXT_PUBLIC_ENABLE_PAYMENTS = true',
          'Add other vars from .env.example as needed',
        ],
      },
      {
        num: '4',
        title: 'Trigger deployment',
        actions: [
          'Deployments tab → Deploy with git',
          'Or: Redeploy latest from commit',
          'Watch build progress in dashboard',
        ],
      },
      {
        num: '5',
        title: 'Verify deployment',
        actions: [
          'Check build succeeded (green checkmark)',
          'Check production URL active',
          'Open https://tradehax.net',
        ],
      },
      {
        num: '6',
        title: 'Test inference endpoint',
        actions: [
          'curl -X POST https://tradehax.net/api/hf-server \\',
          '  -H "Content-Type: application/json" \\',
          '  -d \'{"prompt":"Give me a concise BTC/ETH market brief.","task":"text-generation"}\'',
          'Expected: 200 status + JSON output',
        ],
      },
      {
        num: '7',
        title: 'Monitor for errors',
        actions: [
          'Vercel Logs: vercel logs',
          'Function logs show any HF inference errors',
          'Check error rate, response time metrics',
        ],
      },
      {
        num: '8',
        title: 'Switch to fine-tuned model (if ready)',
        actions: [
          'After successful fine-tuning & Hub push:',
          'Set: HF_MODEL_ID = irishpride81mf/tradehax-mistral-finetuned',
          'Redeploy',
          'Re-test inference with custom model',
        ],
      },
    ];

    steps.forEach(step => {
      log(`${step.num}. ${step.title}`, 'cyan');
      step.actions.forEach(action => {
        log(`   • ${action}`, 'yellow');
      });
      log('');
    });

    return true;
  }

  generateTestingScript() {
    logSection('AUTOMATED INFERENCE TESTING');

    const testScript = `#!/usr/bin/env node

/**
 * TradeHax Inference Endpoint Tester
 */

const https = require('https');

function makeRequest(url, method, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    
    const options = {
      hostname: 'tradehax.net',
      path: '/api/hf-server',
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, body: result });
        } catch {
          resolve({ status: res.statusCode, body: body });
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('\\n🧪 TradeHax Inference Tests\\n');

  // Test 1: Text generation
  console.log('Test 1: Text Generation');
  console.log('Prompt: "Give me a concise BTC/ETH market brief."\\n');
  
  try {
    const result = await makeRequest(
      'https://tradehax.net/api/hf-server',
      'POST',
      {
        prompt: 'Give me a concise BTC/ETH market brief.',
        task: 'text-generation',
        parameters: { max_length: 200 },
      }
    );

    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.body, null, 2));

    if (result.status === 200 && result.body.output) {
      console.log('✅ PASSED\\n');
    } else {
      console.log('❌ FAILED\\n');
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message, '\\n');
  }

  // Test 2: Image generation
  console.log('Test 2: Image Generation');
  console.log('Prompt: "Trading chart with candlestick pattern"\\n');

  try {
    const result = await makeRequest(
      'https://tradehax.net/api/hf-server',
      'POST',
      {
        prompt: 'Trading chart with candlestick pattern',
        task: 'image-generation',
        parameters: { steps: 20 },
      }
    );

    console.log('Status:', result.status);
    if (result.status === 200) {
      console.log('Response: Image generated (type: ' + typeof result.body.output + ')');
      console.log('✅ PASSED\\n');
    } else {
      console.log('Response:', JSON.stringify(result.body, null, 2));
      console.log('❌ FAILED\\n');
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message, '\\n');
  }

  console.log('Tests complete!');
}

runTests();
`;

    const testPath = path.join(this.cwd, 'scripts/test-inference.js');
    fs.writeFileSync(testPath, testScript);
    log(`✅ Saved inference test script to: ${testPath}`, 'green');
    log('');
    log('Run with: node scripts/test-inference.js', 'yellow');
  }

  generateReadinessChecklist() {
    logSection('DEPLOYMENT READINESS CHECKLIST');

    const checklist = [
      { item: 'Repository on main branch', cmd: 'git branch' },
      { item: 'All changes committed', cmd: 'git status' },
      { item: 'Latest commit pushed', cmd: 'git log -1' },
      { item: '.env.example configured', cmd: 'cat .env.example | grep HF_' },
      { item: 'app/api/hf-server/route.ts exists', cmd: 'ls -la app/api/hf-server/route.ts' },
      { item: 'HF_FINE_TUNING_WORKFLOW.md exists', cmd: 'ls -la HF_FINE_TUNING_WORKFLOW.md' },
      { item: 'Fine-tuning script exists', cmd: 'ls -la scripts/fine-tune-mistral-lora.py' },
      { item: 'npm install succeeds', cmd: 'npm install --dry-run' },
    ];

    log('Run these commands to verify readiness:\n', 'cyan');
    checklist.forEach((item, idx) => {
      log(`${idx + 1}. ${item.item}`, 'yellow');
      log(`   $ ${item.cmd}`, 'blue');
    });

    log('');
    log('If all pass ✅, you\'re ready to deploy!', 'green');
  }

  run() {
    log('\n');
    log('╔═══════════════════════════════════════════════════════════════╗', 'cyan');
    log('║         TradeHax Vercel Deployment Automation                 ║', 'cyan');
    log('╚═══════════════════════════════════════════════════════════════╝', 'cyan');

    if (this.hasVercelCLI()) {
      log('✅ Vercel CLI detected\n', 'green');
      this.generateDeploymentScript();
    } else {
      log('⚠️  Vercel CLI not found. Install with: npm install -g vercel\n', 'yellow');
    }

    this.generateManualSteps();
    this.generateTestingScript();
    this.generateReadinessChecklist();

    logSection('SUMMARY');
    log('Deployment automation scripts generated:', 'green');
    log('  • scripts/deploy-to-vercel.sh - Automated deployment', 'cyan');
    log('  • scripts/test-inference.js - Post-deployment testing', 'cyan');
    log('');
    log('Next steps:', 'yellow');
    log('  1. Run: node scripts/validate-deployment.js', 'cyan');
    log('  2. Run: bash scripts/deploy-to-vercel.sh (or manual steps above)', 'cyan');
    log('  3. Run: node scripts/test-inference.js (after deployment)', 'cyan');
    log('');
  }
}

const automation = new VercelDeploymentAutomation();
automation.run();
