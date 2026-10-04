import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from './auth.service.js';
import { registerSchema, loginSchema, refreshSchema } from './auth.schema.js';

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/register', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = registerSchema.parse(req.body);
    const result = await AuthService.register(parsed);
    return reply.status(201).send(result);
  });

  fastify.post('/login', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = loginSchema.parse(req.body);
    const result = await AuthService.login(parsed);
    return reply.status(200).send(result);
  });

  fastify.post('/refresh', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = refreshSchema.parse(req.body);
    const tokens = await AuthService.refresh(parsed);
    return reply.status(200).send(tokens);
  });

  fastify.post('/logout', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = refreshSchema.parse(req.body);
    await AuthService.logout(parsed.refreshToken);
    return reply.status(204).send();
  });
}
