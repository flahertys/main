#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const args = process.argv.slice(2);

function getArgValue(flag, defaultValue) {
  const idx = args.indexOf(flag);
  if (idx === -1) return defaultValue;
  const value = args[idx + 1];
  if (!value || value.startsWith("--")) return defaultValue;
  return value;
}

const reportPathArg = getArgValue("--report", path.join(".artifacts", "aggressive-dev-report.json"));
const maxAgeMinutes = Number(getArgValue("--max-age-minutes", "240"));
const requireSuccess = !args.includes("--allow-failed-run");
const minScore = Number(getArgValue("--min-score", "90"));
const reportPath = path.resolve(process.cwd(), reportPathArg);

function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function fail(msg) {
  process.stderr.write(`❌ ${msg}\n`);
  process.exit(1);
}

function pass(msg) {
  process.stdout.write(`✅ ${msg}\n`);
}

function assert(condition, message) {
  if (!condition) fail(message);
  pass(message);
}

function main() {
  process.stdout.write("\n🔍 Verifying aggressive development report integrity and execution proof\n\n");

  assert(fs.existsSync(reportPath), `Report file exists at ${reportPath}`);

  const raw = fs.readFileSync(reportPath, "utf8");
  let report;
  try {
    report = JSON.parse(raw);
  } catch {
    fail("Report is not valid JSON.");
  }

  assert(report && typeof report === "object", "Report JSON object is valid");
  assert(report.metadata && typeof report.metadata === "object", "Metadata block is present");
  assert(report.plan && typeof report.plan === "object", "Plan block is present");
  assert(report.execution && typeof report.execution === "object", "Execution block is present");
  assert(report.summary && typeof report.summary === "object", "Summary block is present");
  assert(report.integrity && typeof report.integrity === "object", "Integrity block is present");

  assert(Array.isArray(report.plan.steps), "Plan steps are an array");
  assert(Array.isArray(report.execution.steps), "Execution steps are an array");
  assert(report.plan.expectedSteps >= 1, "Expected step count is set");

  const payload = {
    metadata: report.metadata,
    plan: report.plan,
    execution: report.execution,
    summary: report.summary,
  };
  const computedHash = sha256(JSON.stringify(payload));

  assert(report.integrity.algorithm === "sha256", "Integrity algorithm is sha256");
  assert(typeof report.integrity.hash === "string" && report.integrity.hash.length === 64, "Integrity hash shape is valid");
  assert(computedHash === report.integrity.hash, "Integrity hash matches payload (tamper check passed)");

  const finishedAt = new Date(report.metadata.finishedAt).getTime();
  assert(Number.isFinite(finishedAt), "finishedAt timestamp is valid");

  const ageMinutes = (Date.now() - finishedAt) / 60000;
  assert(ageMinutes <= maxAgeMinutes, `Report freshness is within ${maxAgeMinutes} minutes (${ageMinutes.toFixed(2)} min)`);

  assert(report.execution.steps.length <= report.plan.expectedSteps, "Executed step count does not exceed planned steps");

  if (report.metadata.failFast) {
    assert(report.execution.steps.length >= 1, "Fail-fast mode executed at least one step");
  } else {
    assert(report.execution.steps.length === report.plan.expectedSteps, "Non-fail-fast mode executed all planned steps");
  }

  const derivedPassed = report.execution.steps.filter((s) => s.status === "passed").length;
  const derivedFailed = report.execution.steps.filter((s) => s.status === "failed").length;
  const derivedSkipped = report.execution.steps.filter((s) => s.status === "skipped-dry-run").length;
  const derivedExecuted = report.execution.steps.filter((s) => s.status !== "skipped-dry-run").length;

  assert(derivedPassed === report.summary.passed, "Summary passed count is accurate");
  assert(derivedFailed === report.summary.failed, "Summary failed count is accurate");
  assert(derivedSkipped === report.summary.skipped, "Summary skipped count is accurate");
  assert(derivedExecuted === report.summary.executed, "Summary executed count is accurate");

  const expectedCoverage = report.plan.expectedSteps === 0
    ? 100
    : Number(((report.execution.steps.length / report.plan.expectedSteps) * 100).toFixed(2));
  assert(expectedCoverage === report.summary.coveragePct, "Coverage percentage is accurate");

  const expectedPassRate = derivedExecuted === 0 ? 100 : Number(((derivedPassed / derivedExecuted) * 100).toFixed(2));
  assert(expectedPassRate === report.summary.passRatePct, "Pass-rate percentage is accurate");

  if (requireSuccess) {
    assert(report.execution.success === true, "Execution success flag is true");
    assert(derivedFailed === 0, "No failed steps recorded");
  }

  const checksumPath = path.join(path.dirname(reportPath), "aggressive-dev-report.sha256");
  if (fs.existsSync(checksumPath)) {
    const checksumRaw = fs.readFileSync(checksumPath, "utf8").trim();
    const checksumHash = checksumRaw.split(/\s+/)[0];
    assert(checksumHash === report.integrity.hash, "Checksum file matches report integrity hash");
  }

  const averageStepMs = derivedExecuted === 0
    ? 0
    : Math.round((report.summary.totalStepDurationMs || 0) / Math.max(1, derivedExecuted));

  const planningScore = report.summary.coveragePct >= 100 ? 30 : Math.max(0, Math.round((report.summary.coveragePct / 100) * 30));
  const integrityScore = computedHash === report.integrity.hash ? 30 : 0;
  const functionalityScore = report.summary.passRatePct >= 100 ? 30 : Math.max(0, Math.round((report.summary.passRatePct / 100) * 30));
  const optimizationScore = averageStepMs <= 240000 ? 10 : Math.max(0, 10 - Math.ceil((averageStepMs - 240000) / 60000));
  const excellenceScore = planningScore + integrityScore + functionalityScore + optimizationScore;

  process.stdout.write("\n📊 Excellence scoring\n");
  process.stdout.write(`- Planning score: ${planningScore}/30\n`);
  process.stdout.write(`- Integrity score: ${integrityScore}/30\n`);
  process.stdout.write(`- Functionality score: ${functionalityScore}/30\n`);
  process.stdout.write(`- Optimization score: ${optimizationScore}/10\n`);
  process.stdout.write(`- Average executed step time: ${averageStepMs} ms\n`);
  process.stdout.write(`- Overall excellence score: ${excellenceScore}/100\n`);

  assert(excellenceScore >= minScore, `Excellence score meets threshold (${excellenceScore} >= ${minScore})`);

  process.stdout.write("\n🏁 Verification complete: report is cryptographically intact and operationally consistent.\n");
}

main();
