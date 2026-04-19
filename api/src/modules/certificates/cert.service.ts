import { eq, and, desc, sql, inArray, not } from 'drizzle-orm';
import { db } from '../../db';
import {
  certExams,
  examQuestions,
  examAttempts,
  examRegistrations,
  certificates,
  enrollments,
  courses,
  users,
  payments,
} from '../../db/schema';
import { notifyExamResult, notifyCertIssued } from '../../lib/notifications';
import { sendExamResultEmail, sendCertIssuedEmail } from '../../lib/email';
import { redis } from '../../lib/redis';
import type { CreateExamDto, UpdateExamDto, AddQuestionDto } from './cert.schema';
import { hasExamPayment } from '../payment/payment.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeError(message: string, code: string, status: number): Error {
  return Object.assign(new Error(message), { code, status });
}

function toDateStr(date: Date): string {
  const y = String(date.getFullYear()).slice(2);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function computeRegistrationOpen(start: Date | string | null, end: Date | string | null): boolean | null {
  if (!start || !end) return null;
  const now = new Date();
  return new Date(start) <= now && now <= new Date(end);
}

const ACTIVE_STATUSES = ['registered', 'payment_completed'] as const;

// ─── Public: Exam listing ─────────────────────────────────────────────────────

export async function listExams() {
  const rows = await db
    .select({
      id: certExams.id,
      title: certExams.title,
      level: certExams.level,
      description: certExams.description,
      passingScore: certExams.passingScore,
      timeLimit: certExams.timeLimit,
      examFee: certExams.examFee,
      maxCapacity: certExams.maxCapacity,
      prerequisiteCourseId: certExams.prerequisiteCourseId,
      examDate: certExams.examDate,
      registrationStart: certExams.registrationStart,
      registrationEnd: certExams.registrationEnd,
      examRound: certExams.examRound,
      pdfDeliveryDate: certExams.pdfDeliveryDate,
      createdAt: certExams.createdAt,
      registeredCount: sql<number>`(
        SELECT count(*)::int FROM exam_registrations
        WHERE exam_id = ${certExams.id}
        AND status IN ('registered', 'payment_completed')
      )`,
    })
    .from(certExams)
    .where(eq(certExams.isActive, true))
    .orderBy(certExams.examRound, certExams.level);

  return rows.map((r) => ({
    ...r,
    isRegistrationOpen: computeRegistrationOpen(r.registrationStart, r.registrationEnd),
  }));
}

export async function getExam(examId: string) {
  const [exam] = await db
    .select({
      id: certExams.id,
      title: certExams.title,
      level: certExams.level,
      description: certExams.description,
      passingScore: certExams.passingScore,
      timeLimit: certExams.timeLimit,
      examFee: certExams.examFee,
      isActive: certExams.isActive,
      prerequisiteCourseId: certExams.prerequisiteCourseId,
      maxCapacity: certExams.maxCapacity,
      examDate: certExams.examDate,
      registrationStart: certExams.registrationStart,
      registrationEnd: certExams.registrationEnd,
      examRound: certExams.examRound,
      pdfDeliveryDate: certExams.pdfDeliveryDate,
      createdAt: certExams.createdAt,
    })
    .from(certExams)
    .where(eq(certExams.id, examId))
    .limit(1);

  if (!exam) {
    throw makeError('시험을 찾을 수 없습니다.', 'NOT_FOUND', 404);
  }

  // Attach prerequisite course info if present
  let prerequisiteCourse: { id: string; title: string; slug: string } | null = null;
  if (exam.prerequisiteCourseId) {
    const [course] = await db
      .select({ id: courses.id, title: courses.title, slug: courses.slug })
      .from(courses)
      .where(eq(courses.id, exam.prerequisiteCourseId))
      .limit(1);
    if (course) prerequisiteCourse = course;
  }

  // Count questions
  const questions = await db
    .select({ id: examQuestions.id })
    .from(examQuestions)
    .where(eq(examQuestions.examId, examId));

  return {
    ...exam,
    questionCount: questions.length,
    prerequisiteCourse,
    isRegistrationOpen: computeRegistrationOpen(exam.registrationStart, exam.registrationEnd),
  };
}

// ─── Exam attempt ─────────────────────────────────────────────────────────────

export async function startExam(userId: string, examId: string) {
  // Verify exam exists and is active
  const [exam] = await db
    .select({
      id: certExams.id,
      isActive: certExams.isActive,
      prerequisiteCourseId: certExams.prerequisiteCourseId,
      timeLimit: certExams.timeLimit,
      examFee: certExams.examFee,
    })
    .from(certExams)
    .where(eq(certExams.id, examId))
    .limit(1);

  if (!exam || !exam.isActive) {
    throw makeError('시험을 찾을 수 없습니다.', 'NOT_FOUND', 404);
  }

  // Check exam payment + registration status
  if (Number(exam.examFee) > 0) {
    const [reg] = await db
      .select({ id: examRegistrations.id, status: examRegistrations.status })
      .from(examRegistrations)
      .where(and(eq(examRegistrations.userId, userId), eq(examRegistrations.examId, examId)))
      .limit(1);

    if (!reg) {
      throw makeError('시험 응시권이 없습니다. 접수 후 응시해주세요.', 'PAYMENT_REQUIRED', 402);
    }
    if (reg.status === 'refunded' || reg.status === 'cancelled') {
      throw makeError('취소 또는 환불된 접수입니다. 응시할 수 없습니다.', 'REGISTRATION_CANCELLED', 403);
    }
    if (reg.status !== 'payment_completed') {
      throw makeError('결제 완료 후 응시 가능합니다.', 'PAYMENT_REQUIRED', 402);
    }
  }

  // Check prerequisite enrollment
  if (exam.prerequisiteCourseId) {
    const [enrollment] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.userId, userId),
          eq(enrollments.courseId, exam.prerequisiteCourseId),
          eq(enrollments.status, 'active')
        )
      )
      .limit(1);

    if (!enrollment) {
      throw makeError('사전 이수 강좌를 먼저 완료해야 합니다.', 'PREREQUISITE_NOT_MET', 403);
    }
  }

  // 이미 제출 완료된 attempt가 있으면 재응시 불가
  const [submitted] = await db
    .select({ id: examAttempts.id })
    .from(examAttempts)
    .where(
      and(
        eq(examAttempts.userId, userId),
        eq(examAttempts.examId, examId),
        eq(examAttempts.status, 'submitted')
      )
    )
    .limit(1);

  if (submitted) {
    throw makeError('이미 제출 완료된 시험입니다.', 'ALREADY_SUBMITTED', 409);
  }

  // Check if already has in-progress attempt — resume instead of error
  const [existing] = await db
    .select({ id: examAttempts.id, startedAt: examAttempts.startedAt })
    .from(examAttempts)
    .where(
      and(
        eq(examAttempts.userId, userId),
        eq(examAttempts.examId, examId),
        eq(examAttempts.status, 'in_progress')
      )
    )
    .limit(1);

  const fetchQuestions = () =>
    db
      .select({
        id: examQuestions.id,
        question: examQuestions.question,
        options: examQuestions.options,
        order: examQuestions.order,
        points: examQuestions.points,
      })
      .from(examQuestions)
      .where(eq(examQuestions.examId, examId))
      .orderBy(examQuestions.order);

  if (existing) {
    // 시간 초과 여부 확인
    const elapsedSec = Math.floor((Date.now() - new Date(existing.startedAt).getTime()) / 1000);
    const timeLimitSec = exam.timeLimit * 60;
    if (elapsedSec >= timeLimitSec) {
      await db.update(examAttempts)
        .set({ status: 'submitted', submittedAt: new Date(), score: 0, isPassed: false, gradedAt: new Date() })
        .where(eq(examAttempts.id, existing.id));
      throw makeError('시험 시간이 초과되어 자동 제출되었습니다.', 'TIME_EXPIRED', 410);
    }
    // 이어받기
    const questions = await fetchQuestions();
    return {
      attemptId: existing.id,
      startedAt: existing.startedAt,
      timeLimit: exam.timeLimit,
      questions,
      resumed: true,
    };
  }

  // Create attempt
  const [attempt] = await db
    .insert(examAttempts)
    .values({ userId, examId, status: 'in_progress' })
    .returning({ id: examAttempts.id, startedAt: examAttempts.startedAt });

  const questions = await fetchQuestions();

  return {
    attemptId: attempt.id,
    startedAt: attempt.startedAt,
    timeLimit: exam.timeLimit,
    questions,
    resumed: false,
  };
}

