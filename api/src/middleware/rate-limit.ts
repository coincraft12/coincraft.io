import type { FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '../lib/redis';

export async function trackLoginFailure(ip: string): Promise<void> {
  const key = `login_fail:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 15 * 60); // 15분 TTL 초기 설정
}

export async function isLoginBlocked(ip: string): Promise<boolean> {
  const key = `login_fail:${ip}`;
  const count = await redis.get(key);
  return count !== null && parseInt(count) >= 5;
}

export async function clearLoginFailures(ip: string): Promise<void> {
  await redis.del(`login_fail:${ip}`);
}

export async function loginRateLimit(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const ip = request.ip;
  const blocked = await isLoginBlocked(ip);
  if (blocked) {
    reply.code(429).send({
      success: false,
      error: { code: 'TOO_MANY_REQUESTS', message: '로그인 시도 횟수를 초과했습니다. 15분 후 다시 시도해 주세요.' },
    });
  }
}
