import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { ok } from '../../utils/response';
import * as wishlistService from './wishlist.service';

export async function wishlistRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/v1/courses/:courseId/wishlist — toggle wishlist (auth required)
  app.post(
    '/courses/:courseId/wishlist',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { courseId } = request.params as { courseId: string };
      const result = await wishlistService.toggleWishlist(request.user!.id, courseId);
      return reply.send(ok(result));
    },
  );

  // GET /api/v1/courses/:courseId/wishlist/status — check wishlist status (auth required)
  app.get(
    '/courses/:courseId/wishlist/status',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { courseId } = request.params as { courseId: string };
      const wishlisted = await wishlistService.isWishlisted(request.user!.id, courseId);
      return reply.send(ok({ wishlisted }));
    },
  );

  // GET /api/v1/users/me/wishlists — list my wishlist (auth required)
  app.get(
    '/users/me/wishlists',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const wishlistedCourses = await wishlistService.listUserWishlists(request.user!.id);
      return reply.send(ok(wishlistedCourses));
    },
  );
}
