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
const strictDnsCheck = args.has("--strict-dns");

const npmExecPath = process.env.npm_execpath;
const nodeExecPath = process.execPath;
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

function resolveVercelScope() {
  const explicitScope = String(process.env.VERCEL_SCOPE || process.env.VERCEL_TEAM_SLUG || "").trim();
  return explicitScope;
}

function run(label, command, commandArgs) {
  process.stdout.write(`\n==> ${label}\n`);
  const result = spawnSync(command, commandArgs, {
    stdio: "inherit",
    shell: process.platform === "win32" && (command === "npm" || command === "npm.cmd"),
  });
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
  run(label, "npm", npmArgs);
}

function runDeploy() {
  const baseDeployArgs = ["exec", "--yes", "vercel@latest", "--"];
  const vercelScope = resolveVercelScope();
  if (isProd) {
    baseDeployArgs.push("--prod");
  }
  baseDeployArgs.push("--yes");

  const token = process.env.VERCEL_TOKEN;
  if (token) {
    baseDeployArgs.push("--token", token);
  }

  const attemptArgs = vercelScope
    ? [
      [...baseDeployArgs, "--scope", vercelScope],
      [...baseDeployArgs],
    ]
    : [[...baseDeployArgs]];

  for (let attempt = 0; attempt < attemptArgs.length; attempt += 1) {
    const argsForAttempt = attemptArgs[attempt];
    const attemptLabel = attempt === 0
      ? (isProd ? "Deploy to Vercel production" : "Deploy to Vercel preview")
      : `${isProd ? "Deploy to Vercel production" : "Deploy to Vercel preview"} (retry without scope)`;

    process.stdout.write(`\n==> ${attemptLabel}\n`);

    const result = npmExecPath
      ? spawnSync(nodeExecPath, [npmExecPath, ...argsForAttempt], {
        stdio: "inherit",
        shell: process.platform === "win32",
      })
      : spawnSync(npmCmd, argsForAttempt, {
        stdio: "inherit",
        shell: process.platform === "win32",
      });

    if (result.error) {
      process.stderr.write(`${result.error.message}\n`);
      process.exit(1);
    }

    if (result.status === 0) {
      return;
    }

    const hasRetry = attempt < attemptArgs.length - 1;
    if (hasRetry) {
      process.stdout.write("\n⚠️ Deploy attempt failed with configured scope. Retrying without scope...\n");
      continue;
    }

    process.exit(result.status || 1);
  }
}

(function main() {
  process.stdout.write("\nTradeHax One-Button Deploy\n");
  process.stdout.write(`Target: ${isProd ? "production" : "preview"}\n`);
  process.stdout.write(`Vercel scope: ${resolveVercelScope() || "<none>"}\n`);
  if (strictDnsCheck) {
    process.stdout.write("DNS mode: STRICT apex A record required\n");
  }

  if (!skipPreflight) {
    runNpm(
      "Deployment preflight",
      strictDnsCheck
        ? ["run", "pipeline:deploy-checks", "--", "--require-dns-a-record"]
        : ["run", "pipeline:deploy-checks"],
    );
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
