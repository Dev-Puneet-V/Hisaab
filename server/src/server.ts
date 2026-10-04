import { buildApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { closeDbPool } from './db/client.js';

const app = buildApp();

async function startServer(): Promise<void> {
  try {
    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });
    logger.info(`Hisaab server listening on http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

// Graceful shutdown handling
const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, `Received ${signal}. Starting graceful shutdown...`);
  try {
    await app.close();
    logger.info('HTTP server closed.');
    await closeDbPool();
    logger.info('Graceful shutdown completed.');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during shutdown');
    process.exit(1);
  }
};

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

void startServer();