export async function getMyExamStatus(userId: string, examId: string) {
  const [attempt] = await db
    .select({
      id: examAttempts.id,
      status: examAttempts.status,
      isPassed: examAttempts.isPassed,
      score: examAttempts.score,
    })
    .from(examAttempts)
    .where(and(eq(examAttempts.userId, userId), eq(examAttempts.examId, examId)))
    .orderBy(desc(examAttempts.startedAt))
    .limit(1);

  if (!attempt) return { status: 'not_started' as const };
  return {
    status: attempt.status as 'in_progress' | 'submitted' | 'abandoned',
    attemptId: attempt.id,
    isPassed: attempt.isPassed,
    score: attempt.score,
  };
}

export async function getAttempt(userId: string, attemptId: string) {
  const [attempt] = await db
    .select({
      id: examAttempts.id,
      examId: examAttempts.examId,
      status: examAttempts.status,
      startedAt: examAttempts.startedAt,
    })
    .from(examAttempts)
    .where(
      and(
        eq(examAttempts.id, attemptId),
        eq(examAttempts.userId, userId),
        eq(examAttempts.status, 'in_progress')
      )
    )
    .limit(1);

  if (!attempt) {
    throw makeError('진행 중인 시험을 찾을 수 없습니다.', 'NOT_FOUND', 404);
  }

  const [exam] = await db
    .select({ timeLimit: certExams.timeLimit })
    .from(certExams)
    .where(eq(certExams.id, attempt.examId))
    .limit(1);

  const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
  const timeLimitSeconds = (exam?.timeLimit ?? 60) * 60;
  const remainingSeconds = Math.max(0, timeLimitSeconds - elapsedSeconds);

  const questions = await db
    .select({
      id: examQuestions.id,
      question: examQuestions.question,
      options: examQuestions.options,
      order: examQuestions.order,
      points: examQuestions.points,
    })
    .from(examQuestions)
    .where(eq(examQuestions.examId, attempt.examId))
    .orderBy(examQuestions.order);

  return {
    ...attempt,
    elapsedSeconds,
    remainingSeconds,
    questions,
  };
}

