import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { authenticate } from '../../middleware/auth.js';

/**
 * Sync Module Scaffolding
 *
 * NOTE (Learning Contract):
 * The sync protocol (push/pull, cursors, versions, idempotency keys, conflict handling,
 * and tombstones) is reserved for the owner to design and implement.
 */
export async function syncRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('preHandler', authenticate);

  fastify.post('/pull', async (_req: FastifyRequest, reply: FastifyReply) => {
    return reply.status(501).send({
      message: 'Sync pull protocol is awaiting implementation by the owner.',
    });
  });

  fastify.post('/push', async (_req: FastifyRequest, reply: FastifyReply) => {
    return reply.status(501).send({
      message: 'Sync push protocol is awaiting implementation by the owner.',
    });
  });
}
