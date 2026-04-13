import type { FastifyInstance } from 'fastify';
import { coursesQuerySchema } from './courses.schema';
import * as coursesService from './courses.service';
import { optionalAuth } from '../../middleware/optional-auth';
import { ok, paginated } from '../../utils/response';

export async function coursesRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/v1/courses
  app.get('/', { preHandler: [optionalAuth] }, async (request, reply) => {
    const query = coursesQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: query.error.issues[0].message } });
    }
    const result = await coursesService.listCourses(query.data, request.user?.id);
    return reply.send(paginated(result.data, result.meta));
  });

  // GET /api/v1/courses/:slug
  app.get('/:slug', { preHandler: [optionalAuth] }, async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const course = await coursesService.getCourseBySlug(slug, request.user?.id);
    return reply.send(ok(course));
  });
}
