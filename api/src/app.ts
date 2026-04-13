import Fastify from 'fastify';
import errorHandler from './plugins/error-handler';
import corsPlugin from './plugins/cors';
import swaggerPlugin from './plugins/swagger';
import { healthRoutes } from './routes/health';

export async function buildApp() {
  const app = Fastify({
    logger: { level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' },
  });

  await app.register(errorHandler);
  await app.register(corsPlugin);
  await app.register(swaggerPlugin);
  await app.register(healthRoutes);

  return app;
}
