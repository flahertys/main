/**
 * Supabase Database Connection Verification Script
 * Tests connectivity and schema availability
 */

import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:tradehax1@lgatuhmejegzfaucufjt.supabase.co:5432/postgres';

async function testConnection() {
  console.log('\n🔍 SUPABASE ENDPOINTS VERIFICATION');
  console.log('==================================\n');

  const pool = new Pool({
    connectionString: DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 5000,
  });

  try {
    // Test 1: Basic connection
    console.log('✓ Testing connection...');
    const client = await pool.connect();
    console.log('  ✅ Connection successful!\n');

    // Test 2: Check database info
    console.log('✓ Checking database info...');
    const dbInfo = await client.query(`
      SELECT
        current_database() as database,
        current_user as user,
        version() as version
    `);
    console.log(`  ✅ Database: ${dbInfo.rows[0].database}`);
    console.log(`  ✅ User: ${dbInfo.rows[0].user}`);
    console.log(`  ✅ Version: ${dbInfo.rows[0].version.split(',')[0]}\n`);

    // Test 3: Check available tables
    console.log('✓ Checking tables...');
    const tablesResult = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (tablesResult.rows.length === 0) {
      console.log('  ⚠️  No tables found. Schema needs initialization.\n');
    } else {
      console.log(`  ✅ Found ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach((row) => {
        console.log(`     - ${row.table_name}`);
      });
      console.log('');
    }

    // Test 4: Check for metrics tables specifically
    console.log('✓ Checking TradeHax metrics tables...');
    const metricsCheck = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('ai_metrics_snapshots', 'ai_response_logs', 'ai_sessions')
      ORDER BY table_name
    `);

    if (metricsCheck.rows.length === 0) {
      console.log('  ⚠️  No metrics tables found.');
      console.log('  📝 Run schema initialization with:');
      console.log('     psql postgresql://postgres:tradehax1@lgatuhmejegzfaucufjt.supabase.co:5432/postgres < web/api/db/metrics_schema.sql\n');
    } else {
      console.log(`  ✅ Found ${metricsCheck.rows.length} TradeHax metrics tables:`);
      metricsCheck.rows.forEach((row) => {
        console.log(`     - ${row.table_name}`);
      });
      console.log('');
    }

    // Test 5: Test metrics snapshot insert (if table exists)
    if (metricsCheck.rows.length > 0) {
      console.log('✓ Testing metrics write capability...');
      try {
        const testInsert = await client.query(`
          INSERT INTO ai_metrics_snapshots (
            total_requests, valid_responses, invalid_responses,
            hallucination_detections, average_quality_score, provider_stats
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, timestamp
        `, [0, 0, 0, 0, 0, JSON.stringify({})]);

        console.log(`  ✅ Write successful! (ID: ${testInsert.rows[0].id})\n`);

        // Clean up test record
        await client.query(`DELETE FROM ai_metrics_snapshots WHERE id = $1`, [testInsert.rows[0].id]);
      } catch (writeError) {
        console.log(`  ❌ Write test failed: ${(writeError as Error).message}\n`);
      }
    }

    // Test 6: Connection pool status
    console.log('✓ Connection pool status:');
    console.log(`  ✅ Total clients: ${pool.totalCount}`);
    console.log(`  ✅ Idle clients: ${pool.idleCount}`);
    console.log(`  ✅ Waiting requests: ${pool.waitingCount}\n`);

    client.release();

    console.log('==================================');
    console.log('✅ SUPABASE ENDPOINTS: OPERATIONAL\n');
    console.log('💡 Next steps:');
    console.log('   1. If tables are missing, run schema initialization');
    console.log('   2. Start development: npm run dev');
    console.log('   3. Verify metrics dashboard at /neural-console');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ SUPABASE CONNECTION ERROR');
    console.error('==================================\n');
    console.error(`Error: ${(error as Error).message}\n`);

    console.log('🔧 Troubleshooting:');
    console.log('   1. Verify DATABASE_URL in .env.local:');
    console.log(`      DATABASE_URL=${DATABASE_URL}\n`);
    console.log('   2. Check Supabase project at: https://supabase.com/dashboard');
    console.log('   3. Ensure firewall allows outbound connections to Supabase');
    console.log('   4. Test manually with:');
    console.log('      psql ' + DATABASE_URL + '\n');

    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();

