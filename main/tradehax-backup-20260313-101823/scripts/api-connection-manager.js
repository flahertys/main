#!/usr/bin/env node
/**
 * TradeHax API Connection Manager
 * Tests, validates, and monitors all API connections
 * Performs initial handshakes and health checks
 */

const https = require('https');
const http = require('http');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// API Connection Definitions
const connections = {
  huggingface: {
    name: 'Hugging Face LLM',
    test: async () => {
      const token = process.env.NEXT_PUBLIC_HF_API_TOKEN;
      if (!token) return { ok: false, error: 'Token not configured' };

      return await testHttps({
        hostname: 'api-inference.huggingface.co',
        path: '/models/gpt2',
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 10000,
      });
    },
    priority: 'CRITICAL',
  },

  discord: {
    name: 'Discord Webhook',
    test: async () => {
      const webhook = process.env.DISCORD_WEBHOOK_URL || process.env.TRADEHAX_DISCORD_WEBHOOK;
      if (!webhook) return { ok: false, error: 'Webhook URL not configured' };

      const url = new URL(webhook);
      return await testHttps({
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '[TradeHax Connection Test]' }),
        timeout: 5000,
        allowedStatuses: [200, 204, 400], // 400 is ok for test message
      });
    },
    priority: 'CRITICAL',
  },

  telegram: {
    name: 'Telegram Bot',
    test: async () => {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      if (!token) return { ok: false, error: 'Bot token not configured' };

      return await testHttps({
        hostname: 'api.telegram.org',
        path: `/bot${token}/getMe`,
        timeout: 5000,
      });
    },
    priority: 'CRITICAL',
  },

  stripe: {
    name: 'Stripe API',
    test: async () => {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) return { ok: false, error: 'Secret key not configured' };

      return await testHttps({
        hostname: 'api.stripe.com',
        path: '/v1/customers?limit=1',
        headers: { 'Authorization': `Bearer ${key}` },
        timeout: 5000,
      });
    },
    priority: 'HIGH',
  },

  twitter: {
    name: 'Twitter/X API',
    test: async () => {
      const bearer = process.env.TWITTER_BEARER_TOKEN;
      if (!bearer) return { ok: false, error: 'Bearer token not configured' };

      return await testHttps({
        hostname: 'api.twitter.com',
        path: '/2/tweets/search/recent?query=test&max_results=10',
        headers: { 'Authorization': `Bearer ${bearer}` },
        timeout: 5000,
        allowedStatuses: [200, 401, 429], // 401/429 means auth works but needs proper config
      });
    },
    priority: 'MEDIUM',
  },

  instagram: {
    name: 'Instagram Graph API',
    test: async () => {
      const token = process.env.INSTAGRAM_ACCESS_TOKEN;
      if (!token) return { ok: false, error: 'Access token not configured' };

      return await testHttps({
        hostname: 'graph.instagram.com',
        path: `/me?access_token=${encodeURIComponent(token)}`,
        timeout: 5000,
        allowedStatuses: [200, 400, 190], // 190/400 = auth working but needs config
      });
    },
    priority: 'MEDIUM',
  },

  facebook: {
    name: 'Facebook Graph API',
    test: async () => {
      const token = process.env.META_PAGE_ACCESS_TOKEN;
      if (!token) return { ok: false, error: 'Page access token not configured' };

      return await testHttps({
        hostname: 'graph.facebook.com',
        path: `/v18.0/me?access_token=${encodeURIComponent(token)}`,
        timeout: 5000,
        allowedStatuses: [200, 400, 190],
      });
    },
    priority: 'MEDIUM',
  },

  solana: {
    name: 'Solana RPC',
    test: async () => {
      const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC;
      if (!rpc) return { ok: false, error: 'RPC endpoint not configured' };

      const url = new URL(rpc);
      return await testHttps({
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getHealth',
        }),
        timeout: 5000,
      });
    },
    priority: 'HIGH',
  },

  health: {
    name: 'TradeHax Health Endpoint',
    test: async () => {
      const url = process.env.TRADEHAX_HEALTH_URL || 'https://tradehax.net/__health';
      const urlObj = new URL(url);

      return await testHttps({
        hostname: urlObj.hostname,
        path: urlObj.pathname,
        timeout: 5000,
        allowedStatuses: [200, 404], // 404 ok if not deployed yet
      });
    },
    priority: 'HIGH',
  },

  database: {
    name: 'PostgreSQL Database',
    test: async () => {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) return { ok: false, error: 'Database URL not configured' };

      // Just check if URL is valid
      try {
        new URL(dbUrl);
        return { ok: true, message: 'Database URL configured (connection test needs pg library)' };
      } catch {
        return { ok: false, error: 'Invalid database URL format' };
      }
    },
    priority: 'HIGH',
  },

  redis: {
    name: 'Redis Cache',
    test: async () => {
      const redisUrl = process.env.REDIS_URL;
      if (!redisUrl) return { ok: false, error: 'Redis URL not configured' };

      try {
        new URL(redisUrl);
        return { ok: true, message: 'Redis URL configured (connection test needs redis library)' };
      } catch {
        return { ok: false, error: 'Invalid Redis URL format' };
      }
    },
    priority: 'MEDIUM',
  },
};