export async function submitExam(
  userId: string,
  attemptId: string,
  answers: Record<string, number>
) {
  const [attempt] = await db
    .select({
      id: examAttempts.id,
      examId: examAttempts.examId,
      status: examAttempts.status,
      startedAt: examAttempts.startedAt,
    })
    .from(examAttempts)
    .where(
      and(
        eq(examAttempts.id, attemptId),
        eq(examAttempts.userId, userId),
        eq(examAttempts.status, 'in_progress')
      )
    )
    .limit(1);

  if (!attempt) {
    throw makeError('진행 중인 시험을 찾을 수 없습니다.', 'NOT_FOUND', 404);
  }

  const [exam] = await db
    .select({
      passingScore: certExams.passingScore,
      level: certExams.level,
    })
    .from(certExams)
    .where(eq(certExams.id, attempt.examId))
    .limit(1);

  if (!exam) {
    throw makeError('시험을 찾을 수 없습니다.', 'NOT_FOUND', 404);
  }

  // Fetch all questions with correct answers
  const questions = await db
    .select({
      id: examQuestions.id,
      correctIndex: examQuestions.correctIndex,
      points: examQuestions.points,
      explanation: examQuestions.explanation,
      question: examQuestions.question,
      options: examQuestions.options,
    })
    .from(examQuestions)
    .where(eq(examQuestions.examId, attempt.examId));

  // Calculate score
  let totalPoints = 0;
  let earnedPoints = 0;
  const feedback: Array<{
    questionId: string;
    question: string;
    options: unknown;
    selectedIndex: number | null;
    correctIndex: number;
    isCorrect: boolean;
    explanation: string | null;
  }> = [];

  for (const q of questions) {
    totalPoints += q.points;
    const selected = answers[q.id] ?? null;
    const isCorrect = selected === q.correctIndex;
    if (isCorrect) earnedPoints += q.points;
    feedback.push({
      questionId: q.id,
      question: q.question,
      options: q.options,
      selectedIndex: selected,
      correctIndex: q.correctIndex,
      isCorrect,
      explanation: q.explanation ?? null,
    });
  }

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const isPassed = score >= exam.passingScore;

  await db
    .update(examAttempts)
    .set({
      status: 'submitted',
      score,
      isPassed,
      answers: answers as unknown as Record<string, unknown>,
      submittedAt: new Date(),
      gradedAt: new Date(),
    })
    .where(eq(examAttempts.id, attemptId));

  let certificate = null;
  if (isPassed) {
    certificate = await issueCertificate(userId, attempt.examId, exam.level);
  }

  // 알림톡 + 이메일 — 합격/불합격 통보
  const [[eu], [ex]] = await Promise.all([
    db.select({ name: users.name, phone: users.phone, email: users.email }).from(users).where(eq(users.id, userId)).limit(1),
    db.select({ title: certExams.title }).from(certExams).where(eq(certExams.id, attempt.examId)).limit(1),
  ]);
  if (ex?.title) {
    const result = isPassed ? '합격' : '불합격';
    if (eu?.phone) notifyExamResult(eu.phone, eu.name, ex.title, result, score).catch(() => {});
    if (eu?.email) sendExamResultEmail(eu.email, eu.name, ex.title, result, score).catch(() => {});
    if (isPassed && certificate) {
      if (eu?.phone) notifyCertIssued(eu.phone, eu.name, ex.title, certificate.certNumber, certificate.issuedAt).catch(() => {});
      if (eu?.email) sendCertIssuedEmail(eu.email, eu.name, ex.title, certificate.certNumber, certificate.issuedAt).catch(() => {});
    }
  }

  return { score, isPassed, passingScore: exam.passingScore, feedback, certificate };
}

