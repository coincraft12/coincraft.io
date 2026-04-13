import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { coursesRoutes } from './courses.routes';

export default fp(async (app: FastifyInstance) => {
  await app.register(coursesRoutes, { prefix: '/api/v1/courses' });
});
