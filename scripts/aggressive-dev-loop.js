#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const args = new Set(process.argv.slice(2));
const failFast = args.has("--fail-fast");
const continueOnError = !failFast;
const quick = args.has("--quick");
const dryRun = args.has("--dry-run");
const deployDryRun = args.has("--deploy-dry-run");
const strict = args.has("--strict");
const PLAN_VERSION = "2026-03-04.2";

const npmExecPath = process.env.npm_execpath;
const nodeExecPath = process.execPath;
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

function getPipeline(modeQuick, modeStrict) {
  const fullPipeline = [
    { label: "IDE sync full", script: "ide:sync:full", objective: "Baseline repo + build readiness" },
    { label: "Strict internal links", script: "check:links:strict", objective: "Navigation integrity and crawlability" },
    { label: modeStrict ? "LLM environment doctor (strict)" : "LLM environment doctor", script: modeStrict ? "ai:env:doctor:strict" : "ai:env:doctor", objective: "LLM provider and guardrail correctness" },
    { label: modeStrict ? "Hivemind quality (strict)" : "Hivemind benchmark trend", script: modeStrict ? "hivemind:quality:strict" : "hivemind:benchmark", objective: "Model quality trend monitoring" },
    { label: "LLM dataset prep + validation", script: "llm:prepare-and-validate", objective: "Training dataset quality and schema validity" },
    { label: "Tradebot evaluation", script: "tradebot:evaluate", objective: "Evaluation signal freshness" },
    { label: modeStrict ? "Launch readiness (strict)" : "Launch readiness", script: modeStrict ? "launch:readiness:strict" : "launch:readiness", objective: "Operational deploy readiness" },
  ];

  const quickPipeline = [
    { label: "Pipeline local", script: "pipeline:local", objective: "Website quality gate (lint/type/link/build)" },
    { label: modeStrict ? "LLM environment doctor (strict)" : "LLM environment doctor", script: modeStrict ? "ai:env:doctor:strict" : "ai:env:doctor", objective: "LLM provider and guardrail correctness" },
    { label: modeStrict ? "Hivemind quality (strict)" : "Hivemind benchmark trend", script: modeStrict ? "hivemind:quality:strict" : "hivemind:benchmark", objective: "Model quality trend monitoring" },
    { label: "LLM dataset prep + validation", script: "llm:prepare-and-validate", objective: "Training dataset quality and schema validity" },
  ];

  return modeQuick ? quickPipeline : fullPipeline;
}

const selectedPipeline = getPipeline(quick, strict);

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

