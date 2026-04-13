import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import errorHandler from './plugins/error-handler';
import corsPlugin from './plugins/cors';
import swaggerPlugin from './plugins/swagger';
import { healthRoutes } from './routes/health';
import { authRoutes } from './modules/auth/auth.routes';
import coursesPlugin from './modules/courses';

export async function buildApp() {
  const app = Fastify({
    logger: { level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' },
  });

  await app.register(errorHandler);
  await app.register(corsPlugin);
  await app.register(swaggerPlugin);
  await app.register(cookie);

  // Routes
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(coursesPlugin);

  return app;
}
