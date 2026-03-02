#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const appDir = path.join(projectRoot, "app");
const scanRoots = [path.join(projectRoot, "app"), path.join(projectRoot, "components")];
const exts = new Set([".ts", ".tsx", ".js", ".jsx", ".md", ".mdx"]);

function parseArgs(argv) {
  const args = {
    strict: false,
    changed: false,
    baseRef: "",
    reportPath: "",
    sarifPath: "",
  };

  for (const raw of argv) {
    const token = String(raw || "").trim();
    if (!token) continue;
    if (token === "--strict") {
      args.strict = true;
      continue;
    }
    if (token === "--changed") {
      args.changed = true;
      continue;
    }
    if (token.startsWith("--base=")) {
      args.baseRef = token.slice("--base=".length).trim() || args.baseRef;
      continue;
    }
    if (token.startsWith("--report=")) {
      args.reportPath = token.slice("--report=".length).trim();
      continue;
    }
    if (token.startsWith("--sarif=")) {
      args.sarifPath = token.slice("--sarif=".length).trim();
    }
  }

  return args;
}

const options = parseArgs(process.argv.slice(2));
const isStrict = options.strict;
const isChangedMode = options.changed;
const baseRef = options.baseRef;

function toPosix(inputPath) {
  return String(inputPath || "").replace(/\\/g, "/");
}

function countLine(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
      walk(full, acc);
      continue;
    }
    if (exts.has(path.extname(entry.name))) acc.push(full);
  }
  return acc;
}

function toRouteFromPage(filePath) {
  const rel = path.relative(appDir, filePath).replace(/\\/g, "/");
  const parts = rel.split("/");
  if (parts[parts.length - 1] !== "page.tsx" && parts[parts.length - 1] !== "page.ts") return null;

  const segments = parts.slice(0, -1).filter((segment) => {
    if (!segment) return false;
    if (segment.startsWith("(")) return false; // route groups
    return true;
  });

  if (segments.length === 0) return "/";
  return `/${segments.join("/")}`;
}

function routePatternToRegex(route) {
  const escaped = route
    .split("/")
    .map((segment) => {
      if (!segment) return "";
      if (segment.startsWith("[") && segment.endsWith("]")) {
        if (segment.startsWith("[[...") || segment.startsWith("[...")) return ".+";
        return "[^/]+";
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");

  return new RegExp(`^${escaped === "" ? "/" : escaped}/?$`);
}

function extractHrefCandidates(content) {
  const matches = [];
  const regex = /href\s*=\s*(?:"([^"]+)"|'([^']+)')/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    const href = m[1] || m[2] || "";
    if (href) {
      matches.push({
        href: href.trim(),
        index: m.index,
        line: countLine(content, m.index),
      });
    }
  }
  return matches;
}

function extractMarkdownLinkCandidates(content) {
  const matches = [];
  const regex = /\[[^\]]+\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    const href = m[1] || "";
    if (href) {
      matches.push({
        href: href.trim(),
        index: m.index,
        line: countLine(content, m.index),
        source: "markdown",
      });
    }
  }
  return matches;
}

function extractAnchorIdCandidates(content) {
  const ids = new Set();
  const regex = /\bid\s*=\s*(?:"([^"]+)"|'([^']+)'|\{"([^"]+)"\}|\{'([^']+)'\})/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    const value = (m[1] || m[2] || m[3] || m[4] || "").trim();
    if (value) ids.add(value);
  }
  return ids;
}

function normalizeAnchor(raw) {
  if (!raw) return "";
  const value = raw.startsWith("#") ? raw.slice(1) : raw;
  if (!value) return "";
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
}

function splitHref(href) {
  const hashIndex = href.indexOf("#");
  if (hashIndex < 0) {
    return {
      pathname: normalizePathname(href),
      hash: "",
    };
  }

  const left = href.slice(0, hashIndex);
  const right = href.slice(hashIndex + 1);
  return {
    pathname: normalizePathname(left || "/"),
    hash: normalizeAnchor(right),
  };
}

