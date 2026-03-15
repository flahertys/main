/**
 * TradeHax Database Client
 * Production-ready database connection and query builder
 * Handles connection pooling, error recovery, and retry logic
 */

import { Pool, PoolClient, QueryResult } from 'pg';

export interface DatabaseConfig {
  connectionString: string;
  maxConnections?: number;
  idleTimeoutMs?: number;
  connectionTimeoutMs?: number;
  maxRetries?: number;
}

export class DatabaseClient {
  private pool: Pool;
  private config: DatabaseConfig;
  private isHealthy: boolean = false;
  private lastHealthCheck: Date = new Date();

  constructor(config: DatabaseConfig) {
    this.config = {
      maxConnections: 20,
      idleTimeoutMs: 30000,
      connectionTimeoutMs: 5000,
      maxRetries: 3,
      ...config,
    };

    this.pool = new Pool({
      connectionString: this.config.connectionString,
      max: this.config.maxConnections,
      idleTimeoutMillis: this.config.idleTimeoutMs,
      connectionTimeoutMillis: this.config.connectionTimeoutMs,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected pool error:', err);
      this.isHealthy = false;
    });

    this.pool.on('connect', () => {
      this.isHealthy = true;
    });
  }

  /**
   * Health check - verify database is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.pool.query('SELECT 1');
      this.isHealthy = true;
      this.lastHealthCheck = new Date();
      return true;
    } catch (error) {
      this.isHealthy = false;
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Get current health status
   */
  getStatus(): {
    healthy: boolean;
    totalConnections: number;
    idleConnections: number;
    waitingRequests: number;
    lastCheck: Date;
  } {
    return {
      healthy: this.isHealthy,
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      waitingRequests: this.pool.waitingCount,
      lastCheck: this.lastHealthCheck,
    };
  }

  /**
   * Execute a query with automatic retry logic
   */
  async query<T = any>(
    sql: string,
    params?: any[],
    retries = 0
  ): Promise<QueryResult<any>> {
    try {
      const result = await this.pool.query(sql, params);
      this.isHealthy = true;
      return result;
    } catch (error) {
      if (retries < (this.config.maxRetries || 3)) {
        const backoffMs = Math.pow(2, retries) * 100; // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        return this.query<T>(sql, params, retries + 1);
      }
      throw error;
    }
  }

  /**
   * Execute transaction
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Close pool and cleanup
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  /**
   * Get raw pool for advanced operations
   */
  getPool(): Pool {
    return this.pool;
  }
}

// Initialize global database client
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const db = new DatabaseClient({
  connectionString: databaseUrl,
});

export default db;
