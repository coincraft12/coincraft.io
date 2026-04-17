import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../../db';
import { courses, enrollments, payments, ebooks, ebookPurchases, certExams, subscriptions, users, examRegistrations } from '../../db/schema';
import { redis } from '../../lib/redis';
import { env } from '../../config/env';
import { notifyEnroll, notifyExamRegistration, notifyEbookPurchase, notifyVbank, notifyBankTransfer } from '../../lib/notifications';
import { sendEnrollEmail, sendExamRegistrationEmail, sendEbookPurchaseEmail, sendVbankEmail, sendBankTransferEmail, sendAdminPaymentNotificationEmail } from '../../lib/email';

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

interface IamportPaymentData {
  status: string;
  amount: number;
  pay_method: string;
  vbank_num?: string;
  vbank_name?: string;
  vbank_holder?: string;
  vbank_date?: number;
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

async function getIamportPayment(impUid: string, accessToken: string): Promise<IamportPaymentData> {
  const res = await fetch(`https://api.iamport.kr/payments/${encodeURIComponent(impUid)}`, {
    headers: { 'Authorization': accessToken },
  });
  if (!res.ok) throw makeError('결제 검증에 실패했습니다.', 'PAYMENT_VERIFICATION_FAILED', 400);
  const data = await res.json() as { code: number; response: IamportPaymentData };
  if (data.code !== 0) throw makeError('결제 검증에 실패했습니다.', 'PAYMENT_VERIFICATION_FAILED', 400);
  return data.response;
}

async function verifyIamportPayment(impUid: string, expectedAmount: number): Promise<void> {
  const token = await getIamportToken();
  const payment = await getIamportPayment(impUid, token);
  if (payment.status !== 'paid') {
    throw makeError('결제가 완료되지 않았습니다.', 'PAYMENT_NOT_PAID', 400);
  }
  if (payment.amount !== expectedAmount) {
    throw makeError('결제 금액이 일치하지 않습니다.', 'AMOUNT_MISMATCH', 400);
  }
}

export interface VbankInfo {
  vbankNum: string;
  vbankName: string;
  vbankHolder: string;
  vbankDate: number;
  orderId: string;
}

async function verifyIamportVbank(impUid: string, expectedAmount: number): Promise<IamportPaymentData> {
  const token = await getIamportToken();
  const payment = await getIamportPayment(impUid, token);
  if (payment.status !== 'ready') {
    throw makeError('가상계좌 발급이 완료되지 않았습니다.', 'VBANK_NOT_READY', 400);
  }
  if (payment.amount !== expectedAmount) {
    throw makeError('결제 금액이 일치하지 않습니다.', 'AMOUNT_MISMATCH', 400);
  }
  return payment;
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

  // Update payment to paid + create enrollment atomically
  await db.transaction(async (tx) => {
    await tx
      .update(payments)
      .set({
        status: 'paid',
        providerPaymentId: impUid,
        paidAt: new Date(),
      })
      .where(eq(payments.id, pendingPayment.id));

    const [existingEnrollment] = await tx
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
      .limit(1);

    if (!existingEnrollment) {
      await tx.insert(enrollments).values({
        userId,
        courseId,
        status: 'active',
        paymentId: pendingPayment.id,
      });
    }
  });

  // 알림톡 + 이메일 — 수강신청 완료 (실패해도 결제 흐름에 영향 없음)
  const [u] = await db.select({ name: users.name, phone: users.phone, email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  if (u?.phone) notifyEnroll(u.phone, u.name, course.title).catch(() => {});
  if (u?.email) sendEnrollEmail(u.email, u.name, course.title).catch(() => {});

  // 관리자 알림
  import('../../lib/admin-notify').then(({ sendAdminNotification }) => {
    sendAdminNotification(
      '결제 완료',
      `<p>강좌 결제가 완료되었습니다.</p>
       <p>수강생: ${u?.name ?? userId} (${u?.email ?? ''})</p>
       <p>강좌: ${course.title}</p>
       <p>금액: ₩${amount.toLocaleString()}</p>
       <p>주문번호: ${orderId}</p>`
    ).catch(() => {});
  }).catch(() => {});

  return { courseId: course.id, courseSlug: course.slug };
}

export async function handleWebhook(impUid: string, merchantUid: string): Promise<void> {
  // PortOne V1 서버 알림 처리 — 클라이언트 confirm 누락 케이스 보완
  const allPending = await db
    .select()
    .from(payments)
    .where(and(eq(payments.status, 'pending'), eq(payments.provider, 'portone')));

  const pendingPayment = allPending.find((p) => {
    const meta = p.metadata as { orderId?: string } | null;
    return meta?.orderId === merchantUid;
  });

  if (!pendingPayment) return; // 이미 처리됐거나 존재하지 않는 주문

  const expectedAmount = Math.round(Number(pendingPayment.amount));
  await verifyIamportPayment(impUid, expectedAmount);

  await db.transaction(async (tx) => {
    await tx
      .update(payments)
      .set({ status: 'paid', providerPaymentId: impUid, paidAt: new Date() })
      .where(eq(payments.id, pendingPayment.id));

    if (pendingPayment.productType === 'course') {
      const [existing] = await tx
        .select({ id: enrollments.id })
        .from(enrollments)
        .where(and(eq(enrollments.userId, pendingPayment.userId), eq(enrollments.courseId, pendingPayment.productId)))
        .limit(1);
      if (!existing) {
        await tx.insert(enrollments).values({
          userId: pendingPayment.userId,
          courseId: pendingPayment.productId,
          status: 'active',
          paymentId: pendingPayment.id,
        });
      }
    } else if (pendingPayment.productType === 'exam') {
      const meta = pendingPayment.metadata as { orderId?: string; applicantName?: string; applicantBirthdate?: string } | null;
      const [existing] = await tx
        .select({ id: examRegistrations.id })
        .from(examRegistrations)
        .where(and(eq(examRegistrations.userId, pendingPayment.userId), eq(examRegistrations.examId, pendingPayment.productId)))
        .limit(1);
      if (!existing) {
        const [[u], [ex]] = await Promise.all([
          tx.select({ name: users.name }).from(users).where(eq(users.id, pendingPayment.userId)).limit(1),
          tx.select({ level: certExams.level }).from(certExams).where(eq(certExams.id, pendingPayment.productId)).limit(1),
        ]);
        const regNumber = await generateRegistrationNumber(ex?.level ?? pendingPayment.productId);
        await tx.insert(examRegistrations).values({
          userId: pendingPayment.userId,
          examId: pendingPayment.productId,
          paymentId: pendingPayment.id,
          applicantName: meta?.applicantName ?? u?.name ?? '',
          applicantBirthdate: meta?.applicantBirthdate ?? '',
          registrationNumber: regNumber,
        });
      }
    }
  });
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

  // Update payment to paid + create ebook purchase atomically
  await db.transaction(async (tx) => {
    await tx
      .update(payments)
      .set({ status: 'paid', providerPaymentId: impUid, paidAt: new Date() })
      .where(eq(payments.id, pendingPayment.id));

    const [existingPurchase] = await tx
      .select({ id: ebookPurchases.id })
      .from(ebookPurchases)
      .where(and(eq(ebookPurchases.userId, userId), eq(ebookPurchases.ebookId, ebookId)))
      .limit(1);

    if (!existingPurchase) {
      await tx.insert(ebookPurchases).values({
        userId,
        ebookId,
        paymentId: pendingPayment.id,
      });
    }
  });

  // 알림톡 + 이메일 — 전자책 구매 완료
  const [eb] = await db.select({ title: ebooks.title }).from(ebooks).where(eq(ebooks.id, ebookId)).limit(1);
  const [uu] = await db.select({ name: users.name, phone: users.phone, email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  if (uu?.phone && eb?.title) notifyEbookPurchase(uu.phone, uu.name, eb.title, pendingPayment.id).catch(() => {});
  if (uu?.email && eb?.title) sendEbookPurchaseEmail(uu.email, uu.name, eb.title, pendingPayment.id).catch(() => {});
  import('../../lib/admin-notify').then(({ sendAdminNotification }) => {
    sendAdminNotification('전자책 결제 완료',
      `<p>전자책 구매가 완료되었습니다.</p>
       <p>구매자: ${uu?.name ?? ''} (${uu?.email ?? ''})</p>
       <p>도서: ${eb?.title ?? ebookId}</p>
       <p>금액: ₩${amount.toLocaleString()}</p>`
    ).catch(() => {});
  }).catch(() => {});

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

  // 이름 + 생년월일 중복 접수 차단
  if (name?.trim() && birthdate) {
    const [dup] = await db
      .select({ id: examRegistrations.id })
      .from(examRegistrations)
      .where(and(
        eq(examRegistrations.examId, examId),
        eq(examRegistrations.applicantName, name.trim()),
        eq(examRegistrations.applicantBirthdate, birthdate),
      ))
      .limit(1);
    if (dup) {
      throw makeError('이미 접수된 수험자입니다. (이름 + 생년월일 중복)', 'ALREADY_REGISTERED', 409);
    }
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

  // 전화번호만 사용자 레코드에 저장 (이름은 examRegistrations에 저장)
  if (phone) {
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length >= 10) {
      await db.update(users).set({ phone: cleaned }).where(eq(users.id, userId));
    }
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

  const examId = pendingPayment.productId;
  const meta = pendingPayment.metadata as { orderId?: string; applicantName?: string | null; applicantBirthdate?: string | null } | null;
  const applicantName = meta?.applicantName ?? null;
  const applicantBirthdate = meta?.applicantBirthdate ?? null;

  const [[eu], [ex]] = await Promise.all([
    db.select({ name: users.name, phone: users.phone, email: users.email }).from(users).where(eq(users.id, userId)).limit(1),
    db.select({ title: certExams.title, level: certExams.level, maxCapacity: certExams.maxCapacity }).from(certExams).where(eq(certExams.id, examId)).limit(1),
  ]);

  // 정원 초과 체크
  if (ex?.maxCapacity != null) {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(examRegistrations)
      .where(eq(examRegistrations.examId, examId));
    if (count >= ex.maxCapacity) {
      throw makeError('접수 정원이 마감되었습니다.', 'EXAM_CAPACITY_FULL', 409);
    }
  }

  // 수험번호 생성 + DB 저장 (payment 상태 업데이트와 등록 레코드 생성을 트랜잭션으로 처리)
  let registrationNumber = '';
  if (ex?.level) {
    registrationNumber = await generateRegistrationNumber(ex.level);
  }

  await db.transaction(async (tx) => {
    // 트랜잭션 내 최종 중복 체크 (race condition 방지)
    if (applicantName && applicantBirthdate) {
      const [dup] = await tx
        .select({ id: examRegistrations.id })
        .from(examRegistrations)
        .where(and(
          eq(examRegistrations.examId, examId),
          eq(examRegistrations.applicantName, applicantName),
          eq(examRegistrations.applicantBirthdate, applicantBirthdate),
        ))
        .limit(1);
      if (dup) throw makeError('이미 접수된 수험자입니다.', 'ALREADY_REGISTERED', 409);
    }

    await tx.update(payments)
      .set({ status: 'paid', providerPaymentId: impUid, paidAt: new Date() })
      .where(eq(payments.id, pendingPayment.id));

    if (registrationNumber) {
      await tx.insert(examRegistrations).values({
        userId,
        examId,
        paymentId: pendingPayment.id,
        registrationNumber,
        applicantName,
        applicantBirthdate,
      });
    }
  });

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

  // 관리자 알림
  import('../../lib/admin-notify').then(({ sendAdminNotification }) => {
    sendAdminNotification(
      '시험 접수 완료',
      `<p>시험 접수가 완료되었습니다.</p>
       <p>수험자: ${displayName} (${eu?.email ?? ''})</p>
       <p>시험: ${ex?.title ?? examId}</p>
       <p>수험번호: ${registrationNumber}</p>
       <p>금액: ₩${amount.toLocaleString()}</p>`
    ).catch(() => {});
  }).catch(() => {});

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

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + planInfo.months);

  // Update payment + create subscription atomically
  await db.transaction(async (tx) => {
    await tx.update(payments)
      .set({ status: 'paid', providerPaymentId: impUid, paidAt: new Date() })
      .where(eq(payments.id, pendingPayment.id));

    await tx.insert(subscriptions).values({
      userId,
      plan,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      providerSubscriptionId: impUid,
    });
  });

  const [su] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  import('../../lib/admin-notify').then(({ sendAdminNotification }) => {
    sendAdminNotification('구독 결제 완료',
      `<p>구독 결제가 완료되었습니다.</p>
       <p>구독자: ${su?.name ?? ''} (${su?.email ?? ''})</p>
       <p>플랜: ${planInfo.label}</p>
       <p>금액: ₩${amount.toLocaleString()}</p>
       <p>만료일: ${periodEnd.toLocaleDateString('ko-KR')}</p>`
    ).catch(() => {});
  }).catch(() => {});

  return { plan, currentPeriodEnd: periodEnd };
}

// ─── Refund ───────────────────────────────────────────────────────────────────

export async function refundPayment(userId: string, paymentId: string): Promise<{ refunded: boolean }> {
  // 1. Find payment (must belong to user, status must be 'paid')
  const [payment] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.id, paymentId), eq(payments.userId, userId)))
    .limit(1);

  if (!payment) {
    throw makeError('결제 정보를 찾을 수 없습니다.', 'PAYMENT_NOT_FOUND', 404);
  }
  if (payment.status !== 'paid') {
    throw makeError('환불 가능한 결제 상태가 아닙니다.', 'INVALID_STATUS', 400);
  }
  if (!payment.providerPaymentId) {
    throw makeError('결제 공급자 정보가 없습니다.', 'MISSING_IMP_UID', 400);
  }

  // 2. Get PortOne access token
  if (!env.PORTONE_IMP_KEY || !env.PORTONE_IMP_SECRET) {
    throw makeError('결제 설정이 올바르지 않습니다.', 'CONFIG_ERROR', 500);
  }

  const tokenRes = await fetch('https://api.iamport.kr/users/getToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imp_key: env.PORTONE_IMP_KEY, imp_secret: env.PORTONE_IMP_SECRET }),
  });
  const tokenData = await tokenRes.json() as { code: number; response: { access_token: string } };
  if (tokenData.code !== 0) throw makeError('환불 토큰 발급에 실패했습니다.', 'TOKEN_ERROR', 500);

  // 3. Call PortOne cancel API
  const cancelRes = await fetch('https://api.iamport.kr/payments/cancel', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': tokenData.response.access_token,
    },
    body: JSON.stringify({ imp_uid: payment.providerPaymentId, reason: '사용자 환불 요청' }),
  });
  const cancelData = await cancelRes.json() as { code: number; message?: string };
  if (cancelData.code !== 0) {
    throw makeError(cancelData.message ?? '환불 처리에 실패했습니다.', 'REFUND_FAILED', 400);
  }

  // 4 & 5. Update payment status + remove access atomically
  await db.transaction(async (tx) => {
    await tx
      .update(payments)
      .set({ status: 'refunded', refundedAt: new Date() })
      .where(eq(payments.id, paymentId));

    if (payment.productType === 'course') {
      await tx
        .delete(enrollments)
        .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, payment.productId)));
    } else if (payment.productType === 'ebook') {
      await tx
        .delete(ebookPurchases)
        .where(and(eq(ebookPurchases.userId, userId), eq(ebookPurchases.ebookId, payment.productId)));
    } else if (payment.productType === 'exam') {
      await tx
        .delete(examRegistrations)
        .where(and(eq(examRegistrations.userId, userId), eq(examRegistrations.examId, payment.productId)));
    }
  });

  return { refunded: true };
}

