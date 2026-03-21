#!/usr/bin/env node

/**
 * Dual-Domain Vercel Deployment Verification Script
 * Verifies the TradeHax project across multiple domains
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const DEPLOYMENT_CONFIGS = [
  {
    domain: "tradehax.net",
    envFile: ".env.local.net",
    supabaseUrl: "https://lgatuhmejegzfaucufjt.supabase.co",
    description: "Primary TradeHax domain",
  },
  {
    domain: "tradehaxai.tech",
    envFile: ".env.local.tech",
    supabaseUrl: "https://epqvhafqrykvohbiiyhv.supabase.co",
    description: "Secondary AI-focused domain",
  },
  {
    domain: "tradehaxai.me",
    envFile: ".env.local.me",
    supabaseUrl: "https://lgatuhmejegzfaucufjt.supabase.co",
    description: "Tertiary short domain",
  },
];

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function header(title) {
  console.log("\n" + "═".repeat(60));
  log(colors.cyan + colors.bright, `  ${title}`);
  console.log("═".repeat(60));
}

function checkmark(message) {
  log(colors.green, `✓ ${message}`);
}

function warning(message) {
  log(colors.yellow, `⚠ ${message}`);
}

function error(message) {
  log(colors.red, `✗ ${message}`);
}

function section(message) {
  log(colors.blue, `\n→ ${message}`);
}

async function verifyEnvironmentFiles() {
  header("Environment File Verification");
  let allValid = true;

  for (const config of DEPLOYMENT_CONFIGS) {
    const envPath = path.join(process.cwd(), config.envFile);
    const exists = fs.existsSync(envPath);
    if (exists) {
      checkmark(`${config.domain}: ${config.envFile} found`);
    } else {
      warning(`${config.domain}: ${config.envFile} not found`);
      allValid = false;
    }
  }
  return allValid;
}

async function verifyBuildArtifacts() {
  header("Build Artifacts Verification");
  const requiredFiles = [
    "dist/index.html",
    "dist/assets",
    "public/__health",
    ".vercel/project.json",
  ];

  let allValid = true;
  for (const file of requiredFiles) {
    const fullPath = path.join(process.cwd(), file);
    const exists = fs.existsSync(fullPath);
    if (exists) {
      checkmark(file);
    } else {
      error(`${file} - MISSING`);
      allValid = false;
    }
  }
  return allValid;
}

async function verifyDependencies() {
  header("Dependency Verification");
  const requiredPackages = [
    "@ai-sdk/xai",
    "@ai-sdk/openai",
    "@supabase/supabase-js",
    "ai",
    "react",
    "react-dom",
  ];

  const packageJsonPath = path.join(process.cwd(), "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  let allValid = true;
  for (const pkg of requiredPackages) {
    if (allDeps[pkg]) {
      checkmark(`${pkg}@${allDeps[pkg]}`);
    } else {
      error(`${pkg} - NOT INSTALLED`);
      allValid = false;
    }
  }
  return allValid;
}

async function verifyEnvironmentVariables() {
  header("Environment Variables Verification");
  const requiredEnvVars = [
    "XAI_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "VITE_SUPABASE_ANON_KEY",
  ];

  let allValid = true;
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      checkmark(`${envVar}: configured`);
    } else {
      error(`${envVar}: NOT SET`);
      allValid = false;
    }
  }
  return allValid;
}

async function verifyVercelProject() {
  header("Vercel Project Verification");
  const projectJsonPath = path.join(process.cwd(), ".vercel/project.json");

  if (!fs.existsSync(projectJsonPath)) {
    error("Vercel project.json not found");
    return false;
  }

  try {
    const projectConfig = JSON.parse(fs.readFileSync(projectJsonPath, "utf-8"));
    checkmark(`Project ID: ${projectConfig.projectId}`);
    checkmark(`Project Name: ${projectConfig.projectName}`);
    checkmark(`Domains: ${projectConfig.domains.join(", ")}`);
    return true;
  } catch (err) {
    error(`Failed to parse project.json`);
    return false;
  }
}

async function verifyIntegrations() {
  header("Integrations Verification");
  const checks = [
    { name: "Grok-4 API", file: "api/ai/grok.ts" },
    { name: "Multi-Domain Supabase", file: "api/lib/supabase-multi-domain.ts" },
    { name: "Health Check Endpoint", file: "api/health-grok-supabase.ts" },
    { name: "Grok Test Script", file: "grok-test.mjs" },
  ];

  let allValid = true;
  for (const check of checks) {
    const fullPath = path.join(process.cwd(), check.file);
    if (fs.existsSync(fullPath)) {
      checkmark(check.name);
    } else {
      error(`${check.name} - NOT FOUND`);
      allValid = false;
    }
  }
  return allValid;
}

async function runSmokeTest() {
  header("Running Smoke Test");
  try {
    section("Building project...");
    execSync("npm run release:check", {
      stdio: "inherit",
      cwd: process.cwd(),
    });
    checkmark("Release check passed");
    return true;
  } catch (err) {
    error("Release check failed");
    return false;
  }
}

async function generateDeploymentReport(results) {
  header("Deployment Readiness Report");
  const passedChecks = Object.values(results).filter((v) => v).length;
  const totalChecks = Object.keys(results).length;
  const percentage = Math.round((passedChecks / totalChecks) * 100);

  console.log(`\nPassed: ${passedChecks}/${totalChecks} checks (${percentage}%)\n`);

  const status =
    percentage === 100
      ? "🟢 READY FOR DEPLOYMENT"
      : percentage >= 80
        ? "🟡 READY WITH WARNINGS"
        : "🔴 NOT READY";

  log(colors.bright, status);

  if (percentage === 100) {
    section("You can now deploy with:");
    log(colors.green, "  npm run deploy");
    log(colors.green, "  npm run deploy:net");
    log(colors.green, "  npm run deploy:tech");
  } else {
    section("Please fix the following issues before deploying");
  }
}

async function main() {
  log(colors.cyan + colors.bright, "\n🚀 TradeHax Dual-Domain Deployment Verification\n");

  const results = {};
  results["Environment Files"] = await verifyEnvironmentFiles();
  results["Build Artifacts"] = await verifyBuildArtifacts();
  results["Dependencies"] = await verifyDependencies();
  results["Environment Variables"] = await verifyEnvironmentVariables();
  results["Vercel Project"] = await verifyVercelProject();
  results["Integrations"] = await verifyIntegrations();
  results["Smoke Test"] = await runSmokeTest();

  await generateDeploymentReport(results);

  const allPassed = Object.values(results).every((v) => v);
  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  error(`Fatal error: ${err.message}`);
  process.exit(1);
});







