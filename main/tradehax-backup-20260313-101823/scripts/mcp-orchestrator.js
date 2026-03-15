#!/usr/bin/env node

/**
 * MCP Server Orchestrator for TradeHax
 * 
 * Unified Environment Integration:
 * - Connects multiple MCP servers
 * - Synchronized bidirectional syncing
 * - Automated deployments across all clusters
 * - Single push → all targets updated
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// MCP Server Configuration
const MCP_CONFIG = {
  name: 'tradehax-unified-environment',
  version: '1.0.0',
  
  // All MCP servers to connect
  servers: [
    {
      id: 'namecheap-vps',
      type: 'remote',
      host: '199.188.201.164',
      port: 3000,
      user: 'tradehax',
      protocol: 'ssh',
      path: '/home/tradehax/public_html',
      docker: false,
      priority: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      id: 'local-dev',
      type: 'local',
      port: 3000,
      path: 'C:\\tradez\\main',
      docker: false,
      priority: 2,
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      id: 'ollama-server',
      type: 'docker',
      container: 'ollama/ollama:latest',
      port: 11434,
      ports: '11434:11434',
      priority: 3,
      docker: true,
      env: {
        OLLAMA_HOST: '0.0.0.0:11434'
      },
      models: ['mistral', 'neural-chat', 'phi']
    },
    {
      id: 'langchain-server',
      type: 'docker',
      container: 'langchain/langchain:latest',
      port: 8000,
      ports: '8000:8000',
      priority: 4,
      docker: true,
      env: {
        LANGCHAIN_TRACING_V2: 'true'
      }
    },
    {
      id: 'kubernetes-cluster',
      type: 'k8s',
      context: 'desktop-control-plane',
      namespace: 'tradehax',
      priority: 5,
      docker: false,
      api_endpoint: 'https://127.0.0.1:56070'
    }
  ],

  // Synchronization rules
  sync: {
    // Push to all servers
    push: {
      method: 'bidirectional',
      trigger: 'on-commit',
      targets: ['all'],
      order: ['local-dev', 'namecheap-vps', 'docker-servers', 'kubernetes'],
      retry: 3,
      timeout: 300000,
      parallel: false
    },
    
    // Pull from all servers
    pull: {
      method: 'unified',
      trigger: 'on-interval',
      interval: 300000, // 5 minutes
      targets: ['all'],
      conflict_resolution: 'remote-wins'
    },
    
    // Health checks
    health: {
      interval: 60000, // 1 minute
      timeout: 10000,
      required_servers: ['namecheap-vps', 'local-dev']
    }
  }
};

class MCPOrchestrator {
  constructor() {
    this.config = MCP_CONFIG;
    this.servers = new Map();
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
   * Initialize all MCP servers
   */
  async initializeServers() {
    this.log('Initializing MCP servers...');
    
    const sortedServers = this.config.servers.sort((a, b) => a.priority - b.priority);
    
    for (const serverConfig of sortedServers) {
      try {
        this.log(`Initializing server: ${serverConfig.id}`);
        
        if (serverConfig.docker) {
          await this.initializeDockerServer(serverConfig);
        } else if (serverConfig.type === 'remote') {
          await this.initializeRemoteServer(serverConfig);
        } else if (serverConfig.type === 'k8s') {
          await this.initializeK8sServer(serverConfig);
        } else {
          await this.initializeLocalServer(serverConfig);
        }
        
        this.status.set(serverConfig.id, 'ready');
        this.log(`✅ Server ready: ${serverConfig.id}`);
      } catch (error) {
        this.status.set(serverConfig.id, 'error');
        this.log(`❌ Failed to initialize ${serverConfig.id}: ${error.message}`, 'error');
      }
    }
  }

  /**
   * Initialize Docker-based MCP server
   */
  async initializeDockerServer(config) {
    // Check if container exists
    const containerName = config.id;
    
    try {
      execSync(`docker ps -a | grep ${containerName}`, { stdio: 'ignore' });
      this.log(`Docker container ${containerName} found`);
      
      // Start if not running
      try {
        execSync(`docker ps | grep ${containerName}`, { stdio: 'ignore' });
        this.log(`Container ${containerName} already running`);
      } catch {
        this.log(`Starting container ${containerName}...`);
        execSync(`docker start ${containerName}`);
      }
    } catch {
      // Create new container
      this.log(`Creating Docker container ${containerName}...`);
      
      const envFlags = Object.entries(config.env)
        .map(([key, val]) => `-e ${key}=${val}`)
        .join(' ');
      
      execSync(
        `docker run -d --name ${containerName} ${envFlags} -p ${config.ports} ${config.container}`
      );
    }
    
    // Verify container is running
    await this.sleep(2000);
    const isRunning = execSync(`docker ps | grep ${containerName}`).toString().length > 0;
    if (!isRunning) throw new Error(`Container failed to start: ${containerName}`);
  }

  /**
   * Initialize remote SSH-based server
   */
  async initializeRemoteServer(config) {
    // Test SSH connection
    const sshKey = process.env.NAMECHEAP_VPS_SSH_KEY || '~/.ssh/id_ed25519';
    
    try {
      execSync(
        `ssh -i ${sshKey} ${config.user}@${config.host} "echo 'SSH connection OK'"`,
        { stdio: 'ignore' }
      );
      this.log(`SSH connection established to ${config.host}`);
    } catch (error) {
      throw new Error(`SSH connection failed: ${error.message}`);
    }
    
    // Ensure application directory exists
    execSync(
      `ssh -i ${sshKey} ${config.user}@${config.host} "mkdir -p ${config.path}"`
    );
    
    // Check if git repo exists
    try {
      execSync(
        `ssh -i ${sshKey} ${config.user}@${config.host} "cd ${config.path} && git status"`,
        { stdio: 'ignore' }
      );
    } catch {
      // Clone repository
      this.log(`Cloning repository to ${config.host}...`);
      execSync(
        `ssh -i ${sshKey} ${config.user}@${config.host} "cd ${config.path} && git clone https://github.com/DarkModder33/main ."`
      );
    }
  }

  /**
   * Initialize Kubernetes cluster server
   */
  async initializeK8sServer(config) {
    try {
      // Switch to correct context
      execSync(`kubectl config use-context ${config.context}`, { stdio: 'ignore' });
      
      // Create namespace if not exists
      try {
        execSync(`kubectl get namespace ${config.namespace}`, { stdio: 'ignore' });
      } catch {
        execSync(`kubectl create namespace ${config.namespace}`);
      }
      
      this.log(`Kubernetes cluster ${config.context} connected`);
    } catch (error) {
      throw new Error(`Kubernetes connection failed: ${error.message}`);
    }
  }

  /**
   * Initialize local development server
   */
  async initializeLocalServer(config) {
    if (!fs.existsSync(config.path)) {
      throw new Error(`Local path does not exist: ${config.path}`);
    }
    
    this.log(`Local server ready at ${config.path}`);
  }

  /**
   * Unified synchronized push to all servers
   */
  async pushToAll() {
    this.log('Starting unified push to all servers...');
    
    const readyServers = Array.from(this.status.entries())
      .filter(([_, status]) => status === 'ready')
      .map(([id, _]) => id);
    
    this.log(`Pushing to ${readyServers.length} servers`);
    
    const orderedServers = this.config.servers
      .filter(s => readyServers.includes(s.id))
      .sort((a, b) => a.priority - b.priority);
    
    for (const server of orderedServers) {
      try {
        await this.deployToServer(server);
        this.log(`✅ Pushed to ${server.id}`);
      } catch (error) {
        this.log(`❌ Push to ${server.id} failed: ${error.message}`, 'error');
        
        if (this.config.sync.push.retry > 0) {
          this.log(`Retrying push to ${server.id}...`);
          await this.sleep(5000);
          await this.deployToServer(server);
        }
      }
    }
    
    this.log('Unified push complete');
  }

  /**
   * Deploy to a specific server
   */
  async deployToServer(server) {
    if (server.docker) {
      await this.deployDocker(server);
    } else if (server.type === 'remote') {
      await this.deployRemote(server);
    } else if (server.type === 'k8s') {
      await this.deployKubernetes(server);
    } else {
      await this.deployLocal(server);
    }
  }

  /**
   * Deploy to Docker server
   */
  async deployDocker(server) {
    const containerName = server.id;
    
    // Rebuild image if needed
    if (server.id === 'ollama-server') {
      // Pull latest Ollama
      execSync('docker pull ollama/ollama:latest');
    }
    
    // Restart container
    execSync(`docker restart ${containerName}`);
    
    // Wait for readiness
    await this.waitForServer(server);
  }

  /**
   * Deploy to remote SSH server
   */
  async deployRemote(server) {
    const sshKey = process.env.NAMECHEAP_VPS_SSH_KEY || '~/.ssh/id_ed25519';
    const script = `
      cd ${server.path}
      git pull origin main
      npm install --legacy-peer-deps
      npm run build
      pm2 restart tradehax || pm2 start ecosystem.config.js
    `;
    
    execSync(`ssh -i ${sshKey} ${server.user}@${server.host} "${script}"`);
    
    // Wait for readiness
    await this.waitForServer(server);
  }

  /**
   * Deploy to Kubernetes
   */
  async deployKubernetes(server) {
    execSync(`kubectl config use-context ${server.context}`);
    
    // Apply deployment manifests
    execSync(`kubectl apply -f k8s/ -n ${server.namespace}`);
    
    // Wait for rollout
    execSync(`kubectl rollout status deployment/tradehax -n ${server.namespace}`);
  }

  /**
   * Deploy to local development server
   */
  async deployLocal(server) {
    const script = `
      cd ${server.path}
      npm install --legacy-peer-deps
      npm run build
    `;
    
    execSync(script);
  }

  /**
   * Wait for server to be ready
   */
  async waitForServer(server, maxAttempts = 10) {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        if (server.docker) {
          const isRunning = execSync(`docker ps | grep ${server.id}`).toString().length > 0;
          if (isRunning) return;
        } else if (server.type === 'remote') {
          execSync(
            `ssh -i ~/.ssh/id_ed25519 ${server.user}@${server.host} "curl -s http://localhost:${server.port}/__health > /dev/null"`
          );
          return;
        } else {
          // Local server - assume ready
          return;
        }
        
        await this.sleep(1000);
        attempts++;
      } catch {
        await this.sleep(2000);
        attempts++;
      }
    }
    
    throw new Error(`Server ${server.id} failed to become ready`);
  }

  /**
   * Health check all servers
   */
  async healthCheck() {
    this.log('Running health checks...');
    
    for (const [serverId, status] of this.status.entries()) {
      try {
        const server = this.config.servers.find(s => s.id === serverId);
        if (!server) continue;
        
        if (server.docker) {
          const isRunning = execSync(`docker ps | grep ${serverId}`).toString().length > 0;
          this.status.set(serverId, isRunning ? 'ready' : 'down');
        } else if (server.type === 'remote') {
          execSync(
            `ssh -i ~/.ssh/id_ed25519 ${server.user}@${server.host} "echo OK"`,
            { stdio: 'ignore' }
          );
          this.status.set(serverId, 'ready');
        }
      } catch {
        this.status.set(serverId, 'down');
      }
    }
    
    const readyCount = Array.from(this.status.values()).filter(s => s === 'ready').length;
    this.log(`Health check complete: ${readyCount}/${this.status.size} servers ready`);
  }

  /**
   * Get unified status of all servers
   */
  getStatus() {
    const status = {
      timestamp: new Date().toISOString(),
      servers: {},
      summary: {}
    };
    
    for (const [serverId, serverStatus] of this.status.entries()) {
      const serverConfig = this.config.servers.find(s => s.id === serverId);
      status.servers[serverId] = {
        status: serverStatus,
        type: serverConfig?.type,
        priority: serverConfig?.priority
      };
    }
    
    const totalServers = this.status.size;
    const readyServers = Array.from(this.status.values()).filter(s => s === 'ready').length;
    
    status.summary = {
      total: totalServers,
      ready: readyServers,
      down: totalServers - readyServers,
      percentage: Math.round((readyServers / totalServers) * 100)
    };
    
    return status;
  }

  /**
   * Utility: Sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Main execution
 */
async function main() {
  const orchestrator = new MCPOrchestrator();
  
  try {
    // Initialize all servers
    await orchestrator.initializeServers();
    
    // Run health check
    await orchestrator.healthCheck();
    
    // Push to all servers
    if (process.argv.includes('--push')) {
      await orchestrator.pushToAll();
    }
    
    // Show status
    const status = orchestrator.getStatus();
    console.log('\n=== MCP Orchestrator Status ===');
    console.log(JSON.stringify(status, null, 2));
    
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

// Export for module use
module.exports = { MCPOrchestrator, MCP_CONFIG };

// Run if called directly
if (require.main === module) {
  main();
}
