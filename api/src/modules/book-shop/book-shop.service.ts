import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../../db';
import { physicalBooks, bookOrders, payments, users } from '../../db/schema';
import { env } from '../../config/env';
import { sendAdminBookOrderEmail } from '../../lib/email';
import { notifyBookOrder, notifyBookShipped, notifyBookDelivered } from '../../lib/notifications';

function makeError(message: string, code: string, statusCode: number): Error {
  return Object.assign(new Error(message), { code, statusCode });
}

function generateOrderId(bookId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const shortId = bookId.replace(/-/g, '').substring(0, 8).toUpperCase();
  return `BK-${shortId}-${timestamp}-${random}`;
}

async function getIamportToken(): Promise<string> {
  if (!env.PORTONE_IMP_KEY || !env.PORTONE_IMP_SECRET) {
    throw makeError('결제 설정이 올바르지 않습니다.', 'CONFIG_ERROR', 500);
  }
  const res = await fetch('https://api.iamport.kr/users/getToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imp_key: env.PORTONE_IMP_KEY, imp_secret: env.PORTONE_IMP_SECRET }),
  });
  const data = await res.json() as { code: number; response: { access_token: string } };
  if (data.code !== 0) throw makeError('결제 검증 토큰 발급에 실패했습니다.', 'TOKEN_ERROR', 500);
  return data.response.access_token;
}

async function verifyIamportPayment(impUid: string, expectedAmount: number): Promise<void> {
  const token = await getIamportToken();
  const res = await fetch(`https://api.iamport.kr/payments/${encodeURIComponent(impUid)}`, {
    headers: { 'Authorization': token },
  });
  if (!res.ok) throw makeError('결제 검증에 실패했습니다.', 'PAYMENT_VERIFICATION_FAILED', 400);
  const data = await res.json() as { code: number; response: { status: string; amount: number } };
  if (data.code !== 0) throw makeError('결제 검증에 실패했습니다.', 'PAYMENT_VERIFICATION_FAILED', 400);
  const payment = data.response;
  if (payment.status !== 'paid') throw makeError('결제가 완료되지 않았습니다.', 'PAYMENT_NOT_PAID', 400);
  if (payment.amount !== expectedAmount) throw makeError('결제 금액이 일치하지 않습니다.', 'AMOUNT_MISMATCH', 400);
}

// ─── Public ───────────────────────────────────────────────────────────────────

export interface BookItem {
  id: string;
  title: string;
  author: string;
  price: number;
  coverImageUrl: string | null;
  description: string | null;
  stock: number;
}

export async function listBooks(): Promise<BookItem[]> {
  const rows = await db
    .select()
    .from(physicalBooks)
    .where(eq(physicalBooks.isActive, true));

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    author: r.author,
    price: r.price,
    coverImageUrl: r.coverImageUrl ?? null,
    description: r.description ?? null,
    stock: r.stock,
  }));
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export interface PrepareBookPaymentResult {
  orderId: string;
  amount: number;
  bookTitle: string;
}

export async function prepareBookPayment(
  userId: string,
  bookId: string,
  quantity: number = 1
): Promise<PrepareBookPaymentResult> {
  const [book] = await db
    .select()
    .from(physicalBooks)
    .where(eq(physicalBooks.id, bookId))
    .limit(1);

  if (!book || !book.isActive) {
    throw makeError('도서를 찾을 수 없습니다.', 'NOT_FOUND', 404);
  }

  if (book.stock < quantity) {
    throw makeError('재고가 부족합니다.', 'OUT_OF_STOCK', 400);
  }

  const totalAmount = book.price * quantity;
  const orderId = generateOrderId(bookId);

  return { orderId, amount: totalAmount, bookTitle: book.title };
}

export interface ConfirmBookPaymentInput {
  impUid: string;
  orderId: string;
  amount: number;
  shippingName: string;
  shippingPhone: string;
  postalCode: string;
  shippingAddress: string;
  shippingDetail?: string;
  quantity?: number;
}