export async function getAttemptResult(userId: string, attemptId: string) {
  const [attempt] = await db
    .select({
      id: examAttempts.id,
      examId: examAttempts.examId,
      status: examAttempts.status,
      score: examAttempts.score,
      isPassed: examAttempts.isPassed,
      answers: examAttempts.answers,
    })
    .from(examAttempts)
    .where(and(eq(examAttempts.id, attemptId), eq(examAttempts.userId, userId)))
    .limit(1);

  if (!attempt || attempt.status !== 'submitted') {
    throw makeError('제출된 시험 결과를 찾을 수 없습니다.', 'NOT_FOUND', 404);
  }

  const [exam] = await db
    .select({ passingScore: certExams.passingScore })
    .from(certExams)
    .where(eq(certExams.id, attempt.examId))
    .limit(1);

  const questions = await db
    .select({
      id: examQuestions.id,
      question: examQuestions.question,
      options: examQuestions.options,
      correctIndex: examQuestions.correctIndex,
      explanation: examQuestions.explanation,
    })
    .from(examQuestions)
    .where(eq(examQuestions.examId, attempt.examId));

  const savedAnswers = (attempt.answers ?? {}) as Record<string, number>;
  const feedback = questions.map((q) => {
    const selectedIndex = savedAnswers[q.id] ?? null;
    return {
      questionId: q.id,
      question: q.question,
      options: q.options,
      selectedIndex,
      correctIndex: q.correctIndex,
      isCorrect: selectedIndex === q.correctIndex,
      explanation: q.explanation ?? null,
    };
  });

  const [cert] = await db
    .select({ id: certificates.id, certNumber: certificates.certNumber, level: certificates.level })
    .from(certificates)
    .where(and(eq(certificates.userId, userId), eq(certificates.examId, attempt.examId)))
    .limit(1);

  return {
    score: attempt.score ?? 0,
    isPassed: attempt.isPassed ?? false,
    passingScore: exam?.passingScore ?? 70,
    feedback,
    certificate: cert ?? null,
  };
}

