import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/require-role';
import { ok } from '../../utils/response';
import * as ebookService from './ebook.service';

export async function ebookRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/v1/ebooks — 전자책 목록 (인증 불필요)
  app.get('/api/v1/ebooks', async (_request, reply) => {
    const list = await ebookService.listEbooks();
    return reply.send(ok(list));
  });

  // GET /api/v1/ebooks/:id — 전자책 메타데이터 (인증 필요)
  app.get('/api/v1/ebooks/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const meta = await ebookService.getEbookMeta(id, request.user!.id);
    return reply.send(ok(meta));
  });

  // GET /api/v1/ebooks/:id/file — epub 파일 스트리밍 (인증 필요, 권한 확인)
  app.get('/api/v1/ebooks/:id/file', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const buffer = await ebookService.getEbookFile(id, request.user!.id);

    return reply
      .header('Content-Type', 'application/epub+zip')
      .header('Cache-Control', 'no-store')
      .header('Content-Disposition', 'inline')
      .header('Content-Length', buffer.length)
      .send(buffer);
  });

  // GET /api/v1/ebooks/:id/progress — 읽기 진행도 조회 (인증 필요)
  app.get('/api/v1/ebooks/:id/progress', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const progress = await ebookService.getEbookProgress(id, request.user!.id);
    return reply.send(ok(progress));
  });

  // PATCH /api/v1/ebooks/:id/progress — 읽기 진행도 저장 (인증 필요)
  app.patch('/api/v1/ebooks/:id/progress', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { cfi } = request.body as { cfi: string };
    const progress = await ebookService.upsertEbookProgress(id, request.user!.id, cfi);
    return reply.send(ok(progress));
  });

  // POST /api/v1/ebooks/:id/extract-cover — EPUB에서 표지 이미지 추출 (admin/instructor 전용)
  app.post('/api/v1/ebooks/:id/extract-cover', {
    preHandler: [authenticate, requireRole('instructor', 'admin')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await ebookService.extractAndSaveCover(id);
    return reply.send(ok(result));
  });
}
