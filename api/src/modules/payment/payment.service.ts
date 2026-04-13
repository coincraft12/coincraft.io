import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../db';
import { courses, enrollments, payments } from '../../db/schema';
import { env } from '../../config/env';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PreparePaymentResult {
  orderId: string;
  amount: number;
  courseName: string;
}

export interface PaymentHistoryItem {
  id: string;
  productType: string;
  productId: string;
  amount: string;
  currency: string;
  status: string;
  provider: string;
  paidAt: Date | null;
  createdAt: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeError(message: string, code: string, status: number): Error {
  return Object.assign(new Error(message), { code, status });
}

function generateOrderId(courseId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const shortId = courseId.replace(/-/g, '').substring(0, 8).toUpperCase();
  return `CC-${shortId}-${timestamp}-${random}`;
}

// ─── Service functions ────────────────────────────────────────────────────────

export async function preparePayment(
  userId: string,
  courseId: string
): Promise<PreparePaymentResult> {
  const [course] = await db
    .select({ id: courses.id, title: courses.title, price: courses.price, isFree: courses.isFree, isPublished: courses.isPublished })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course || !course.isPublished) {
    throw makeError('강좌를 찾을 수 없습니다.', 'NOT_FOUND', 404);
  }

  if (course.isFree) {
    throw makeError('무료 강좌는 결제가 필요하지 않습니다.', 'BAD_REQUEST', 400);
  }

  // Check if already enrolled
  const [existing] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
    .limit(1);

  if (existing) {
    throw makeError('이미 수강 중인 강좌입니다.', 'ALREADY_ENROLLED', 409);
  }

  const orderId = generateOrderId(courseId);
  const amount = Math.round(Number(course.price));

  // Create pending payment record
  await db.insert(payments).values({
    userId,
    productType: 'course',
    productId: courseId,
    amount: String(amount),
    currency: 'KRW',
    status: 'pending',
    provider: 'portone',
    metadata: { orderId },
  });

  return {
    orderId,
    amount,
    courseName: course.title,
  };
}

export async function confirmPayment(
  userId: string,
  paymentId: string,
  orderId: string,
  amount: number
): Promise<{ courseId: string; courseSlug: string }> {
  if (!env.PORTONE_API_SECRET) {
    throw makeError('결제 설정이 올바르지 않습니다.', 'CONFIG_ERROR', 500);
  }

  // Verify payment with PortOne V2
  const portoneRes = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
    method: 'GET',
    headers: {
      'Authorization': `PortOne ${env.PORTONE_API_SECRET}`,
    },
  });

  if (!portoneRes.ok) {
    throw makeError('결제 검증에 실패했습니다.', 'PAYMENT_VERIFICATION_FAILED', 400);
  }

  const portoneData = await portoneRes.json() as {
    status: string;
    amount: { total: number };
    customData?: string;
  };

  if (portoneData.status !== 'PAID') {
    throw makeError('결제가 완료되지 않았습니다.', 'PAYMENT_NOT_PAID', 400);
  }

  if (portoneData.amount.total !== amount) {
    throw makeError('결제 금액이 일치하지 않습니다.', 'AMOUNT_MISMATCH', 400);
  }

  // Find the pending payment record by metadata orderId
  const allPending = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.userId, userId),
        eq(payments.productType, 'course'),
        eq(payments.status, 'pending'),
        eq(payments.provider, 'portone')
      )
    );

  const pendingPayment = allPending.find((p) => {
    const meta = p.metadata as { orderId?: string } | null;
    return meta?.orderId === orderId;
  });

  if (!pendingPayment) {
    throw makeError('결제 정보를 찾을 수 없습니다.', 'PAYMENT_NOT_FOUND', 404);
  }

  const courseId = pendingPayment.productId;

  // Check course exists
  const [course] = await db
    .select({ id: courses.id, slug: courses.slug })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) {
    throw makeError('강좌를 찾을 수 없습니다.', 'NOT_FOUND', 404);
  }

  // Update payment to paid
  await db
    .update(payments)
    .set({
      status: 'paid',
      providerPaymentId: paymentId,
      paidAt: new Date(),
    })
    .where(eq(payments.id, pendingPayment.id));

  // Create enrollment
  const [existingEnrollment] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
    .limit(1);

  if (!existingEnrollment) {
    await db.insert(enrollments).values({
      userId,
      courseId,
      status: 'active',
      paymentId: pendingPayment.id,
    });
  }

  return { courseId: course.id, courseSlug: course.slug };
}

export async function getPaymentHistory(userId: string): Promise<PaymentHistoryItem[]> {
  const rows = await db
    .select({
      id: payments.id,
      productType: payments.productType,
      productId: payments.productId,
      amount: payments.amount,
      currency: payments.currency,
      status: payments.status,
      provider: payments.provider,
      paidAt: payments.paidAt,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt));

  return rows;
}
