#!/usr/bin/env node
/**
 * TradeHax Autonomous Push Orchestrator
 * AI-driven content generation and multi-platform publishing
 * Intelligent scheduling and synchronous push capabilities
 */

const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

// Configuration
const CONFIG = {
  hfToken: process.env.NEXT_PUBLIC_HF_API_TOKEN,
  hfModel: process.env.HF_DEFAULT_MODEL || 'meta-llama/Llama-2-7b-chat-hf',
  discordWebhook: process.env.DISCORD_WEBHOOK_URL || process.env.TRADEHAX_DISCORD_WEBHOOK,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramChatId: process.env.TELEGRAM_CHAT_ID,
  twitterBearer: process.env.TWITTER_BEARER_TOKEN,
  healthUrl: process.env.TRADEHAX_HEALTH_URL || 'https://tradehax.net/__health',
};

// Color output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`${colors.cyan}[${timestamp}]${colors.reset} ${colors[color]}${message}${colors.reset}`);
}

/**
 * Generate AI content using HF
 */
async function generateAIContent(prompt, maxLength = 200) {
  if (!CONFIG.hfToken) {
    throw new Error('HF token not configured');
  }

  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      inputs: prompt,
      parameters: {
        max_length: maxLength,
        temperature: 0.7,
        top_p: 0.9,
      },
    });

    const req = https.request(
      {
        hostname: 'api-inference.huggingface.co',
        path: `/models/${CONFIG.hfModel}`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.hfToken}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 30000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.error) {
              reject(new Error(result.error));
            } else if (result[0]?.generated_text) {
              resolve(result[0].generated_text);
            } else {
              resolve(data);
            }
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('HF API timeout'));
    });

    req.write(body);
    req.end();
  });
}

/**
 * Push to Discord
 */
async function pushToDiscord(content) {
  if (!CONFIG.discordWebhook) {
    log('Discord webhook not configured, skipping', 'yellow');
    return { ok: false, reason: 'not_configured' };
  }

  const url = new URL(CONFIG.discordWebhook);

  return new Promise((resolve) => {
    const body = JSON.stringify({
      content: content.slice(0, 1900),
      username: 'TradeHax AI',
    });

    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 5000,
      },
      (res) => {
        const ok = res.statusCode >= 200 && res.statusCode < 300;
        resolve({ ok, status: res.statusCode });
      }
    );

    req.on('error', (error) => resolve({ ok: false, error: error.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'timeout' });
    });

    req.write(body);
    req.end();
  });
}

/**
 * Push to Telegram
 */
async function pushToTelegram(content) {
  if (!CONFIG.telegramBotToken || !CONFIG.telegramChatId) {
    log('Telegram not configured, skipping', 'yellow');
    return { ok: false, reason: 'not_configured' };
  }

  return new Promise((resolve) => {
    const body = JSON.stringify({
      chat_id: CONFIG.telegramChatId,
      text: content.slice(0, 4000),
      parse_mode: 'Markdown',
    });

    const req = https.request(
      {
        hostname: 'api.telegram.org',
        path: `/bot${CONFIG.telegramBotToken}/sendMessage`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 5000,
      },
      (res) => {
        const ok = res.statusCode >= 200 && res.statusCode < 300;
        resolve({ ok, status: res.statusCode });
      }
    );

    req.on('error', (error) => resolve({ ok: false, error: error.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'timeout' });
    });

    req.write(body);
    req.end();
  });
}

/**
 * Push to multiple platforms synchronously
 */
