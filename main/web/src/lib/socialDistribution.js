/**
 * Social Distribution Configuration
 * Setup for Discord Bot and Telegram Mini App
 */

// Discord Bot Configuration
export const DISCORD_CONFIG = {
  // Get from Discord Developer Portal (discord.dev)
  CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
  BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
  GUILD_ID: process.env.DISCORD_GUILD_ID,
  PUBLIC_KEY: process.env.DISCORD_PUBLIC_KEY,

  // Command endpoints
  COMMANDS: {
    SCAN: {
      name: 'scan',
      description: 'Get AI signal for a cryptocurrency',
      options: [
        {
          type: 3, // STRING
          name: 'symbol',
          description: 'Crypto symbol (BTC, ETH, SOL, etc)',
          required: true,
        },
      ],
    },
    GENERATE: {
      name: 'generate',
      description: 'Generate music idea or service blueprint',
      options: [
        {
          type: 3,
          name: 'type',
          description: 'music or services',
          required: true,
        },
      ],
    },
    RECOMMEND: {
      name: 'recommend',
      description: 'Get service recommendations',
      options: [
        {
          type: 3,
          name: 'category',
          description: 'Service category',
          required: false,
        },
      ],
    },
    LEADERBOARD: {
      name: 'leaderboard',
      description: 'View guild leaderboard',
      options: [
        {
          type: 3,
          name: 'type',
          description: 'trading, music, or services',
          required: false,
        },
      ],
    },
  },

  // Invite URL (users share this to add bot to their guild)
  INVITE_URL:
    'https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot&permissions=2048',

  // Guild subscription pricing
  PREMIUM_TIER: {
    price: 5.99,
    currency: 'USD',
    interval: 'month',
  },
};

// Telegram Bot Configuration
export const TELEGRAM_CONFIG = {
  // Get from BotFather (@BotFather on Telegram)
  BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  BOT_USERNAME: process.env.TELEGRAM_BOT_USERNAME,

  // Mini App setup
  MINI_APP: {
    SHORT_NAME: 'tradehax',
    TITLE: 'TradeHax AI',
    // URL should be your vercel deployment
    URL: process.env.TELEGRAM_MINI_APP_URL || 'https://tradehax.net/telegram-app',
  },

  // Commands available in Telegram
  COMMANDS: [
    {
      command: 'start',
      description: 'Start the bot and open mini app',
    },
    {
      command: 'scan',
      description: 'Scan cryptocurrency signal',
    },
    {
      command: 'settings',
      description: 'Update your preferences',
    },
  ],

  // Webhook for receiving messages
  WEBHOOK_URL: process.env.TELEGRAM_WEBHOOK_URL,

  // Firebase Cloud Messaging for push notifications
  FCM_CONFIG: {
    PROJECT_ID: process.env.FCM_PROJECT_ID,
    PRIVATE_KEY: process.env.FCM_PRIVATE_KEY,
    CLIENT_EMAIL: process.env.FCM_CLIENT_EMAIL,
  },
};

/**
 * Discord Command Response Builder
 */
export class DiscordResponseBuilder {
  constructor() {
    this.content = '';
    this.embeds = [];
    this.components = [];
  }

  setContent(text) {
    this.content = text;
    return this;
  }

  addEmbed(embed) {
    this.embeds.push(embed);
    return this;
  }

  addButton(label, customId, style = 'PRIMARY') {
    if (!this.components[0]) {
      this.components.push({ type: 1, components: [] });
    }
    this.components[0].components.push({
      type: 2,
      label,
      custom_id: customId,
      style: ['PRIMARY', 'SECONDARY', 'SUCCESS', 'DANGER'].indexOf(style) + 1,
    });
    return this;
  }

  build() {
    const response = {
      type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
      data: {},
    };

    if (this.content) response.data.content = this.content;
    if (this.embeds.length > 0) response.data.embeds = this.embeds;
    if (this.components.length > 0) response.data.components = this.components;

    return response;
  }
}

/**
 * Sample Discord Scan Command Response
 * This is what the bot returns when user types /scan BTC
 */
export function buildScanResponse(symbol, signal) {
  const builder = new DiscordResponseBuilder();

  builder.addEmbed({
    title: `${symbol} Signal Analysis`,
    description: signal.reasoning || 'AI-generated trading signal',
    color: signal.action === 'BUY' ? 0x00e5a0 : signal.action === 'SELL' ? 0xff4757 : 0x00d9ff,
    fields: [
      {
        name: 'Signal',
        value: `**${signal.action}** (${(signal.confidence * 100).toFixed(1)}% confidence)`,
        inline: true,
      },
      {
        name: 'Price Target',
        value: signal.targetPrice || 'N/A',
        inline: true,
      },
      {
        name: 'Timeframe',
        value: signal.timeframe || '4-6 hours',
        inline: true,
      },
      {
        name: 'Risk/Reward',
        value: signal.riskReward || 'Favorable',
        inline: true,
      },
    ],
    footer: {
      text: 'TradeHax AI • Signal confidence changes with market conditions',
      icon_url: 'https://tradehax.net/logo.png',
    },
  });

  builder.addButton('Get More Details', 'scan_details');
  builder.addButton('Trade This Signal', 'trade_signal');

  return builder.build();
}

