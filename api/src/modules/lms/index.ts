import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { lmsRoutes } from './lms.routes';

export default fp(async (app: FastifyInstance) => {
  await app.register(lmsRoutes);
});
