import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../lib/jwt';

export async function optionalAuth(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const auth = request.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return;
  const token = auth.slice(7);
  try {
    const payload = verifyAccessToken(token);
    request.user = { id: payload.sub, email: payload.email ?? '', role: payload.role ?? 'student' };
  } catch {
    // invalid token → treat as unauthenticated, continue
  }
}
