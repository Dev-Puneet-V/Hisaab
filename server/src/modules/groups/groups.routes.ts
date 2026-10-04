import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { authenticate } from '../../middleware/auth.js';

export async function groupRoutes(fastify: FastifyInstance): Promise<void> {
  // All group routes require authentication
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', async (_req: FastifyRequest, reply: FastifyReply) => {
    // Scaffolding: groups list endpoint
    return reply.status(200).send({
      groups: [],
    });
  });
}
