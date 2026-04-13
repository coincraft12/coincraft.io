import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/require-role';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';

export const UPLOADS_DIR =
  process.env.UPLOADS_DIR ?? path.join(process.cwd(), 'uploads');

export async function uploadRoutes(app: FastifyInstance): Promise<void> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });

  // POST /api/v1/instructor/upload/image
  app.post('/image', {
    preHandler: [authenticate, requireRole('instructor', 'admin')],
  }, async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.code(400).send({
        success: false,
        error: { code: 'NO_FILE', message: '파일이 없습니다.' },
      });
    }

    const ext = path.extname(data.filename).toLowerCase() || '.jpg';
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      return reply.code(400).send({
        success: false,
        error: { code: 'INVALID_TYPE', message: 'JPG, PNG, WEBP만 허용됩니다.' },
      });
    }

    const chunks: Buffer[] = [];
    for await (const chunk of data.file) {
      chunks.push(chunk as Buffer);
    }
    const buffer = Buffer.concat(chunks);

    if (buffer.length > 10 * 1024 * 1024) {
      return reply.code(400).send({
        success: false,
        error: { code: 'FILE_TOO_LARGE', message: '파일 크기는 10MB 이하여야 합니다.' },
      });
    }

    const filename = `${randomUUID()}${ext}`;
    await fs.writeFile(path.join(UPLOADS_DIR, filename), buffer);

    const publicBase = (process.env.API_PUBLIC_URL ?? '').replace(/\/$/, '');
    const url = `${publicBase}/api/v1/files/${filename}`;

    return reply.send({ success: true, data: { url, filename } });
  });
}
