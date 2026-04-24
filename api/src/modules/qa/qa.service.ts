import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  questions,
  answers,
  answerReactions,
  lessonReviews,
  users,
  lessons,
  courses,
  enrollments,
} from '@/db/schema';
import { generateAIAnswer } from '@/lib/anthropic';
import { sendQuestionToInstructorEmail } from '@/lib/email';
import { getVimeoTranscript } from '@/lib/video-provider/vimeo';

// ===== Types =====
export interface CreateQuestionInput {
  title: string;
  content: string;
}

export interface CreateAnswerInput {
  instructorRevision: string;
}

export interface CreateReactionInput {
  reactionType: 'helpful' | 'unhelpful';
}

export interface CreateReviewInput {
  rating: number;
  content: string;
  imageUrls?: string[];
}

export interface QuestionRow {
  id: string;
  lessonId: string;
  courseId: string;
  userId: string;
  title: string;
  content: string;
  status: string;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  userName: string | null;
  userAvatar: string | null;
  answerCount?: number;
}

export interface AnswerRow {
  id: string;
  questionId: string;
  userId: string | null;
  content: string;
  type: string;
  status: string;
  isAccepted: boolean;
  helpfulCount: number;
  unhelpfulCount: number;
  aiModel: string | null;
  instructorRevision: string | null;
  instructorRevisedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userName: string | null;
  userAvatar: string | null;
}

export interface ReviewRow {
  id: string;
  lessonId: string;
  courseId: string;
  userId: string;
  rating: number;
  content: string;
  imageUrls: string[] | null;
  isVisible: boolean;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
  userName: string | null;
  userAvatar: string | null;
}

// ===== Question Service =====

export async function createQuestion(
  lessonId: string,
  courseId: string,
  userId: string,
  input: CreateQuestionInput
) {
  const [question] = await db
    .insert(questions)
    .values({
      lessonId,
      courseId,
      userId,
      title: input.title,
      content: input.content,
      status: 'open',
    })
    .returning();

  return question;
}

export async function getQuestionsByLesson(
  lessonId: string,
  limit: number = 10,
  offset: number = 0
) {
  const result = await db
    .select({
      id: questions.id,
      lessonId: questions.lessonId,
      courseId: questions.courseId,
      userId: questions.userId,
      title: questions.title,
      content: questions.content,
      status: questions.status,
      viewCount: questions.viewCount,
      createdAt: questions.createdAt,
      updatedAt: questions.updatedAt,
      userName: users.name,
      userAvatar: users.avatarUrl,
      answerCount: sql<number>`(SELECT COUNT(*) FROM ${answers} WHERE ${answers.questionId} = ${questions.id})`.as('answerCount'),
    })
    .from(questions)
    .leftJoin(users, eq(questions.userId, users.id))
    .where(eq(questions.lessonId, lessonId))
    .orderBy(desc(questions.createdAt))
    .limit(limit)
    .offset(offset);

  return result as QuestionRow[];
}

export async function getQuestionById(questionId: string) {
  const [result] = await db
    .select({
      id: questions.id,
      lessonId: questions.lessonId,
      courseId: questions.courseId,
      userId: questions.userId,
      title: questions.title,
      content: questions.content,
      status: questions.status,
      viewCount: questions.viewCount,
      createdAt: questions.createdAt,
      updatedAt: questions.updatedAt,
      userName: users.name,
      userAvatar: users.avatarUrl,
    })
    .from(questions)
    .leftJoin(users, eq(questions.userId, users.id))
    .where(eq(questions.id, questionId));

  return result as QuestionRow | undefined;
}

export async function incrementQuestionViewCount(questionId: string) {
  await db
    .update(questions)
    .set({ viewCount: sql`${questions.viewCount} + 1` })
    .where(eq(questions.id, questionId));
}

// ===== Answer Service =====

export async function getAnswersByQuestion(questionId: string) {
  const result = await db
    .select({
      id: answers.id,
      questionId: answers.questionId,
      userId: answers.userId,
      content: answers.content,
      type: answers.type,
      status: answers.status,
      isAccepted: answers.isAccepted,
      helpfulCount: answers.helpfulCount,
      unhelpfulCount: answers.unhelpfulCount,
      aiModel: answers.aiModel,
      instructorRevision: answers.instructorRevision,
      instructorRevisedAt: answers.instructorRevisedAt,
      createdAt: answers.createdAt,
      updatedAt: answers.updatedAt,
      userName: users.name,
      userAvatar: users.avatarUrl,
    })
    .from(answers)
    .leftJoin(users, eq(answers.userId, users.id))
    .where(eq(answers.questionId, questionId))
    .orderBy(answers.createdAt);

  return result as AnswerRow[];
}

export async function createAIAnswer(
  questionId: string,
  content: string,
  aiModel: string,
  aiTokensUsed: number
) {
  const [answer] = await db
    .insert(answers)
    .values({
      questionId,
      userId: null,
      content,
      type: 'ai',
      status: 'ai_answered',
      aiModel,
      aiTokensUsed,
    })
    .returning();

  return answer;
}