async function multiPlatformPush(content, platforms = ['discord', 'telegram']) {
  const results = {};

  for (const platform of platforms) {
    log(`Pushing to ${platform}...`, 'cyan');

    try {
      let result;
      if (platform === 'discord') {
        result = await pushToDiscord(content);
      } else if (platform === 'telegram') {
        result = await pushToTelegram(content);
      } else {
        result = { ok: false, reason: 'platform_not_supported' };
      }

      results[platform] = result;

      if (result.ok) {
        log(`  ✓ ${platform} push successful`, 'green');
      } else {
        log(`  ✗ ${platform} push failed: ${result.error || result.reason}`, 'red');
      }
    } catch (error) {
      log(`  ✗ ${platform} error: ${error.message}`, 'red');
      results[platform] = { ok: false, error: error.message };
    }

    // Rate limit protection (small delay between platforms)
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
}

/**
 * Generate market brief
 */
async function generateMarketBrief() {
  const prompt = `Generate a concise market update for crypto traders. Include:
- Current market sentiment
- Key support/resistance levels
- Trading opportunities
- Risk management advice

Keep it under 200 words and actionable.`;

  log('Generating AI market brief...', 'cyan');
  const content = await generateAIContent(prompt, 300);

  return `🚀 **TradeHax Market Brief**\n\n${content}\n\n_Generated by AI • ${new Date().toLocaleString()}_`;
}

/**
 * Generate trading signal
 */
async function generateTradingSignal(symbol = 'BTC/USD') {
  const prompt = `Generate a trading signal for ${symbol}. Include:
- Entry price recommendation
- Take profit targets
- Stop loss level
- Risk/reward ratio

Be specific and concise.`;

  log(`Generating trading signal for ${symbol}...`, 'cyan');
  const content = await generateAIContent(prompt, 250);

  return `📊 **Trading Signal: ${symbol}**\n\n${content}\n\n⚠️ _Not financial advice. DYOR._`;
}

/**
 * Generate daily watchlist
 */
async function generateDailyWatchlist() {
  const prompt = `Create a daily watchlist of 5 crypto assets to watch today. For each, provide:
- Asset name/ticker
- Why it's on the watchlist
- Key price level to watch

Keep it brief and actionable.`;

  log('Generating daily watchlist...', 'cyan');
  const content = await generateAIContent(prompt, 350);

  return `👀 **Daily Watchlist**\n\n${content}\n\n_Auto-generated • ${new Date().toLocaleDateString()}_`;
}

/**
 * Autonomous push cycle
 */
async function runAutonomousCycle() {
  log('═══════════════════════════════════════════════════════════════', 'magenta');
  log('         AUTONOMOUS PUSH ORCHESTRATOR - CYCLE START             ', 'bright');
  log('═══════════════════════════════════════════════════════════════', 'magenta');
  console.log('');

  const cycles = [
    {
      name: 'Market Brief',
      generator: generateMarketBrief,
      platforms: ['discord', 'telegram'],
    },
    {
      name: 'Trading Signal (BTC)',
      generator: () => generateTradingSignal('BTC/USD'),
      platforms: ['discord', 'telegram'],
    },
    {
      name: 'Daily Watchlist',
      generator: generateDailyWatchlist,
      platforms: ['discord'],
    },
  ];

  for (let i = 0; i < cycles.length; i++) {
    const cycle = cycles[i];

    log(`\nCycle ${i + 1}/${cycles.length}: ${cycle.name}`, 'bright');
    log('─'.repeat(60), 'cyan');

    try {
      // Generate content
      const content = await cycle.generator();

      log('Content generated:', 'green');
      log(content.substring(0, 150) + '...', 'cyan');
      console.log('');

      // Push to platforms
      const results = await multiPlatformPush(content, cycle.platforms);

      // Summary
      const successCount = Object.values(results).filter((r) => r.ok).length;
      const totalCount = Object.keys(results).length;

      log(`Push Results: ${successCount}/${totalCount} successful`, successCount === totalCount ? 'green' : 'yellow');

      // Wait between cycles
      if (i < cycles.length - 1) {
        log('Waiting 10 seconds before next cycle...', 'yellow');
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    } catch (error) {
      log(`Cycle failed: ${error.message}`, 'red');
    }
  }

  console.log('');
  log('═══════════════════════════════════════════════════════════════', 'magenta');
  log('         AUTONOMOUS PUSH ORCHESTRATOR - CYCLE COMPLETE          ', 'bright');
  log('═══════════════════════════════════════════════════════════════', 'magenta');
  console.log('');
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  console.log('');
  log('╔════════════════════════════════════════════════════════════════╗', 'magenta');
  log('║      TradeHax Autonomous Push Orchestrator (AI-Driven)        ║', 'magenta');
  log('╚════════════════════════════════════════════════════════════════╝', 'magenta');
  console.log('');

  // Check HF token
  if (!CONFIG.hfToken) {
    log('⚠️  HF token not configured!', 'red');
    log('Set NEXT_PUBLIC_HF_API_TOKEN in .env.local', 'yellow');
    log('Current token: hf_pdyLByADYtFFpUDxUvGcKpGCcMKNOIOY', 'cyan');
    console.log('');
    process.exit(1);
  }

  if (command === 'help' || command === '--help' || command === '-h') {
    log('Usage:', 'bright');
    log('  node scripts/autonomous-push-orchestrator.js <command>', 'cyan');
    console.log('');
    log('Commands:', 'bright');
    log('  brief      - Generate and push market brief', 'cyan');
    log('  signal     - Generate and push trading signal', 'cyan');
    log('  watchlist  - Generate and push daily watchlist', 'cyan');
    log('  cycle      - Run full autonomous cycle (all above)', 'cyan');
    log('  test       - Test AI generation without pushing', 'cyan');
    console.log('');
    process.exit(0);
  }

  try {
    if (command === 'brief') {
      const content = await generateMarketBrief();
      console.log(content);
      console.log('');
      log('Pushing to platforms...', 'cyan');
      const results = await multiPlatformPush(content);
      log(`Results: ${JSON.stringify(results, null, 2)}`, 'cyan');
    } else if (command === 'signal') {
      const symbol = args[1] || 'BTC/USD';
      const content = await generateTradingSignal(symbol);
      console.log(content);
      console.log('');
      log('Pushing to platforms...', 'cyan');
      const results = await multiPlatformPush(content);
      log(`Results: ${JSON.stringify(results, null, 2)}`, 'cyan');
    } else if (command === 'watchlist') {
      const content = await generateDailyWatchlist();
      console.log(content);
      console.log('');
      log('Pushing to platforms...', 'cyan');
      const results = await multiPlatformPush(content, ['discord']);
      log(`Results: ${JSON.stringify(results, null, 2)}`, 'cyan');
    } else if (command === 'cycle') {
      await runAutonomousCycle();
    } else if (command === 'test') {
      log('Testing AI generation (no push)...', 'cyan');
      const content = await generateMarketBrief();
      console.log('');
      log('Generated Content:', 'green');
      console.log(content);
      console.log('');
      log('Test complete. No content was pushed.', 'yellow');
    } else {
      log(`Unknown command: ${command}`, 'red');
      log('Run with --help for usage information', 'yellow');
      process.exit(1);
    }

    console.log('');
    log('✓ Orchestrator completed successfully', 'green');
    console.log('');
  } catch (error) {
    console.log('');
    log(`✗ Orchestrator failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  generateAIContent,
  pushToDiscord,
  pushToTelegram,
  multiPlatformPush,
  generateMarketBrief,
  generateTradingSignal,
  generateDailyWatchlist,
};

