import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../db';
import { courses, enrollments, payments, ebooks, ebookPurchases, certExams, subscriptions, users, examRegistrations } from '../../db/schema';
import { redis } from '../../lib/redis';
import { env } from '../../config/env';
import { notifyEnroll, notifyExamRegistration, notifyEbookPurchase } from '../../lib/notifications';
import { sendEnrollEmail, sendExamRegistrationEmail, sendEbookPurchaseEmail } from '../../lib/email';

// ─── Subscription plans ───────────────────────────────────────────────────────
export const SUBSCRIPTION_PLANS: Record<string, { label: string; amount: number; months: number }> = {
  'basic-monthly':  { label: 'Basic 월간 구독', amount: 29000,  months: 1  },
  'basic-yearly':   { label: 'Basic 연간 구독', amount: 290000, months: 12 },
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PreparePaymentResult {
  orderId: string;
  amount: number;
  courseName: string;
}

export interface PrepareEbookPaymentResult {
  orderId: string;
  amount: number;
  ebookTitle: string;
}

export interface PrepareExamPaymentResult {
  orderId: string;
  amount: number;
  examTitle: string;
}

export interface PrepareSubscriptionPaymentResult {
  orderId: string;
  amount: number;
  planLabel: string;
  plan: string;
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

function makeError(message: string, code: string, statusCode: number): Error {
  return Object.assign(new Error(message), { code, statusCode });
}

async function verifyIamportPayment(impUid: string, expectedAmount: number): Promise<void> {
  if (!env.PORTONE_IMP_KEY || !env.PORTONE_IMP_SECRET) {
    throw makeError('결제 설정이 올바르지 않습니다.', 'CONFIG_ERROR', 500);
  }

  // 1. Get access token
  const tokenRes = await fetch('https://api.iamport.kr/users/getToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imp_key: env.PORTONE_IMP_KEY, imp_secret: env.PORTONE_IMP_SECRET }),
  });
  const tokenData = await tokenRes.json() as { code: number; response: { access_token: string } };
  if (tokenData.code !== 0) throw makeError('결제 검증 토큰 발급에 실패했습니다.', 'TOKEN_ERROR', 500);

  // 2. Verify payment
  const payRes = await fetch(`https://api.iamport.kr/payments/${encodeURIComponent(impUid)}`, {
    headers: { 'Authorization': tokenData.response.access_token },
  });
  if (!payRes.ok) throw makeError('결제 검증에 실패했습니다.', 'PAYMENT_VERIFICATION_FAILED', 400);

  const payData = await payRes.json() as { code: number; response: { status: string; amount: number } };
  if (payData.code !== 0 || payData.response.status !== 'paid') {
    throw makeError('결제가 완료되지 않았습니다.', 'PAYMENT_NOT_PAID', 400);
  }
  if (payData.response.amount !== expectedAmount) {
    throw makeError('결제 금액이 일치하지 않습니다.', 'AMOUNT_MISMATCH', 400);
  }
}

async function generateRegistrationNumber(level: string): Promise<string> {
  // level: 'basic' → 'B', 'associate' → 'A', 'professional' → 'P'
  const levelCode = level.charAt(0).toUpperCase();
  const now = new Date();
  const dateStr = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const key = `exam:reg:WEB3-${levelCode}:${dateStr}`;
  const seq = await redis.incr(key);
  await redis.expire(key, 7 * 24 * 3600); // 7일 TTL
  return `WEB3-${levelCode}-${dateStr}-${String(seq).padStart(4, '0')}`;
}

function generateOrderId(productId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const shortId = productId.replace(/-/g, '').substring(0, 8).toUpperCase();
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
  impUid: string,
  orderId: string,
  amount: number
): Promise<{ courseId: string; courseSlug: string }> {
  await verifyIamportPayment(impUid, amount);

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
    .select({ id: courses.id, slug: courses.slug, title: courses.title })
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
      providerPaymentId: impUid,
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

  // 알림톡 + 이메일 — 수강신청 완료 (실패해도 결제 흐름에 영향 없음)
  const [u] = await db.select({ name: users.name, phone: users.phone, email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  if (u?.phone) notifyEnroll(u.phone, u.name, course.title).catch(() => {});
  if (u?.email) sendEnrollEmail(u.email, u.name, course.title).catch(() => {});

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

// ─── Ebook payment ────────────────────────────────────────────────────────────

export async function prepareEbookPayment(
  userId: string,
  ebookId: string
): Promise<PrepareEbookPaymentResult> {
  const [ebook] = await db
    .select({ id: ebooks.id, title: ebooks.title, price: ebooks.price, isFree: ebooks.isFree, isPublished: ebooks.isPublished })
    .from(ebooks)
    .where(eq(ebooks.id, ebookId))
    .limit(1);

  if (!ebook || !ebook.isPublished) {
    throw makeError('전자책을 찾을 수 없습니다.', 'NOT_FOUND', 404);
  }

  if (ebook.isFree) {
    throw makeError('무료 전자책은 결제가 필요하지 않습니다.', 'BAD_REQUEST', 400);
  }

  const [existing] = await db
    .select({ id: ebookPurchases.id })
    .from(ebookPurchases)
    .where(and(eq(ebookPurchases.userId, userId), eq(ebookPurchases.ebookId, ebookId)))
    .limit(1);

  if (existing) {
    throw makeError('이미 구매한 전자책입니다.', 'ALREADY_PURCHASED', 409);
  }

  const orderId = generateOrderId(ebookId);
  const amount = Math.round(Number(ebook.price));

  await db.insert(payments).values({
    userId,
    productType: 'ebook',
    productId: ebookId,
    amount: String(amount),
    currency: 'KRW',
    status: 'pending',
    provider: 'portone',
    metadata: { orderId },
  });

  return { orderId, amount, ebookTitle: ebook.title };
}

export async function confirmEbookPayment(
  userId: string,
  impUid: string,
  orderId: string,
  amount: number
): Promise<{ ebookId: string }> {
  await verifyIamportPayment(impUid, amount);

  const allPending = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.userId, userId),
        eq(payments.productType, 'ebook'),
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

  const ebookId = pendingPayment.productId;

  await db
    .update(payments)
    .set({ status: 'paid', providerPaymentId: impUid, paidAt: new Date() })
    .where(eq(payments.id, pendingPayment.id));

  const [existingPurchase] = await db
    .select({ id: ebookPurchases.id })
    .from(ebookPurchases)
    .where(and(eq(ebookPurchases.userId, userId), eq(ebookPurchases.ebookId, ebookId)))
    .limit(1);

  if (!existingPurchase) {
    await db.insert(ebookPurchases).values({
      userId,
      ebookId,
      paymentId: pendingPayment.id,
    });
  }

  // 알림톡 + 이메일 — 전자책 구매 완료
  const [eb] = await db.select({ title: ebooks.title }).from(ebooks).where(eq(ebooks.id, ebookId)).limit(1);
  const [uu] = await db.select({ name: users.name, phone: users.phone, email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  if (uu?.phone && eb?.title) notifyEbookPurchase(uu.phone, uu.name, eb.title, pendingPayment.id).catch(() => {});
  if (uu?.email && eb?.title) sendEbookPurchaseEmail(uu.email, uu.name, eb.title, pendingPayment.id).catch(() => {});

  return { ebookId };
}

// ─── Exam payment ─────────────────────────────────────────────────────────────

export async function prepareExamPayment(
  userId: string,
  examId: string,
  phone?: string,
  name?: string,
  birthdate?: string
): Promise<PrepareExamPaymentResult> {
  const [exam] = await db
    .select({ id: certExams.id, title: certExams.title, examFee: certExams.examFee, isActive: certExams.isActive })
    .from(certExams)
    .where(eq(certExams.id, examId))
    .limit(1);

  if (!exam || !exam.isActive) {
    throw makeError('시험을 찾을 수 없습니다.', 'NOT_FOUND', 404);
  }

  const amount = Math.round(Number(exam.examFee));
  if (amount === 0) {
    throw makeError('무료 시험은 결제가 필요하지 않습니다.', 'BAD_REQUEST', 400);
  }

  const orderId = generateOrderId(examId);

  await db.insert(payments).values({
    userId,
    productType: 'exam',
    productId: examId,
    amount: String(amount),
    currency: 'KRW',
    status: 'pending',
    provider: 'portone',
    metadata: { orderId, applicantName: name?.trim() ?? null, applicantBirthdate: birthdate ?? null },
  });

  // 이름/전화번호 제공 시 사용자 레코드에 저장
  const updates: { phone?: string; name?: string } = {};
  if (phone) {
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length >= 10) updates.phone = cleaned;
  }
  if (name?.trim()) updates.name = name.trim();
  if (Object.keys(updates).length > 0) {
    await db.update(users).set(updates).where(eq(users.id, userId));
  }

  return { orderId, amount, examTitle: exam.title };
}

export async function confirmExamPayment(
  userId: string,
  impUid: string,
  orderId: string,
  amount: number
): Promise<{ examId: string; registrationNumber: string }> {
  await verifyIamportPayment(impUid, amount);

  const allPending = await db.select().from(payments).where(
    and(eq(payments.userId, userId), eq(payments.productType, 'exam'), eq(payments.status, 'pending'), eq(payments.provider, 'portone'))
  );

  const pendingPayment = allPending.find((p) => {
    const meta = p.metadata as { orderId?: string } | null;
    return meta?.orderId === orderId;
  });

  if (!pendingPayment) throw makeError('결제 정보를 찾을 수 없습니다.', 'PAYMENT_NOT_FOUND', 404);

  await db.update(payments)
    .set({ status: 'paid', providerPaymentId: impUid, paidAt: new Date() })
    .where(eq(payments.id, pendingPayment.id));

  const examId = pendingPayment.productId;
  const meta = pendingPayment.metadata as { orderId?: string; applicantName?: string | null; applicantBirthdate?: string | null } | null;
  const applicantName = meta?.applicantName ?? null;
  const applicantBirthdate = meta?.applicantBirthdate ?? null;

  // 수험번호 생성 + 등록 테이블 저장
  const [[eu], [ex]] = await Promise.all([
    db.select({ name: users.name, phone: users.phone, email: users.email }).from(users).where(eq(users.id, userId)).limit(1),
    db.select({ title: certExams.title, level: certExams.level }).from(certExams).where(eq(certExams.id, examId)).limit(1),
  ]);

  let registrationNumber = '';
  if (ex?.level) {
    registrationNumber = await generateRegistrationNumber(ex.level);
    await db.insert(examRegistrations).values({
      userId,
      examId,
      paymentId: pendingPayment.id,
      registrationNumber,
      applicantName,
      applicantBirthdate,
    });
  }

  // 알림톡 + 이메일 — 시험 접수 완료
  const displayName = applicantName ?? eu?.name ?? '';
  const examDateTime = '2026년 5월 2일 (토) 오후 2시';
  const rulesUrl = `${env.FRONTEND_URL}/cert/exam-rules`;
  if (eu?.phone && ex?.title && registrationNumber) {
    notifyExamRegistration(eu.phone, displayName, ex.title, examDateTime, registrationNumber, rulesUrl).catch(() => {});
  }
  if (eu?.email && ex?.title && registrationNumber) {
    sendExamRegistrationEmail(eu.email, displayName, ex.title, examDateTime, registrationNumber, rulesUrl).catch(() => {});
  }

  return { examId, registrationNumber };
}

// ─── Subscription payment ─────────────────────────────────────────────────────

export async function prepareSubscriptionPayment(
  userId: string,
  plan: string
): Promise<PrepareSubscriptionPaymentResult> {
  const planInfo = SUBSCRIPTION_PLANS[plan];
  if (!planInfo) throw makeError('존재하지 않는 플랜입니다.', 'NOT_FOUND', 404);

  // 이미 활성 구독 여부 확인
  const now = new Date();
  const existingActive = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.plan, plan),
      eq(subscriptions.status, 'active'),
    ))
    .limit(1);

  if (existingActive.length > 0) {
    throw makeError('이미 활성화된 구독이 있습니다.', 'ALREADY_SUBSCRIBED', 409);
  }

  const orderId = generateOrderId(userId + plan);

  await db.insert(payments).values({
    userId,
    productType: 'subscription',
    productId: plan,
    amount: String(planInfo.amount),
    currency: 'KRW',
    status: 'pending',
    provider: 'portone',
    metadata: { orderId, plan },
  });

  return { orderId, amount: planInfo.amount, planLabel: planInfo.label, plan };
}

export async function confirmSubscriptionPayment(
  userId: string,
  impUid: string,
  orderId: string,
  amount: number
): Promise<{ plan: string; currentPeriodEnd: Date }> {
  await verifyIamportPayment(impUid, amount);

  const allPending = await db.select().from(payments).where(
    and(eq(payments.userId, userId), eq(payments.productType, 'subscription'), eq(payments.status, 'pending'), eq(payments.provider, 'portone'))
  );

  const pendingPayment = allPending.find((p) => {
    const meta = p.metadata as { orderId?: string } | null;
    return meta?.orderId === orderId;
  });

  if (!pendingPayment) throw makeError('결제 정보를 찾을 수 없습니다.', 'PAYMENT_NOT_FOUND', 404);

  const plan = pendingPayment.productId;
  const planInfo = SUBSCRIPTION_PLANS[plan];
  if (!planInfo) throw makeError('플랜 정보가 올바르지 않습니다.', 'INVALID_PLAN', 400);

  await db.update(payments)
    .set({ status: 'paid', providerPaymentId: impUid, paidAt: new Date() })
    .where(eq(payments.id, pendingPayment.id));

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + planInfo.months);

  await db.insert(subscriptions).values({
    userId,
    plan,
    status: 'active',
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    providerSubscriptionId: impUid,
  });

  return { plan, currentPeriodEnd: periodEnd };
}

// ─── Exam payment check (cert.service 에서 호출용) ───────────────────────────

export async function hasExamPayment(userId: string, examId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: payments.id })
    .from(payments)
    .where(and(
      eq(payments.userId, userId),
      eq(payments.productType, 'exam'),
      eq(payments.productId, examId),
      eq(payments.status, 'paid'),
    ))
    .limit(1);
  return !!row;
}
