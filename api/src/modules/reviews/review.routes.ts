import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { ok, created } from '../../utils/response';
import * as reviewService from './review.service';

export async function reviewRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/v1/courses/:courseId/reviews — list reviews (no auth required)
  app.get('/courses/:courseId/reviews', async (request, reply) => {
    const { courseId } = request.params as { courseId: string };
    const reviews = await reviewService.listCourseReviews(courseId);
    return reply.send(ok(reviews));
  });

  // POST /api/v1/courses/:courseId/reviews — create/update review (auth required)
  app.post(
    '/courses/:courseId/reviews',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { courseId } = request.params as { courseId: string };
      const body = request.body as { rating?: unknown; comment?: unknown };

      const rating = Number(body.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return reply.code(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '평점은 1에서 5 사이의 정수여야 합니다.' },
        });
      }

      const rawComment = typeof body.comment === 'string' ? body.comment : undefined;
      if (rawComment !== undefined && rawComment.length > 1000) {
        return reply.code(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '리뷰는 1000자 이하로 작성해 주세요.' },
        });
      }
      const comment = rawComment;

      const review = await reviewService.createReview(request.user!.id, courseId, rating, comment);
      return reply.code(201).send(created(review, '리뷰가 등록되었습니다.'));
    },
  );

  // DELETE /api/v1/reviews/:reviewId — delete own review (auth required)
  app.delete(
    '/reviews/:reviewId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { reviewId } = request.params as { reviewId: string };
      await reviewService.deleteReview(request.user!.id, reviewId);
      return reply.send({ success: true, message: '리뷰가 삭제되었습니다.' });
    },
  );
}
