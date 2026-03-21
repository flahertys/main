#!/usr/bin/env node

import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const webRoot = dirname(__dirname);

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {
    target: '',
    project: '',
    scope: '',
    profile: 'production',
    domain: '',
    envFile: '',
    allowlistFile: '',
    dryRun: true,
    replace: false,
    includeDocker: true,
  };

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);

    if (key === 'apply') {
      out.dryRun = false;
      continue;
    }
    if (key === 'dry-run') {
      out.dryRun = true;
      continue;
    }
    if (key === 'replace') {
      out.replace = true;
      continue;
    }
    if (key === 'no-docker') {
      out.includeDocker = false;
      continue;
    }

    const value = args[i + 1];
    if (typeof value === 'string' && !value.startsWith('--')) {
      out[key] = value;
      i += 1;
    }
  }

  return out;
}

function loadJson(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function parseEnvFile(filePath) {
  const env = {};
  if (!existsSync(filePath)) return env;

  const lines = readFileSync(filePath, 'utf-8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const normalized = trimmed.startsWith('export ') ? trimmed.slice(7) : trimmed;
    const eq = normalized.indexOf('=');
    if (eq < 1) continue;

    const key = normalized.slice(0, eq).trim();
    let value = normalized.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
}

function parseAllowlist(filePath) {
  const keys = new Set();
  const lines = readFileSync(filePath, 'utf-8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    keys.add(trimmed);
  }
  return keys;
}

function countIndent(line) {
  let n = 0;
  while (n < line.length && line[n] === ' ') n += 1;
  return n;
}

function resolveTemplate(raw, valueLookup) {
  if (typeof raw !== 'string') return '';
  return raw.replace(/\$\{([A-Z0-9_]+)(:-([^}]*))?\}/g, (_m, name, _g2, fallback) => {
    if (Object.prototype.hasOwnProperty.call(valueLookup, name) && String(valueLookup[name]).length > 0) {
      return String(valueLookup[name]);
    }
    if (typeof process.env[name] === 'string' && process.env[name].length > 0) {
      return String(process.env[name]);
    }
    return typeof fallback === 'string' ? fallback : '';
  });
}

function parseComposeEnvironment(composePath, valueLookup) {
  const result = {};
  if (!existsSync(composePath)) return result;

  const lines = readFileSync(composePath, 'utf-8').split(/\r?\n/);
  let inEnvironment = false;
  let envIndent = -1;

  for (const line of lines) {
    const trimmed = line.trim();
    const indent = countIndent(line);

    if (!inEnvironment && /^environment:\s*$/.test(trimmed)) {
      inEnvironment = true;
      envIndent = indent;
      continue;
    }

    if (inEnvironment) {
      if (!trimmed) continue;
      if (indent <= envIndent) {
        inEnvironment = false;
        envIndent = -1;
        continue;
      }

      const listMatch = line.match(/^\s*-\s*([A-Z0-9_]+)(?:=(.*))?\s*$/);
      if (listMatch) {
        const key = listMatch[1];
        const raw = (listMatch[2] || '').trim();
        if (raw) {
          result[key] = resolveTemplate(raw, valueLookup);
        }
        continue;
      }

      const mapMatch = line.match(/^\s*([A-Z0-9_]+)\s*:\s*(.*)\s*$/);
      if (mapMatch) {
        const key = mapMatch[1];
        const raw = (mapMatch[2] || '').trim();
        result[key] = resolveTemplate(raw, valueLookup);

        const refs = [...raw.matchAll(/\$\{([A-Z0-9_]+)(?::-[^}]*)?\}/g)];
        for (const ref of refs) {
          const refKey = ref[1];
          if (!Object.prototype.hasOwnProperty.call(result, refKey)) {
            const fallbackValue =
              Object.prototype.hasOwnProperty.call(valueLookup, refKey) ? valueLookup[refKey] : process.env[refKey] || '';
            if (fallbackValue) result[refKey] = String(fallbackValue);
          }
        }
      }
    }
  }

  return result;
}

