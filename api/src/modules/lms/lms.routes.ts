import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { optionalAuth } from '../../middleware/optional-auth';
import { ok, created } from '../../utils/response';
import { progressSchema } from './lms.schema';
import * as lmsService from './lms.service';
import { db } from '../../db';
import { chapterMaterials, lessons, enrollments, lessonQuizzes } from '../../db/schema';
import { eq, and, asc } from 'drizzle-orm';

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
    const myEnrollments = await lmsService.getMyEnrollments(request.user!.id);
    return reply.send(ok(myEnrollments));
  });

  // GET /api/v1/courses/:slug/lessons/:lessonId/materials — 수강생 자료 조회
  app.get('/api/v1/courses/:slug/lessons/:lessonId/materials', { preHandler: [authenticate] }, async (request, reply) => {
    const { lessonId } = request.params as { slug: string; lessonId: string };
    const userId = request.user!.id;

    const [lesson] = await db
      .select({ chapterId: lessons.chapterId, courseId: lessons.courseId, isPreview: lessons.isPreview })
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);
    if (!lesson) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: '레슨을 찾을 수 없습니다.' } });

    // 미리보기 레슨이 아니면 수강 여부 확인
    if (!lesson.isPreview) {
      const [enrollment] = await db
        .select({ id: enrollments.id })
        .from(enrollments)
        .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, lesson.courseId), eq(enrollments.status, 'active')))
        .limit(1);
      if (!enrollment) {
        return reply.code(403).send({ success: false, error: { code: 'NOT_ENROLLED', message: '수강 신청 후 이용할 수 있습니다.' } });
      }
    }

    const materials = await db
      .select({
        id: chapterMaterials.id,
        title: chapterMaterials.title,
        fileUrl: chapterMaterials.fileUrl,
        fileSize: chapterMaterials.fileSize,
        fileType: chapterMaterials.fileType,
        order: chapterMaterials.order,
      })
      .from(chapterMaterials)
      .where(eq(chapterMaterials.lessonId, lessonId))
      .orderBy(asc(chapterMaterials.order), asc(chapterMaterials.createdAt));

    return reply.send(ok(materials));
  });

  // GET /api/v1/lessons/:lessonId/quiz — 레슨 퀴즈 조회 (수강생)
  app.get('/api/v1/lessons/:lessonId/quiz', { preHandler: [authenticate] }, async (request, reply) => {
    const { lessonId } = request.params as { lessonId: string };
    const userId = request.user!.id;

    const [lesson] = await db
      .select({ courseId: lessons.courseId, isPreview: lessons.isPreview, quizStatus: lessons.quizStatus })
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);
    if (!lesson) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: '레슨을 찾을 수 없습니다.' } });

    if (!lesson.isPreview) {
      const [enrollment] = await db
        .select({ id: enrollments.id })
        .from(enrollments)
        .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, lesson.courseId), eq(enrollments.status, 'active')))
        .limit(1);
      if (!enrollment) {
        return reply.code(403).send({ success: false, error: { code: 'NOT_ENROLLED', message: '수강 신청 후 이용할 수 있습니다.' } });
      }
    }

    const quizzes = await db
      .select({
        id: lessonQuizzes.id,
        question: lessonQuizzes.question,
        options: lessonQuizzes.options,
        correctIndex: lessonQuizzes.correctIndex,
        explanation: lessonQuizzes.explanation,
        order: lessonQuizzes.order,
      })
      .from(lessonQuizzes)
      .where(eq(lessonQuizzes.lessonId, lessonId))
      .orderBy(asc(lessonQuizzes.order));

    return reply.send(ok({ quizStatus: lesson.quizStatus, questions: quizzes }));
  });
}
