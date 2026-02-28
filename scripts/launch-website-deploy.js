#!/usr/bin/env node

const { spawnSync } = require("node:child_process");

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  console.log(`
TradeHax Website Deploy Launcher

Usage:
  node ./scripts/launch-website-deploy.js [options]

Options:
  --skip-local-checks   Skip local deploy readiness checks
  --no-watch            Do not wait/watch GitHub Actions run
  --dry-run             Print actions only, do not execute
  --help, -h            Show help

What this does:
  1) Runs local deploy-readiness checks
  2) Triggers GitHub Actions workflow: namecheap-vps-deploy.yml
  3) Watches the workflow run until it completes
`);
  process.exit(0);
}

const dryRun = args.has("--dry-run");
const skipLocalChecks = args.has("--skip-local-checks");
const noWatch = args.has("--no-watch");

const npmExecPath = process.env.npm_execpath;
const nodeExecPath = process.execPath;
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const ghCmd = process.platform === "win32" ? "gh.exe" : "gh";

function run(label, command, commandArgs, options = {}) {
  console.log(`\n==> ${label}`);
  console.log(`${command} ${commandArgs.join(" ")}`);

  if (dryRun) {
    return { status: 0, stdout: "", stderr: "" };
  }

  const result = spawnSync(command, commandArgs, {
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: "utf8",
    ...options,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    if (options.capture) {
      if (result.stdout) process.stdout.write(result.stdout);
      if (result.stderr) process.stderr.write(result.stderr);
    }
    process.exit(result.status || 1);
  }

  return result;
}

function runNpm(label, npmArgs) {
  if (npmExecPath) {
    return run(label, nodeExecPath, [npmExecPath, ...npmArgs]);
  }
  return run(label, npmCmd, npmArgs);
}

function ensureGhAuth() {
  run("Verify GitHub CLI authentication", ghCmd, ["auth", "status"]);
}

function triggerWorkflow() {
  run("Trigger Namecheap deploy workflow", ghCmd, [
    "workflow",
    "run",
    "namecheap-vps-deploy.yml",
    "--ref",
    "main",
  ]);
}

function getLatestRunId() {
  const result = run(
    "Fetch latest deploy workflow run id",
    ghCmd,
    [
      "run",
      "list",
      "--workflow",
      "namecheap-vps-deploy.yml",
      "--branch",
      "main",
      "--limit",
      "1",
      "--json",
      "databaseId,status,conclusion,displayTitle,headSha,createdAt",
    ],
    { capture: true },
  );

  const output = String(result.stdout || "").trim();
  let parsed;
  try {
    parsed = JSON.parse(output);
  } catch {
    console.error("Unable to parse workflow run list output.");
    process.exit(1);
  }

  if (!Array.isArray(parsed) || parsed.length === 0 || !parsed[0].databaseId) {
    console.error("No workflow run found after dispatch.");
    process.exit(1);
  }

  const runInfo = parsed[0];
  console.log(
    `Latest run: #${runInfo.databaseId} (${runInfo.status}${runInfo.conclusion ? `/${runInfo.conclusion}` : ""})`,
  );

  return String(runInfo.databaseId);
}

function watchRun(runId) {
  run("Watch deploy workflow run", ghCmd, ["run", "watch", runId]);
}

function showRunDetails(runId) {
  run("Show deploy workflow run details", ghCmd, [
    "run",
    "view",
    runId,
    "--web",
  ]);
}

(function main() {
  console.log("\n🚀 TradeHax Website Deploy Launcher");

  if (!skipLocalChecks) {
    runNpm("Run deploy readiness checks", ["run", "ide:sync:deploy-ready"]);
  } else {
    console.log("\n⚠️ Skipping local checks (--skip-local-checks).");
  }

  ensureGhAuth();
  triggerWorkflow();

  if (dryRun) {
    console.log("\nℹ️ Dry run enabled; skipping workflow run lookup/watch/details.");
    console.log("\n✅ Deploy launch automation complete (dry run).");
    return;
  }

  const runId = getLatestRunId();

  if (!noWatch) {
    watchRun(runId);
  } else {
    console.log("\nℹ️ Skipping run watch (--no-watch).");
  }

  showRunDetails(runId);

  console.log("\n✅ Deploy launch automation complete.");
})();