// ─── 가상계좌 confirm ─────────────────────────────────────────────────────────

export async function confirmVbankPayment(
  userId: string,
  impUid: string,
  orderId: string,
  amount: number
): Promise<VbankInfo> {
  const paymentData = await verifyIamportVbank(impUid, amount);

  const allPending = await db
    .select()
    .from(payments)
    .where(and(eq(payments.userId, userId), eq(payments.status, 'pending'), eq(payments.provider, 'portone')));

  const pendingPayment = allPending.find((p) => {
    const meta = p.metadata as { orderId?: string } | null;
    return meta?.orderId === orderId;
  });

  if (!pendingPayment) throw makeError('결제 정보를 찾을 수 없습니다.', 'PAYMENT_NOT_FOUND', 404);

  await db.update(payments)
    .set({ providerPaymentId: impUid })
    .where(eq(payments.id, pendingPayment.id));

  const vbankInfo: VbankInfo = {
    vbankNum: paymentData.vbank_num ?? '',
    vbankName: paymentData.vbank_name ?? '',
    vbankHolder: paymentData.vbank_holder ?? '',
    vbankDate: paymentData.vbank_date ?? 0,
    orderId,
  };

  // 알림 발송 (강좌 또는 시험 모두 처리)
  const [u] = await db.select({ name: users.name, phone: users.phone, email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  let productTitle = '';
  if (pendingPayment.productType === 'exam') {
    const [ex] = await db.select({ title: certExams.title }).from(certExams).where(eq(certExams.id, pendingPayment.productId)).limit(1);
    productTitle = ex?.title ?? '';
  } else {
    const [c] = await db.select({ title: courses.title }).from(courses).where(eq(courses.id, pendingPayment.productId)).limit(1);
    productTitle = c?.title ?? '';
  }
  const expiry = vbankInfo.vbankDate
    ? new Date(vbankInfo.vbankDate * 1000).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '';
  const paidAmount = Math.round(Number(pendingPayment.amount));
  if (u?.phone && productTitle) notifyVbank(u.phone, u.name, productTitle, vbankInfo.vbankName, vbankInfo.vbankNum, paidAmount, expiry).catch(() => {});
  if (u?.email && productTitle) sendVbankEmail(u.email, u.name, productTitle, vbankInfo.vbankName, vbankInfo.vbankNum, vbankInfo.vbankHolder, paidAmount, expiry).catch(() => {});

  return vbankInfo;
}

// ─── 결제 실패/취소 처리 ─────────────────────────────────────────────────────

export async function cancelPendingPayment(userId: string, orderId: string): Promise<void> {
  const allPending = await db
    .select()
    .from(payments)
    .where(and(eq(payments.userId, userId), eq(payments.status, 'pending'), eq(payments.provider, 'portone')));

  const payment = allPending.find((p) => {
    const meta = p.metadata as { orderId?: string } | null;
    return meta?.orderId === orderId;
  });

  if (!payment) return; // 이미 처리됐거나 없으면 무시

  await db.update(payments)
    .set({ status: 'failed' })
    .where(eq(payments.id, payment.id));
}

// ─── 무통장 입금 (직접 계좌이체) ────────────────────────────────────────────

export interface BankTransferInfo {
  paymentId: string;
  orderId: string;
  amount: number;
  courseName: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
}

export async function prepareBankTransfer(
  userId: string,
  courseId: string
): Promise<BankTransferInfo> {
  const [course] = await db
    .select({ id: courses.id, title: courses.title, price: courses.price, isFree: courses.isFree, isPublished: courses.isPublished })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course || !course.isPublished) throw makeError('강좌를 찾을 수 없습니다.', 'NOT_FOUND', 404);
  if (course.isFree) throw makeError('무료 강좌는 결제가 필요하지 않습니다.', 'BAD_REQUEST', 400);

  const [existing] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
    .limit(1);

  if (existing) throw makeError('이미 수강 중인 강좌입니다.', 'ALREADY_ENROLLED', 409);

  const orderId = generateOrderId(courseId);
  const amount = Math.round(Number(course.price));

  const [inserted] = await db.insert(payments).values({
    userId,
    productType: 'course',
    productId: courseId,
    amount: String(amount),
    currency: 'KRW',
    status: 'pending',
    provider: 'bank_transfer',
    metadata: { orderId },
  }).returning({ id: payments.id });

  // 알림 발송
  const [u] = await db.select({ name: users.name, phone: users.phone, email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  if (u?.phone) notifyBankTransfer(u.phone, u.name, course.title, amount).catch(() => {});
  if (u?.email) sendBankTransferEmail(u.email, u.name, course.title, amount).catch(() => {});
  import('../../lib/admin-notify').then(({ sendAdminNotification }) => {
    sendAdminNotification('무통장 입금 신청 — 강좌',
      `<p>무통장 입금 신청이 접수되었습니다. <strong>관리자 수동 승인이 필요합니다.</strong></p>
       <p>신청자: ${u?.name ?? ''} (${u?.email ?? ''})</p>
       <p>강좌: ${course.title}</p>
       <p>금액: ₩${amount.toLocaleString()}</p>
       <p><a href="${env.FRONTEND_URL}/admin/payments" style="color:#f59e0b;">결제 관리 페이지 바로가기</a></p>`
    ).catch(() => {});
  }).catch(() => {});

  return {
    paymentId: inserted.id,
    orderId,
    amount,
    courseName: course.title,
    bankName: '하나은행',
    bankAccount: '398-910040-13304',
    bankHolder: '(주)코인크래프트',
  };
}

export async function approveBankTransferPayment(
  paymentId: string
): Promise<{ productId: string; productType: string; userId: string }> {
  const [payment] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.id, paymentId), eq(payments.provider, 'bank_transfer'), eq(payments.status, 'pending')))
    .limit(1);

  if (!payment) throw makeError('결제 정보를 찾을 수 없습니다.', 'PAYMENT_NOT_FOUND', 404);

  const [u] = await db.select({ name: users.name, phone: users.phone, email: users.email }).from(users).where(eq(users.id, payment.userId)).limit(1);

  if (payment.productType === 'course') {
    const courseId = payment.productId;

    await db.transaction(async (tx) => {
      await tx.update(payments).set({ status: 'paid', paidAt: new Date() }).where(eq(payments.id, paymentId));
      const [existing] = await tx.select({ id: enrollments.id }).from(enrollments)
        .where(and(eq(enrollments.userId, payment.userId), eq(enrollments.courseId, courseId))).limit(1);
      if (!existing) {
        await tx.insert(enrollments).values({ userId: payment.userId, courseId, status: 'active', paymentId: payment.id });
      }
    });

    const [c] = await db.select({ title: courses.title }).from(courses).where(eq(courses.id, courseId)).limit(1);
    if (u?.phone && c?.title) notifyEnroll(u.phone, u.name, c.title).catch(() => {});
    if (u?.email && c?.title) sendEnrollEmail(u.email, u.name, c.title).catch(() => {});

  } else if (payment.productType === 'exam') {
    const examId = payment.productId;
    const meta = payment.metadata as { orderId?: string; applicantName?: string; applicantBirthdate?: string } | null;

    const [ex] = await db.select({ title: certExams.title, level: certExams.level }).from(certExams).where(eq(certExams.id, examId)).limit(1);

    await db.transaction(async (tx) => {
      await tx.update(payments).set({ status: 'paid', paidAt: new Date() }).where(eq(payments.id, paymentId));
      const [existing] = await tx.select({ id: examRegistrations.id }).from(examRegistrations)
        .where(and(eq(examRegistrations.userId, payment.userId), eq(examRegistrations.examId, examId))).limit(1);
      if (!existing) {
        const regNumber = await generateRegistrationNumber(ex?.level ?? examId);
        await tx.insert(examRegistrations).values({
          userId: payment.userId,
          examId,
          paymentId: payment.id,
          applicantName: meta?.applicantName ?? u?.name ?? '',
          applicantBirthdate: meta?.applicantBirthdate ?? '',
          registrationNumber: regNumber,
        });
      }
    });

    const examDateTime = '2026년 5월 2일 (토) 오후 2시';
    const rulesUrl = `${env.FRONTEND_URL}/cert/exam-rules`;
    const [reg] = await db.select({ registrationNumber: examRegistrations.registrationNumber })
      .from(examRegistrations).where(and(eq(examRegistrations.userId, payment.userId), eq(examRegistrations.examId, examId))).limit(1);
    const regNum = reg?.registrationNumber ?? '';
    if (u?.phone && ex?.title) notifyExamRegistration(u.phone, u.name, ex.title, examDateTime, regNum, rulesUrl).catch(() => {});
    if (u?.email && ex?.title) sendExamRegistrationEmail(u.email, u.name, ex.title, examDateTime, regNum, rulesUrl).catch(() => {});
  }

  return { productId: payment.productId, productType: payment.productType, userId: payment.userId };
}

