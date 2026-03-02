#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const appDir = path.join(projectRoot, "app");
const scanRoots = [path.join(projectRoot, "app"), path.join(projectRoot, "components")];
const exts = new Set([".ts", ".tsx", ".js", ".jsx", ".md", ".mdx"]);
const isStrict = process.argv.includes("--strict");

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
    if (href) matches.push(href.trim());
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

function validateInternalLinks() {
  const { routes, routeToFile } = collectRoutes();
  const routePatterns = routes.map((route) => ({ route, re: routePatternToRegex(route) }));

  const files = scanRoots.flatMap((root) => walk(root, []));
  const broken = [];
  const missingAnchors = [];

  const fileAnchorIndex = new Map();
  const globalAnchors = new Set();
  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, "utf8");
    const ids = extractAnchorIdCandidates(raw);
    fileAnchorIndex.set(filePath, ids);
    for (const id of ids) globalAnchors.add(id);
  }

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, "utf8");
    const hrefs = extractHrefCandidates(raw);
    for (const href of hrefs) {
      if (shouldSkipHref(href)) continue;
      const { pathname, hash } = splitHref(href);

      if (href.startsWith("#")) {
        const ids = fileAnchorIndex.get(filePath) || new Set();
        if (hash && !ids.has(hash)) {
          missingAnchors.push({
            filePath,
            href,
            pathname: "(same-file)",
            hash,
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
        broken.push({ filePath, href, pathname });
        continue;
      }

      if (hash) {
        const routeFile = routeToFile.get(pathname);
        if (routeFile) {
          const ids = fileAnchorIndex.get(routeFile) || new Set();
          const existsInTargetRoute = ids.has(hash);
          const existsGlobally = globalAnchors.has(hash);
          if (!existsInTargetRoute && !(existsGlobally && !isStrict)) {
            missingAnchors.push({ filePath, href, pathname, hash });
          }
        }
      }
    }
  }

  if (broken.length > 0 || missingAnchors.length > 0) {
    console.error("\n❌ Internal link validation failed. Broken links found:\n");
    for (const item of broken.slice(0, 120)) {
      console.error(`- ${path.relative(projectRoot, item.filePath)} -> ${item.href}`);
    }

    if (missingAnchors.length > 0) {
      console.error("\n❌ Missing anchor targets found:\n");
      for (const item of missingAnchors.slice(0, 120)) {
        console.error(`- ${path.relative(projectRoot, item.filePath)} -> ${item.href} (missing #${item.hash})`);
      }
    }

    console.error(`\nTotal broken links: ${broken.length}`);
    console.error(`Total missing anchors: ${missingAnchors.length}`);
    process.exit(1);
  }

  const mode = isStrict ? "strict" : "standard";
  console.log(`✅ Internal link validation passed (${files.length} files scanned, ${routes.length} routes indexed, anchors verified, mode=${mode}).`);
}

validateInternalLinks();
