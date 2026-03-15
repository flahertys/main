#!/usr/bin/env node

/**
 * Social Media MCP Servers
 * 
 * Unified social platform integration:
 * - Discord MCP server
 * - Telegram MCP server
 * - Meta (Facebook/Instagram) MCP server
 * - Twitter/X MCP server
 * 
 * All integrated with the unified MCP environment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SocialMCPServers {
  constructor() {
    this.config = {
      name: 'social-media-mcp',
      version: '1.0.0',
      servers: [
        {
          id: 'discord-mcp',
          type: 'discord',
          port: 3001,
          npm_package: '@discordjs/client',
          env_vars: [
            'DISCORD_TOKEN',
            'DISCORD_GUILD_ID',
            'DISCORD_WEBHOOK_URL'
          ]
        },
        {
          id: 'telegram-mcp',
          type: 'telegram',
          port: 3002,
          npm_package: 'telegraf',
          env_vars: [
            'TELEGRAM_BOT_TOKEN',
            'TELEGRAM_CHAT_ID',
            'TELEGRAM_ADMIN_ID'
          ]
        },
        {
          id: 'meta-mcp',
          type: 'meta',
          port: 3003,
          npm_package: 'facebook-sdk',
          env_vars: [
            'META_APP_ID',
            'META_APP_SECRET',
            'META_PAGE_ID',
            'META_PAGE_ACCESS_TOKEN'
          ]
        },
        {
          id: 'instagram-mcp',
          type: 'instagram',
          port: 3004,
          npm_package: 'instagram-sdk',
          env_vars: [
            'INSTAGRAM_ACCESS_TOKEN',
            'INSTAGRAM_BUSINESS_ACCOUNT_ID',
            'INSTAGRAM_WEBHOOK_SECRET'
          ]
        },
        {
          id: 'twitter-mcp',
          type: 'twitter',
          port: 3005,
          npm_package: 'twitter-api-v2',
          env_vars: [
            'TWITTER_API_KEY',
            'TWITTER_API_SECRET',
            'TWITTER_BEARER_TOKEN',
            'TWITTER_ACCESS_TOKEN',
            'TWITTER_ACCESS_SECRET'
          ]
        }
      ]
    };
    this.status = new Map();
    this.logs = [];
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    console.log(logMessage);
    this.logs.push(logMessage);
  }

  /**
   * Create Discord MCP Server
   */
  createDiscordServer() {
    const serverCode = `#!/usr/bin/env node

/**
 * Discord MCP Server
 * Connects to Discord guild and provides message/channel management
 */

const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder } = require('discord.js');
const express = require('express');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages] });
const app = express();
const PORT = process.env.DISCORD_PORT || 3001;

// State
let discordClient = null;
let guild = null;

/**
 * Initialize Discord bot
 */
client.on('ready', () => {
  console.log(\`✅ Discord bot ready: \${client.user.tag}\`);
  guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
  if (guild) {
    console.log(\`📍 Connected to guild: \${guild.name}\`);
  }
});

client.login(process.env.DISCORD_TOKEN);

/**
 * Express API routes
 */
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ready', 
    client: client.isReady(),
    guild: guild?.name || 'not-connected'
  });
});

// Send message to channel
app.post('/message', async (req, res) => {
  try {
    const { channel_id, content, embed } = req.body;
    
    const channel = guild?.channels.cache.get(channel_id);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    const message = await channel.send({
      content: content || undefined,
      embeds: embed ? [embed] : undefined
    });
    
    res.json({ 
      success: true, 
      message_id: message.id,
      channel: channel.name 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get channel list
app.get('/channels', (req, res) => {
  if (!guild) {
    return res.status(503).json({ error: 'Guild not connected' });
  }
  
  const channels = guild.channels.cache.map(c => ({
    id: c.id,
    name: c.name,
    type: c.type
  }));
  
  res.json({ channels });
});

// Get messages from channel
app.get('/messages/:channel_id', async (req, res) => {
  try {
    const channel = guild?.channels.cache.get(req.params.channel_id);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    const messages = await channel.messages.fetch({ limit: 50 });
    const formatted = messages.map(m => ({
      id: m.id,
      author: m.author.username,
      content: m.content,
      timestamp: m.createdTimestamp
    }));
    
    res.json({ messages: formatted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register commands (slash commands)
app.post('/commands/register', async (req, res) => {
  try {
    const { commands } = req.body;
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const result = await rest.put(
      Routes.applicationGuildCommands(client.user.id, process.env.DISCORD_GUILD_ID),
      { body: commands }
    );
    
    res.json({ success: true, registered: result.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(\`🚀 Discord MCP server listening on port \${PORT}\`);
});
`;
    
    const filePath = 'scripts/mcp-servers/discord-mcp.js';
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, serverCode);
    this.log(`Created Discord MCP server: ${filePath}`);
  }

  /**
   * Create Telegram MCP Server
   */
  createTelegramServer() {
    const serverCode = `#!/usr/bin/env node

/**
 * Telegram MCP Server
 * Connects to Telegram bot and provides message/channel management
 */

const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const app = express();
const PORT = process.env.TELEGRAM_PORT || 3002;

// State
let botInfo = null;
const messageCache = new Map();

/**
 * Initialize Telegram bot
 */
bot.start((ctx) => {
  ctx.reply('🤖 TradeHax Telegram MCP Bot ready!');
});

bot.launch();
console.log('✅ Telegram bot started');

bot.telegram.getMe().then(me => {
  botInfo = me;
  console.log(\`📱 Bot info: @\${me.username}\`);
});

/**
 * Express API routes
 */
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ready',
    bot: botInfo?.username || 'initializing'
  });
});

// Send message
app.post('/message', async (req, res) => {
  try {
    const { chat_id, text, parse_mode } = req.body;
    
    const message = await bot.telegram.sendMessage(chat_id, text, {
      parse_mode: parse_mode || 'HTML'
    });
    
    res.json({ 
      success: true,
      message_id: message.message_id,
      chat_id: message.chat.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send photo
app.post('/photo', async (req, res) => {
  try {
    const { chat_id, photo_url, caption } = req.body;
    
    const message = await bot.telegram.sendPhoto(chat_id, photo_url, {
      caption: caption || undefined
    });
    
    res.json({ 
      success: true,
      message_id: message.message_id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get chat info
app.get('/chat/:chat_id', async (req, res) => {
  try {
    const chat = await bot.telegram.getChat(req.params.chat_id);
    
    res.json({ 
      id: chat.id,
      title: chat.title || chat.first_name,
      type: chat.type,
      members: chat.all_members_are_administrators ? 'all-admins' : 'mixed'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get chat member count
app.get('/chat/:chat_id/members', async (req, res) => {
  try {
    const count = await bot.telegram.getChatMembersCount(req.params.chat_id);
    
    res.json({ 
      chat_id: req.params.chat_id,
      member_count: count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(\`🚀 Telegram MCP server listening on port \${PORT}\`);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
`;
    
    const filePath = 'scripts/mcp-servers/telegram-mcp.js';
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, serverCode);
    this.log(`Created Telegram MCP server: ${filePath}`);
  }

  /**
   * Create Meta/Facebook MCP Server
   */
  createMetaServer() {
    const serverCode = `#!/usr/bin/env node

/**
 * Meta (Facebook) MCP Server
 * Connects to Facebook/Instagram Graph API
 */

const axios = require('axios');
const express = require('express');

const app = express();
const PORT = process.env.META_PORT || 3003;

const META_API_VERSION = 'v18.0';
const META_GRAPH_URL = \`https://graph.instagram.com/\${META_API_VERSION}\`;
const FACEBOOK_GRAPH_URL = \`https://graph.facebook.com/\${META_API_VERSION}\`;

/**
 * Helper: Make API request to Meta
 */
const metaRequest = async (endpoint, method = 'GET', data = null) => {
  try {
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : \`\${META_GRAPH_URL}\${endpoint}?access_token=\${process.env.INSTAGRAM_ACCESS_TOKEN}\`;
    
    const config = {
      method,
      url,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (data) config.data = data;
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    throw new Error(\`Meta API error: \${error.response?.data?.error?.message || error.message}\`);
  }
};

/**
 * Express API routes
 */
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ready',
    api_version: META_API_VERSION
  });
});

// Get business account info
app.get('/account', async (req, res) => {
  try {
    const data = await metaRequest(\`\${process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID}?fields=name,username,biography,website,profile_picture_url\`);
    
    res.json({
      id: data.id,
      username: data.username,
      name: data.name,
      biography: data.biography,
      website: data.website,
      profile_picture: data.profile_picture_url
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Post to Instagram/Facebook
app.post('/post', async (req, res) => {
  try {
    const { image_url, caption, is_carousel_item } = req.body;
    
    const payload = {
      image_url,
      caption: caption || '',
      is_carousel_item: is_carousel_item || false
    };
    
    const data = await metaRequest(
      \`\${process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID}/media\`,
      'POST',
      payload
    );
    
    res.json({
      success: true,
      media_id: data.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get insights (analytics)
app.get('/insights/:media_id', async (req, res) => {
  try {
    const data = await metaRequest(
      \`\${req.params.media_id}?fields=engagement,impressions,reach,saved\`
    );
    
    res.json({
      media_id: req.params.media_id,
      engagement: data.engagement,
      impressions: data.impressions,
      reach: data.reach,
      saved: data.saved
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent media
app.get('/media', async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const data = await metaRequest(
      \`\${process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID}/media?fields=id,caption,media_type,timestamp&limit=\${limit}\`
    );
    
    res.json({ media: data.data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get followers count
app.get('/followers', async (req, res) => {
  try {
    const data = await metaRequest(
      \`\${process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID}?fields=followers_count,follows_count\`
    );
    
    res.json({
      followers: data.followers_count,
      following: data.follows_count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(\`🚀 Meta MCP server listening on port \${PORT}\`);
});
`;
    
    const filePath = 'scripts/mcp-servers/meta-mcp.js';
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, serverCode);
    this.log(`Created Meta MCP server: ${filePath}`);
  }

  /**
   * Create Instagram MCP Server
   */
  createInstagramServer() {
    const serverCode = `#!/usr/bin/env node

/**
 * Instagram MCP Server
 * Specialized Instagram Graph API integration
 */

const axios = require('axios');
const express = require('express');
const crypto = require('crypto');

const app = express();
const PORT = process.env.INSTAGRAM_PORT || 3004;

const API_VERSION = 'v18.0';
const GRAPH_URL = \`https://graph.instagram.com/\${API_VERSION}\`;

/**
 * Express API routes
 */
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ready',
    service: 'instagram-mcp'
  });
});

// Verify webhook
app.get('/webhook', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  
  if (mode === 'subscribe' && token === process.env.TELEGRAM_ADMIN_ID) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Handle webhook events
app.post('/webhook', (req, res) => {
  const { object, entry } = req.body;
  
  if (object === 'instagram') {
    entry.forEach(item => {
      const { messaging } = item;
      if (messaging) {
        messaging.forEach(msg => {
          console.log('📩 Instagram message:', msg);
          // Process message
        });
      }
    });
    
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// Get hashtag posts
app.get('/hashtag/:tag/posts', async (req, res) => {
  try {
    const tag = req.params.tag.replace('#', '');
    
    const response = await axios.get(
      \`\${GRAPH_URL}/ig_hashtag_search?user_id=\${process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID}&fields=id,name&access_token=\${process.env.INSTAGRAM_ACCESS_TOKEN}\`,
      { params: { search_string: tag } }
    );
    
    const hashtags = response.data.data;
    res.json({ hashtags });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get comments
app.get('/media/:media_id/comments', async (req, res) => {
  try {
    const response = await axios.get(
      \`\${GRAPH_URL}/\${req.params.media_id}/comments?fields=id,from,text,timestamp&access_token=\${process.env.INSTAGRAM_ACCESS_TOKEN}\`
    );
    
    res.json({ 
      media_id: req.params.media_id,
      comments: response.data.data || [] 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reply to comment
app.post('/comment/:comment_id/reply', async (req, res) => {
  try {
    const { message } = req.body;
    
    const response = await axios.post(
      \`\${GRAPH_URL}/\${req.params.comment_id}/replies?access_token=\${process.env.INSTAGRAM_ACCESS_TOKEN}\`,
      { message }
    );
    
    res.json({ 
      success: true,
      reply_id: response.data.id 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(\`🚀 Instagram MCP server listening on port \${PORT}\`);
});
`;
    
    const filePath = 'scripts/mcp-servers/instagram-mcp.js';
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, serverCode);
    this.log(`Created Instagram MCP server: ${filePath}`);
  }

  /**
   * Create Twitter/X MCP Server
   */
  createTwitterServer() {
    const serverCode = `#!/usr/bin/env node

/**
 * Twitter/X MCP Server
 * Twitter API v2 integration
 */

const { ETwitterStreamEvent, TwitterApi } = require('twitter-api-v2');
const express = require('express');

const app = express();
const PORT = process.env.TWITTER_PORT || 3005;

// Initialize Twitter client
const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
  bearerToken: process.env.TWITTER_BEARER_TOKEN
});

const rwClient = client.readWrite;
const roClient = client.readOnly;

let userInfo = null;

/**
 * Get authenticated user info
 */
(async () => {
  try {
    const { data: user } = await roClient.v2.me();
    userInfo = user;
    console.log(\`✅ Twitter authenticated: @\${user.username}\`);
  } catch (error) {
    console.error('❌ Twitter auth failed:', error.message);
  }
})();

/**
 * Express API routes
 */
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ready',
    user: userInfo?.username || 'initializing'
  });
});

// Post tweet
app.post('/tweet', async (req, res) => {
  try {
    const { text, reply_to, quote_to } = req.body;
    
    const options = {};
    if (reply_to) options.reply = { in_reply_to_tweet_id: reply_to };
    if (quote_to) options.quote_tweet_id = quote_to;
    
    const { data } = await rwClient.v2.tweet(text, options);
    
    res.json({
      success: true,
      tweet_id: data.id,
      text: data.text
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get timeline
app.get('/timeline', async (req, res) => {
  try {
    const max_results = req.query.limit || 10;
    
    const { data } = await roClient.v2.userTimeline(userInfo.id, {
      'max_results': max_results,
      'tweet.fields': ['created_at', 'public_metrics', 'author_id'],
      'expansions': ['author_id']
    });
    
    res.json({
      tweets: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tweet metrics
app.get('/tweet/:tweet_id', async (req, res) => {
  try {
    const { data: tweet } = await roClient.v2.singleTweet(req.params.tweet_id, {
      'tweet.fields': ['created_at', 'public_metrics', 'author_id']
    });
    
    res.json({
      id: tweet.id,
      text: tweet.text,
      metrics: tweet.public_metrics,
      created_at: tweet.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Like tweet
app.post('/like/:tweet_id', async (req, res) => {
  try {
    const { data } = await rwClient.v2.like(userInfo.id, req.params.tweet_id);
    
    res.json({
      success: data.liked,
      tweet_id: req.params.tweet_id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Retweet
app.post('/retweet/:tweet_id', async (req, res) => {
  try {
    const { data } = await rwClient.v2.retweet(userInfo.id, req.params.tweet_id);
    
    res.json({
      success: data.retweeted,
      tweet_id: req.params.tweet_id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search tweets
app.get('/search', async (req, res) => {
  try {
    const query = req.query.q || 'tradehax';
    const max_results = req.query.limit || 10;
    
    const { data } = await roClient.v2.search(query, {
      'max_results': max_results,
      'tweet.fields': ['created_at', 'public_metrics']
    });
    
    res.json({
      query,
      tweets: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(\`🚀 Twitter MCP server listening on port \${PORT}\`);
});
`;
    
    const filePath = 'scripts/mcp-servers/twitter-mcp.js';
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, serverCode);
    this.log(`Created Twitter MCP server: ${filePath}`);
  }

  /**
   * Generate all social media servers
   */
  generateAllServers() {
    this.log('Generating social media MCP servers...', 'info');
    this.createDiscordServer();
    this.createTelegramServer();
    this.createMetaServer();
    this.createInstagramServer();
    this.createTwitterServer();
    this.log('All social media MCP servers created', 'success');
  }

  /**
   * Generate package.json for social servers
   */
  generatePackageJson() {
    const packageJson = {
      name: 'social-mcp-servers',
      version: '1.0.0',
      description: 'Social media MCP servers for unified integration',
      main: 'social-sync-orchestrator.js',
      scripts: {
        'start': 'node social-sync-orchestrator.js',
        'discord': 'node scripts/mcp-servers/discord-mcp.js',
        'telegram': 'node scripts/mcp-servers/telegram-mcp.js',
        'meta': 'node scripts/mcp-servers/meta-mcp.js',
        'instagram': 'node scripts/mcp-servers/instagram-mcp.js',
        'twitter': 'node scripts/mcp-servers/twitter-mcp.js',
        'all': 'concurrently "npm run discord" "npm run telegram" "npm run meta" "npm run instagram" "npm run twitter"',
        'dev': 'nodemon social-sync-orchestrator.js'
      },
      dependencies: {
        'express': '^4.18.2',
        'axios': '^1.6.0',
        'discord.js': '^14.13.0',
        'telegraf': '^4.14.0',
        'twitter-api-v2': '^10.7.0',
        'facebook-sdk': '^3.3.0',
        'concurrently': '^8.2.0',
        'nodemon': '^3.0.1',
        'dotenv': '^16.3.1'
      },
      keywords: ['mcp', 'social-media', 'discord', 'telegram', 'twitter', 'instagram', 'meta'],
      author: 'TradeHax',
      license: 'MIT'
    };
    
    const filePath = 'scripts/mcp-servers/package.json';
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(packageJson, null, 2));
    this.log(`Created package.json: ${filePath}`);
  }
}

/**
 * Main execution
 */
async function main() {
  const socialServers = new SocialMCPServers();
  
  try {
    // Generate all MCP servers
    socialServers.generateAllServers();
    
    // Generate package.json
    socialServers.generatePackageJson();
    
    console.log('\n✅ Social Media MCP Servers generated successfully!');
    console.log('\nNext steps:');
    console.log('1. cd scripts/mcp-servers');
    console.log('2. npm install');
    console.log('3. Set environment variables (see .env.social.template)');
    console.log('4. Run: npm run all (or individual: npm run discord, npm run telegram, etc.)');
    
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { SocialMCPServers };
