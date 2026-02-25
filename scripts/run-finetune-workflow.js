// scripts/run-finetune-workflow.js - Robust wrapper for TradeHax fine-tuning
const { spawnSync } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const shouldInstallDeps = args.includes('--install-deps');
const shouldPush = args.includes('--push');

const scriptPath = path.join(__dirname, 'fine-tune-mistral-lora.py');
const reqPath = path.join(__dirname, 'fine-tune-requirements.txt');

const pythonCandidates = [
  { cmd: 'py', probeArgs: ['-3.11', '--version'], runPrefix: ['-3.11'] },
  { cmd: 'py', probeArgs: ['-3.10', '--version'], runPrefix: ['-3.10'] },
  { cmd: 'python', probeArgs: ['--version'], runPrefix: [] },
];

function parseVersion(output) {
  const match = output.match(/Python\s+(\d+)\.(\d+)\.(\d+)/i);
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

function isSupported(v) {
  if (!v) return false;
  return v.major === 3 && (v.minor === 10 || v.minor === 11);
}

function findPython() {
  for (const candidate of pythonCandidates) {
    const probe = spawnSync(candidate.cmd, candidate.probeArgs, { encoding: 'utf8' });
    const text = `${probe.stdout || ''}${probe.stderr || ''}`.trim();
    const version = parseVersion(text);
    if (probe.status === 0 && isSupported(version)) {
      return {
        cmd: candidate.cmd,
        runPrefix: candidate.runPrefix,
        versionText: text,
      };
    }
  }
  return null;
}

function runStep(cmd, cmdArgs, label) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(cmd, cmdArgs, { stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status}`);
  }
}

try {
  const py = findPython();
  if (!py) {
    console.error('❌ No compatible Python found.');
    console.error('This workflow requires Python 3.10 or 3.11 for torch/transformers compatibility.');
    console.error('Install Python 3.11, then rerun with: npm run fine-tune -- --install-deps');
    process.exit(1);
  }

  console.log(`✅ Using interpreter: ${py.cmd} ${py.runPrefix.join(' ')} (${py.versionText})`);

  if (shouldInstallDeps) {
    runStep(py.cmd, [...py.runPrefix, '-m', 'pip', 'install', '-r', reqPath], 'Install fine-tune dependencies');
  }

  const trainArgs = [...py.runPrefix, scriptPath];
  if (shouldPush) {
    trainArgs.push('--push-to-hub');
  }

  runStep(py.cmd, trainArgs, 'Run fine-tune training');
  console.log('\n🎉 Fine-tune workflow completed.');
} catch (error) {
  console.error(`\n❌ Workflow failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
