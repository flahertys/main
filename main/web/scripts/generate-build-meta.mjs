import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function safeGitSha() {
  try {
    return execSync("git rev-parse --verify HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

const commitSha =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GIT_COMMIT_SHA ||
  safeGitSha();

const payload = {
  commitSha,
  shortSha: commitSha === "unknown" ? "unknown" : commitSha.slice(0, 12),
  generatedAt: new Date().toISOString(),
  buildSource: process.env.VERCEL === "1" ? "vercel" : "local",
  branch: process.env.VERCEL_GIT_COMMIT_REF || process.env.GIT_BRANCH || null,
};

const outputFile = resolve(__dirname, "../public/__build.json");
mkdirSync(dirname(outputFile), { recursive: true });
writeFileSync(outputFile, JSON.stringify(payload, null, 2) + "\n", "utf8");

console.log(`[build-meta] wrote ${outputFile}`);
console.log(`[build-meta] commit: ${payload.shortSha}`);

