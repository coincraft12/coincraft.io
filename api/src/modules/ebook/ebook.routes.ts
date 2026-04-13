import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
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
}