function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function writeReport(report) {
  const artifactsDir = ensureArtifactsDir();
  const reportPath = path.join(artifactsDir, "aggressive-dev-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

  const checksumPath = path.join(artifactsDir, "aggressive-dev-report.sha256");
  fs.writeFileSync(checksumPath, `${report.integrity.hash}  aggressive-dev-report.json\n`, "utf8");

  const planPath = path.join(artifactsDir, "aggressive-dev-plan.json");
  fs.writeFileSync(
    planPath,
    JSON.stringify(
      {
        planVersion: report.metadata.planVersion,
        generatedAt: report.metadata.finishedAt,
        mode: report.metadata.mode,
        strict: report.metadata.strict,
        failFast: report.metadata.failFast,
        steps: report.plan.steps,
      },
      null,
      2,
    ),
    "utf8",
  );

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

  for (const [index, step] of selectedPipeline.entries()) {
    printDivider(step.label);
    const stepStartedAt = new Date();

    if (dryRun) {
      process.stdout.write(`[dry-run] npm run ${step.script}\n`);
      steps.push({
        index,
        label: step.label,
        script: step.script,
        objective: step.objective,
        startedAt: stepStartedAt.toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: 0,
        status: "skipped-dry-run",
        exitCode: 0,
      });
      continue;
    }

    const result = runNpmScript(step.script);
    const exitCode = result.status || 0;
    const status = exitCode === 0 ? "passed" : "failed";
    const stepFinishedAt = new Date();

    steps.push({
      index,
      label: step.label,
      script: step.script,
      objective: step.objective,
      startedAt: stepStartedAt.toISOString(),
      finishedAt: stepFinishedAt.toISOString(),
      durationMs: stepFinishedAt.getTime() - stepStartedAt.getTime(),
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
    const stepStartedAt = new Date();
    if (dryRun) {
      process.stdout.write("[dry-run] npm run deploy:launch:dry-run\n");
      steps.push({
        index: steps.length,
        label: "Deploy launcher dry run",
        script: "deploy:launch:dry-run",
        objective: "Deploy orchestration sanity check",
        startedAt: stepStartedAt.toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: 0,
        status: "skipped-dry-run",
        exitCode: 0,
      });
    } else {
      const result = runNpmScript("deploy:launch:dry-run");
      const exitCode = result.status || 0;
      const status = exitCode === 0 ? "passed" : "failed";
      const stepFinishedAt = new Date();
      steps.push({
        index: steps.length,
        label: "Deploy launcher dry run",
        script: "deploy:launch:dry-run",
        objective: "Deploy orchestration sanity check",
        startedAt: stepStartedAt.toISOString(),
        finishedAt: stepFinishedAt.toISOString(),
        durationMs: stepFinishedAt.getTime() - stepStartedAt.getTime(),
        status,
        exitCode,
      });
      if (exitCode !== 0) failed = true;
    }
  }

  const finishedAt = new Date();
  const expectedSteps = selectedPipeline.length + (deployDryRun ? 1 : 0);
  const passed = steps.filter((s) => s.status === "passed").length;
  const failedCount = steps.filter((s) => s.status === "failed").length;
  const skippedCount = steps.filter((s) => s.status === "skipped-dry-run").length;
  const executedCount = steps.filter((s) => s.status !== "skipped-dry-run").length;
  const totalDurationMs = steps.reduce((sum, step) => sum + (step.durationMs || 0), 0);
  const coveragePct = expectedSteps === 0 ? 100 : Number(((steps.length / expectedSteps) * 100).toFixed(2));
  const passRatePct = executedCount === 0 ? 100 : Number(((passed / executedCount) * 100).toFixed(2));

  const payload = {
    metadata: {
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      mode: quick ? "quick" : "full",
      strict,
      failFast,
      continueOnError,
      dryRun,
      deployDryRun,
      nodeVersion: process.version,
      platform: process.platform,
      planVersion: PLAN_VERSION,
    },
    plan: {
      expectedSteps,
      steps: selectedPipeline.map((step, idx) => ({
        index: idx,
        label: step.label,
        script: step.script,
        objective: step.objective,
      })),
    },
    execution: {
      success: !failed,
      steps,
    },
    summary: {
      passed,
      failed: failedCount,
      skipped: skippedCount,
      executed: executedCount,
      coveragePct,
      passRatePct,
      totalStepDurationMs: totalDurationMs,
    },
  };

  const reportHash = sha256(JSON.stringify(payload));
  const report = {
    ...payload,
    integrity: {
      algorithm: "sha256",
      hash: reportHash,
      generatedAt: new Date().toISOString(),
    },
  };

  const reportPath = writeReport(report);

  printDivider("Aggressive Loop Summary");
  process.stdout.write(`Passed steps: ${passed}\n`);
  process.stdout.write(`Failed steps: ${failedCount}\n`);
  process.stdout.write(`Skipped steps: ${skippedCount}\n`);
  process.stdout.write(`Coverage: ${coveragePct}%\n`);
  process.stdout.write(`Pass rate: ${passRatePct}%\n`);
  process.stdout.write(`Report: ${reportPath}\n`);
  process.stdout.write(`Integrity hash: ${reportHash}\n`);

  if (failed) {
    process.stdout.write("\n❌ Aggressive development loop finished with failures.\n");
    process.exit(1);
  }

  process.stdout.write("\n✅ Aggressive development loop completed successfully.\n");
}

main();
