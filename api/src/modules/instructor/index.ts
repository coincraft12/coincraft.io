import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { instructorRoutes } from './instructor.routes';

export default fp(async (app: FastifyInstance) => {
  await app.register(instructorRoutes, { prefix: '/api/v1/instructor' });
});