// ─── Certificate ──────────────────────────────────────────────────────────────

export async function issueCertificate(userId: string, examId: string, level: string) {
  // Check if already has certificate for this exam
  const [existing] = await db
    .select({ id: certificates.id, certNumber: certificates.certNumber, level: certificates.level, issuedAt: certificates.issuedAt })
    .from(certificates)
    .where(and(eq(certificates.userId, userId), eq(certificates.examId, examId)))
    .limit(1);

  if (existing) return existing;

  const certNumber = await generateCertNumber(level);

  const [cert] = await db
    .insert(certificates)
    .values({
      userId,
      examId,
      level,
      certNumber,
    })
    .returning({
      id: certificates.id,
      certNumber: certificates.certNumber,
      level: certificates.level,
      issuedAt: certificates.issuedAt,
    });


  return cert;
}

export async function generateCertNumber(level: string): Promise<string> {
  const levelCode = level.toUpperCase().slice(0, 3);
  const dateStr = toDateStr(new Date());
  const key = `cert:seq:${levelCode}:${dateStr}`;
  const seq = await redis.incr(key);
  // Expire key after 2 days to clean up
  await redis.expire(key, 172800);
  const seqStr = String(seq).padStart(4, '0');
  return `CC-${levelCode}-${dateStr}-${seqStr}`;
}

export async function getMyExamRegistrations(userId: string) {
  const rows = await db
    .select({
      id: examRegistrations.id,
      examId: examRegistrations.examId,
      registrationNumber: examRegistrations.registrationNumber,
      applicantName: examRegistrations.applicantName,
      status: examRegistrations.status,
      pdfSent: examRegistrations.pdfSent,
      registeredAt: examRegistrations.registeredAt,
      refundedAt: examRegistrations.refundedAt,
      examTitle: certExams.title,
      examLevel: certExams.level,
      examRound: certExams.examRound,
      examDate: certExams.examDate,
    })
    .from(examRegistrations)
    .innerJoin(certExams, eq(examRegistrations.examId, certExams.id))
    .where(eq(examRegistrations.userId, userId))
    .orderBy(desc(examRegistrations.registeredAt));

  return rows;
}

export async function getMyCertificates(userId: string) {
  const rows = await db
    .select({
      id: certificates.id,
      certNumber: certificates.certNumber,
      level: certificates.level,
      issuedAt: certificates.issuedAt,
      expiresAt: certificates.expiresAt,
      examId: certificates.examId,
    })
    .from(certificates)
    .where(eq(certificates.userId, userId))
    .orderBy(certificates.issuedAt);

  return rows;
}