/**
 * Telegram Mini App Message Format
 */
export function buildTelegramSignalMessage(signal) {
  return {
    chat_id: '${USER_CHAT_ID}',
    text: `
🎯 *${signal.symbol} Signal*

*Action:* ${signal.action}
*Confidence:* ${(signal.confidence * 100).toFixed(1)}%
*Target:* ${signal.targetPrice}
*Timeframe:* ${signal.timeframe}

*${signal.reasoning}*

[View in App](${TELEGRAM_CONFIG.MINI_APP.URL})
    `.trim(),
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '📈 View Details',
            url: `${TELEGRAM_CONFIG.MINI_APP.URL}?signal=${signal.id}`,
          },
        ],
      ],
    },
  };
}

/**
 * Subscription/Payment Integration
 */
export const PAYMENT_CONFIG = {
  STRIPE: {
    PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY,
    SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    PRICE_ID_FEATURED: process.env.STRIPE_PRICE_FEATURED,
    PRICE_ID_GUILD: process.env.STRIPE_PRICE_GUILD,
    PRICE_ID_TELEGRAM: process.env.STRIPE_PRICE_TELEGRAM,
  },

  WEBHOOKS: {
    DISCORD_WEBHOOK: '/api/webhooks/stripe/discord',
    TELEGRAM_WEBHOOK: '/api/webhooks/stripe/telegram',
  },
};

/**
 * Analytics Events to Track
 */
export const ANALYTICS_EVENTS = {
  // Discord
  DISCORD_COMMAND_SCAN: 'discord_command_scan',
  DISCORD_COMMAND_GENERATE: 'discord_command_generate',
  DISCORD_GUILD_ADDED: 'discord_guild_added',
  DISCORD_GUILD_PREMIUM: 'discord_guild_premium',

  // Telegram
  TELEGRAM_SCAN: 'telegram_scan',
  TELEGRAM_NOTIFICATION_SENT: 'telegram_notification_sent',
  TELEGRAM_MINI_APP_OPEN: 'telegram_mini_app_open',
  TELEGRAM_SUBSCRIPTION: 'telegram_subscription',

  // Conversions
  DISCORD_TO_WEB_SIGNUP: 'discord_to_web_signup',
  TELEGRAM_TO_WEB_SIGNUP: 'telegram_to_web_signup',
  REFERRAL_CONVERSION: 'referral_conversion',
};

/**
 * Rate Limiting Configuration
 */
export const RATE_LIMITS = {
  DISCORD: {
    SCAN: { perUser: 10, windowSeconds: 3600 }, // 10 scans per hour
    GENERATE: { perUser: 5, windowSeconds: 3600 },
  },
  TELEGRAM: {
    SCAN: { perUser: 20, windowSeconds: 3600 }, // 20 scans per hour
    NOTIFICATIONS: { perUser: 5, windowSeconds: 86400 }, // 5 per day
  },
};

/**
 * Feature Flags for Social Channels
 */
export const FEATURE_FLAGS = {
  DISCORD_BOT_ENABLED: process.env.DISCORD_BOT_ENABLED === 'true',
  TELEGRAM_BOT_ENABLED: process.env.TELEGRAM_BOT_ENABLED === 'true',
  TELEGRAM_MINI_APP_ENABLED: process.env.TELEGRAM_MINI_APP_ENABLED === 'true',
  PUSH_NOTIFICATIONS_ENABLED:
    process.env.PUSH_NOTIFICATIONS_ENABLED === 'true',
  GUILD_PREMIUM_ENABLED: process.env.GUILD_PREMIUM_ENABLED === 'true',
};

/**
 * Helper: Get invite links for social sharing
 */
export function getInviteLinks() {
  return {
    discord: DISCORD_CONFIG.INVITE_URL,
    telegram: `https://t.me/${TELEGRAM_CONFIG.BOT_USERNAME}?start=ref`,
    web: 'https://tradehax.net?utm_source=social',
  };
}

/**
 * Validate Discord interaction signature (security)
 */
export function validateDiscordSignature(request, body, signature) {
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha256', DISCORD_CONFIG.PUBLIC_KEY)
    .update(body)
    .digest('hex');
  return hash === signature;
}

/**
 * Log social channel activity
 */
export async function logSocialActivity(event, userId, metadata = {}) {
  // TODO: Implement analytics logging
  console.log(`[SOCIAL ANALYTICS] ${event}`, { userId, ...metadata });

  // Send to analytics service (Mixpanel, Segment, etc)
  // await analytics.track(event, { userId, ...metadata });
}

