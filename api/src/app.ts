import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
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
import instructorsPublicPlugin from './modules/instructors';
import adminPlugin from './modules/admin';
import blogPlugin from './modules/blog';
import { uploadRoutes, UPLOADS_DIR } from './modules/upload/upload.routes';
import { registerPdfDeliveryJob } from './jobs/pdf-delivery';

export async function buildApp() {
  const app = Fastify({
    logger: { level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' },
  });

  await app.register(errorHandler);
  await app.register(corsPlugin);
  await app.register(swaggerPlugin);
  await app.register(cookie);
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });
  await app.register(fastifyStatic, {
    root: UPLOADS_DIR,
    prefix: '/api/v1/files/',
    decorateReply: false,
  });

  // Routes
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(coursesPlugin);
  await app.register(lmsPlugin);
  await app.register(paymentPlugin);
  await app.register(ebookPlugin);
  await app.register(certificatesPlugin);
  await app.register(instructorPlugin);
  await app.register(instructorsPublicPlugin);
  await app.register(adminPlugin);
  await app.register(blogPlugin);
  await app.register(uploadRoutes, { prefix: '/api/v1/instructor/upload' });

  // 스케줄러 등록
  registerPdfDeliveryJob();

  return app;
}
