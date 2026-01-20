#!/usr/bin/env node
/**
 * Simple endpoint test script
 * Tests key endpoints to verify functionality
 */

const BASE_URL = 'http://localhost:3001';

async function testEndpoint(method, endpoint, body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EndpointTester/1.0'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json().catch(() => null);

    console.log(`\n✓ ${method} ${endpoint}`);
    console.log(`  Status: ${response.status} ${response.statusText}`);
    if (data) {
      console.log(`  Response: ${JSON.stringify(data).substring(0, 150)}${JSON.stringify(data).length > 150 ? '...' : ''}`);
    }

    return { status: response.status, data };
  } catch (error) {
    console.error(`\n✗ ${method} ${endpoint}`);
    console.error(`  Error: ${error.message}`);
    return { status: 0, error: error.message };
  }
}

async function runTests() {
  console.log('\n🧪 Testing TradeHax Backend Endpoints\n');
  console.log(`Server: ${BASE_URL}`);
  console.log('═'.repeat(50));

  // Test health endpoint
  console.log('\n📊 Health Check:');
  await testEndpoint('GET', '/health');

  // Test public gaming endpoints
  console.log('\n🎮 Gaming Endpoints (Public):');
  await testEndpoint('GET', '/api/gaming/games');
  await testEndpoint('GET', '/api/gaming/results/coinflip-1');

  // Test public rewards endpoints
  console.log('\n💰 Rewards Endpoints (Public):');
  await testEndpoint('GET', '/api/rewards/leaderboard');
  await testEndpoint('GET', '/api/rewards/statistics');

  // Test auth challenge (public but initiates auth)
  console.log('\n🔐 Auth Endpoints:');
  await testEndpoint('POST', '/api/auth/challenge', {
    wallet: '11111111111111111111111111111111'
  });

  // Test legacy endpoint
  console.log('\n📦 Legacy Endpoints:');
  await testEndpoint('POST', '/auth/web3/challenge', {
    wallet: '11111111111111111111111111111111'
  });

  console.log('\n═'.repeat(50));
  console.log('✅ Test suite complete!\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