function normalizePathname(href) {
  const pathOnly = href.split("#")[0].split("?")[0] || "/";
  return pathOnly.endsWith("/") && pathOnly !== "/" ? pathOnly.slice(0, -1) : pathOnly;
}

function shouldSkipHref(href) {
  if (!href) return true;
  if (href.startsWith("http://") || href.startsWith("https://")) return true;
  if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("sms:")) return true;
  if (href.startsWith("javascript:")) return true;
  if (!href.startsWith("/") && !href.startsWith("#")) return true;
  return false;
}

function isMarkdownFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ext === ".md" || ext === ".mdx";
}

function collectRoutes() {
  const appFiles = walk(appDir, []);
  const routeToFile = new Map();
  const routes = [];

  for (const file of appFiles) {
    const route = toRouteFromPage(file);
    if (!route) continue;
    routes.push(route);
    routeToFile.set(route, file);
  }

  // API and metadata links are valid internal paths even without page.tsx
  routes.push("/api");

  return {
    routes: Array.from(new Set(routes)),
    routeToFile,
  };
}

function getChangedWorkspaceFiles(ref) {
  const result = spawnSync("git", ["diff", "--name-only", "--diff-filter=ACMRTUXB", `${ref}...HEAD`], {
    cwd: projectRoot,
    encoding: "utf8",
  });

  if (result.error || result.status !== 0) {
    return {
      ok: false,
      files: [],
      reason: result.error ? result.error.message : (result.stderr || "git diff failed").trim(),
    };
  }

  const files = String(result.stdout || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((rel) => path.resolve(projectRoot, rel));

  return {
    ok: true,
    files,
    reason: "",
  };
}

function gitRefExists(ref) {
  if (!ref) return false;
  const result = spawnSync("git", ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`], {
    cwd: projectRoot,
    stdio: "ignore",
  });
  return result.status === 0;
}

function resolveBaseRef(explicitBaseRef) {
  const candidates = [];
  const userBase = String(explicitBaseRef || "").trim();
  if (userBase) {
    candidates.push(userBase);
  }

  const githubBaseRef = String(process.env.GITHUB_BASE_REF || "").trim();
  if (githubBaseRef) {
    candidates.push(`origin/${githubBaseRef}`);
    candidates.push(githubBaseRef);
  }

  candidates.push("origin/main", "main", "origin/master", "master");

  const unique = Array.from(new Set(candidates.filter(Boolean)));
  for (const candidate of unique) {
    if (gitRefExists(candidate)) {
      return {
        ok: true,
        ref: candidate,
        reason: "",
      };
    }
  }

  return {
    ok: false,
    ref: "",
    reason: `No valid base ref found among: ${unique.join(", ")}`,
  };
}

function isScannableSourceFile(filePath) {
  const ext = path.extname(filePath);
  if (!exts.has(ext)) return false;
  const normalized = toPosix(filePath);
  return scanRoots.some((root) => normalized.startsWith(toPosix(root)));
}

function encodeAnnotationValue(value) {
  return String(value || "")
    .replace(/%/g, "%25")
    .replace(/\r/g, "%0D")
    .replace(/\n/g, "%0A")
    .replace(/:/g, "%3A")
    .replace(/,/g, "%2C");
}

function emitGithubAnnotation(entry, summary) {
  if (String(process.env.GITHUB_ACTIONS || "").toLowerCase() !== "true") return;
  const relPath = toPosix(path.relative(projectRoot, entry.filePath));
  const line = Number.isFinite(entry.line) ? entry.line : 1;
  const title = entry.type === "broken-link" ? "Broken internal link" : "Missing anchor target";
  const message = `${summary} -> ${entry.href}`;
  console.error(
    `::error file=${encodeAnnotationValue(relPath)},line=${line},title=${encodeAnnotationValue(title)}::${encodeAnnotationValue(message)}`,
  );
}

function writeJsonReport(reportPath, report) {
  if (!reportPath) return;
  const absolute = path.isAbsolute(reportPath) ? reportPath : path.resolve(projectRoot, reportPath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, JSON.stringify(report, null, 2));
  console.log(`🧾 Link audit report written: ${path.relative(projectRoot, absolute)}`);
}

function writeSarifReport(sarifPath, report) {
  if (!sarifPath) return;
  const absolute = path.isAbsolute(sarifPath) ? sarifPath : path.resolve(projectRoot, sarifPath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });

  const sarif = {
    version: "2.1.0",
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [
      {
        tool: {
          driver: {
            name: "tradehax-link-audit",
            informationUri: "https://github.com/DarkModder33/main",
            rules: [
              {
                id: "broken-internal-link",
                name: "Broken Internal Link",
                shortDescription: { text: "Internal link points to a missing route/path." },
                defaultConfiguration: { level: "error" },
              },
              {
                id: "missing-anchor-target",
                name: "Missing Anchor Target",
                shortDescription: { text: "Anchor link points to an id that does not exist." },
                defaultConfiguration: { level: "error" },
              },
            ],
          },
        },
        results: [
          ...report.brokenLinks.map((item) => ({
            ruleId: "broken-internal-link",
            level: "error",
            message: {
              text: `Broken internal link '${item.href}' in ${item.filePath}`,
            },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: {
                    uri: item.filePath,
                  },
                  region: {
                    startLine: Math.max(1, Number(item.line) || 1),
                  },
                },
              },
            ],
          })),
          ...report.missingAnchors.map((item) => ({
            ruleId: "missing-anchor-target",
            level: "error",
            message: {
              text: `Missing anchor target '#${item.hash}' for link '${item.href}' in ${item.filePath}`,
            },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: {
                    uri: item.filePath,
                  },
                  region: {
                    startLine: Math.max(1, Number(item.line) || 1),
                  },
                },
              },
            ],
          })),
        ],
      },
    ],
  };

  fs.writeFileSync(absolute, JSON.stringify(sarif, null, 2));
  console.log(`🧾 SARIF report written: ${path.relative(projectRoot, absolute)}`);
}

function validateInternalLinks() {
  const { routes, routeToFile } = collectRoutes();
  const routePatterns = routes.map((route) => ({ route, re: routePatternToRegex(route) }));

  const allFiles = scanRoots.flatMap((root) => walk(root, []));
  let files = allFiles;
  let changedFallbackReason = "";
  let resolvedBaseRef = baseRef;

  if (isChangedMode) {
    const baseResolution = resolveBaseRef(baseRef);
    if (!baseResolution.ok) {
      changedFallbackReason = `Changed-files scan unavailable (${baseResolution.reason}); used full scan.`;
    } else {
      resolvedBaseRef = baseResolution.ref;
      const changed = getChangedWorkspaceFiles(resolvedBaseRef);
      if (changed.ok) {
        const changedScannable = changed.files.filter((filePath) => isScannableSourceFile(filePath) && fs.existsSync(filePath));
        if (changedScannable.length > 0) {
          files = changedScannable;
        } else {
          changedFallbackReason = "No changed scannable source files detected; used full scan.";
        }
      } else {
        changedFallbackReason = `Changed-files scan unavailable (${changed.reason}); used full scan.`;
      }
    }
  }

  const broken = [];
  const missingAnchors = [];

  const fileAnchorIndex = new Map();
  const globalAnchors = new Set();
  for (const filePath of allFiles) {
    const raw = fs.readFileSync(filePath, "utf8");
    const ids = extractAnchorIdCandidates(raw);
    fileAnchorIndex.set(filePath, ids);
    for (const id of ids) globalAnchors.add(id);
  }

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, "utf8");
    const hrefs = [
      ...extractHrefCandidates(raw),
      ...(isMarkdownFile(filePath) ? extractMarkdownLinkCandidates(raw) : []),
    ];
    for (const hrefEntry of hrefs) {
      const href = hrefEntry.href;
      if (shouldSkipHref(href)) continue;

      const isMarkdownRelative = href.startsWith("./") || href.startsWith("../");
      if (isMarkdownRelative && isMarkdownFile(filePath)) {
        const rawWithoutHash = href.split("#")[0].split("?")[0];
        const candidatePath = path.resolve(path.dirname(filePath), rawWithoutHash);
        if (!fs.existsSync(candidatePath)) {
          broken.push({
            type: "broken-link",
            filePath,
            href,
            pathname: rawWithoutHash,
            line: hrefEntry.line,
          });
        }
        continue;
      }

      const { pathname, hash } = splitHref(href);

      if (href.startsWith("#")) {
        const ids = fileAnchorIndex.get(filePath) || new Set();
        if (hash && !ids.has(hash)) {
          missingAnchors.push({
            type: "missing-anchor",
            filePath,
            href,
            pathname: "(same-file)",
            hash,
            line: hrefEntry.line,
          });
        }
        continue;
      }

      // Allow API namespace and static assets
      if (pathname.startsWith("/api/") || pathname.startsWith("/_next/") || pathname.startsWith("/public/")) {
        continue;
      }

      const exists = routePatterns.some(({ re }) => re.test(pathname));
      if (!exists) {
        broken.push({ type: "broken-link", filePath, href, pathname, line: hrefEntry.line });
        continue;
      }

      if (hash) {
        const routeFile = routeToFile.get(pathname);
        if (routeFile) {
          const ids = fileAnchorIndex.get(routeFile) || new Set();
          const existsInTargetRoute = ids.has(hash);
          const existsGlobally = globalAnchors.has(hash);
          if (!existsInTargetRoute && !(existsGlobally && !isStrict)) {
            missingAnchors.push({
              type: "missing-anchor",
              filePath,
              href,
              pathname,
              hash,
              line: hrefEntry.line,
            });
          }
        }
      }
    }
  }

  const report = {
    ok: broken.length === 0 && missingAnchors.length === 0,
    generatedAt: new Date().toISOString(),
    mode: isStrict ? "strict" : "standard",
    changedMode: isChangedMode,
    baseRef: isChangedMode ? resolvedBaseRef : null,
    changedFallbackReason: changedFallbackReason || null,
    scannedFiles: files.length,
    indexedRoutes: routes.length,
    totals: {
      brokenLinks: broken.length,
      missingAnchors: missingAnchors.length,
    },
    brokenLinks: broken.map((item) => ({
      filePath: toPosix(path.relative(projectRoot, item.filePath)),
      href: item.href,
      pathname: item.pathname,
      line: item.line,
    })),
    missingAnchors: missingAnchors.map((item) => ({
      filePath: toPosix(path.relative(projectRoot, item.filePath)),
      href: item.href,
      pathname: item.pathname,
      hash: item.hash,
      line: item.line,
    })),
  };

  writeJsonReport(options.reportPath, report);
  writeSarifReport(options.sarifPath, report);

  if (broken.length > 0 || missingAnchors.length > 0) {
    console.error("\n❌ Internal link validation failed. Broken links found:\n");
    for (const item of broken.slice(0, 120)) {
      console.error(`- ${path.relative(projectRoot, item.filePath)} -> ${item.href}`);
      emitGithubAnnotation(item, "Broken internal link");
    }

    if (missingAnchors.length > 0) {
      console.error("\n❌ Missing anchor targets found:\n");
      for (const item of missingAnchors.slice(0, 120)) {
        console.error(`- ${path.relative(projectRoot, item.filePath)} -> ${item.href} (missing #${item.hash})`);
        emitGithubAnnotation(item, `Missing anchor target #${item.hash}`);
      }
    }

    console.error(`\nTotal broken links: ${broken.length}`);
    console.error(`Total missing anchors: ${missingAnchors.length}`);
    process.exit(1);
  }

  const mode = isStrict ? "strict" : "standard";
  if (changedFallbackReason) {
    console.log(`ℹ️ ${changedFallbackReason}`);
  }
  console.log(`✅ Internal link validation passed (${files.length} files scanned, ${routes.length} routes indexed, anchors verified, mode=${mode}${isChangedMode ? `, changed-base=${resolvedBaseRef}` : ""}).`);
}

validateInternalLinks();
