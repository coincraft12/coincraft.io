import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { adminRoutes } from './admin.routes';

export default fp(async (app: FastifyInstance) => {
  await app.register(adminRoutes, { prefix: '/api/v1/admin' });
});
