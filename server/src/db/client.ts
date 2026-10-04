import pg from 'pg';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

const { Pool } = pg;

export const dbPool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.DATABASE_MAX_CONNECTIONS,
  connectionTimeoutMillis: env.DATABASE_TIMEOUT_MS,
  idleTimeoutMillis: 30000,
});

dbPool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle PostgreSQL client');
});

export async function checkDbReadiness(): Promise<boolean> {
  try {
    const res = await dbPool.query('SELECT 1 AS ready');
    return res.rows?.[0]?.ready === 1;
  } catch (err) {
    logger.warn({ err }, 'Database readiness check failed');
    return false;
  }
}

export async function closeDbPool(): Promise<void> {
  logger.info('Closing PostgreSQL connection pool...');
  await dbPool.end();
  logger.info('PostgreSQL connection pool closed.');
}
