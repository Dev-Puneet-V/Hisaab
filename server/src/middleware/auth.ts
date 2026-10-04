import { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../lib/errors.js';

export interface AuthUser {
  id: string;
  email: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export async function authenticate(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed Authorization header');
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    throw new UnauthorizedError('Bearer token is empty');
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string; email: string };
    if (!decoded.sub || !decoded.email) {
      throw new UnauthorizedError('Invalid token payload');
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email,
    };
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      throw err;
    }
    throw new UnauthorizedError('Invalid or expired authentication token');
  }
}
