import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError, RateLimitError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export function errorHandler(error: FastifyError | Error, req: FastifyRequest, reply: FastifyReply): void {
  const requestId = req.id || 'unknown';

  // Domain AppError
  if (error instanceof AppError) {
    logger.warn({
      requestId,
      err: error,
      url: req.url,
      method: req.method,
      code: error.code,
      statusCode: error.statusCode,
    }, error.message);

    if (error instanceof RateLimitError) {
      reply.header('Retry-After', error.retryAfterSeconds);
    }

    reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
        requestId,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
    });
    return;
  }

  // Zod validation error
  if (error instanceof ZodError) {
    const issues = error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));

    logger.warn({
      requestId,
      url: req.url,
      method: req.method,
      issues,
    }, 'Input validation failed');

    reply.status(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request input',
        requestId,
        details: issues,
      },
    });
    return;
  }

  // Fastify schema validation error or bad json
  if ('statusCode' in error && typeof error.statusCode === 'number') {
    const statusCode = error.statusCode;
    logger.warn({
      requestId,
      url: req.url,
      method: req.method,
      statusCode,
      err: error,
    }, error.message);

    reply.status(statusCode).send({
      error: {
        code: error.code || 'BAD_REQUEST',
        message: error.message,
        requestId,
      },
    });
    return;
  }

  // Unhandled internal server error (never leak stack or SQL to client)
  logger.error({
    requestId,
    url: req.url,
    method: req.method,
    err: error,
  }, 'Unhandled internal server error');

  reply.status(500).send({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred',
      requestId,
    },
  });
}
