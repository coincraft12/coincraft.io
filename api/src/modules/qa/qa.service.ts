import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  questions,
  answers,
  answerReactions,
  lessonReviews,
  users,
  lessons,
  courses,
} from '@/db/schema';

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
  const [answer] = await db
    .update(answers)
    .set({
      instructorRevision,
      instructorRevisedBy: instructorId,
      instructorRevisedAt: new Date(),
      status: 'instructor_revised',
    })
    .where(
      and(eq(answers.questionId, questionId), eq(answers.type, 'instructor'))
    )
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
  // UPSERT: 기존 반응이 있으면 업데이트, 없으면 생성
  const [reaction] = await db
    .insert(answerReactions)
    .values({
      answerId,
      userId,
      reactionType,
    })
    .onConflictDoUpdate({
      target: [answerReactions.answerId, answerReactions.userId],
      set: { reactionType, updatedAt: new Date() },
    })
    .returning();

  return reaction;
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
  // enrollments 테이블에서 확인
  const [result] = await db
    .select({ exists: sql<boolean>`true` })
    .from(sql`enrollments`)
    .where(sql`user_id = ${userId} AND course_id = ${courseId}`);

  return !!result;
}