export async function verifyCertificate(certNumber: string) {
  const [cert] = await db
    .select({
      id: certificates.id,
      certNumber: certificates.certNumber,
      level: certificates.level,
      issuedAt: certificates.issuedAt,
      expiresAt: certificates.expiresAt,
      userId: certificates.userId,
    })
    .from(certificates)
    .where(eq(certificates.certNumber, certNumber))
    .limit(1);

  if (!cert) {
    throw makeError('자격증을 찾을 수 없습니다.', 'NOT_FOUND', 404);
  }

  // Get user name (no sensitive info)
  const [user] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, cert.userId))
    .limit(1);

  return {
    certNumber: cert.certNumber,
    level: cert.level,
    issuedAt: cert.issuedAt,
    expiresAt: cert.expiresAt ?? null,
    holderName: user?.name ?? '알 수 없음',
    isValid: cert.expiresAt ? cert.expiresAt > new Date() : true,
  };
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function createExam(dto: CreateExamDto) {
  const [exam] = await db
    .insert(certExams)
    .values({
      title: dto.title,
      level: dto.level,
      description: dto.description ?? null,
      passingScore: dto.passingScore,
      timeLimit: dto.timeLimit,
      isActive: dto.isActive,
      prerequisiteCourseId: dto.prerequisiteCourseId ?? null,
      examFee: String(dto.examFee),
      maxCapacity: dto.maxCapacity ?? null,
      pdfDeliveryDate: dto.pdfDeliveryDate ?? null,
      pdfFileUrl: dto.pdfFileUrl ?? null,
      examDate: dto.examDate ?? null,
      registrationStart: dto.registrationStart ? new Date(dto.registrationStart) : null,
      registrationEnd: dto.registrationEnd ? new Date(dto.registrationEnd) : null,
      examRound: dto.examRound,
    })
    .returning();

  return exam;
}

export async function updateExam(examId: string, dto: UpdateExamDto) {
  const [existing] = await db.select({ id: certExams.id }).from(certExams).where(eq(certExams.id, examId)).limit(1);
  if (!existing) throw makeError('시험을 찾을 수 없습니다.', 'NOT_FOUND', 404);

  const updateValues: Record<string, unknown> = {};
  if (dto.title !== undefined) updateValues.title = dto.title;
  if (dto.level !== undefined) updateValues.level = dto.level;
  if (dto.description !== undefined) updateValues.description = dto.description;
  if (dto.passingScore !== undefined) updateValues.passingScore = dto.passingScore;
  if (dto.timeLimit !== undefined) updateValues.timeLimit = dto.timeLimit;
  if (dto.isActive !== undefined) updateValues.isActive = dto.isActive;
  if (dto.prerequisiteCourseId !== undefined) updateValues.prerequisiteCourseId = dto.prerequisiteCourseId;
  if (dto.examFee !== undefined) updateValues.examFee = String(dto.examFee);
  if (dto.maxCapacity !== undefined) updateValues.maxCapacity = dto.maxCapacity;
  if (dto.pdfDeliveryDate !== undefined) updateValues.pdfDeliveryDate = dto.pdfDeliveryDate;
  if (dto.pdfFileUrl !== undefined) updateValues.pdfFileUrl = dto.pdfFileUrl;
  if (dto.examDate !== undefined) updateValues.examDate = dto.examDate;
  if (dto.registrationStart !== undefined) updateValues.registrationStart = dto.registrationStart ? new Date(dto.registrationStart) : null;
  if (dto.registrationEnd !== undefined) updateValues.registrationEnd = dto.registrationEnd ? new Date(dto.registrationEnd) : null;
  if (dto.examRound !== undefined) updateValues.examRound = dto.examRound;

  const [updated] = await db.update(certExams).set(updateValues).where(eq(certExams.id, examId)).returning();
  return updated;
}

export async function addQuestion(examId: string, dto: AddQuestionDto) {
  // Verify exam exists
  const [exam] = await db
    .select({ id: certExams.id })
    .from(certExams)
    .where(eq(certExams.id, examId))
    .limit(1);

  if (!exam) {
    throw makeError('시험을 찾을 수 없습니다.', 'NOT_FOUND', 404);
  }

  const [question] = await db
    .insert(examQuestions)
    .values({
      examId,
      question: dto.question,
      options: dto.options,
      correctIndex: dto.correctIndex,
      explanation: dto.explanation ?? null,
      order: dto.order,
      points: dto.points,
    })
    .returning();

  return question;
}