function mergeObjects(...objects) {
  const out = {};
  for (const obj of objects) {
    for (const [k, v] of Object.entries(obj || {})) {
      if (typeof v === 'string' && v.length > 0) {
        out[k] = v;
      }
    }
  }
  return out;
}

function syncVarToVercel({ key, value, scope, project, replace }) {
  if (replace) {
    spawnSync('npx', ['vercel', 'env', 'rm', key, scope, '--yes', '--project', project], {
      stdio: 'ignore',
      shell: process.platform === 'win32',
    });
  }

  const cmd = spawnSync('npx', ['vercel', 'env', 'add', key, scope, '--yes', '--project', project], {
    input: `${value}\n`,
    encoding: 'utf-8',
    shell: process.platform === 'win32',
  });

  if (cmd.status !== 0) {
    const stderr = String(cmd.stderr || '').trim();
    const stdout = String(cmd.stdout || '').trim();
    throw new Error(stderr || stdout || `Failed to add ${key}`);
  }
}

function redactValue(value) {
  const str = String(value || '');
  if (str.length <= 4) return '****';
  return `${str.slice(0, 2)}****${str.slice(-2)}`;
}

function main() {
  const args = parseArgs();
  const configPath = resolve(__dirname, 'vercel-env-sync.config.json');
  const allowlistPath = args.allowlistFile
    ? resolve(webRoot, args.allowlistFile)
    : resolve(__dirname, 'vercel-env-allowlist.txt');

  const config = loadJson(configPath);
  const targetConfig = args.target ? config.targets?.[args.target] : null;

  const scope = args.scope || config.defaultScope || 'production';
  const project = args.project || targetConfig?.project || '';
  const domain = args.domain || targetConfig?.domain || args.target || '';

  if (!project) {
    console.error('[vercel-env-sync] Missing project. Use --project or configure target in vercel-env-sync.config.json');
    process.exit(1);
  }

  const allowlist = parseAllowlist(allowlistPath);
  const baseEnvFile = args.envFile
    ? resolve(webRoot, args.envFile)
    : resolve(webRoot, '.env.local');

  const profileBase = resolve(webRoot, '.env.profiles', `${args.profile}.env`);
  const profileDomain = domain ? resolve(webRoot, '.env.profiles', `${args.profile}.${domain}.env`) : '';

  const envFromLocal = parseEnvFile(baseEnvFile);
  const envFromProfile = mergeObjects(parseEnvFile(profileBase), parseEnvFile(profileDomain));
  const seedValues = mergeObjects(envFromProfile, envFromLocal);

  let envFromDocker = {};
  if (args.includeDocker) {
    for (const file of config.composeFiles || []) {
      const composePath = resolve(webRoot, file);
      envFromDocker = mergeObjects(envFromDocker, parseComposeEnvironment(composePath, seedValues));
    }
  }

  const merged = mergeObjects(envFromDocker, envFromProfile, envFromLocal);

  const selected = [];
  for (const key of allowlist) {
    const value = merged[key] || process.env[key] || '';
    if (typeof value === 'string' && value.length > 0) {
      selected.push({ key, value });
    }
  }

  console.log(`[vercel-env-sync] project=${project} scope=${scope} domain=${domain || 'n/a'} mode=${args.dryRun ? 'dry-run' : 'apply'}`);
  console.log(`[vercel-env-sync] allowlist=${allowlist.size} selected=${selected.length} includeDocker=${args.includeDocker}`);

  if (selected.length === 0) {
    console.log('[vercel-env-sync] No allowlisted variables found with values.');
    return;
  }

  for (const item of selected) {
    if (args.dryRun) {
      console.log(`[dry-run] ${item.key}=${redactValue(item.value)}`);
      continue;
    }

    try {
      syncVarToVercel({
        key: item.key,
        value: item.value,
        scope,
        project,
        replace: args.replace,
      });
      console.log(`[applied] ${item.key}`);
    } catch (err) {
      console.error(`[failed] ${item.key}: ${(err && err.message) || err}`);
    }
  }

  if (args.dryRun) {
    console.log('[vercel-env-sync] Dry run complete. Re-run with --apply to push values.');
  } else {
    console.log('[vercel-env-sync] Apply complete.');
  }
}

main();

