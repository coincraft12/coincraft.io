import type { FastifyRequest, FastifyReply } from 'fastify';

export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } });
      return;
    }
    if (!roles.includes(request.user.role)) {
      reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: '접근 권한이 없습니다.' } });
    }
  };
}
