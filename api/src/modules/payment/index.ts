import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { paymentRoutes } from './payment.routes';

export default fp(async (app: FastifyInstance) => {
  await app.register(paymentRoutes);
});
