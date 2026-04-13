import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { ebookRoutes } from './ebook.routes';

export default fp(async (app: FastifyInstance) => {
  await app.register(ebookRoutes);
});
