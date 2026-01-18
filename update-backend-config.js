#!/usr/bin/env node

/**
 * Update Backend Configuration with Deployed Program IDs
 *
 * This script updates the backend .env file with the deployed Solana program IDs
 * after successful deployment to mainnet.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PROGRAM_IDS_FILE = path.join(__dirname, 'program-ids.json');
const BACKEND_ENV_FILE = path.join(__dirname, '..', 'backend', '.env');
const BACKEND_ENV_EXAMPLE = path.join(__dirname, '..', 'backend', '.env.example');

// Load program IDs
function loadProgramIds() {
  try {
    const data = fs.readFileSync(PROGRAM_IDS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Failed to load program IDs:', error.message);
    process.exit(1);
  }
}

// Update backend .env file
function updateBackendEnv(programIds) {
  const network = process.env.SOLANA_NETWORK || 'mainnet-beta';
  const ids = programIds[network];

  if (!ids) {
    console.error(`❌ No program IDs found for network: ${network}`);
    process.exit(1);
  }

  // Read current .env file or create from example
  let envContent = '';
  if (fs.existsSync(BACKEND_ENV_FILE)) {
    envContent = fs.readFileSync(BACKEND_ENV_FILE, 'utf8');
  } else if (fs.existsSync(BACKEND_ENV_EXAMPLE)) {
    envContent = fs.readFileSync(BACKEND_ENV_EXAMPLE, 'utf8');
    console.log('📝 Creating .env file from .env.example');
  } else {
    console.log('📝 Creating new .env file');
  }

  // Update or add program ID variables
  const updates = {
    'TRADEHAX_TOKEN_MINT': ids.cloverCoins,
    'CLOVER_COINS_TOKEN_MINT': ids.cloverCoins,
    'STAKING_PROGRAM_ID': ids.stakingProgram,
    'GAMING_PROGRAM_ID': ids.gamingEngine,
    'SOLANA_NETWORK': network,
    'ENABLE_SOLANA_INTEGRATION': 'true',
    'ENABLE_STAKING': 'true',
    'ENABLE_GAMING': 'true'
  };

  let updatedContent = envContent;
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    const newLine = `${key}=${value}`;

    if (regex.test(updatedContent)) {
      // Update existing line
      updatedContent = updatedContent.replace(regex, newLine);
    } else {
      // Add new line
      updatedContent += `\n${newLine}`;
    }
  }

  // Write updated content
  fs.writeFileSync(BACKEND_ENV_FILE, updatedContent.trim() + '\n');
  console.log('✅ Backend .env file updated successfully');
}

// Main execution
function main() {
  console.log('🚀 Updating backend configuration with deployed program IDs...');

  const programIds = loadProgramIds();
  updateBackendEnv(programIds);

  console.log('✅ Backend configuration updated!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Restart the backend server to load new configuration');
  console.log('2. Test the Solana integration endpoints');
  console.log('3. Update frontend with any new program IDs if needed');
}

if (require.main === module) {
  main();
}

module.exports = { loadProgramIds, updateBackendEnv };