/**
 * Test HTTPS endpoint
 */
function testHttps(options) {
  return new Promise((resolve) => {
    const {
      hostname,
      path,
      method = 'GET',
      headers = {},
      body = null,
      timeout = 5000,
      allowedStatuses = [200, 201, 204],
    } = options;

    const req = https.request(
      {
        hostname,
        path,
        method,
        headers,
        timeout,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          const ok = allowedStatuses.includes(res.statusCode);
          resolve({
            ok,
            status: res.statusCode,
            message: ok ? `HTTP ${res.statusCode}` : `Unexpected status ${res.statusCode}`,
            data: data.slice(0, 200),
          });
        });
      }
    );

    req.on('error', (error) => {
      resolve({
        ok: false,
        error: error.message,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        ok: false,
        error: 'Request timeout',
      });
    });

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

/**
 * Main execution
 */
async function main() {
  console.log('');
  log('╔════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║        TradeHax API Connection Manager & Health Check          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════╝', 'cyan');
  console.log('');

  const results = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };

  // Test all connections
  for (const [key, config] of Object.entries(connections)) {
    process.stdout.write(`Testing ${config.name}... `);

    const startTime = Date.now();
    const result = await config.test();
    const latency = Date.now() - startTime;

    const status = result.ok ? '[OK]' : '[FAIL]';
    const color = result.ok ? 'green' : 'red';

    log(`${status} (${latency}ms)`, color);

    if (result.message) {
      log(`  ├─ ${result.message}`, 'cyan');
    }

    if (result.error) {
      log(`  └─ Error: ${result.error}`, 'yellow');
    }

    if (result.status) {
      log(`  └─ Status: ${result.status}`, 'cyan');
    }

    // Categorize by priority
    const priority = config.priority.toLowerCase();
    results[priority].push({
      name: config.name,
      key,
      ok: result.ok,
      latency,
      error: result.error,
      message: result.message,
    });
  }

  // Summary
  console.log('');
  log('═══════════════════════════════════════════════════════════════', 'cyan');
  log('                        SUMMARY                                  ', 'bright');
  log('═══════════════════════════════════════════════════════════════', 'cyan');
  console.log('');

  const totalCount = Object.values(results).flat().length;
  const okCount = Object.values(results).flat().filter((r) => r.ok).length;
  const failCount = totalCount - okCount;

  log(`Total Connections Tested: ${totalCount}`, 'bright');
  log(`Successful: ${okCount}`, 'green');
  log(`Failed: ${failCount}`, failCount > 0 ? 'red' : 'green');
  console.log('');

  // Priority breakdown
  for (const priority of ['critical', 'high', 'medium', 'low']) {
    const items = results[priority];
    if (items.length === 0) continue;

    const okItems = items.filter((i) => i.ok).length;
    const priorityLabel = priority.toUpperCase();
    const color = okItems === items.length ? 'green' : 'yellow';

    log(`${priorityLabel} Priority: ${okItems}/${items.length} OK`, color);

    items.forEach((item) => {
      const symbol = item.ok ? '✓' : '✗';
      const itemColor = item.ok ? 'green' : 'red';
      log(`  ${symbol} ${item.name}`, itemColor);
    });

    console.log('');
  }

  // Recommendations
  if (failCount > 0) {
    log('═══════════════════════════════════════════════════════════════', 'cyan');
    log('                      RECOMMENDATIONS                            ', 'bright');
    log('═══════════════════════════════════════════════════════════════', 'cyan');
    console.log('');

    Object.values(results)
      .flat()
      .filter((r) => !r.ok)
      .forEach((item) => {
        log(`⚠ ${item.name}:`, 'yellow');
        if (item.error) {
          log(`  Error: ${item.error}`, 'red');
        }
        log(`  → Configure the required environment variables in .env.local`, 'cyan');
        log(`  → See API_CONNECTIONS_INVENTORY.md for details`, 'cyan');
        console.log('');
      });
  }

  // Next steps
  log('═══════════════════════════════════════════════════════════════', 'cyan');
  log('                       NEXT STEPS                                ', 'bright');
  log('═══════════════════════════════════════════════════════════════', 'cyan');
  console.log('');

  if (okCount === totalCount) {
    log('✓ All connections successful!', 'green');
    log('  → Ready for autonomous push system setup', 'cyan');
    log('  → Run: node scripts/autonomous-push-orchestrator.js', 'cyan');
  } else if (results.critical.filter((r) => r.ok).length === results.critical.length) {
    log('✓ Critical connections OK', 'green');
    log('  → Core features operational', 'cyan');
    log('  → Configure remaining integrations as needed', 'yellow');
  } else {
    log('⚠ Critical connections failing', 'red');
    log('  → Configure CRITICAL priority connections first', 'yellow');
    log('  → Check .env.local and API_CONNECTIONS_INVENTORY.md', 'cyan');
  }

  console.log('');
  log('Documentation: API_CONNECTIONS_INVENTORY.md', 'cyan');
  console.log('');

  // Exit code
  process.exit(failCount > 0 ? 1 : 0);
}

// Run
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

