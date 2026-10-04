import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dbPool, closeDbPool } from './client.js';
import { logger } from '../lib/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations(): Promise<void> {
  const migrationsDir = path.join(__dirname, 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  logger.info('Starting database migration runner...');

  const client = await dbPool.connect();
  try {
    // 1. Ensure migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Query already applied migrations
    const { rows } = await client.query<{ name: string }>('SELECT name FROM _migrations ORDER BY id ASC;');
    const appliedSet = new Set(rows.map((r) => r.name));

    // 3. Read migration files
    const allFiles = fs.readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    const pending = allFiles.filter((file) => !appliedSet.has(file));

    if (pending.length === 0) {
      logger.info('Database is already up to date. No pending migrations.');
      return;
    }

    logger.info({ pendingCount: pending.length }, `Found ${pending.length} pending migrations.`);

    for (const file of pending) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      logger.info(`Applying migration: ${file}...`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1);', [file]);
        await client.query('COMMIT');
        logger.info(`Successfully applied migration: ${file}`);
      } catch (migrationErr) {
        await client.query('ROLLBACK');
        logger.error({ file, err: migrationErr }, `Failed to apply migration: ${file}. Transaction rolled back.`);
        throw migrationErr;
      }
    }

    logger.info('All migrations successfully applied.');
  } finally {
    client.release();
  }
}

// Run directly if invoked via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(async () => {
      await closeDbPool();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error({ err }, 'Migration run failed.');
      await closeDbPool();
      process.exit(1);
    });
}
