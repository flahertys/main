#!/usr/bin/env node

const { spawnSync } = require("node:child_process");

const args = new Set(process.argv.slice(2));
const withInstall = args.has("--install");
const withBuild = args.has("--build");
const withNamecheapCheck = args.has("--namecheap");
const strictNamecheap = args.has("--strict-namecheap");
const npmExecPath = process.env.npm_execpath;
const nodeExecPath = process.execPath;

function run(command, commandArgs, opts = {}) {
  const result = spawnSync(command, commandArgs, {
    stdio: "inherit",
    shell: false,
    ...opts,
  });

  if (result.error) {
    throw result.error;
  }

  return result.status || 0;
}

function runPowershell(command) {
  const ps = process.platform === "win32" ? "powershell.exe" : "bash";
  const psArgs = process.platform === "win32"
    ? ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command]
    : ["-lc", command];

  const result = spawnSync(ps, psArgs, { encoding: "utf8" });
  if (result.error) return null;
  return {
    code: result.status || 0,
    out: String(result.stdout || "").trim(),
    err: String(result.stderr || "").trim(),
  };
}

function runNpmScript(scriptName, allowFailure = false) {
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const code = npmExecPath
    ? run(nodeExecPath, [npmExecPath, "run", scriptName])
    : run(npmCmd, ["run", scriptName]);
  if (code !== 0 && !allowFailure) {
    process.exit(code);
  }
  return code;
}

function printHeader(title) {
  process.stdout.write(`\n===============================================\n${title}\n===============================================\n`);
}

(function main() {
  printHeader("TradeHax IDE Sync Pipeline");

  process.stdout.write("Mode:\n");
  process.stdout.write(`- Install deps: ${withInstall ? "yes" : "no"}\n`);
  process.stdout.write(`- Build: ${withBuild ? "yes" : "no"}\n`);
  process.stdout.write(`- Namecheap check: ${withNamecheapCheck ? "yes" : "no"}\n`);
  process.stdout.write(`- Strict Namecheap: ${strictNamecheap ? "yes" : "no"}\n`);

  printHeader("Git Sync Status");
  run(process.platform === "win32" ? "git.exe" : "git", ["fetch", "origin"]);

  const sync = runPowershell("git rev-list --left-right --count HEAD...origin/main");
  if (sync && sync.code === 0 && sync.out) {
    const [ahead = "0", behind = "0"] = sync.out.split(/\s+/);
    process.stdout.write(`Ahead of origin/main: ${ahead}\n`);
    process.stdout.write(`Behind origin/main: ${behind}\n`);
    if (Number(behind) > 0) {
      process.stdout.write("⚠️ Your branch is behind origin/main. Pull before pushing from this machine.\n");
    }
  } else {
    process.stdout.write("ℹ️ Could not determine ahead/behind counts.\n");
  }

  if (withInstall) {
    printHeader("Dependencies");
    const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
    if (npmExecPath) {
      run(nodeExecPath, [npmExecPath, "ci"]);
    } else {
      run(npmCmd, ["ci"]);
    }
  }

  printHeader("Workspace Hygiene");
  runNpmScript("hooks:install", true);

  printHeader("Quality Gate");
  runNpmScript("lint");
  runNpmScript("type-check");

  if (withBuild) {
    printHeader("Build");
    runNpmScript("build");
  }

  if (withNamecheapCheck) {
    printHeader("Namecheap Deploy Check");
    const code = runNpmScript("deploy:namecheap:check", true);
    if (code !== 0 && strictNamecheap) {
      process.exit(code);
    }
  }

  printHeader("Completed");
  process.stdout.write("✅ IDE sync pipeline finished.\n");
})();
