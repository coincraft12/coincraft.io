import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import errorHandler from './plugins/error-handler';
import corsPlugin from './plugins/cors';
import swaggerPlugin from './plugins/swagger';
import { healthRoutes } from './routes/health';
import { authRoutes } from './modules/auth/auth.routes';
import coursesPlugin from './modules/courses';
import lmsPlugin from './modules/lms';
import paymentPlugin from './modules/payment';
import ebookPlugin from './modules/ebook';
import certificatesPlugin from './modules/certificates';
import instructorPlugin from './modules/instructor';
import blogPlugin from './modules/blog';

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
  await app.register(lmsPlugin);
  await app.register(paymentPlugin);
  await app.register(ebookPlugin);
  await app.register(certificatesPlugin);
  await app.register(instructorPlugin);
  await app.register(blogPlugin);

  return app;
}
