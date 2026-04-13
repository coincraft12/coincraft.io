import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { ok, created } from '../../utils/response';
import { preparePaymentSchema, confirmPaymentSchema } from './payment.schema';
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
      body.data.paymentId,
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
}