export async function addInstructorAnswer(
  questionId: string,
  instructorId: string,
  instructorRevision: string
) {
  // 기존 강사 답변이 있으면 UPDATE, 없으면 INSERT
  const [existing] = await db
    .select({ id: answers.id })
    .from(answers)
    .where(and(eq(answers.questionId, questionId), eq(answers.type, 'instructor')))
    .limit(1);

  if (existing) {
    const [answer] = await db
      .update(answers)
      .set({
        content: instructorRevision,
        instructorRevision,
        instructorRevisedBy: instructorId,
        instructorRevisedAt: new Date(),
        status: 'instructor_revised',
      })
      .where(eq(answers.id, existing.id))
      .returning();
    return answer;
  }

  const [answer] = await db
    .insert(answers)
    .values({
      questionId,
      userId: instructorId,
      content: instructorRevision,
      type: 'instructor',
      status: 'instructor_revised',
      instructorRevision,
      instructorRevisedBy: instructorId,
      instructorRevisedAt: new Date(),
    })
    .returning();

  return answer;
}

export async function acceptAnswer(
  answerId: string,
  userId: string
) {
  const [answer] = await db
    .update(answers)
    .set({
      isAccepted: true,
      acceptedBy: userId,
      acceptedAt: new Date(),
    })
    .where(eq(answers.id, answerId))
    .returning();

  return answer;
}

export async function rejectAnswer(answerId: string) {
  const [answer] = await db
    .update(answers)
    .set({
      isAccepted: false,
      acceptedBy: null,
      acceptedAt: null,
    })
    .where(eq(answers.id, answerId))
    .returning();

  return answer;
}

export async function addAnswerReaction(
  answerId: string,
  userId: string,
  reactionType: 'helpful' | 'unhelpful'
) {
  // UPSERT
  const [reaction] = await db
    .insert(answerReactions)
    .values({ answerId, userId, reactionType })
    .onConflictDoUpdate({
      target: [answerReactions.answerId, answerReactions.userId],
      set: { reactionType, updatedAt: new Date() },
    })
    .returning();

  // 트리거 미설치 환경 대비 — 카운트 수동 갱신
  await db.update(answers)
    .set({
      helpfulCount: sql`(SELECT COUNT(*) FROM ${answerReactions} WHERE answer_id = ${answerId} AND reaction_type = 'helpful')`,
      unhelpfulCount: sql`(SELECT COUNT(*) FROM ${answerReactions} WHERE answer_id = ${answerId} AND reaction_type = 'unhelpful')`,
    })
    .where(eq(answers.id, answerId));

  return reaction;
}

// ===== Instructor Q&A =====

export async function getInstructorQuestions(instructorId: string, statusFilter: string) {
  const instructorCourses = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.instructorId, instructorId));

  if (!instructorCourses.length) return [];

  const courseIds = instructorCourses.map((c) => c.id);

  const questionList = await db
    .select({
      id: questions.id,
      title: questions.title,
      status: questions.status,
      viewCount: questions.viewCount,
      createdAt: questions.createdAt,
      lessonTitle: lessons.title,
      courseName: courses.title,
      userName: users.name,
      answerCount: sql<number>`(SELECT COUNT(*) FROM ${answers} WHERE question_id = ${questions.id})`.as('answerCount'),
      hasAIAnswer: sql<boolean>`EXISTS(SELECT 1 FROM ${answers} WHERE question_id = ${questions.id} AND type = 'ai')`.as('hasAIAnswer'),
      hasInstructorAnswer: sql<boolean>`EXISTS(SELECT 1 FROM ${answers} WHERE question_id = ${questions.id} AND type = 'instructor')`.as('hasInstructorAnswer'),
    })
    .from(questions)
    .leftJoin(lessons, eq(questions.lessonId, lessons.id))
    .leftJoin(courses, eq(questions.courseId, courses.id))
    .leftJoin(users, eq(questions.userId, users.id))
    .where(inArray(questions.courseId, courseIds))
    .orderBy(desc(questions.createdAt));

  return questionList.filter((q) => {
    const hasAI = Boolean(q.hasAIAnswer);
    const hasInstructor = Boolean(q.hasInstructorAnswer);
    if (statusFilter === 'unanswered') return !hasAI && !hasInstructor;
    if (statusFilter === 'ai-only') return hasAI && !hasInstructor;
    if (statusFilter === 'completed') return hasInstructor;
    return true;
  });
}

// ===== Review Service =====

export async function createReview(
  lessonId: string,
  courseId: string,
  userId: string,
  input: CreateReviewInput
) {
  const [review] = await db
    .insert(lessonReviews)
    .values({
      lessonId,
      courseId,
      userId,
      rating: input.rating,
      content: input.content,
      imageUrls: input.imageUrls || null,
    })
    .onConflictDoUpdate({
      target: [lessonReviews.lessonId, lessonReviews.userId],
      set: {
        rating: input.rating,
        content: input.content,
        imageUrls: input.imageUrls || null,
        updatedAt: new Date(),
      },
    })
    .returning();

  return review;
}

