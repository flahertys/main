#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const args = new Set(process.argv.slice(2));
const failFast = args.has("--fail-fast");
const continueOnError = !failFast;
const quick = args.has("--quick");
const dryRun = args.has("--dry-run");
const deployDryRun = args.has("--deploy-dry-run");
const strict = args.has("--strict");

const npmExecPath = process.env.npm_execpath;
const nodeExecPath = process.execPath;
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

const fullPipeline = [
  { label: "IDE sync full", script: "ide:sync:full" },
  { label: "Strict internal links", script: "check:links:strict" },
  { label: strict ? "LLM environment doctor (strict)" : "LLM environment doctor", script: strict ? "ai:env:doctor:strict" : "ai:env:doctor" },
  { label: strict ? "Hivemind quality (strict)" : "Hivemind benchmark trend", script: strict ? "hivemind:quality:strict" : "hivemind:benchmark" },
  { label: "LLM dataset prep + validation", script: "llm:prepare-and-validate" },
  { label: "Tradebot evaluation", script: "tradebot:evaluate" },
  { label: strict ? "Launch readiness (strict)" : "Launch readiness", script: strict ? "launch:readiness:strict" : "launch:readiness" },
];

const quickPipeline = [
  { label: "Pipeline local", script: "pipeline:local" },
  { label: strict ? "LLM environment doctor (strict)" : "LLM environment doctor", script: strict ? "ai:env:doctor:strict" : "ai:env:doctor" },
  { label: strict ? "Hivemind quality (strict)" : "Hivemind benchmark trend", script: strict ? "hivemind:quality:strict" : "hivemind:benchmark" },
  { label: "LLM dataset prep + validation", script: "llm:prepare-and-validate" },
];

const selectedPipeline = quick ? quickPipeline : fullPipeline;

function runNpmScript(scriptName) {
  const command = npmExecPath ? nodeExecPath : npmCmd;
  const commandArgs = npmExecPath
    ? [npmExecPath, "run", scriptName]
    : ["run", scriptName];

  return spawnSync(command, commandArgs, {
    stdio: "inherit",
    shell: false,
  });
}

function ensureArtifactsDir() {
  const artifactsDir = path.resolve(process.cwd(), ".artifacts");
  fs.mkdirSync(artifactsDir, { recursive: true });
  return artifactsDir;
}

function writeReport(report) {
  const artifactsDir = ensureArtifactsDir();
  const reportPath = path.join(artifactsDir, "aggressive-dev-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  return reportPath;
}

function printDivider(title) {
  process.stdout.write(`\n===============================================\n${title}\n===============================================\n`);
}

function main() {
  printDivider("TradeHax Aggressive Development Loop");
  process.stdout.write(`Mode: ${quick ? "QUICK" : "FULL"}\n`);
  process.stdout.write(`Strict checks: ${strict ? "yes" : "no"}\n`);
  process.stdout.write(`Fail fast: ${failFast ? "yes" : "no"}\n`);
  process.stdout.write(`Continue on error: ${continueOnError ? "yes" : "no"}\n`);
  process.stdout.write(`Dry run: ${dryRun ? "yes" : "no"}\n`);
  process.stdout.write(`Deploy dry run: ${deployDryRun ? "yes" : "no"}\n`);

  const startedAt = new Date();
  const steps = [];
  let failed = false;

  for (const step of selectedPipeline) {
    printDivider(step.label);

    if (dryRun) {
      process.stdout.write(`[dry-run] npm run ${step.script}\n`);
      steps.push({
        label: step.label,
        script: step.script,
        status: "skipped-dry-run",
        exitCode: 0,
      });
      continue;
    }

    const result = runNpmScript(step.script);
    const exitCode = result.status || 0;
    const status = exitCode === 0 ? "passed" : "failed";

    steps.push({
      label: step.label,
      script: step.script,
      status,
      exitCode,
    });

    if (exitCode !== 0) {
      failed = true;
      if (!continueOnError) break;
    }
  }

  if (deployDryRun) {
    printDivider("Deploy launcher dry run");
    if (dryRun) {
      process.stdout.write("[dry-run] npm run deploy:launch:dry-run\n");
      steps.push({
        label: "Deploy launcher dry run",
        script: "deploy:launch:dry-run",
        status: "skipped-dry-run",
        exitCode: 0,
      });
    } else {
      const result = runNpmScript("deploy:launch:dry-run");
      const exitCode = result.status || 0;
      const status = exitCode === 0 ? "passed" : "failed";
      steps.push({
        label: "Deploy launcher dry run",
        script: "deploy:launch:dry-run",
        status,
        exitCode,
      });
      if (exitCode !== 0) failed = true;
    }
  }

  const finishedAt = new Date();
  const report = {
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    mode: quick ? "quick" : "full",
    continueOnError,
    dryRun,
    deployDryRun,
    success: !failed,
    steps,
  };

  const reportPath = writeReport(report);
  printDivider("Aggressive Loop Summary");

  const passed = steps.filter((s) => s.status === "passed").length;
  const failedCount = steps.filter((s) => s.status === "failed").length;
  process.stdout.write(`Passed steps: ${passed}\n`);
  process.stdout.write(`Failed steps: ${failedCount}\n`);
  process.stdout.write(`Report: ${reportPath}\n`);

  if (failed) {
    process.stdout.write("\n❌ Aggressive development loop finished with failures.\n");
    process.exit(1);
  }

  process.stdout.write("\n✅ Aggressive development loop completed successfully.\n");
}

main();
