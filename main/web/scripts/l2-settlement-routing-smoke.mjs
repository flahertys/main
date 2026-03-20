#!/usr/bin/env node
import http from 'node:http';

function parseArgs(argv) {
  const flags = new Set(argv.slice(2));
  return {
    selfTest: flags.has('--self-test'),
  };
}

function isRetryableStatus(statusCode) {
  return statusCode === 429 || statusCode >= 500;
}

function normalizeMode(mode) {
  const value = String(mode || 'auto').toLowerCase();
  return value === 'local' || value === 'cloud' ? value : 'auto';
}

function endpointOrder(mode, localUrl, cloudUrl) {
  if (mode === 'local') return [localUrl].filter(Boolean);
  if (mode === 'cloud') return [cloudUrl].filter(Boolean);
  return [localUrl, cloudUrl].filter(Boolean);
}

async function postJson(url, payload, timeoutMs, apiKey) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await response.text();
    let body = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      body = { raw: text };
    }

    return {
      ok: response.ok,
      statusCode: response.status,
      body,
    };
  } catch (error) {
    if (error?.name === 'AbortError') {
      return {
        ok: false,
        statusCode: 408,
        body: { message: `timeout after ${timeoutMs}ms` },
      };
    }

    return {
      ok: false,
      statusCode: 503,
      body: { message: error?.message || 'network error' },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function runFallbackCheck(name, mode, localUrl, cloudUrl, timeoutMs, apiKey, payload) {
  const attempts = [];
  const ordered = endpointOrder(mode, localUrl, cloudUrl);

  if (!ordered.length) {
    return {
      ok: false,
      attempts,
      message: `${name}: no endpoint configured`,
    };
  }

  for (const endpoint of ordered) {
    const result = await postJson(endpoint, payload, timeoutMs, apiKey);
    attempts.push({ endpoint, ...result });

    if (result.ok) {
      return {
        ok: true,
        attempts,
        message: `${name}: reachable via ${endpoint}`,
      };
    }

    if (!isRetryableStatus(result.statusCode)) {
      return {
        ok: false,
        attempts,
        message: `${name}: fatal ${result.statusCode} at ${endpoint}`,
      };
    }
  }

  const last = attempts[attempts.length - 1];
  return {
    ok: false,
    attempts,
    message: `${name}: fallback exhausted (last ${last?.statusCode || 'unknown'})`,
  };
}

function printResult(title, result) {
  console.log(`\n[${title}] ${result.ok ? 'PASS' : 'FAIL'} - ${result.message}`);
  for (const attempt of result.attempts) {
    console.log(`  -> ${attempt.endpoint} | status=${attempt.statusCode} | ok=${attempt.ok}`);
  }
}

async function startMockServer(handler) {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

async function runSelfTest() {
  const localSequencer = await startMockServer((req, res) => {
    res.writeHead(503, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ message: 'local sequencer unavailable' }));
  });

  const cloudSequencer = await startMockServer((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ sequencerOrderId: 'SEQ-MOCK', estimatedLatency: 120 }));
  });

  const localRelayer = await startMockServer((req, res) => {
    res.writeHead(503, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ message: 'local relayer unavailable' }));
  });

  const cloudRelayer = await startMockServer((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ transactionHash: '0xabc', status: 'pending' }));
  });

  try {
    const sequencer = await runFallbackCheck(
      'sequencer(auto)',
      'auto',
      `${localSequencer.url}/sequencer/order`,
      `${cloudSequencer.url}/sequencer/order`,
      2000,
      '',
      { request: { order: { market: 'BTC-USD', side: 'BUY_YES', size: 1, price: 100 } } },
    );

    const relayer = await runFallbackCheck(
      'relayer(auto)',
      'auto',
      `${localRelayer.url}/relayer/batch`,
      `${cloudRelayer.url}/relayer/batch`,
      2000,
      '',
      { sequencerOrderIds: ['SEQ-MOCK'] },
    );

    printResult('SelfTest Sequencer', sequencer);
    printResult('SelfTest Relayer', relayer);

    const ok = sequencer.ok && relayer.ok;
    if (!ok) process.exitCode = 1;
    return;
  } finally {
    await localSequencer.close();
    await cloudSequencer.close();
    await localRelayer.close();
    await cloudRelayer.close();
  }
}

async function runLiveCheck() {
  const mode = normalizeMode(process.env.SETTLEMENT_L2_MODE || 'auto');
  const timeoutMs = Number(process.env.SETTLEMENT_L2_TIMEOUT_MS || 5000);
  const apiKey = process.env.SETTLEMENT_L2_API_KEY || '';

  const sequencer = await runFallbackCheck(
    `sequencer(${mode})`,
    mode,
    process.env.SETTLEMENT_L2_SEQUENCER_LOCAL_URL || '',
    process.env.SETTLEMENT_L2_SEQUENCER_CLOUD_URL || '',
    timeoutMs,
    apiKey,
    { request: { order: { market: 'BTC-USD', side: 'BUY_YES', size: 1, price: 100 } } },
  );

  const relayer = await runFallbackCheck(
    `relayer(${mode})`,
    mode,
    process.env.SETTLEMENT_L2_RELAYER_LOCAL_URL || '',
    process.env.SETTLEMENT_L2_RELAYER_CLOUD_URL || '',
    timeoutMs,
    apiKey,
    { sequencerOrderIds: ['SEQ-SMOKE'] },
  );

  printResult('Live Sequencer', sequencer);
  printResult('Live Relayer', relayer);

  if (!(sequencer.ok && relayer.ok)) {
    process.exitCode = 1;
  }
}

const args = parseArgs(process.argv);

if (args.selfTest) {
  await runSelfTest();
} else {
  await runLiveCheck();
}

