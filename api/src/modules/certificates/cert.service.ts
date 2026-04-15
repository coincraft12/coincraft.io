import { eq, and } from 'drizzle-orm';
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
} from '../../db/schema';
import { notifyExamResult, notifyCertIssued } from '../../lib/notifications';
import { sendExamResultEmail, sendCertIssuedEmail } from '../../lib/email';
import { redis } from '../../lib/redis';
import type { CreateExamDto, AddQuestionDto } from './cert.schema';
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
      prerequisiteCourseId: certExams.prerequisiteCourseId,
      createdAt: certExams.createdAt,
    })
    .from(certExams)
    .where(eq(certExams.isActive, true))
    .orderBy(certExams.level, certExams.createdAt);

  return rows;
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

  return { ...exam, questionCount: questions.length, prerequisiteCourse };
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

  // Check exam payment (유료 시험인 경우 결제 확인)
  if (Number(exam.examFee) > 0) {
    const paid = await hasExamPayment(userId, examId);
    if (!paid) {
      throw makeError('시험 응시권이 없습니다. 결제 후 응시해주세요.', 'PAYMENT_REQUIRED', 402);
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

  // Check if already has in-progress attempt
  const [existing] = await db
    .select({ id: examAttempts.id })
    .from(examAttempts)
    .where(
      and(
        eq(examAttempts.userId, userId),
        eq(examAttempts.examId, examId),
        eq(examAttempts.status, 'in_progress')
      )
    )
    .limit(1);

  if (existing) {
    throw makeError('이미 진행 중인 시험이 있습니다.', 'ALREADY_IN_PROGRESS', 409);
  }

  // Create attempt
  const [attempt] = await db
    .insert(examAttempts)
    .values({ userId, examId, status: 'in_progress' })
    .returning({ id: examAttempts.id, startedAt: examAttempts.startedAt });

  // Fetch questions (without correctIndex and explanation)
  const questions = await db
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

  return {
    attemptId: attempt.id,
    startedAt: attempt.startedAt,
    timeLimit: exam.timeLimit,
    questions,
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

  const elapsedSeconds = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);
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
      registeredAt: examRegistrations.registeredAt,
      examTitle: certExams.title,
      examLevel: certExams.level,
    })
    .from(examRegistrations)
    .innerJoin(certExams, eq(examRegistrations.examId, certExams.id))
    .where(eq(examRegistrations.userId, userId))
    .orderBy(examRegistrations.registeredAt);

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
    })
    .returning();

  return exam;
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
