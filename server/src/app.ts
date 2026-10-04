import Fastify, { FastifyBaseLogger, FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { requestIdHook } from './middleware/request-id.js';
import { errorHandler } from './middleware/error-handler.js';
import { checkDbReadiness } from './db/client.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { groupRoutes } from './modules/groups/groups.routes.js';
import { syncRoutes } from './modules/sync/sync.routes.js';
import { realtimeRoutes } from './modules/realtime/realtime.js';

export function buildApp(): FastifyInstance {
  const app = Fastify({
    loggerInstance: logger as unknown as FastifyBaseLogger,
    bodyLimit: 1048576, // 1MB payload limit
    requestTimeout: 15000, // 15 seconds timeout
  });

  // 1. Core plugins
  app.register(cors, {
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((o) => o.trim()),
    credentials: true,
  });

  app.register(websocket, {
    options: {
      maxPayload: 1048576,
    },
  });

  // 2. Request id and tracing
  app.addHook('onRequest', requestIdHook);

  // 3. Central error and 404 handling
  app.setErrorHandler(errorHandler);

  app.setNotFoundHandler((req, reply) => {
    const requestId = req.id || 'unknown';
    reply.status(404).send({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method}:${req.url} not found`,
        requestId,
      },
    });
  });

  // 4. Health and readiness probes
  app.get('/health', async (_req, reply) => {
    return reply.status(200).send({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/ready', async (_req, reply) => {
    const isDbReady = await checkDbReadiness();
    if (!isDbReady) {
      return reply.status(503).send({
        status: 'error',
        message: 'Database is not ready',
        timestamp: new Date().toISOString(),
      });
    }

    return reply.status(200).send({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  });

  // 5. Versioned API Routes (/v1)
  app.register(
    async (v1) => {
      v1.register(authRoutes, { prefix: '/auth' });
      v1.register(groupRoutes, { prefix: '/groups' });
      v1.register(syncRoutes, { prefix: '/sync' });
      v1.register(realtimeRoutes, { prefix: '/realtime' });
    },
    { prefix: '/v1' },
  );

  return app;
}
