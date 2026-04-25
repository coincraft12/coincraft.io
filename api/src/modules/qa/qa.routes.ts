import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate, optionalAuth } from '../../middleware/authenticate';
import { ok, created } from '../../utils/response';
import {
  createQuestion,
  getQuestionsByLesson,
  getQuestionById,
  incrementQuestionViewCount,
  getAnswersByQuestion,
  createAIAnswer,
  addInstructorAnswer,
  acceptAnswer,
  rejectAnswer,
  addAnswerReaction,
  createReview,
  getReviewsByLesson,
  deleteReview,
  getQuestionWithLesson,
  getLessonWithCourse,
  isUserEnrolled,
  triggerAIAnswerForQuestion,
  getInstructorQuestions,
  deleteQuestion,
  updateQuestionPrivacy,
} from './qa.service';

// ===== Schemas =====
const createQuestionSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().min(1).max(5000),
  isPrivate: z.boolean().optional(),
});

const addInstructorAnswerSchema = z.object({
  instructorRevision: z.string().min(1).max(5000),
});

const addReactionSchema = z.object({
  reactionType: z.enum(['helpful', 'unhelpful']),
});

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  content: z.string().min(1).max(2000),
  imageUrls: z.array(z.string().url()).optional(),
});

// ===== Routes =====
export default async function qaRoutes(app: FastifyInstance) {
  // ===== Question Routes =====

  // 질문 작성
  app.post<{ Params: { lessonId: string } }>(
    '/lessons/:lessonId/questions',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const { lessonId } = request.params;
        const userId = request.user!.id;

        // 입력값 검증
        const validation = createQuestionSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: validation.error.issues[0].message,
            },
          });
        }

        const input = validation.data;

        // 강의 및 코스 정보 조회
        const lesson = await getLessonWithCourse(lessonId);
        if (!lesson) {
          return reply.code(404).send({
            success: false,
            error: { code: 'LESSON_NOT_FOUND', message: '강의를 찾을 수 없습니다.' },
          });
        }

        // 수강 여부 확인 (강사 본인은 예외)
        const isInstructor = lesson.instructorId === userId;
        if (!isInstructor) {
          const isEnrolled = await isUserEnrolled(userId, lesson.courseId);
          if (!isEnrolled) {
            return reply.code(403).send({
              success: false,
              error: {
                code: 'NOT_ENROLLED',
                message: '이 강의를 수강 중인 학생만 질문할 수 있습니다.',
              },
            });
          }
        }

        // 질문 생성
        const question = await createQuestion(
          lessonId,
          lesson.courseId,
          userId,
          input
        );

        // 백그라운드에서 AI 답변 생성 + 강사 이메일 발송 (fire-and-forget)
        triggerAIAnswerForQuestion(question.id).catch(() => {});

        reply.code(201).send(
          created(
            {
              questionId: question.id,
              status: 'ai_answering',
            },
            '질문이 작성되었습니다. AI 답변을 생성 중입니다.'
          )
        );
      } catch (error) {
        console.error('[QA] Error creating question:', error);
        reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: '질문 작성에 실패했습니다.' },
        });
      }
    }
  );

  // 질문 목록 조회
  app.get<{ Params: { lessonId: string }; Querystring: { limit?: string; offset?: string } }>(
    '/lessons/:lessonId/questions',
    { preHandler: [optionalAuth] },
    async (request, reply) => {
      try {
        const { lessonId } = request.params;
        const limit = Math.min(parseInt(request.query.limit || '10'), 100);
        const offset = parseInt(request.query.offset || '0');

        const lesson = await getLessonWithCourse(lessonId);
        const questionList = await getQuestionsByLesson(
          lessonId, limit, offset,
          request.user?.id,
          lesson?.instructorId ?? undefined
        );

        reply.send(
          ok({
            questions: questionList,
            pagination: {
              limit,
              offset,
            },
          })
        );
      } catch (error) {
        console.error('[QA] Error fetching questions:', error);
        reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: '질문 조회에 실패했습니다.' },
        });
      }
    }
  );

  // 질문 상세 조회
  app.get<{ Params: { questionId: string } }>(
    '/questions/:questionId',
    { preHandler: [optionalAuth] },
    async (request, reply) => {
      try {
        const { questionId } = request.params;

        // 조회수 증가
        incrementQuestionViewCount(questionId);

        // 질문 조회
        const question = await getQuestionById(questionId);
        if (!question) {
          return reply.code(404).send({
            success: false,
            error: { code: 'QUESTION_NOT_FOUND', message: '질문을 찾을 수 없습니다.' },
          });
        }

        // 비공개 질문 접근 제어
        if (question.isPrivate) {
          const currentUserId = request.user?.id;
          const lessonInfo = await getLessonWithCourse(question.lessonId);
          const isOwner = currentUserId === question.userId;
          const isInstructor = currentUserId === lessonInfo?.instructorId;
          if (!isOwner && !isInstructor) {
            return reply.code(403).send({
              success: false,
              error: { code: 'FORBIDDEN', message: '비공개 질문입니다.' },
            });
          }
        }

        // 답변 조회
        const answerList = await getAnswersByQuestion(questionId, request.user?.id);

        reply.send(
          ok({
            question,
            answers: answerList,
          })
        );
      } catch (error) {
        console.error('[QA] Error fetching question:', error);
        reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: '질문 조회에 실패했습니다.' },
        });
      }
    }
  );

  // 질문 삭제 (질문자 본인만)
  app.delete<{ Params: { questionId: string } }>(
    '/questions/:questionId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        await deleteQuestion(request.params.questionId, request.user!.id);
        reply.send(ok(null, '질문이 삭제되었습니다.'));
      } catch (err: any) {
        const code = err.code === 'NOT_FOUND' ? 404 : err.code === 'FORBIDDEN' ? 403 : 500;
        reply.code(code).send({ success: false, error: { code: err.code || 'ERROR', message: err.message } });
      }
    }
  );

  // 질문 비공개 토글 (질문자 본인만)
  app.patch<{ Params: { questionId: string } }>(
    '/questions/:questionId/privacy',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const { isPrivate } = z.object({ isPrivate: z.boolean() }).parse(request.body);
        const result = await updateQuestionPrivacy(request.params.questionId, request.user!.id, isPrivate);
        reply.send(ok(result));
      } catch (err: any) {
        const code = err.code === 'NOT_FOUND' ? 404 : err.code === 'FORBIDDEN' ? 403 : 500;
        reply.code(code).send({ success: false, error: { code: err.code || 'ERROR', message: err.message } });
      }
    }
  );

  // ===== Answer Routes =====

  // 강사 답변 작성 (보완 답변)
  app.post<{ Params: { questionId: string } }>(
    '/questions/:questionId/instructor-answer',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const { questionId } = request.params;
        const instructorId = request.user!.id;

        // 입력값 검증
        const validation = addInstructorAnswerSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: validation.error.issues[0].message,
            },
          });
        }

        // 질문 존재 여부 확인
        const question = await getQuestionWithLesson(questionId);
        if (!question) {
          return reply.code(404).send({
            success: false,
            error: { code: 'QUESTION_NOT_FOUND', message: '질문을 찾을 수 없습니다.' },
          });
        }

        // 강사 권한 확인 (현재 사용자가 강사인지 또는 강의 강사인지)
        if (question.instructorId !== instructorId) {
          return reply.code(403).send({
            success: false,
            error: { code: 'FORBIDDEN', message: '강사만 답변을 작성할 수 있습니다.' },
          });
        }

        // 강사 답변 추가
        const answer = await addInstructorAnswer(
          questionId,
          instructorId,
          validation.data.instructorRevision
        );

        // 학생에게 이메일 알림 발송 (Phase 4에서 구현)
        // await sendEmailToStudent(question.userId, { ... });

        reply.code(201).send(
          created(
            { answerId: answer.id },
            '강사 답변이 작성되었습니다.'
          )
        );
      } catch (error) {
        console.error('[QA] Error adding instructor answer:', error);
        reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: '답변 작성에 실패했습니다.' },
        });
      }
    }
  );

  // 답변 채택
  app.post<{ Params: { answerId: string } }>(
    '/answers/:answerId/accept',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const { answerId } = request.params;
        const userId = request.user!.id;

        // TODO: answerId로 question을 찾아서 userId가 질문자인지 확인
        // 지금은 스킵 (Phase 4에서 구현)

        const answer = await acceptAnswer(answerId, userId);

        reply.send(
          ok({ answerId: answer.id }, '답변이 채택되었습니다.')
        );
      } catch (error) {
        console.error('[QA] Error accepting answer:', error);
        reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: '처리에 실패했습니다.' },
        });
      }
    }
  );

  // 답변 거부 (채택 취소)
  app.delete<{ Params: { answerId: string } }>(
    '/answers/:answerId/accept',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const { answerId } = request.params;

        const answer = await rejectAnswer(answerId);

        reply.send(
          ok({ answerId: answer.id }, '답변 채택이 취소되었습니다.')
        );
      } catch (error) {
        console.error('[QA] Error rejecting answer:', error);
        reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: '처리에 실패했습니다.' },
        });
      }
    }
  );

  // 답변 평가 (좋아요/싫어요)
  app.post<{ Params: { answerId: string } }>(
    '/answers/:answerId/reaction',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const { answerId } = request.params;
        const userId = request.user!.id;

        // 입력값 검증
        const validation = addReactionSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: validation.error.issues[0].message,
            },
          });
        }

        const reaction = await addAnswerReaction(
          answerId,
          userId,
          validation.data.reactionType
        );

        reply.code(201).send(
          created(
            reaction,
            '평가가 기록되었습니다.'
          )
        );
      } catch (error) {
        console.error('[QA] Error adding reaction:', error);
        reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: '평가 처리에 실패했습니다.' },
        });
      }
    }
  );

  // ===== Review Routes =====

  // 강의 후기 작성
  app.post<{ Params: { lessonId: string } }>(
    '/lessons/:lessonId/reviews',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const { lessonId } = request.params;
        const userId = request.user!.id;

        // 입력값 검증
        const validation = createReviewSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: validation.error.issues[0].message,
            },
          });
        }

        // 강의 및 코스 정보 조회
        const lesson = await getLessonWithCourse(lessonId);
        if (!lesson) {
          return reply.code(404).send({
            success: false,
            error: { code: 'LESSON_NOT_FOUND', message: '강의를 찾을 수 없습니다.' },
          });
        }

        // 수강 여부 확인 (강사 본인은 예외)
        const isInstructor = lesson.instructorId === userId;
        if (!isInstructor) {
          const isEnrolled = await isUserEnrolled(userId, lesson.courseId);
          if (!isEnrolled) {
            return reply.code(403).send({
              success: false,
              error: {
                code: 'NOT_ENROLLED',
                message: '이 강의를 수강 중인 학생만 후기를 작성할 수 있습니다.',
              },
            });
          }
        }

        // 후기 작성
        const review = await createReview(
          lessonId,
          lesson.courseId,
          userId,
          validation.data
        );

        reply.code(201).send(
          created({ reviewId: review.id }, '후기가 작성되었습니다.')
        );
      } catch (error) {
        console.error('[QA] Error creating review:', error);
        reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: '후기 작성에 실패했습니다.' },
        });
      }
    }
  );

  // 강의 후기 목록 조회
  app.get<{ Params: { lessonId: string }; Querystring: { limit?: string; offset?: string } }>(
    '/lessons/:lessonId/reviews',
    { preHandler: [optionalAuth] },
    async (request, reply) => {
      try {
        const { lessonId } = request.params;
        const limit = Math.min(parseInt(request.query.limit || '10'), 100);
        const offset = parseInt(request.query.offset || '0');

        const reviewList = await getReviewsByLesson(lessonId, limit, offset);

        reply.send(
          ok({
            reviews: reviewList,
            pagination: {
              limit,
              offset,
            },
          })
        );
      } catch (error) {
        console.error('[QA] Error fetching reviews:', error);
        reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: '후기 조회에 실패했습니다.' },
        });
      }
    }
  );


  // ===== Instructor Dashboard Routes =====

  // 강사의 Q&A 목록 조회 (필터링)
  app.get<{ Querystring: { status?: string } }>(
    '/instructor/qa',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const instructorId = request.user!.id;
        const status = (request.query.status || 'all') as string;

        const questionList = await getInstructorQuestions(instructorId, status);

        reply.send(ok({ questions: questionList }));
      } catch (error) {
        console.error('[QA] Error fetching instructor Q&A:', error);
        reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Q&A 조회에 실패했습니다.' },
        });
      }
    }
  );
}