export async function bulkImportQuestions(examId: string, questions: AddQuestionDto[]) {
  const [exam] = await db
    .select({ id: certExams.id })
    .from(certExams)
    .where(eq(certExams.id, examId))
    .limit(1);

  if (!exam) {
    throw makeError('시험을 찾을 수 없습니다.', 'NOT_FOUND', 404);
  }

  const inserted = await db
    .insert(examQuestions)
    .values(
      questions.map((q) => ({
        examId,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation ?? null,
        order: q.order,
        points: q.points,
      }))
    )
    .returning();

  return inserted;
}

// ─── Admin: 시험 관리 ──────────────────────────────────────────────────────────

export async function listAdminExams() {
  const rows = await db
    .select({
      id: certExams.id,
      title: certExams.title,
      level: certExams.level,
      isActive: certExams.isActive,
      examRound: certExams.examRound,
      examDate: certExams.examDate,
      registrationStart: certExams.registrationStart,
      registrationEnd: certExams.registrationEnd,
      examFee: certExams.examFee,
      maxCapacity: certExams.maxCapacity,
      pdfDeliveryDate: certExams.pdfDeliveryDate,
      pdfFileUrl: certExams.pdfFileUrl,
      createdAt: certExams.createdAt,
      totalRegistered: sql<number>`(
        SELECT count(*)::int FROM exam_registrations
        WHERE exam_id = ${certExams.id} AND status IN ('registered', 'payment_completed')
      )`,
      totalRefunded: sql<number>`(
        SELECT count(*)::int FROM exam_registrations
        WHERE exam_id = ${certExams.id} AND status = 'refunded'
      )`,
      totalPassed: sql<number>`(
        SELECT count(*)::int FROM exam_attempts
        WHERE exam_id = ${certExams.id} AND is_passed = true
      )`,
    })
    .from(certExams)
    .orderBy(desc(certExams.examRound), certExams.level);

  return rows.map((r) => ({
    ...r,
    isRegistrationOpen: computeRegistrationOpen(r.registrationStart, r.registrationEnd),
  }));
}

// ─── Admin: 접수자 목록 ────────────────────────────────────────────────────────

export async function listRegistrations(examId: string, status?: string) {
  const [exam] = await db.select({ id: certExams.id }).from(certExams).where(eq(certExams.id, examId)).limit(1);
  if (!exam) throw makeError('시험을 찾을 수 없습니다.', 'NOT_FOUND', 404);

  const conditions = [eq(examRegistrations.examId, examId)];
  if (status) conditions.push(eq(examRegistrations.status, status));

  const rows = await db
    .select({
      id: examRegistrations.id,
      registrationNumber: examRegistrations.registrationNumber,
      applicantName: examRegistrations.applicantName,
      applicantBirthdate: examRegistrations.applicantBirthdate,
      status: examRegistrations.status,
      pdfSent: examRegistrations.pdfSent,
      registeredAt: examRegistrations.registeredAt,
      refundedAt: examRegistrations.refundedAt,
      refundReason: examRegistrations.refundReason,
      userEmail: users.email,
      userPhone: users.phone,
      userName: users.name,
      paymentAmount: payments.amount,
    })
    .from(examRegistrations)
    .innerJoin(users, eq(examRegistrations.userId, users.id))
    .leftJoin(payments, eq(examRegistrations.paymentId, payments.id))
    .where(and(...conditions))
    .orderBy(examRegistrations.registeredAt);

  return rows;
}

// ─── Admin: 환불 처리 ──────────────────────────────────────────────────────────

