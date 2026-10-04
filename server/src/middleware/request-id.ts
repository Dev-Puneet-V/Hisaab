import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify';
import { generateUuid } from '../lib/utils.js';

export function requestIdHook(
  req: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction,
): void {
  const incomingId = req.headers['x-request-id'];
  const requestId = typeof incomingId === 'string' && incomingId.length > 0 ? incomingId : generateUuid();

  req.id = requestId;
  reply.header('x-request-id', requestId);
  done();
}
