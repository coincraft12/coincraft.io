import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { optionalAuth } from '../../middleware/optional-auth';
import { ok, created } from '../../utils/response';
import { progressSchema } from './lms.schema';
import * as lmsService from './lms.service';

export async function lmsRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/v1/courses/:id/enroll
  app.post('/api/v1/courses/:id/enroll', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await lmsService.enrollFree(request.user!.id, id);
    return reply.code(201).send(created(null, '수강 신청이 완료되었습니다.'));
  });

  // GET /api/v1/courses/:slug/lessons/:lessonId — preview lessons are accessible without auth
  app.get('/api/v1/courses/:slug/lessons/:lessonId', { preHandler: [optionalAuth] }, async (request, reply) => {
    const { lessonId } = request.params as { slug: string; lessonId: string };
    const lesson = await lmsService.getLessonDetail(lessonId, request.user?.id);
    return reply.send(ok(lesson));
  });

  // GET /api/v1/courses/:id/progress
  app.get('/api/v1/courses/:id/progress', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const progress = await lmsService.getCourseProgress(request.user!.id, id);
    return reply.send(ok(progress));
  });

  // POST /api/v1/lessons/:id/progress
  app.post('/api/v1/lessons/:id/progress', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = progressSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: body.error.issues[0].message },
      });
    }
    await lmsService.updateLessonProgress(request.user!.id, id, body.data.watchedSeconds);
    return reply.send(ok(null));
  });

  // POST /api/v1/lessons/:id/complete
  app.post('/api/v1/lessons/:id/complete', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await lmsService.completeLesson(request.user!.id, id);
    return reply.send(ok(result));
  });

  // GET /api/v1/users/me/enrollments
  app.get('/api/v1/users/me/enrollments', { preHandler: [authenticate] }, async (request, reply) => {
    const enrollments = await lmsService.getMyEnrollments(request.user!.id);
    return reply.send(ok(enrollments));
  });
}
