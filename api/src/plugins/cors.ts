import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';
import { env } from '../config/env';

export default fp(async (app: FastifyInstance) => {
  const origins = env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean);
  await app.register(cors, {
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
});
