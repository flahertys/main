#!/usr/bin/env node
/**
 * Automated .env Filling Script
 * Scans .env.example and .env.local, prompts for missing keys, and updates .env.local
 */
const fs = require('fs');
const readline = require('readline');
const path = require('path');

const examplePath = path.resolve(__dirname, '../.env.example');
const localPath = path.resolve(__dirname, '../.env.local');

function parseEnv(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) env[match[1]] = match[2];
  }
  return env;
}

async function promptMissingKeys(missing) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const filled = {};
  for (const key of missing) {
    filled[key] = await new Promise(res => rl.question(`Enter value for ${key}: `, res));
  }
  rl.close();
  return filled;
}

async function main() {
  const exampleEnv = parseEnv(examplePath);
  const localEnv = fs.existsSync(localPath) ? parseEnv(localPath) : {};
  const missingKeys = Object.keys(exampleEnv).filter(k => !(k in localEnv));
  if (missingKeys.length === 0) {
    console.log('✅ All .env keys are present.');
    return;
  }
  console.log('⚠️ Missing keys:', missingKeys);
  const filled = await promptMissingKeys(missingKeys);
  const newLines = Object.entries(filled).map(([k, v]) => `${k}=${v}`);
  fs.appendFileSync(localPath, '\n' + newLines.join('\n'));
  console.log('✅ .env.local updated.');
}

main();

