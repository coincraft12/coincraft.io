import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/require-role';
import { optionalAuth } from '../../middleware/optional-auth';
import { ok, created } from '../../utils/response';
import {
  startExamSchema,
  submitExamSchema,
  createExamSchema,
  updateExamSchema,
  refundRegistrationSchema,
  addQuestionSchema,
  bulkImportQuestionsSchema,
} from './cert.schema';
import * as certService from './cert.service';

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

  // GET /api/v1/exams/:id/my-status — 내 응시 상태 (authenticate)
  app.get('/api/v1/exams/:id/my-status', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const status = await certService.getMyExamStatus(request.user!.id, id);
    return reply.send(ok(status));
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

  // GET /api/v1/exams/attempts/:id/result — 제출된 결과 조회 (authenticate)
  app.get('/api/v1/exams/attempts/:id/result', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await certService.getAttemptResult(request.user!.id, id);
    return reply.send(ok(result));
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

  // GET /api/v1/users/me/exam-registrations — 내 시험 접수 목록 (authenticate)
  app.get('/api/v1/users/me/exam-registrations', { preHandler: [authenticate] }, async (request, reply) => {
    const registrations = await certService.getMyExamRegistrations(request.user!.id);
    return reply.send(ok(registrations));
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
  app.post('/api/v1/admin/exams', { preHandler: [authenticate, requireRole('admin')] }, async (request, reply) => {
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
  app.post('/api/v1/admin/exams/:id/questions', { preHandler: [authenticate, requireRole('admin')] }, async (request, reply) => {
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
  app.post('/api/v1/admin/exams/:id/questions/bulk', { preHandler: [authenticate, requireRole('admin')] }, async (request, reply) => {
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

  // ── Admin: 시험 관리 ───────────────────────────────────────────────────────

  // GET /api/v1/admin/exams — 전체 시험 목록 (비활성 포함)
  app.get('/api/v1/admin/exams', { preHandler: [authenticate, requireRole('admin')] }, async (_request, reply) => {
    const exams = await certService.listAdminExams();
    return reply.send(ok(exams));
  });

  // PUT /api/v1/admin/exams/:id — 시험 정보 수정
  app.put('/api/v1/admin/exams/:id', { preHandler: [authenticate, requireRole('admin')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateExamSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: body.error.issues[0].message },
      });
    }
    const exam = await certService.updateExam(id, body.data);
    return reply.send(ok(exam, '시험 정보가 수정되었습니다.'));
  });

  // ── Admin: 접수자 관리 ─────────────────────────────────────────────────────

  // GET /api/v1/admin/exams/:id/registrations?status=payment_completed — 접수자 목록
  app.get('/api/v1/admin/exams/:id/registrations', { preHandler: [authenticate, requireRole('admin')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.query as { status?: string };
    const rows = await certService.listRegistrations(id, status);
    return reply.send(ok(rows));
  });

  // PUT /api/v1/admin/registrations/:id/refund — 환불 처리
  app.put('/api/v1/admin/registrations/:id/refund', { preHandler: [authenticate, requireRole('admin')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = refundRegistrationSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: body.error.issues[0].message },
      });
    }
    const result = await certService.refundRegistration(id, body.data.reason);
    return reply.send(ok(result, '환불 처리되었습니다.'));
  });

  // PUT /api/v1/admin/registrations/:id/cancel — 취소 처리
  app.put('/api/v1/admin/registrations/:id/cancel', { preHandler: [authenticate, requireRole('admin')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await certService.cancelRegistration(id);
    return reply.send(ok(result, '접수가 취소되었습니다.'));
  });

  // PUT /api/v1/admin/registrations/:id/pdf-sent — PDF 발송 완료 처리
  app.put('/api/v1/admin/registrations/:id/pdf-sent', { preHandler: [authenticate, requireRole('admin')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await certService.markPdfSent(id);
    return reply.send(ok(result, 'PDF 발송 완료 처리되었습니다.'));
  });

  // ── Admin: 시험 결과 ───────────────────────────────────────────────────────

  // GET /api/v1/admin/exams/:id/results — 응시 결과 + 합격자 목록
  app.get('/api/v1/admin/exams/:id/results', { preHandler: [authenticate, requireRole('admin')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const results = await certService.listExamResults(id);
    return reply.send(ok(results));
  });
}