export async function getReviewsByLesson(
  lessonId: string,
  limit: number = 10,
  offset: number = 0
) {
  const result = await db
    .select({
      id: lessonReviews.id,
      lessonId: lessonReviews.lessonId,
      courseId: lessonReviews.courseId,
      userId: lessonReviews.userId,
      rating: lessonReviews.rating,
      content: lessonReviews.content,
      imageUrls: lessonReviews.imageUrls,
      isVisible: lessonReviews.isVisible,
      helpfulCount: lessonReviews.helpfulCount,
      createdAt: lessonReviews.createdAt,
      updatedAt: lessonReviews.updatedAt,
      userName: users.name,
      userAvatar: users.avatarUrl,
    })
    .from(lessonReviews)
    .leftJoin(users, eq(lessonReviews.userId, users.id))
    .where(
      and(eq(lessonReviews.lessonId, lessonId), eq(lessonReviews.isVisible, true))
    )
    .orderBy(desc(lessonReviews.createdAt))
    .limit(limit)
    .offset(offset);

  return result as ReviewRow[];
}

export async function deleteReview(reviewId: string) {
  await db.delete(lessonReviews).where(eq(lessonReviews.id, reviewId));
}

// ===== AI Answer Trigger =====

export async function triggerAIAnswerForQuestion(questionId: string) {
  try {
    // 질문 + 강의 + 강사 정보 조회
    const [q] = await db
      .select({
        id: questions.id,
        title: questions.title,
        content: questions.content,
        courseName: courses.title,
        lessonTitle: lessons.title,
        lessonTranscript: lessons.transcript,
        lessonTextContent: lessons.textContent,
        lessonVideoUrl: lessons.videoUrl,
        instructorId: courses.instructorId,
        instructorEmail: users.email,
        instructorName: users.name,
      })
      .from(questions)
      .leftJoin(lessons, eq(questions.lessonId, lessons.id))
      .leftJoin(courses, eq(questions.courseId, courses.id))
      .leftJoin(users, eq(courses.instructorId, users.id))
      .where(eq(questions.id, questionId));

    if (!q) return;

    // 컨텍스트 우선순위: DB transcript → textContent → Vimeo 실시간 fetch
    let lessonContent = q.lessonTranscript || q.lessonTextContent || '';
    if (!lessonContent && q.lessonVideoUrl) {
      const transcript = await getVimeoTranscript(q.lessonVideoUrl);
      if (transcript) {
        lessonContent = transcript;
        await db.update(lessons)
          .set({ transcript, notesStatus: 'transcript_ready' })
          .where(eq(lessons.videoUrl, q.lessonVideoUrl!));
      }
    }

    // AI 답변 생성
    const aiResponse = await generateAIAnswer({
      courseName: q.courseName || '강의',
      lessonTitle: q.lessonTitle || '강의',
      lessonContent: lessonContent || '(강의 내용 없음)',
      questionTitle: q.title,
      questionContent: q.content,
    });

    // DB 저장
    await db.insert(answers).values({
      questionId: q.id,
      userId: null,
      content: aiResponse.content,
      type: 'ai',
      status: 'ai_answered',
      aiModel: aiResponse.model,
      aiTokensUsed: aiResponse.tokensUsed,
    });

    console.log(`[QA] AI answer created for question ${questionId}`);

    // 강사 이메일 발송
    if (q.instructorEmail) {
      await sendQuestionToInstructorEmail({
        instructorEmail: q.instructorEmail,
        instructorName: q.instructorName || '강사님',
        questionTitle: q.title,
        questionContent: q.content,
        aiAnswer: aiResponse.content,
        courseName: q.courseName || '강의',
        lessonTitle: q.lessonTitle || '강의',
        questionId: q.id,
      });
      console.log(`[QA] Instructor email sent for question ${questionId}`);
    }
  } catch (error) {
    console.error(`[QA] triggerAIAnswer failed for ${questionId}:`, error);
  }
}

// ===== Helper Functions =====

export async function getLessonWithCourse(lessonId: string) {
  const [result] = await db
    .select({
      id: lessons.id,
      title: lessons.title,
      courseId: lessons.courseId,
      courseName: courses.title,
      instructorId: courses.instructorId,
    })
    .from(lessons)
    .leftJoin(courses, eq(lessons.courseId, courses.id))
    .where(eq(lessons.id, lessonId));

  return result;
}

export async function getQuestionWithLesson(questionId: string) {
  const [result] = await db
    .select({
      id: questions.id,
      lessonId: questions.lessonId,
      courseId: questions.courseId,
      userId: questions.userId,
      title: questions.title,
      content: questions.content,
      lessonTitle: lessons.title,
      courseTitle: courses.title,
      instructorId: courses.instructorId,
    })
    .from(questions)
    .leftJoin(lessons, eq(questions.lessonId, lessons.id))
    .leftJoin(courses, eq(questions.courseId, courses.id))
    .where(eq(questions.id, questionId));

  return result;
}

export async function isUserEnrolled(
  userId: string,
  courseId: string
): Promise<boolean> {
  const [result] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
    .limit(1);

  return !!result;
}