export async function confirmBookPayment(
  userId: string,
  bookId: string,
  input: ConfirmBookPaymentInput
): Promise<{ orderId: string }> {
  await verifyIamportPayment(input.impUid, input.amount);

  const [book] = await db
    .select()
    .from(physicalBooks)
    .where(eq(physicalBooks.id, bookId))
    .limit(1);

  if (!book) throw makeError('도서를 찾을 수 없습니다.', 'NOT_FOUND', 404);

  const quantity = input.quantity ?? 1;
  const expectedAmount = book.price * quantity;
  if (input.amount !== expectedAmount) {
    throw makeError('결제 금액이 일치하지 않습니다.', 'AMOUNT_MISMATCH', 400);
  }

  if (book.stock < quantity) {
    throw makeError('재고가 부족합니다.', 'OUT_OF_STOCK', 400);
  }

  const order = await db.transaction(async (tx) => {
    const [payment] = await tx
      .insert(payments)
      .values({
        userId,
        productType: 'book',
        productId: bookId,
        amount: String(input.amount),
        currency: 'KRW',
        status: 'paid',
        provider: 'portone',
        providerPaymentId: input.impUid,
        paidAt: new Date(),
      })
      .returning({ id: payments.id });

    const paymentId = payment?.id ?? null;

    const [newOrder] = await tx
      .insert(bookOrders)
      .values({
        userId,
        bookId,
        paymentId,
        status: 'paid',
        shippingName: input.shippingName,
        shippingPhone: input.shippingPhone,
        postalCode: input.postalCode,
        shippingAddress: input.shippingAddress,
        shippingDetail: input.shippingDetail ?? null,
        quantity,
        totalAmount: input.amount,
      })
      .returning({ id: bookOrders.id });

    await tx
      .update(physicalBooks)
      .set({ stock: sql`${physicalBooks.stock} - ${quantity}` })
      .where(eq(physicalBooks.id, bookId));

    return newOrder;
  });

  // 관리자 이메일 발송 (비동기, 실패해도 주문에 영향 없음)
  db.select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then(([user]) => {
      if (!user) return;
      notifyBookOrder(
        input.shippingPhone,
        user.name,
        book.title,
        quantity,
        input.amount,
        `${input.shippingAddress} ${input.shippingDetail ?? ''}`.trim()
      ).catch((err) => {
        console.warn('[BookShop] Failed to send order notification:', err);
      });
      sendAdminBookOrderEmail({
        userName: user.name,
        userEmail: user.email,
        bookTitle: book.title,
        quantity,
        totalAmount: input.amount,
        shippingName: input.shippingName,
        shippingPhone: input.shippingPhone,
        postalCode: input.postalCode,
        shippingAddress: input.shippingAddress,
        shippingDetail: input.shippingDetail ?? null,
      }).catch((err) => {
        console.warn('[BookShop] Failed to send admin email:', err);
      });
    })
    .catch((err) => {
      console.error('[BookShop] Failed to fetch user for notifications:', err);
    });

  return { orderId: order.id };
}

// ─── My orders ────────────────────────────────────────────────────────────────

export interface MyBookOrder {
  id: string;
  bookTitle: string;
  coverImageUrl: string | null;
  quantity: number;
  totalAmount: number;
  status: string;
  shippingName: string;
  shippingPhone: string;
  postalCode: string;
  shippingAddress: string;
  shippingDetail: string | null;
  createdAt: Date;
}

