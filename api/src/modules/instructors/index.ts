import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { instructorsPublicRoutes } from './instructors-public.routes';

export default fp(async (app: FastifyInstance) => {
  await app.register(instructorsPublicRoutes, { prefix: '/api/v1/instructors' });
});
