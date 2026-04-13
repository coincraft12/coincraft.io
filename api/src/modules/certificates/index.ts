import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { certRoutes } from './cert.routes';

export default fp(async (app: FastifyInstance) => {
  await app.register(certRoutes);
});
