import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../lib/jwt';

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const auth = request.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } });
    return;
  }
  const token = auth.slice(7);
  try {
    const payload = verifyAccessToken(token);
    request.user = { id: payload.sub, email: payload.email ?? '', role: payload.role ?? 'student' };
  } catch {
    reply.code(401).send({ success: false, error: { code: 'INVALID_TOKEN', message: '유효하지 않은 토큰입니다.' } });
    return;
  }
}
