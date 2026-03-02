#!/usr/bin/env node

const { spawnSync } = require("node:child_process");

const npmExecPath = process.env.npm_execpath;
const nodeExecPath = process.execPath;
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

function runStep(label, args) {
  process.stdout.write(`\n==> ${label}\n`);
  const command = npmExecPath ? nodeExecPath : npmCmd;
  const commandArgs = npmExecPath ? [npmExecPath, ...args] : args;
  const result = spawnSync(command, commandArgs, { stdio: "inherit" });
  if (result.error) {
    process.stderr.write(`${result.error.message}\n`);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function hasBash() {
  const result = spawnSync("bash", ["--version"], { stdio: "ignore" });
  if (result.error) {
    return false;
  }
  return result.status === 0;
}

function shouldUseChangedLinkCheck() {
  const eventName = String(process.env.GITHUB_EVENT_NAME || "").toLowerCase();
  const ci = String(process.env.CI || "").toLowerCase() === "true";
  return ci && eventName === "pull_request";
}

runStep("Clean workspace", ["run", "clean"]);

if (hasBash()) {
  runStep("Deploy checks", ["run", "pipeline:deploy-checks"]);
} else {
  process.stdout.write(
    "\n==> Skipping deploy checks: bash is not available on this machine.\n",
  );
}

runStep("Quality checks", ["run", "pipeline:quality"]);

if (String(process.env.SKIP_PRECHECK_LINKS || "").toLowerCase() !== "true") {
  if (shouldUseChangedLinkCheck()) {
    runStep("Internal link checks (changed scope)", ["run", "check:links:changed"]);
  } else {
    runStep("Internal link checks", ["run", "check:links"]);
  }
} else {
  process.stdout.write("\n==> Skipping internal link checks: precheck step already executed.\n");
}

runStep("Build", ["run", "build"]);
