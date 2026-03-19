const args = process.argv.slice(2);

function getArg(name) {
  const index = args.findIndex((item) => item === `--${name}`);
  if (index === -1) return undefined;
  return args[index + 1];
}

const baseUrlRaw = getArg("url") || process.env.VERIFY_URL || process.env.DEPLOY_URL || process.env.SITE_URL;
const expectedCommitRaw = getArg("expected-commit") || process.env.EXPECTED_COMMIT_SHA;
const timeoutMs = Number(getArg("timeout-ms") || process.env.VERIFY_TIMEOUT_MS || 15000);

if (!baseUrlRaw) {
  console.error("[verify] missing URL. Pass --url https://your-domain or set VERIFY_URL.");
  process.exit(2);
}

const baseUrl = baseUrlRaw.startsWith("http://") || baseUrlRaw.startsWith("https://")
  ? baseUrlRaw
  : `https://${baseUrlRaw}`;

const expectedCommit = expectedCommitRaw ? expectedCommitRaw.trim().toLowerCase() : null;

function normalizePath(assetPath) {
  if (assetPath.startsWith("http://") || assetPath.startsWith("https://")) {
    return assetPath;
  }
  if (assetPath.startsWith("/")) {
    return `${baseUrl}${assetPath}`;
  }
  return `${baseUrl}/${assetPath}`;
}

function extractAssets(html) {
  const pattern = /(?:src|href)=["']([^"']+\.(?:js|css))(?:\?[^"']*)?["']/gi;
  const matches = new Set();
  let match;
  while ((match = pattern.exec(html)) !== null) {
    matches.add(match[1]);
  }
  return [...matches];
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function headerValue(headers, key) {
  return headers.get(key) || "<missing>";
}

function commitMatches(actual, expected) {
  if (!actual || !expected) return false;
  const actualLower = String(actual).toLowerCase();
  return actualLower === expected || actualLower.startsWith(expected) || expected.startsWith(actualLower);
}

const failures = [];
const warnings = [];

console.log(`[verify] target: ${baseUrl}`);

const homeResponse = await fetchWithTimeout(`${baseUrl}/`);
if (!homeResponse.ok) {
  failures.push(`GET / returned ${homeResponse.status}`);
}

const homeCacheControl = headerValue(homeResponse.headers, "cache-control");
const homeVercelCache = headerValue(homeResponse.headers, "x-vercel-cache");
const homeVercelId = headerValue(homeResponse.headers, "x-vercel-id");

console.log(`[verify] / cache-control: ${homeCacheControl}`);
console.log(`[verify] / x-vercel-cache: ${homeVercelCache}`);
console.log(`[verify] / x-vercel-id: ${homeVercelId}`);

if (/immutable/i.test(homeCacheControl)) {
  failures.push("HTML response appears immutable; expected revalidating/no-cache policy for index HTML.");
}
if (!/(no-cache|no-store|max-age=0)/i.test(homeCacheControl)) {
  warnings.push("HTML cache-control does not clearly force revalidation (recommended: no-cache or max-age=0).");
}

let html = "";
try {
  html = await homeResponse.text();
} catch {
  failures.push("Could not read HTML response body from /. ");
}

const assets = extractAssets(html).slice(0, 12);
if (assets.length === 0) {
  warnings.push("No JS/CSS assets found in HTML. This can happen on non-SPA responses or redirects.");
}

for (const asset of assets) {
  const assetUrl = normalizePath(asset);
  const assetResponse = await fetchWithTimeout(assetUrl, { method: "HEAD" });
  const cacheControl = headerValue(assetResponse.headers, "cache-control");
  const etag = headerValue(assetResponse.headers, "etag");
  const vercelCache = headerValue(assetResponse.headers, "x-vercel-cache");

  console.log(`[verify] asset ${asset} -> ${assetResponse.status}`);
  console.log(`         cache-control=${cacheControl}; etag=${etag}; x-vercel-cache=${vercelCache}`);

  if (!assetResponse.ok) {
    failures.push(`Asset ${asset} returned ${assetResponse.status}`);
    continue;
  }

  if (!/immutable/i.test(cacheControl)) {
    warnings.push(`Asset ${asset} is not immutable-cached; expected long-lived hashed cache policy.`);
  }
}

let buildMeta = null;
try {
  const buildMetaResponse = await fetchWithTimeout(`${baseUrl}/__build.json`);
  if (buildMetaResponse.ok) {
    buildMeta = await buildMetaResponse.json();
    console.log(`[verify] __build.json commit: ${buildMeta.commitSha || "<missing>"}`);
    console.log(`[verify] __build.json generatedAt: ${buildMeta.generatedAt || "<missing>"}`);
    console.log(`[verify] __build.json cache-control: ${headerValue(buildMetaResponse.headers, "cache-control")}`);
  } else {
    warnings.push(`GET /__build.json returned ${buildMetaResponse.status}`);
  }
} catch (error) {
  warnings.push(`Could not fetch /__build.json (${error?.message || "unknown error"})`);
}

if (expectedCommit) {
  if (!buildMeta?.commitSha) {
    failures.push("Expected commit was provided, but /__build.json did not provide commitSha.");
  } else if (!commitMatches(buildMeta.commitSha, expectedCommit)) {
    failures.push(`Commit mismatch: expected ${expectedCommit}, got ${buildMeta.commitSha}`);
  }
}

if (warnings.length) {
  console.log("[verify] warnings:");
  for (const warning of warnings) {
    console.log(`  - ${warning}`);
  }
}

if (failures.length) {
  console.error("[verify] failures:");
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log("[verify] deployment bundle check passed.");

