import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';

export default fp(async (app: FastifyInstance) => {
  await app.register(swagger, {
    openapi: {
      info: { title: 'CoinCraft API', version: '0.1.0', description: 'CoinCraft Platform REST API' },
      servers: [{ url: 'http://localhost:4000' }],
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });
});
