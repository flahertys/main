#!/usr/bin/env node

const { spawnSync } = require("node:child_process");

const args = new Set(process.argv.slice(2));
const isPreview = args.has("--preview");
const isProd = !isPreview;
const skipPreflight = args.has("--skip-preflight");
const skipBuild = args.has("--skip-build");
const skipSocialCheck = args.has("--skip-social-check");
const dryRun = args.has("--dry-run");
const strictSocialCheck = args.has("--strict-social-check");

const npmExecPath = process.env.npm_execpath;
const nodeExecPath = process.execPath;
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

function run(label, command, commandArgs) {
  process.stdout.write(`\n==> ${label}\n`);
  const result = spawnSync(command, commandArgs, { stdio: "inherit" });
  if (result.error) {
    process.stderr.write(`${result.error.message}\n`);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function runNpm(label, npmArgs) {
  if (npmExecPath) {
    run(label, nodeExecPath, [npmExecPath, ...npmArgs]);
    return;
  }
  run(label, npmCmd, npmArgs);
}

function runDeploy() {
  const deployArgs = ["exec", "--yes", "vercel@latest", "--"];
  if (isProd) {
    deployArgs.push("--prod");
  }
  deployArgs.push("--yes");

  const token = process.env.VERCEL_TOKEN;
  if (token) {
    deployArgs.push("--token", token);
  }

  if (npmExecPath) {
    run(
      isProd ? "Deploy to Vercel production" : "Deploy to Vercel preview",
      nodeExecPath,
      [npmExecPath, ...deployArgs],
    );
    return;
  }

  run(
    isProd ? "Deploy to Vercel production" : "Deploy to Vercel preview",
    npmCmd,
    deployArgs,
  );
}

(function main() {
  process.stdout.write("\nTradeHax One-Button Deploy\n");
  process.stdout.write(`Target: ${isProd ? "production" : "preview"}\n`);

  if (!skipPreflight) {
    runNpm("Deployment preflight", ["run", "pipeline:deploy-checks"]);
  }

  if (!skipSocialCheck) {
    runNpm(
      "Social API environment check",
      strictSocialCheck
        ? ["run", "social:check", "--", "--strict"]
        : ["run", "social:check"],
    );
  }

  runNpm("Quality checks", ["run", "pipeline:quality"]);

  if (!skipBuild) {
    runNpm("Production build", ["run", "deploy:build"]);
  }

  if (dryRun) {
    process.stdout.write("\nℹ️  Dry run enabled. Skipping Vercel deployment call.\n");
  } else {
    runDeploy();
  }

  process.stdout.write("\n✅ One-button deploy completed.\n");
})();
