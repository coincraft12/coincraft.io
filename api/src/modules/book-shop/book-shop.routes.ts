import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/require-role';
import { ok } from '../../utils/response';
import * as bookShopService from './book-shop.service';

export async function bookShopRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/v1/books — 종이책 목록 (공개)
  app.get('/api/v1/books', async (_request, reply) => {
    const books = await bookShopService.listBooks();
    return reply.send(ok(books));
  });

  // POST /api/v1/books/:bookId/prepare — 결제 준비 (인증 필요)
  app.post('/api/v1/books/:bookId/prepare', { preHandler: [authenticate] }, async (request, reply) => {
    const { bookId } = request.params as { bookId: string };
    const body = request.body as { quantity?: number };
    const quantity = body?.quantity ?? 1;
    const result = await bookShopService.prepareBookPayment(request.user!.id, bookId, quantity);
    return reply.send(ok(result));
  });

  // POST /api/v1/books/:bookId/confirm — 결제 확인 + 주문 생성 (인증 필요)
  app.post('/api/v1/books/:bookId/confirm', { preHandler: [authenticate] }, async (request, reply) => {
    const { bookId } = request.params as { bookId: string };
    const body = request.body as {
      impUid: string;
      orderId: string;
      amount: number;
      shippingName: string;
      shippingPhone: string;
      postalCode: string;
      shippingAddress: string;
      shippingDetail?: string;
      quantity?: number;
    };
    const result = await bookShopService.confirmBookPayment(request.user!.id, bookId, body);
    return reply.send(ok(result));
  });

  // GET /api/v1/users/me/book-orders — 내 주문 목록 (인증 필요)
  app.get('/api/v1/users/me/book-orders', { preHandler: [authenticate] }, async (request, reply) => {
    const orders = await bookShopService.listMyBookOrders(request.user!.id);
    return reply.send(ok(orders));
  });

  // GET /api/v1/admin/book-orders — 전체 주문 목록 (admin 전용)
  app.get('/api/v1/admin/book-orders', { preHandler: [authenticate, requireRole('admin')] }, async (_request, reply) => {
    const orders = await bookShopService.adminListBookOrders();
    return reply.send(ok(orders));
  });

  // PATCH /api/v1/admin/book-orders/:orderId/status — 주문 상태 변경 (admin 전용)
  app.patch('/api/v1/admin/book-orders/:orderId/status', { preHandler: [authenticate, requireRole('admin')] }, async (request, reply) => {
    const { orderId } = request.params as { orderId: string };
    const { status } = request.body as { status: string };
    await bookShopService.adminUpdateOrderStatus(orderId, status);
    return reply.send(ok({ updated: true }));
  });

  // POST /api/v1/admin/book-orders/:orderId/ship — 배송 출발 처리 (admin 전용)
  app.post('/api/v1/admin/book-orders/:orderId/ship', { preHandler: [authenticate, requireRole('admin')] }, async (request, reply) => {
    const { orderId } = request.params as { orderId: string };
    const { trackingNumber } = request.body as { trackingNumber: string };
    await bookShopService.adminShipOrder(orderId, trackingNumber);
    return reply.send(ok({ shipped: true }));
  });

  // POST /api/v1/admin/book-orders/:orderId/deliver — 배송 완료 처리 (admin 전용)
  app.post('/api/v1/admin/book-orders/:orderId/deliver', { preHandler: [authenticate, requireRole('admin')] }, async (request, reply) => {
    const { orderId } = request.params as { orderId: string };
    await bookShopService.adminDeliverOrder(orderId);
    return reply.send(ok({ delivered: true }));
  });

  // POST /api/v1/admin/book-orders/:orderId/resend — 주문확인 알림톡 재발송 (admin 전용)
  app.post('/api/v1/admin/book-orders/:orderId/resend', { preHandler: [authenticate, requireRole('admin')] }, async (request, reply) => {
    const { orderId } = request.params as { orderId: string };
    await bookShopService.adminResendOrderNotification(orderId);
    return reply.send(ok({ sent: true }));
  });
}