export async function listMyBookOrders(userId: string): Promise<MyBookOrder[]> {
  const rows = await db
    .select({
      id: bookOrders.id,
      bookTitle: physicalBooks.title,
      coverImageUrl: physicalBooks.coverImageUrl,
      quantity: bookOrders.quantity,
      totalAmount: bookOrders.totalAmount,
      status: bookOrders.status,
      shippingName: bookOrders.shippingName,
      shippingPhone: bookOrders.shippingPhone,
      postalCode: bookOrders.postalCode,
      shippingAddress: bookOrders.shippingAddress,
      shippingDetail: bookOrders.shippingDetail,
      createdAt: bookOrders.createdAt,
    })
    .from(bookOrders)
    .innerJoin(physicalBooks, eq(bookOrders.bookId, physicalBooks.id))
    .where(eq(bookOrders.userId, userId))
    .orderBy(desc(bookOrders.createdAt));

  return rows.map((r) => ({
    id: r.id,
    bookTitle: r.bookTitle,
    coverImageUrl: r.coverImageUrl ?? null,
    quantity: r.quantity,
    totalAmount: r.totalAmount,
    status: r.status,
    shippingName: r.shippingName,
    shippingPhone: r.shippingPhone,
    postalCode: r.postalCode,
    shippingAddress: r.shippingAddress,
    shippingDetail: r.shippingDetail ?? null,
    createdAt: r.createdAt,
  }));
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AdminBookOrder {
  id: string;
  bookTitle: string;
  userName: string;
  userEmail: string;
  quantity: number;
  totalAmount: number;
  status: string;
  shippingName: string;
  shippingPhone: string;
  postalCode: string;
  shippingAddress: string;
  shippingDetail: string | null;
  createdAt: Date;
}

export async function adminListBookOrders(): Promise<AdminBookOrder[]> {
  const rows = await db
    .select({
      id: bookOrders.id,
      bookTitle: physicalBooks.title,
      userName: users.name,
      userEmail: users.email,
      quantity: bookOrders.quantity,
      totalAmount: bookOrders.totalAmount,
      status: bookOrders.status,
      shippingName: bookOrders.shippingName,
      shippingPhone: bookOrders.shippingPhone,
      postalCode: bookOrders.postalCode,
      shippingAddress: bookOrders.shippingAddress,
      shippingDetail: bookOrders.shippingDetail,
      createdAt: bookOrders.createdAt,
    })
    .from(bookOrders)
    .innerJoin(physicalBooks, eq(bookOrders.bookId, physicalBooks.id))
    .innerJoin(users, eq(bookOrders.userId, users.id))
    .orderBy(desc(bookOrders.createdAt));

  return rows.map((r) => ({
    id: r.id,
    bookTitle: r.bookTitle,
    userName: r.userName,
    userEmail: r.userEmail,
    quantity: r.quantity,
    totalAmount: r.totalAmount,
    status: r.status,
    shippingName: r.shippingName,
    shippingPhone: r.shippingPhone,
    postalCode: r.postalCode,
    shippingAddress: r.shippingAddress,
    shippingDetail: r.shippingDetail ?? null,
    createdAt: r.createdAt,
  }));
}

export async function adminShipOrder(orderId: string, trackingNumber: string): Promise<void> {
  const [row] = await db
    .select({
      status: bookOrders.status,
      shippingPhone: bookOrders.shippingPhone,
      shippingName: bookOrders.shippingName,
      bookTitle: physicalBooks.title,
      userName: users.name,
    })
    .from(bookOrders)
    .innerJoin(physicalBooks, eq(bookOrders.bookId, physicalBooks.id))
    .innerJoin(users, eq(bookOrders.userId, users.id))
    .where(eq(bookOrders.id, orderId))
    .limit(1);

  if (!row) throw makeError('주문을 찾을 수 없습니다.', 'NOT_FOUND', 404);

  if (row.status === 'shipped' || row.status === 'delivered') {
    throw makeError('이미 배송 처리된 주문입니다.', 'ALREADY_PROCESSED', 400);
  }

  await db
    .update(bookOrders)
    .set({ status: 'shipped', trackingNumber, updatedAt: new Date() })
    .where(eq(bookOrders.id, orderId));

  notifyBookShipped(row.shippingPhone, row.shippingName, row.bookTitle, trackingNumber).catch(() => {});
}

export async function adminDeliverOrder(orderId: string): Promise<void> {
  const [row] = await db
    .select({
      status: bookOrders.status,
      shippingPhone: bookOrders.shippingPhone,
      shippingName: bookOrders.shippingName,
      bookTitle: physicalBooks.title,
    })
    .from(bookOrders)
    .innerJoin(physicalBooks, eq(bookOrders.bookId, physicalBooks.id))
    .where(eq(bookOrders.id, orderId))
    .limit(1);

  if (!row) throw makeError('주문을 찾을 수 없습니다.', 'NOT_FOUND', 404);

  if (row.status === 'delivered') {
    throw makeError('이미 배송 완료된 주문입니다.', 'ALREADY_DELIVERED', 400);
  }

  await db
    .update(bookOrders)
    .set({ status: 'delivered', updatedAt: new Date() })
    .where(eq(bookOrders.id, orderId));

  notifyBookDelivered(row.shippingPhone, row.shippingName, row.bookTitle).catch(() => {});
}

export async function adminResendOrderNotification(orderId: string): Promise<void> {
  const [row] = await db
    .select({
      shippingPhone: bookOrders.shippingPhone,
      shippingName: bookOrders.shippingName,
      shippingAddress: bookOrders.shippingAddress,
      shippingDetail: bookOrders.shippingDetail,
      quantity: bookOrders.quantity,
      totalAmount: bookOrders.totalAmount,
      bookTitle: physicalBooks.title,
    })
    .from(bookOrders)
    .innerJoin(physicalBooks, eq(bookOrders.bookId, physicalBooks.id))
    .where(eq(bookOrders.id, orderId))
    .limit(1);

  if (!row) throw makeError('주문을 찾을 수 없습니다.', 'NOT_FOUND', 404);

  await notifyBookOrder(
    row.shippingPhone,
    row.shippingName,
    row.bookTitle,
    row.quantity,
    row.totalAmount,
    `${row.shippingAddress} ${row.shippingDetail ?? ''}`.trim()
  );
}

export async function adminUpdateOrderStatus(orderId: string, status: string): Promise<void> {
  const validStatuses = ['pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw makeError('유효하지 않은 상태값입니다.', 'INVALID_STATUS', 400);
  }

  const [order] = await db
    .select({ status: bookOrders.status, quantity: bookOrders.quantity, bookId: bookOrders.bookId })
    .from(bookOrders)
    .where(eq(bookOrders.id, orderId))
    .limit(1);

  if (!order) throw makeError('주문을 찾을 수 없습니다.', 'NOT_FOUND', 404);

  await db.transaction(async (tx) => {
    if (status === 'cancelled' && order.status !== 'cancelled') {
      await tx
        .update(physicalBooks)
        .set({ stock: sql`${physicalBooks.stock} + ${order.quantity}` })
        .where(eq(physicalBooks.id, order.bookId));
    }
    await tx
      .update(bookOrders)
      .set({ status, updatedAt: new Date() })
      .where(eq(bookOrders.id, orderId));
  });
}
