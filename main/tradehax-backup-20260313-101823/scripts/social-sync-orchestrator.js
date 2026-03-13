#!/usr/bin/env node

/**
 * Social Media Sync Orchestrator
 * 
 * Unified orchestration of all social media MCP servers:
 * - Discord, Telegram, Meta, Instagram, Twitter
 * - Synchronized cross-platform publishing
 * - Message routing and formatting
 * - Status tracking and health checks
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const axios = require('axios');

class SocialSyncOrchestrator {
  constructor() {
    this.config = {
      name: 'social-sync-orchestrator',
      version: '1.0.0',
      
      servers: [
        {
          id: 'discord-mcp',
          type: 'discord',
          port: 3001,
          url: 'http://localhost:3001',
          enabled: true
        },
        {
          id: 'telegram-mcp',
          type: 'telegram',
          port: 3002,
          url: 'http://localhost:3002',
          enabled: true
        },
        {
          id: 'meta-mcp',
          type: 'meta',
          port: 3003,
          url: 'http://localhost:3003',
          enabled: true
        },
        {
          id: 'instagram-mcp',
          type: 'instagram',
          port: 3004,
          url: 'http://localhost:3004',
          enabled: true
        },
        {
          id: 'twitter-mcp',
          type: 'twitter',
          port: 3005,
          url: 'http://localhost:3005',
          enabled: true
        }
      ],
      
      // Cross-platform message formatting
      formatters: {
        discord: (msg) => ({
          content: msg.content,
          embed: msg.embed ? {
            title: msg.title,
            description: msg.content,
            color: 3447003, // Blurple
            thumbnail: { url: msg.image }
          } : undefined
        }),
        
        telegram: (msg) => ({
          text: msg.content,
          photo: msg.image,
          caption: msg.title ? \`<b>\${msg.title}</b>\\n\${msg.content}\` : msg.content,
          parse_mode: 'HTML'
        }),
        
        meta: (msg) => ({
          image_url: msg.image,
          caption: msg.title ? \`\${msg.title}\\n\${msg.content}\` : msg.content
        }),
        
        instagram: (msg) => ({
          image_url: msg.image,
          caption: msg.title ? \`\${msg.title}\\n\${msg.content}\` : msg.content
        }),
        
        twitter: (msg) => ({
          text: msg.title 
            ? \`\${msg.title}\\n\${msg.content}\`
            : msg.content.length > 280 
              ? msg.content.substring(0, 277) + '...'
              : msg.content
        })
      }
    };
    
    this.status = new Map();
    this.logs = [];
    this.messageQueue = [];
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = \`[\${timestamp}] [\${level.toUpperCase()}] \${message}\`;
    console.log(logMessage);
    this.logs.push(logMessage);
  }

  /**
   * Initialize all social media servers
   */
  async initializeServers() {
    this.log('Initializing social media servers...', 'info');
    
    for (const server of this.config.servers) {
      try {
        if (!server.enabled) {
          this.status.set(server.id, 'disabled');
          continue;
        }
        
        // Test health endpoint
        const response = await axios.get(\`\${server.url}/health\`, { timeout: 5000 });
        
        if (response.status === 200) {
          this.status.set(server.id, 'ready');
          this.log(\`✅ \${server.id} initialized\`, 'success');
        }
      } catch (error) {
        this.status.set(server.id, 'error');
        this.log(\`❌ Failed to initialize \${server.id}: \${error.message}\`, 'error');
      }
    }
  }

  /**
   * Health check all servers
   */
  async healthCheck() {
    this.log('Running health checks on all servers...', 'info');
    
    const readyCount = Array.from(this.status.values()).filter(s => s === 'ready').length;
    const totalCount = this.config.servers.filter(s => s.enabled).length;
    
    this.log(\`Health check: \${readyCount}/\${totalCount} servers ready\`, 'info');
    
    return {
      ready: readyCount,
      total: totalCount,
      percentage: Math.round((readyCount / totalCount) * 100)
    };
  }

  /**
   * Format message for specific platform
   */
  formatMessage(platform, message) {
    if (!this.config.formatters[platform]) {
      return message;
    }
    
    return this.config.formatters[platform](message);
  }

  /**
   * Publish message to a single platform
   */
  async publishToSingle(platform, message) {
    const server = this.config.servers.find(s => s.id === \`\${platform}-mcp\`);
    if (!server || !server.enabled) {
      throw new Error(\`Platform \${platform} not available\`);
    }
    
    const formatted = this.formatMessage(platform, message);
    
    try {
      let endpoint = '';
      let method = 'POST';
      let data = formatted;
      
      // Route to appropriate endpoint
      switch (platform) {
        case 'discord':
          endpoint = '/message';
          data = { ...formatted, channel_id: message.channel_id || process.env.DISCORD_CHANNEL_ID };
          break;
        
        case 'telegram':
          endpoint = '/message';
          data = { ...formatted, chat_id: message.chat_id || process.env.TELEGRAM_CHAT_ID };
          break;
        
        case 'meta':
          endpoint = '/post';
          break;
        
        case 'instagram':
          endpoint = '/post';
          break;
        
        case 'twitter':
          endpoint = '/tweet';
          data = { text: formatted.text };
          break;
      }
      
      const response = await axios.post(\`\${server.url}\${endpoint}\`, data);
      
      this.log(\`📤 Published to \${platform}\`, 'success');
      return response.data;
    } catch (error) {
      this.log(\`❌ Failed to publish to \${platform}: \${error.message}\`, 'error');
      throw error;
    }
  }

  /**
   * Publish message to multiple platforms (cross-platform sync)
   */
  async publishToAll(message, platforms = null) {
    const targetPlatforms = platforms || 
      this.config.servers
        .filter(s => s.enabled && this.status.get(s.id) === 'ready')
        .map(s => s.type);
    
    this.log(\`Publishing to \${targetPlatforms.length} platforms: \${targetPlatforms.join(', ')}\`, 'info');
    
    const results = {
      success: [],
      failed: []
    };
    
    for (const platform of targetPlatforms) {
      try {
        const result = await this.publishToSingle(platform, message);
        results.success.push({ platform, ...result });
      } catch (error) {
        results.failed.push({ platform, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Schedule message publishing
   */
  schedulePublish(message, delay = 0, platforms = null) {
    const scheduledTime = new Date(Date.now() + delay);
    
    this.messageQueue.push({
      id: \`msg-\${Date.now()}\`,
      message,
      platforms,
      scheduledTime,
      status: 'scheduled'
    });
    
    this.log(\`📅 Message scheduled for \${scheduledTime.toISOString()}\`, 'info');
    
    // Set timeout to publish
    setTimeout(() => {
      this.publishToAll(message, platforms).catch(error => {
        this.log(\`Failed to publish scheduled message: \${error.message}\`, 'error');
      });
    }, delay);
  }

  /**
   * Get unified status
   */
  getStatus() {
    const status = {
      timestamp: new Date().toISOString(),
      servers: {},
      queue: this.messageQueue,
      summary: {
        total: this.config.servers.length,
        enabled: this.config.servers.filter(s => s.enabled).length,
        ready: Array.from(this.status.values()).filter(s => s === 'ready').length
      }
    };
    
    for (const [serverId, serverStatus] of this.status.entries()) {
      const server = this.config.servers.find(s => s.id === serverId);
      status.servers[serverId] = {
        status: serverStatus,
        type: server?.type,
        port: server?.port
      };
    }
    
    return status;
  }

  /**
   * Get metrics from all platforms
   */
  async getMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      platforms: {}
    };
    
    try {
      // Discord metrics
      const discord = this.config.servers.find(s => s.id === 'discord-mcp');
      if (discord?.enabled) {
        try {
          const response = await axios.get(\`\${discord.url}/channels\`);
          metrics.platforms.discord = {
            channels: response.data.channels?.length || 0
          };
        } catch {}
      }
      
      // Telegram metrics
      const telegram = this.config.servers.find(s => s.id === 'telegram-mcp');
      if (telegram?.enabled) {
        metrics.platforms.telegram = {
          status: 'active'
        };
      }
      
      // Meta/Instagram metrics
      const meta = this.config.servers.find(s => s.id === 'meta-mcp');
      if (meta?.enabled) {
        try {
          const response = await axios.get(\`\${meta.url}/followers\`);
          metrics.platforms.meta = {
            followers: response.data.followers
          };
        } catch {}
      }
      
      // Twitter metrics
      const twitter = this.config.servers.find(s => s.id === 'twitter-mcp');
      if (twitter?.enabled) {
        metrics.platforms.twitter = {
          status: 'active'
        };
      }
    } catch (error) {
      this.log(\`Failed to retrieve metrics: \${error.message}\`, 'error');
    }
    
    return metrics;
  }
}

/**
 * Express Server
 */
const express = require('express');
const app = express();
app.use(express.json());

const orchestrator = new SocialSyncOrchestrator();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ready', service: 'social-sync-orchestrator' });
});

// Get status
app.get('/status', (req, res) => {
  res.json(orchestrator.getStatus());
});

// Get metrics
app.get('/metrics', async (req, res) => {
  const metrics = await orchestrator.getMetrics();
  res.json(metrics);
});

// Publish to all platforms
app.post('/publish', async (req, res) => {
  try {
    const { message, platforms } = req.body;
    const results = await orchestrator.publishToAll(message, platforms);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Publish to single platform
app.post('/publish/:platform', async (req, res) => {
  try {
    const { message } = req.body;
    const result = await orchestrator.publishToSingle(req.params.platform, message);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Schedule publish
app.post('/schedule', async (req, res) => {
  try {
    const { message, delay, platforms } = req.body;
    orchestrator.schedulePublish(message, delay || 0, platforms);
    res.json({ success: true, message: 'Message scheduled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize and start
(async () => {
  await orchestrator.initializeServers();
  await orchestrator.healthCheck();
  
  const PORT = process.env.SOCIAL_ORCHESTRATOR_PORT || 3000;
  app.listen(PORT, () => {
    console.log(\`🚀 Social Sync Orchestrator listening on port \${PORT}\`);
    console.log('\nEndpoints:');
    console.log('  GET /health - Health check');
    console.log('  GET /status - Orchestrator status');
    console.log('  GET /metrics - Platform metrics');
    console.log('  POST /publish - Publish to all platforms');
    console.log('  POST /publish/:platform - Publish to single platform');
    console.log('  POST /schedule - Schedule message publishing');
  });
})();

module.exports = SocialSyncOrchestrator;
