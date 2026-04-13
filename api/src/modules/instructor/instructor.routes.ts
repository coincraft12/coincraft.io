import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/require-role';
import { ok, created } from '../../utils/response';
import {
  createCourseSchema,
  updateCourseSchema,
  createChapterSchema,
  updateChapterSchema,
  createLessonSchema,
  updateLessonSchema,
} from './instructor.schema';
import * as instructorService from './instructor.service';

export async function instructorRoutes(app: FastifyInstance): Promise<void> {
  const preHandler = [authenticate, requireRole('instructor', 'admin')];

  // GET /api/v1/instructor/courses — 내 강좌 목록
  app.get('/courses', { preHandler }, async (request, reply) => {
    const courses = await instructorService.getInstructorCourses(request.user!.id);
    return reply.send(ok(courses));
  });

  // POST /api/v1/instructor/courses — 강좌 생성
  app.post('/courses', { preHandler }, async (request, reply) => {
    const body = createCourseSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: body.error.issues[0].message },
      });
    }
    const course = await instructorService.createCourse(request.user!.id, body.data);
    return reply.code(201).send(created(course, '강좌가 생성되었습니다.'));
  });

  // GET /api/v1/instructor/courses/:id — 강좌 상세 (챕터/레슨 트리)
  app.get('/courses/:id', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const course = await instructorService.getCourseDetail(request.user!.id, id);
    return reply.send(ok(course));
  });

  // PUT /api/v1/instructor/courses/:id — 강좌 수정
  app.put('/courses/:id', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateCourseSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: body.error.issues[0].message },
      });
    }
    const course = await instructorService.updateCourse(request.user!.id, id, body.data);
    return reply.send(ok(course));
  });

  // POST /api/v1/instructor/courses/:id/chapters — 챕터 추가
  app.post('/courses/:id/chapters', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = createChapterSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: body.error.issues[0].message },
      });
    }
    const chapter = await instructorService.addChapter(request.user!.id, id, body.data);
    return reply.code(201).send(created(chapter, '챕터가 추가되었습니다.'));
  });

  // PUT /api/v1/instructor/chapters/:chapterId — 챕터 수정
  app.put('/chapters/:chapterId', { preHandler: [authenticate, requireRole('instructor', 'admin')] }, async (request, reply) => {
    const { chapterId } = request.params as { chapterId: string };
    const input = updateChapterSchema.parse(request.body);
    const result = await instructorService.updateChapter(request.user!.id, chapterId, input);
    return reply.send({ success: true, data: result });
  });

  // POST /api/v1/instructor/chapters/:id/lessons — 레슨 추가
  app.post('/chapters/:id/lessons', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = createLessonSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: body.error.issues[0].message },
      });
    }
    const lesson = await instructorService.addLesson(request.user!.id, id, body.data);
    return reply.code(201).send(created(lesson, '레슨이 추가되었습니다.'));
  });

  // GET /api/v1/instructor/lessons/:id — 레슨 상세 (수정용)
  app.get('/lessons/:id', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const lesson = await instructorService.getLessonForEdit(request.user!.id, id);
    return reply.send(ok(lesson));
  });

  // PUT /api/v1/instructor/lessons/:id — 레슨 수정
  app.put('/lessons/:id', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateLessonSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: body.error.issues[0].message },
      });
    }
    const lesson = await instructorService.updateLesson(request.user!.id, id, body.data);
    return reply.send(ok(lesson));
  });

  // GET /api/v1/instructor/courses/:id/students — 수강생 목록 + 진도
  app.get('/courses/:id/students', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const students = await instructorService.getCourseStudents(request.user!.id, id);
    return reply.send(ok(students));
  });

  // GET /api/v1/instructor/stats — 통계
  app.get('/stats', { preHandler }, async (request, reply) => {
    const stats = await instructorService.getInstructorStats(request.user!.id);
    return reply.send(ok(stats));
  });
}