export async function refundRegistration(registrationId: string, reason: string) {
  const [reg] = await db
    .select({ id: examRegistrations.id, status: examRegistrations.status })
    .from(examRegistrations)
    .where(eq(examRegistrations.id, registrationId))
    .limit(1);

  if (!reg) throw makeError('접수 정보를 찾을 수 없습니다.', 'NOT_FOUND', 404);
  if (reg.status === 'refunded') throw makeError('이미 환불된 접수입니다.', 'ALREADY_REFUNDED', 409);
  if (reg.status === 'cancelled') throw makeError('취소된 접수는 환불할 수 없습니다.', 'ALREADY_CANCELLED', 409);

  const [updated] = await db
    .update(examRegistrations)
    .set({ status: 'refunded', refundedAt: new Date(), refundReason: reason })
    .where(eq(examRegistrations.id, registrationId))
    .returning();

  return updated;
}

// ─── Admin: 취소 처리 ──────────────────────────────────────────────────────────

export async function cancelRegistration(registrationId: string) {
  const [reg] = await db
    .select({ id: examRegistrations.id, status: examRegistrations.status })
    .from(examRegistrations)
    .where(eq(examRegistrations.id, registrationId))
    .limit(1);

  if (!reg) throw makeError('접수 정보를 찾을 수 없습니다.', 'NOT_FOUND', 404);
  if (reg.status === 'cancelled') throw makeError('이미 취소된 접수입니다.', 'ALREADY_CANCELLED', 409);
  if (reg.status === 'refunded') throw makeError('환불된 접수는 취소할 수 없습니다.', 'ALREADY_REFUNDED', 409);

  const [updated] = await db
    .update(examRegistrations)
    .set({ status: 'cancelled' })
    .where(eq(examRegistrations.id, registrationId))
    .returning();

  return updated;
}

// ─── Admin: PDF 발송 완료 처리 ─────────────────────────────────────────────────

export async function markPdfSent(registrationId: string) {
  const [reg] = await db.select({ id: examRegistrations.id }).from(examRegistrations).where(eq(examRegistrations.id, registrationId)).limit(1);
  if (!reg) throw makeError('접수 정보를 찾을 수 없습니다.', 'NOT_FOUND', 404);

  const [updated] = await db
    .update(examRegistrations)
    .set({ pdfSent: true })
    .where(eq(examRegistrations.id, registrationId))
    .returning({ id: examRegistrations.id, pdfSent: examRegistrations.pdfSent });

  return updated;
}

// ─── Admin: 응시 결과 목록 ─────────────────────────────────────────────────────

export async function listExamResults(examId: string) {
  const [exam] = await db.select({ id: certExams.id, passingScore: certExams.passingScore }).from(certExams).where(eq(certExams.id, examId)).limit(1);
  if (!exam) throw makeError('시험을 찾을 수 없습니다.', 'NOT_FOUND', 404);

  const rows = await db
    .select({
      attemptId: examAttempts.id,
      score: examAttempts.score,
      isPassed: examAttempts.isPassed,
      submittedAt: examAttempts.submittedAt,
      userId: examAttempts.userId,
      userName: users.name,
      userEmail: users.email,
      registrationNumber: examRegistrations.registrationNumber,
      applicantName: examRegistrations.applicantName,
      registrationStatus: examRegistrations.status,
    })
    .from(examAttempts)
    .innerJoin(users, eq(examAttempts.userId, users.id))
    .leftJoin(
      examRegistrations,
      and(eq(examRegistrations.userId, examAttempts.userId), eq(examRegistrations.examId, examId))
    )
    .where(and(eq(examAttempts.examId, examId), eq(examAttempts.status, 'submitted')))
    .orderBy(desc(examAttempts.score));

  const passed = rows.filter((r) => r.isPassed);
  const failed = rows.filter((r) => !r.isPassed);

  return {
    passingScore: exam.passingScore,
    totalAttempts: rows.length,
    passCount: passed.length,
    failCount: failed.length,
    passRate: rows.length > 0 ? Math.round((passed.length / rows.length) * 100) : 0,
    results: rows,
  };
}
