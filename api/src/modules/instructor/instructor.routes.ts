import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/require-role';
import { ok, created } from '../../utils/response';
import { db } from '../../db';
import { chapterMaterials, chapters, courses, lessons } from '../../db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { z } from 'zod';
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
    const parsed = updateChapterSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message },
      });
    }
    const result = await instructorService.updateChapter(request.user!.id, chapterId, parsed.data);
    return reply.send({ success: true, data: result });
  });

  // DELETE /api/v1/instructor/chapters/:chapterId — 챕터 삭제
  app.delete('/chapters/:chapterId', { preHandler }, async (request, reply) => {
    const { chapterId } = request.params as { chapterId: string };
    await instructorService.deleteChapter(request.user!.id, chapterId);
    return reply.send({ success: true, message: '챕터가 삭제되었습니다.' });
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
    // 영상 있으면 자동으로 스크립트만 백그라운드 저장
    if (lesson.videoUrl && lesson.videoProvider === 'vimeo') {
      instructorService.fetchTranscriptBackground(lesson.id, lesson.videoUrl).catch(console.error);
    }
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
    // videoUrl이 변경됐고 vimeo면 스크립트만 재수집
    if (body.data.videoUrl && lesson.videoProvider === 'vimeo') {
      instructorService.fetchTranscriptBackground(lesson.id, lesson.videoUrl!).catch(console.error);
    }
    return reply.send(ok(lesson));
  });

  // POST /api/v1/instructor/lessons/:id/generate-notes — 스크립트+강의노트 생성 트리거
  app.post('/lessons/:id/generate-notes', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const lesson = await instructorService.getLessonForEdit(request.user!.id, id);
    if (!lesson) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: '레슨을 찾을 수 없습니다.' } });
    if (!lesson.videoUrl) return reply.code(400).send({ success: false, error: { code: 'NO_VIDEO', message: '영상이 등록되지 않았습니다.' } });

    // 즉시 202 반환 후 강의노트만 백그라운드 생성
    reply.code(202).send({ success: true, data: { status: 'notes_processing' } });
    instructorService.generateNotesBackground(id).catch(console.error);
  });

  // POST /api/v1/instructor/lessons/:id/fetch-transcript — 자막만 수동 수집
  app.post('/lessons/:id/fetch-transcript', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const lesson = await instructorService.getLessonForEdit(request.user!.id, id);
    if (!lesson?.videoUrl) return reply.code(400).send({ success: false, error: { code: 'NO_VIDEO', message: '영상이 등록되지 않았습니다.' } });
    reply.code(202).send({ success: true, data: { status: 'transcript_processing' } });
    instructorService.fetchTranscriptBackground(id, lesson.videoUrl).catch(console.error);
  });

  // GET /api/v1/instructor/lessons/:id/notes-status — 생성 상태 조회
  app.get('/lessons/:id/notes-status', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const status = await instructorService.getNotesStatus(id);
    return reply.send(ok(status));
  });

  // DELETE /api/v1/instructor/lessons/:id — 레슨 삭제
  app.delete('/lessons/:id', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await instructorService.deleteLesson(request.user!.id, id);
    return reply.send({ success: true, message: '레슨이 삭제되었습니다.' });
  });

  // DELETE /api/v1/instructor/courses/:id — 강좌 삭제
  app.delete('/courses/:id', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await instructorService.deleteCourse(request.user!.id, id);
    return reply.send({ success: true, message: '강좌가 삭제되었습니다.' });
  });

  // POST /api/v1/instructor/courses/:id/duplicate — 강좌 복제
  app.post('/courses/:id/duplicate', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const course = await instructorService.duplicateCourse(request.user!.id, id);
    return reply.code(201).send(created(course, '강좌가 복제되었습니다.'));
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

  // ── 챕터 자료 관리 ──────────────────────────────────────────────────────────

  // GET /api/v1/instructor/chapters/:chapterId/materials
  app.get('/chapters/:chapterId/materials', { preHandler }, async (request, reply) => {
    const { chapterId } = request.params as { chapterId: string };

    // 강사 소유 챕터인지 확인
    const [chapter] = await db
      .select({ id: chapters.id, courseId: chapters.courseId })
      .from(chapters)
      .where(eq(chapters.id, chapterId))
      .limit(1);
    if (!chapter) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: '챕터를 찾을 수 없습니다.' } });

    const [course] = await db
      .select({ instructorId: courses.instructorId })
      .from(courses)
      .where(eq(courses.id, chapter.courseId))
      .limit(1);
    if (!course || course.instructorId !== request.user!.id) {
      return reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: '권한이 없습니다.' } });
    }

    const materials = await db
      .select()
      .from(chapterMaterials)
      .where(eq(chapterMaterials.chapterId, chapterId))
      .orderBy(asc(chapterMaterials.order), asc(chapterMaterials.createdAt));
    return reply.send(ok(materials));
  });

  // POST /api/v1/instructor/chapters/:chapterId/materials
  app.post('/chapters/:chapterId/materials', { preHandler }, async (request, reply) => {
    const { chapterId } = request.params as { chapterId: string };

    const bodySchema = z.object({
      title: z.string().min(1).max(300),
      fileUrl: z.string().url(),
      fileSize: z.number().int().optional(),
      fileType: z.string().optional(),
    });
    const body = bodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: body.error.issues[0].message } });
    }

    // 강사 소유 확인
    const [chapter] = await db.select({ courseId: chapters.courseId }).from(chapters).where(eq(chapters.id, chapterId)).limit(1);
    if (!chapter) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: '챕터를 찾을 수 없습니다.' } });
    const [course] = await db.select({ instructorId: courses.instructorId }).from(courses).where(eq(courses.id, chapter.courseId)).limit(1);
    if (!course || course.instructorId !== request.user!.id) {
      return reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: '권한이 없습니다.' } });
    }

    const existing = await db.select({ order: chapterMaterials.order }).from(chapterMaterials).where(eq(chapterMaterials.chapterId, chapterId)).orderBy(asc(chapterMaterials.order));
    const nextOrder = existing.length > 0 ? Math.max(...existing.map((m) => m.order)) + 1 : 0;

    const [material] = await db.insert(chapterMaterials).values({
      chapterId,
      title: body.data.title,
      fileUrl: body.data.fileUrl,
      fileSize: body.data.fileSize,
      fileType: body.data.fileType,
      order: nextOrder,
    }).returning();

    return reply.code(201).send(created(material, '자료가 등록되었습니다.'));
  });

  // DELETE /api/v1/instructor/chapters/:chapterId/materials/:materialId
  app.delete('/chapters/:chapterId/materials/:materialId', { preHandler }, async (request, reply) => {
    const { chapterId, materialId } = request.params as { chapterId: string; materialId: string };

    const [chapter] = await db.select({ courseId: chapters.courseId }).from(chapters).where(eq(chapters.id, chapterId)).limit(1);
    if (!chapter) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: '챕터를 찾을 수 없습니다.' } });
    const [course] = await db.select({ instructorId: courses.instructorId }).from(courses).where(eq(courses.id, chapter.courseId)).limit(1);
    if (!course || course.instructorId !== request.user!.id) {
      return reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: '권한이 없습니다.' } });
    }

    await db.delete(chapterMaterials).where(and(eq(chapterMaterials.id, materialId), eq(chapterMaterials.chapterId, chapterId)));
    return reply.send({ success: true, message: '자료가 삭제되었습니다.' });
  });

  // ── 레슨 자료 관리 ──────────────────────────────────────────────────────────

  // GET /api/v1/instructor/lessons/:lessonId/materials
  app.get('/lessons/:lessonId/materials', { preHandler }, async (request, reply) => {
    const { lessonId } = request.params as { lessonId: string };

    const [lesson] = await db.select({ chapterId: lessons.chapterId, courseId: lessons.courseId }).from(lessons).where(eq(lessons.id, lessonId)).limit(1);
    if (!lesson) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: '레슨을 찾을 수 없습니다.' } });
    const [course] = await db.select({ instructorId: courses.instructorId }).from(courses).where(eq(courses.id, lesson.courseId)).limit(1);
    if (!course || course.instructorId !== request.user!.id) {
      return reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: '권한이 없습니다.' } });
    }

    const materials = await db
      .select()
      .from(chapterMaterials)
      .where(eq(chapterMaterials.lessonId, lessonId))
      .orderBy(asc(chapterMaterials.order), asc(chapterMaterials.createdAt));
    return reply.send(ok(materials));
  });

  // POST /api/v1/instructor/lessons/:lessonId/materials
  app.post('/lessons/:lessonId/materials', { preHandler }, async (request, reply) => {
    const { lessonId } = request.params as { lessonId: string };

    const bodySchema = z.object({
      title: z.string().min(1).max(300),
      fileUrl: z.string().url(),
      fileSize: z.number().int().optional(),
      fileType: z.string().optional(),
    });
    const body = bodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: body.error.issues[0].message } });
    }

    const [lesson] = await db.select({ chapterId: lessons.chapterId, courseId: lessons.courseId }).from(lessons).where(eq(lessons.id, lessonId)).limit(1);
    if (!lesson) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: '레슨을 찾을 수 없습니다.' } });
    const [course] = await db.select({ instructorId: courses.instructorId }).from(courses).where(eq(courses.id, lesson.courseId)).limit(1);
    if (!course || course.instructorId !== request.user!.id) {
      return reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: '권한이 없습니다.' } });
    }

    const existing = await db.select({ order: chapterMaterials.order }).from(chapterMaterials).where(eq(chapterMaterials.lessonId, lessonId)).orderBy(asc(chapterMaterials.order));
    const nextOrder = existing.length > 0 ? Math.max(...existing.map((m) => m.order)) + 1 : 0;

    const [material] = await db.insert(chapterMaterials).values({
      chapterId: lesson.chapterId,
      lessonId,
      title: body.data.title,
      fileUrl: body.data.fileUrl,
      fileSize: body.data.fileSize,
      fileType: body.data.fileType,
      order: nextOrder,
    }).returning();

    return reply.code(201).send(created(material, '자료가 등록되었습니다.'));
  });

  // DELETE /api/v1/instructor/lessons/:lessonId/materials/:materialId
  app.delete('/lessons/:lessonId/materials/:materialId', { preHandler }, async (request, reply) => {
    const { lessonId, materialId } = request.params as { lessonId: string; materialId: string };

    const [lesson] = await db.select({ courseId: lessons.courseId }).from(lessons).where(eq(lessons.id, lessonId)).limit(1);
    if (!lesson) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: '레슨을 찾을 수 없습니다.' } });
    const [course] = await db.select({ instructorId: courses.instructorId }).from(courses).where(eq(courses.id, lesson.courseId)).limit(1);
    if (!course || course.instructorId !== request.user!.id) {
      return reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: '권한이 없습니다.' } });
    }

    await db.delete(chapterMaterials).where(and(eq(chapterMaterials.id, materialId), eq(chapterMaterials.lessonId, lessonId)));
    return reply.send({ success: true, message: '자료가 삭제되었습니다.' });
  });
}
