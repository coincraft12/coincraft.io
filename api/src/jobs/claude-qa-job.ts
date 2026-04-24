import cron from 'node-cron';
import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { questions, answers, lessons, courses, users } from '../db/schema';
import { generateAIAnswer } from '../lib/anthropic';
import { sendQuestionToInstructorEmail } from '../lib/email';

/**
 * Q&A AI 답변 자동 생성
 * - 5분마다 미응답 질문 확인
 * - AI로 답변 생성
 * - 강사에게 이메일 알림
 */
export function registerClaudeQAJob() {
  // 5분마다 실행
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('[Claude QA Job] Starting...');

      // AI 답변이 아직 없는 질문 조회 (최근 5분 내)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const pendingQuestions = await db
        .select({
          id: questions.id,
          lessonId: questions.lessonId,
          courseId: questions.courseId,
          userId: questions.userId,
          title: questions.title,
          content: questions.content,
          createdAt: questions.createdAt,
          courseName: courses.title,
          lessonTitle: lessons.title,
          lessonContent: lessons.textContent,
          instructorId: courses.instructorId,
          instructorEmail: users.email,
          instructorName: users.name,
        })
        .from(questions)
        .leftJoin(lessons, eq(questions.lessonId, lessons.id))
        .leftJoin(courses, eq(questions.courseId, courses.id))
        .leftJoin(users, eq(courses.instructorId, users.id))
        .where(eq(questions.status, 'open'));

      // AI 답변이 있는지 확인하고 없는 것만 필터링
      for (const question of pendingQuestions) {
        const existingAIAnswer = await db
          .select({ id: answers.id })
          .from(answers)
          .where(and(eq(answers.questionId, question.id), eq(answers.type, 'ai')))
          .limit(1)
          .then((rows) => rows[0] ?? null);

        // 이미 AI 답변이 있으면 스킵
        if (existingAIAnswer) continue;

        // AI 답변 생성
        try {
          const aiResponse = await generateAIAnswer({
            courseName: question.courseName || '강의',
            lessonTitle: question.lessonTitle || '강의',
            lessonContent: question.lessonContent || '(강의 내용 없음)',
            questionTitle: question.title,
            questionContent: question.content,
          });

          // DB에 저장
          await db.insert(answers).values({
            questionId: question.id,
            userId: null,
            content: aiResponse.content,
            type: 'ai',
            status: 'ai_answered',
            aiModel: aiResponse.model,
            aiTokensUsed: aiResponse.tokensUsed,
          });

          console.log(`[Claude QA Job] AI answer created for question ${question.id}`);

          // 강사에게 이메일 발송
          if (question.instructorEmail) {
            await sendQuestionToInstructorEmail({
              instructorEmail: question.instructorEmail,
              instructorName: question.instructorName || '강사님',
              questionTitle: question.title,
              questionContent: question.content,
              aiAnswer: aiResponse.content,
              courseName: question.courseName || '강의',
              lessonTitle: question.lessonTitle || '강의',
              questionId: question.id,
            });

            console.log(`[Claude QA Job] Email sent to instructor for question ${question.id}`);
          }
        } catch (error) {
          console.error(`[Claude QA Job] Error processing question ${question.id}:`, error);
          // 개별 실패는 무시하고 계속
        }
      }

      console.log('[Claude QA Job] Completed');
    } catch (error) {
      console.error('[Claude QA Job] Fatal error:', error);
    }
  });
}
