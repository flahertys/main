import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registryPath = path.join(root, 'oss-components.json');

function fail(message) {
  console.error(`[license-audit] ERROR: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(registryPath)) {
  fail(`Missing ${registryPath}`);
}

const raw = fs.readFileSync(registryPath, 'utf8');
const cfg = JSON.parse(raw);
const allowed = new Set(cfg?.policy?.allowedLicenses || []);
const components = cfg?.components || [];

if (!allowed.size) {
  fail('No allowed licenses configured');
}

if (!components.length) {
  fail('No OSS components found in registry');
}

const violations = [];
for (const c of components) {
  if (!allowed.has(c.license)) {
    violations.push(`${c.name} (${c.license})`);
  }
}

if (violations.length) {
  console.error('[license-audit] Disallowed licenses detected:');
  for (const v of violations) {
    console.error(` - ${v}`);
  }
  process.exit(2);
}

console.log(`[license-audit] PASS: ${components.length} components checked.`);
console.log(`[license-audit] Allowed: ${Array.from(allowed).join(', ')}`);

