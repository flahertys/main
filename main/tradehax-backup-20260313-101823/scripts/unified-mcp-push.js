#!/usr/bin/env node

/**
 * Unified MCP Push - Single Push to All Targets
 * 
 * This script enables:
 * 1. Code → GitHub → All MCP servers (single command)
 * 2. Synchronized bidirectional syncing
 * 3. Automatic health checks
 * 4. Rollback on failure
 * 5. Parallel or sequential deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const MCPOrchestrator = require('./mcp-orchestrator').MCPOrchestrator;

class UnifiedMCPPush {
  constructor() {
    this.orchestrator = new MCPOrchestrator();
    this.deploymentId = `deploy-${Date.now()}`;
    this.startTime = Date.now();
  }

  log(message, level = 'info') {
    const icon = {
      'info': 'ℹ️ ',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️ ',
      'push': '📤'
    }[level] || '• ';
    
    console.log(`${icon} [${level.toUpperCase()}] ${message}`);
  }

  /**
   * Execute unified push: Code → GitHub → All servers
   */
  async executePush() {
    try {
      this.log(`Starting unified MCP push ${this.deploymentId}`, 'push');
      
      // Step 1: Prepare local code
      this.log('Step 1: Preparing local code', 'info');
      await this.prepareLocalCode();
      
      // Step 2: Push to GitHub
      this.log('Step 2: Pushing to GitHub', 'info');
      await this.pushToGithub();
      
      // Step 3: Initialize MCP servers
      this.log('Step 3: Initializing MCP servers', 'info');
      await this.orchestrator.initializeServers();
      
      // Step 4: Health check all servers
      this.log('Step 4: Health checking all servers', 'info');
      await this.orchestrator.healthCheck();
      
      // Step 5: Deploy to all servers
      this.log('Step 5: Deploying to all servers', 'info');
      await this.orchestrator.pushToAll();
      
      // Step 6: Verify deployment
      this.log('Step 6: Verifying deployment', 'info');
      await this.verifyDeployment();
      
      // Success
      const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
      this.log(`Unified push completed in ${duration}s`, 'success');
      
      // Show final status
      this.showStatus();
      
    } catch (error) {
      this.log(`Unified push failed: ${error.message}`, 'error');
      await this.rollback();
      process.exit(1);
    }
  }

  /**
   * Prepare local code for deployment
   */
  async prepareLocalCode() {
    try {
      const localPath = 'C:\\tradez\\main';
      
      // Quality checks
      this.log('Running quality checks...', 'info');
      execSync('npm run lint', { cwd: localPath });
      execSync('npm run type-check', { cwd: localPath });
      
      // Build locally
      this.log('Building locally...', 'info');
      execSync('npm run build', { cwd: localPath });
      
      this.log('Local code ready', 'success');
    } catch (error) {
      throw new Error(`Local preparation failed: ${error.message}`);
    }
  }

  /**
   * Push code to GitHub
   */
  async pushToGithub() {
    try {
      const branch = process.argv.includes('--branch') 
        ? process.argv[process.argv.indexOf('--branch') + 1]
        : 'main';
      
      const localPath = 'C:\\tradez\\main';
      
      // Check for uncommitted changes
      const status = execSync('git status --porcelain', { cwd: localPath }).toString();
      if (status.length > 0) {
        this.log('Uncommitted changes found, committing...', 'warning');
        execSync('git add .', { cwd: localPath });
        execSync(
          `git commit -m "build: automated MCP push ${this.deploymentId}"`,
          { cwd: localPath }
        );
      }
      
      // Push to GitHub
      this.log(`Pushing to GitHub (branch: ${branch})...`, 'info');
      execSync(`git push origin ${branch}`, { cwd: localPath });
      
      this.log('GitHub push successful', 'success');
    } catch (error) {
      throw new Error(`GitHub push failed: ${error.message}`);
    }
  }

  /**
   * Verify all deployments succeeded
   */
  async verifyDeployment() {
    const status = this.orchestrator.getStatus();
    
    if (status.summary.ready < status.summary.total) {
      throw new Error(
        `Deployment incomplete: ${status.summary.ready}/${status.summary.total} servers ready`
      );
    }
    
    // Verify each server is serving
    for (const [serverId, serverStatus] of Object.entries(status.servers)) {
      if (serverStatus.status !== 'ready') {
        throw new Error(`Server ${serverId} is not ready`);
      }
    }
    
    this.log('All servers verified', 'success');
  }

  /**
   * Rollback on failure
   */
  async rollback() {
    try {
      this.log('Attempting rollback...', 'warning');
      
      const localPath = 'C:\\tradez\\main';
      
      // Reset local changes
      execSync('git reset --hard HEAD~1', { cwd: localPath });
      
      // Push revert to GitHub
      execSync('git push origin main -f', { cwd: localPath });
      
      this.log('Rollback complete', 'success');
    } catch (error) {
      this.log(`Rollback failed: ${error.message}`, 'error');
    }
  }

  /**
   * Show deployment status
   */
  showStatus() {
    const status = this.orchestrator.getStatus();
    
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║     UNIFIED MCP PUSH STATUS             ║');
    console.log('╠════════════════════════════════════════╣');
    console.log(`║ Deployment ID: ${this.deploymentId.padEnd(20)} ║`);
    console.log(`║ Servers Ready: ${status.summary.ready}/${status.summary.total} (${status.summary.percentage}%) ║`.padEnd(41) + '║');
    console.log('╠════════════════════════════════════════╣');
    
    for (const [serverId, serverStatus] of Object.entries(status.servers)) {
      const statusIcon = serverStatus.status === 'ready' ? '✅' : '❌';
      const line = `║ ${statusIcon} ${serverId.padEnd(30)} ║`;
      console.log(line);
    }
    
    console.log('╚════════════════════════════════════════╝\n');
  }

  /**
   * Watch mode - auto-push on file changes
   */
  async watchMode() {
    const localPath = 'C:\\tradez\\main';
    const chokidar = require('chokidar');
    
    this.log('Entering watch mode...', 'info');
    
    const watcher = chokidar.watch(localPath, {
      ignored: /node_modules|\.git|\.next/,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    });
    
    let timeout;
    watcher.on('change', async (filePath) => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        this.log(`File changed: ${filePath}`, 'warning');
        await this.executePush();
      }, 5000);
    });
    
    this.log('Watch mode active - changes will auto-deploy', 'success');
  }
}

/**
 * CLI Interface
 */
async function main() {
  const args = process.argv.slice(2);
  const push = new UnifiedMCPPush();
  
  if (args.includes('--watch')) {
    await push.watchMode();
  } else {
    await push.executePush();
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = UnifiedMCPPush;
