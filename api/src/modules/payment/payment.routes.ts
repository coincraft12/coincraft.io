import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { ok, created } from '../../utils/response';
import {
  preparePaymentSchema, confirmPaymentSchema,
  prepareEbookPaymentSchema, confirmEbookPaymentSchema,
  prepareExamPaymentSchema, confirmExamPaymentSchema,
  prepareSubscriptionPaymentSchema, confirmSubscriptionPaymentSchema,
} from './payment.schema';
import * as paymentService from './payment.service';

export async function paymentRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/v1/payments/prepare
  app.post('/api/v1/payments/prepare', { preHandler: [authenticate] }, async (request, reply) => {
    const body = preparePaymentSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: body.error.issues[0].message },
      });
    }
    const result = await paymentService.preparePayment(request.user!.id, body.data.courseId);
    return reply.code(201).send(created(result, '결제 준비가 완료되었습니다.'));
  });

  // POST /api/v1/payments/confirm
  app.post('/api/v1/payments/confirm', { preHandler: [authenticate] }, async (request, reply) => {
    const body = confirmPaymentSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: body.error.issues[0].message },
      });
    }
    const result = await paymentService.confirmPayment(
      request.user!.id,
      body.data.impUid,
      body.data.orderId,
      body.data.amount
    );
    return reply.send(ok(result, '결제가 완료되었습니다.'));
  });

  // GET /api/v1/payments/history
  app.get('/api/v1/payments/history', { preHandler: [authenticate] }, async (request, reply) => {
    const history = await paymentService.getPaymentHistory(request.user!.id);
    return reply.send(ok(history));
  });

  // POST /api/v1/payments/ebooks/prepare
  app.post('/api/v1/payments/ebooks/prepare', { preHandler: [authenticate] }, async (request, reply) => {
    const body = prepareEbookPaymentSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: body.error.issues[0].message },
      });
    }
    const result = await paymentService.prepareEbookPayment(request.user!.id, body.data.ebookId);
    return reply.code(201).send(created(result, '결제 준비가 완료되었습니다.'));
  });

  // POST /api/v1/payments/ebooks/confirm
  app.post('/api/v1/payments/ebooks/confirm', { preHandler: [authenticate] }, async (request, reply) => {
    const body = confirmEbookPaymentSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: body.error.issues[0].message },
      });
    }
    const result = await paymentService.confirmEbookPayment(
      request.user!.id,
      body.data.impUid,
      body.data.orderId,
      body.data.amount
    );
    return reply.send(ok(result, '결제가 완료되었습니다.'));
  });

  // POST /api/v1/payments/exams/prepare
  app.post('/api/v1/payments/exams/prepare', { preHandler: [authenticate] }, async (request, reply) => {
    const body = prepareExamPaymentSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: body.error.issues[0].message } });
    const result = await paymentService.prepareExamPayment(request.user!.id, body.data.examId, body.data.phone);
    return reply.code(201).send(created(result, '결제 준비가 완료되었습니다.'));
  });

  // POST /api/v1/payments/exams/confirm
  app.post('/api/v1/payments/exams/confirm', { preHandler: [authenticate] }, async (request, reply) => {
    const body = confirmExamPaymentSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: body.error.issues[0].message } });
    const result = await paymentService.confirmExamPayment(request.user!.id, body.data.impUid, body.data.orderId, body.data.amount);
    return reply.send(ok(result, '결제가 완료되었습니다.'));
  });

  // GET /api/v1/payments/subscriptions/plans
  app.get('/api/v1/payments/subscriptions/plans', async (_request, reply) => {
    return reply.send(ok(paymentService.SUBSCRIPTION_PLANS));
  });

  // POST /api/v1/payments/subscriptions/prepare
  app.post('/api/v1/payments/subscriptions/prepare', { preHandler: [authenticate] }, async (request, reply) => {
    const body = prepareSubscriptionPaymentSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: body.error.issues[0].message } });
    const result = await paymentService.prepareSubscriptionPayment(request.user!.id, body.data.plan);
    return reply.code(201).send(created(result, '결제 준비가 완료되었습니다.'));
  });

  // POST /api/v1/payments/subscriptions/confirm
  app.post('/api/v1/payments/subscriptions/confirm', { preHandler: [authenticate] }, async (request, reply) => {
    const body = confirmSubscriptionPaymentSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: body.error.issues[0].message } });
    const result = await paymentService.confirmSubscriptionPayment(request.user!.id, body.data.impUid, body.data.orderId, body.data.amount);
    return reply.send(ok(result, '구독이 시작되었습니다.'));
  });
}
