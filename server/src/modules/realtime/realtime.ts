import { FastifyInstance, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { WebSocket, RawData } from 'ws';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';

interface AuthenticatedWebSocket extends WebSocket {
  isAlive?: boolean;
  userId?: string;
}

export async function realtimeRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/ws', { websocket: true }, (socket: WebSocket, req: FastifyRequest) => {
    const ws = socket as AuthenticatedWebSocket;
    ws.isAlive = true;

    // 1. Authenticate at connect via token query param
    const token = (req.query as { token?: string })?.token;
    if (!token) {
      logger.warn({ ip: req.ip }, 'WebSocket connection rejected: missing token');
      ws.close(1008, 'Authentication token required');
      return;
    }

    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string };
      ws.userId = decoded.sub;
      logger.info({ userId: ws.userId }, 'WebSocket client connected and authenticated');
    } catch {
      logger.warn({ ip: req.ip }, 'WebSocket connection rejected: invalid token');
      ws.close(1008, 'Invalid authentication token');
      return;
    }

    // 2. Heartbeat ping-pong
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (data: RawData) => {
      logger.debug({ userId: ws.userId, byteLength: data.toString().length }, 'WebSocket message received');
    });

    ws.on('close', (code: number, reason: Buffer) => {
      logger.info({ userId: ws.userId, code, reason: reason.toString() }, 'WebSocket client disconnected');
    });
  });
}
