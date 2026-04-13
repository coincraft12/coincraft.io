import type { FastifyInstance } from 'fastify';
import { blogQuerySchema, createPostSchema, updatePostSchema } from './blog.schema';
import * as blogService from './blog.service';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/require-role';
import { ok, paginated } from '../../utils/response';

export async function blogRoutes(app: FastifyInstance): Promise<void> {
  // ── Public routes ────────────────────────────────────────────────────────

  // GET /api/v1/blog/posts
  app.get('/api/v1/blog/posts', async (request, reply) => {
    const query = blogQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: query.error.issues[0].message },
      });
    }
    const result = await blogService.listPosts(query.data);
    return reply.send(paginated(result.data, result.meta));
  });

  // GET /api/v1/blog/posts/:slug
  app.get('/api/v1/blog/posts/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const post = await blogService.getPostBySlug(slug);
    return reply.send(ok(post));
  });

  // GET /api/v1/blog/categories
  app.get('/api/v1/blog/categories', async (_request, reply) => {
    const list = await blogService.listCategories();
    return reply.send(ok(list));
  });

  // GET /api/v1/blog/tags
  app.get('/api/v1/blog/tags', async (_request, reply) => {
    const list = await blogService.listTags();
    return reply.send(ok(list));
  });

  // ── Admin routes ─────────────────────────────────────────────────────────

  // POST /api/v1/admin/blog/posts
  app.post(
    '/api/v1/admin/blog/posts',
    { preHandler: [authenticate, requireRole('admin')] },
    async (request, reply) => {
      const body = createPostSchema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: body.error.issues[0].message },
        });
      }
      const post = await blogService.createPost(body.data, request.user!.id);
      return reply.code(201).send(ok(post));
    }
  );

  // PUT /api/v1/admin/blog/posts/:id
  app.put(
    '/api/v1/admin/blog/posts/:id',
    { preHandler: [authenticate, requireRole('admin')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updatePostSchema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: body.error.issues[0].message },
        });
      }
      const post = await blogService.updatePost(id, body.data);
      return reply.send(ok(post));
    }
  );

  // DELETE /api/v1/admin/blog/posts/:id
  app.delete(
    '/api/v1/admin/blog/posts/:id',
    { preHandler: [authenticate, requireRole('admin')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await blogService.deletePost(id);
      return reply.send(ok(null, '포스트가 삭제되었습니다.'));
    }
  );
}
