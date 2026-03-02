#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const defaultReportPath = path.resolve(projectRoot, ".artifacts", "link-audit-report.json");
const reportPathArg = process.argv.find((arg) => arg.startsWith("--report="));
const reportPath = reportPathArg
  ? path.resolve(projectRoot, reportPathArg.slice("--report=".length))
  : defaultReportPath;

const MARKER = "<!-- tradehax-link-audit -->";

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function buildSummaryMarkdown(report) {
  if (!report) {
    return `${MARKER}\n## 🔗 Link Audit\n\nNo report file was found at \`${path.relative(projectRoot, reportPath)}\`.`;
  }

  const broken = Number(report?.totals?.brokenLinks || 0);
  const missingAnchors = Number(report?.totals?.missingAnchors || 0);
  const status = report?.ok ? "✅ Passed" : "❌ Failed";
  const mode = report?.mode || "standard";
  const changedMode = report?.changedMode ? "changed-scope" : "full-scope";
  const generatedAt = report?.generatedAt || "unknown";

  const lines = [
    MARKER,
    "## 🔗 Link Audit",
    "",
    `**Status:** ${status}`,
    `**Mode:** ${mode} (${changedMode})`,
    `**Scanned files:** ${report?.scannedFiles ?? "n/a"}`,
    `**Indexed routes:** ${report?.indexedRoutes ?? "n/a"}`,
    `**Broken links:** ${broken}`,
    `**Missing anchors:** ${missingAnchors}`,
    `**Generated:** ${generatedAt}`,
  ];

  if (report?.baseRef) {
    lines.push(`**Base ref:** ${report.baseRef}`);
  }

  if (report?.changedFallbackReason) {
    lines.push(`**Changed-scope fallback:** ${report.changedFallbackReason}`);
  }

  const topIssues = [];
  for (const item of report?.brokenLinks || []) {
    topIssues.push(`- \`${item.filePath}:${item.line || 1}\` → \`${item.href}\``);
    if (topIssues.length >= 8) break;
  }
  for (const item of report?.missingAnchors || []) {
    topIssues.push(`- \`${item.filePath}:${item.line || 1}\` missing anchor \`#${item.hash}\` for \`${item.href}\``);
    if (topIssues.length >= 12) break;
  }

  if (topIssues.length > 0) {
    lines.push("", "### Top findings", "", ...topIssues);
  }

  return lines.join("\n");
}

async function githubRequest(url, token, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API ${response.status}: ${text}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function upsertPullRequestComment(markdown) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  const eventPath = process.env.GITHUB_EVENT_PATH;

  if (!token || !repo || !eventPath || !fs.existsSync(eventPath)) {
    return { ok: false, reason: "Missing GitHub runtime context; skipped PR comment." };
  }

  const event = readJson(eventPath);
  const prNumber = event?.pull_request?.number;
  if (!prNumber) {
    return { ok: false, reason: "No pull_request number in event payload; skipped PR comment." };
  }

  const [owner, name] = repo.split("/");
  if (!owner || !name) {
    return { ok: false, reason: "Invalid GITHUB_REPOSITORY; skipped PR comment." };
  }

  const issueCommentsUrl = `https://api.github.com/repos/${owner}/${name}/issues/${prNumber}/comments`;
  const comments = await githubRequest(issueCommentsUrl, token, { method: "GET" });
  const existing = Array.isArray(comments)
    ? comments.find((comment) => typeof comment?.body === "string" && comment.body.includes(MARKER))
    : null;

  if (existing?.id) {
    const updateUrl = `https://api.github.com/repos/${owner}/${name}/issues/comments/${existing.id}`;
    await githubRequest(updateUrl, token, {
      method: "PATCH",
      body: JSON.stringify({ body: markdown }),
    });
    return { ok: true, reason: "Updated existing link-audit PR comment." };
  }

  await githubRequest(issueCommentsUrl, token, {
    method: "POST",
    body: JSON.stringify({ body: markdown }),
  });
  return { ok: true, reason: "Created new link-audit PR comment." };
}

async function main() {
  const report = readJson(reportPath);
  const markdown = buildSummaryMarkdown(report);

  const stepSummaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (stepSummaryPath) {
    fs.appendFileSync(stepSummaryPath, `${markdown}\n\n`);
  }

  const result = await upsertPullRequestComment(markdown).catch((error) => ({
    ok: false,
    reason: error instanceof Error ? error.message : String(error),
  }));

  console.log(result.reason);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
