import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';

const databaseProvider = {
  provide: 'DATABASE_POOL',
  useFactory: () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const sslEnabled = process.env.DATABASE_SSL === 'true' || isProduction;

    const pool = new Pool({
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      user: process.env.DATABASE_USER || 'ridendine',
      password: process.env.DATABASE_PASSWORD || 'ridendine_dev_password',
      database: process.env.DATABASE_NAME || 'ridendine_dev',
      ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,

      // Connection pool optimization
      max: 50, // Increased from 20 to handle concurrent requests
      min: 10, // Keep minimum warm connections
      idleTimeoutMillis: 60000, // 1 minute (increased from 30s)
      connectionTimeoutMillis: 5000, // 5 seconds (increased from 2s for retry)
      maxUses: 7500, // Rotate connections after 7500 uses
      allowExitOnIdle: false, // Prevent premature shutdown

      // Query timeouts
      statement_timeout: 10000, // 10 second query timeout
      query_timeout: 10000, // 10 second query timeout
      application_name: 'ridendine_api', // Identify in pg_stat_activity

      // Health check and validation
      keepAlive: true, // Enable TCP keepalive
      keepAliveInitialDelayMillis: 10000, // 10 seconds
    });

    // Connection pool event handlers
    pool.on('connect', (_client) => {
      console.log('[DB Pool] New client connected');
    });

    pool.on('acquire', (_client) => {
      console.log('[DB Pool] Client acquired from pool');
    });

    pool.on('remove', (_client) => {
      console.log('[DB Pool] Client removed from pool');
    });

    pool.on('error', (err, _client) => {
      console.error('[DB Pool] Unexpected error on idle client', err);
      // Don't throw - pool will handle cleanup
    });

    // Graceful shutdown handler
    process.on('SIGTERM', async () => {
      console.log('[DB Pool] SIGTERM received, closing pool...');
      await pool.end();
      console.log('[DB Pool] Pool closed');
    });

    process.on('SIGINT', async () => {
      console.log('[DB Pool] SIGINT received, closing pool...');
      await pool.end();
      console.log('[DB Pool] Pool closed');
    });

    return pool;
  },
};

@Global()
@Module({
  providers: [databaseProvider],
  exports: ['DATABASE_POOL'],
})
export class DatabaseModule {}
