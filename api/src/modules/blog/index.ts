import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { blogRoutes } from './blog.routes';

export default fp(async (app: FastifyInstance) => {
  await app.register(blogRoutes);
});
