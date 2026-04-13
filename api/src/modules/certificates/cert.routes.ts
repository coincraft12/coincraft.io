import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { ok, created } from '../../utils/response';
import {
  startExamSchema,
  submitExamSchema,
  createExamSchema,
  addQuestionSchema,
  bulkImportQuestionsSchema,
} from './cert.schema';
import * as certService from './cert.service';

async function optionalAuth(request: Parameters<typeof authenticate>[0], reply: Parameters<typeof authenticate>[1]): Promise<void> {
  const auth = request.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return;
  await authenticate(request, reply);
}

async function requireRole(role: string) {
  return async function (request: Parameters<typeof authenticate>[0], reply: Parameters<typeof authenticate>[1]): Promise<void> {
    await authenticate(request, reply);
    if (request.user?.role !== role) {
      reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: '권한이 없습니다.' } });
    }
  };
}

export async function certRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/v1/exams — 목록 (인증 불필요)
  app.get('/api/v1/exams', async (_request, reply) => {
    const exams = await certService.listExams();
    return reply.send(ok(exams));
  });

  // GET /api/v1/exams/:id — 상세 (optionalAuth)
  app.get('/api/v1/exams/:id', { preHandler: [optionalAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const exam = await certService.getExam(id);
    return reply.send(ok(exam));
  });

  // POST /api/v1/exams/:id/start — 시작 (authenticate)
  app.post('/api/v1/exams/:id/start', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = startExamSchema.safeParse({ examId: id });
    if (!body.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: body.error.issues[0].message },
      });
    }
    const result = await certService.startExam(request.user!.id, id);
    return reply.code(201).send(created(result, '시험이 시작되었습니다.'));
  });

  // GET /api/v1/exams/attempts/:id — 진행중 시험 (authenticate)
  app.get('/api/v1/exams/attempts/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const attempt = await certService.getAttempt(request.user!.id, id);
    return reply.send(ok(attempt));
  });

  // POST /api/v1/exams/attempts/:id/submit — 제출 (authenticate)
  app.post('/api/v1/exams/attempts/:id/submit', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = submitExamSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: body.error.issues[0].message },
      });
    }
    const result = await certService.submitExam(request.user!.id, id, body.data.answers);
    return reply.send(ok(result));
  });

  // GET /api/v1/users/me/certificates — 내 자격증 (authenticate)
  app.get('/api/v1/users/me/certificates', { preHandler: [authenticate] }, async (request, reply) => {
    const certs = await certService.getMyCertificates(request.user!.id);
    return reply.send(ok(certs));
  });

  // GET /api/v1/certificates/:certNumber — 공개 검증 (인증 불필요)
  app.get('/api/v1/certificates/:certNumber', async (request, reply) => {
    const { certNumber } = request.params as { certNumber: string };
    const result = await certService.verifyCertificate(certNumber);
    return reply.send(ok(result));
  });

  // POST /api/v1/admin/exams — 시험 생성 (authenticate + requireRole('admin'))
  const adminRole = await requireRole('admin');
  app.post('/api/v1/admin/exams', { preHandler: [adminRole] }, async (request, reply) => {
    const body = createExamSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: body.error.issues[0].message },
      });
    }
    const exam = await certService.createExam(body.data);
    return reply.code(201).send(created(exam, '시험이 생성되었습니다.'));
  });

  // POST /api/v1/admin/exams/:id/questions — 문제 추가 (authenticate + requireRole('admin'))
  app.post('/api/v1/admin/exams/:id/questions', { preHandler: [adminRole] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = addQuestionSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: body.error.issues[0].message },
      });
    }
    const question = await certService.addQuestion(id, body.data);
    return reply.code(201).send(created(question, '문제가 추가되었습니다.'));
  });

  // POST /api/v1/admin/exams/:id/questions/bulk — 일괄 업로드 (authenticate + requireRole('admin'))
  app.post('/api/v1/admin/exams/:id/questions/bulk', { preHandler: [adminRole] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = bulkImportQuestionsSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: body.error.issues[0].message },
      });
    }
    const questions = await certService.bulkImportQuestions(id, body.data.questions);
    return reply.code(201).send(created(questions, `${questions.length}개 문제가 업로드되었습니다.`));
  });
}