export async function prepareBankTransferExam(
  userId: string,
  examId: string,
  phone?: string,
  name?: string,
  birthdate?: string
): Promise<BankTransferInfo & { examTitle: string }> {
  const [exam] = await db
    .select({ id: certExams.id, title: certExams.title, examFee: certExams.examFee, isActive: certExams.isActive, level: certExams.level })
    .from(certExams)
    .where(eq(certExams.id, examId))
    .limit(1);

  if (!exam || !exam.isActive) throw makeError('시험을 찾을 수 없습니다.', 'NOT_FOUND', 404);
  const amount = Math.round(Number(exam.examFee));
  if (amount === 0) throw makeError('무료 시험은 결제가 필요하지 않습니다.', 'BAD_REQUEST', 400);

  if (name?.trim() && birthdate) {
    const [dup] = await db.select({ id: examRegistrations.id }).from(examRegistrations)
      .where(and(eq(examRegistrations.examId, examId), eq(examRegistrations.applicantName, name.trim()), eq(examRegistrations.applicantBirthdate, birthdate)))
      .limit(1);
    if (dup) throw makeError('이미 접수된 수험자입니다. (이름 + 생년월일 중복)', 'ALREADY_REGISTERED', 409);
  }

  const orderId = generateOrderId(examId);

  const [inserted] = await db.insert(payments).values({
    userId,
    productType: 'exam',
    productId: examId,
    amount: String(amount),
    currency: 'KRW',
    status: 'pending',
    provider: 'bank_transfer',
    metadata: { orderId, applicantName: name?.trim() ?? null, applicantBirthdate: birthdate ?? null },
  }).returning({ id: payments.id });

  if (phone) {
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length >= 10) await db.update(users).set({ phone: cleaned }).where(eq(users.id, userId));
  }

  const [u] = await db.select({ name: users.name, phone: users.phone, email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  if (u?.phone) notifyBankTransfer(u.phone, u.name, exam.title, amount).catch(() => {});
  if (u?.email) sendBankTransferEmail(u.email, u.name, exam.title, amount).catch(() => {});
  import('../../lib/admin-notify').then(({ sendAdminNotification }) => {
    sendAdminNotification('무통장 입금 신청 — 검정',
      `<p>검정 무통장 입금 신청이 접수되었습니다. <strong>관리자 수동 승인이 필요합니다.</strong></p>
       <p>신청자: ${u?.name ?? ''} (${u?.email ?? ''})</p>
       <p>시험: ${exam.title}</p>
       <p>금액: ₩${amount.toLocaleString()}</p>
       <p><a href="${env.FRONTEND_URL}/admin/payments" style="color:#f59e0b;">결제 관리 페이지 바로가기</a></p>`
    ).catch(() => {});
  }).catch(() => {});

  return {
    paymentId: inserted.id,
    orderId,
    amount,
    courseName: exam.title,
    examTitle: exam.title,
    bankName: '하나은행',
    bankAccount: '398-910040-13304',
    bankHolder: '(주)코인크래프트',
  };
}

// ─── Admin: 전체 결제 목록 조회 ───────────────────────────────────────────────

export interface AdminPaymentItem {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  productType: string;
  productId: string;
  amount: string;
  status: string;
  provider: string;
  createdAt: Date;
  paidAt: Date | null;
}

export async function listAllPayments(): Promise<AdminPaymentItem[]> {
  const rows = await db
    .select({
      id: payments.id,
      userId: payments.userId,
      userEmail: users.email,
      userName: users.name,
      productType: payments.productType,
      productId: payments.productId,
      amount: payments.amount,
      status: payments.status,
      provider: payments.provider,
      createdAt: payments.createdAt,
      paidAt: payments.paidAt,
    })
    .from(payments)
    .leftJoin(users, eq(payments.userId, users.id))
    .orderBy(desc(payments.createdAt));

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    userEmail: r.userEmail ?? '',
    userName: r.userName ?? '',
    productType: r.productType,
    productId: r.productId,
    amount: r.amount,
    status: r.status,
    provider: r.provider,
    createdAt: r.createdAt,
    paidAt: r.paidAt,
  }));
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
