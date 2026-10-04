import pino, { Logger } from 'pino';
import { env } from '../config/env.js';

export const logger: Logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'headers.authorization',
      'password',
      'token',
      'refreshToken',
      'accessToken',
      'secret',
    ],
    censor: '[REDACTED]',
  },
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});
