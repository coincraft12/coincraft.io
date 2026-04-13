import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyError } from 'fastify';

export default fp(async (app: FastifyInstance) => {
  app.setErrorHandler((error: FastifyError, _request, reply) => {
    const statusCode = error.statusCode ?? 500;
    if (statusCode >= 500) app.log.error(error);
    reply.status(statusCode).send({
      success: false,
      error: {
        code: error.code ?? 'INTERNAL_SERVER_ERROR',
        message: statusCode >= 500 ? 'Internal server error' : error.message,
      },
    });
  });
});
