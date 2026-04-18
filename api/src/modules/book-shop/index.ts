import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { bookShopRoutes } from './book-shop.routes';

export default fp(async (app: FastifyInstance) => {
  await app.register(bookShopRoutes);
});
