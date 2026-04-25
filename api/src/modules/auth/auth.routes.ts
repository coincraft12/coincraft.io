import type { FastifyInstance } from 'fastify';
import { eq, and, sql } from 'drizzle-orm';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, resendVerificationSchema } from './auth.schema';
import * as authService from './auth.service';
import { authenticate } from '../../middleware/authenticate';
import { loginRateLimit, clearLoginFailures, trackLoginFailure } from '../../middleware/rate-limit';
import { ok, created } from '../../utils/response';
import { env } from '../../config/env';
import { generateId } from '../../utils/uuid';
import { redis } from '../../lib/redis';
import { db } from '../../db';
import { enrollments, lessonProgress } from '../../db/schema';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/v1/auth/register
  app.post('/register', async (request, reply) => {
    const body = registerSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: body.error.issues[0].message } });

    const user = await authService.register(body.data);
    return reply.code(201).send(created(user, '회원가입이 완료되었습니다. 이메일을 인증해 주세요.'));
  });

  // POST /api/v1/auth/login
  app.post('/login', { preHandler: [loginRateLimit] }, async (request, reply) => {
    const body = loginSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: '이메일과 비밀번호를 입력해 주세요.' } });

    try {
      const result = await authService.login(body.data);
      await clearLoginFailures(request.ip);

      reply.setCookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV !== 'development',
        sameSite: 'lax',
        path: '/api/v1/auth',
        maxAge: 30 * 24 * 3600,
      });
      return reply.send(ok({ accessToken: result.accessToken, user: result.user }));
    } catch (err: any) {
      if (err.code === 'INVALID_CREDENTIALS') await trackLoginFailure(request.ip);
      throw err;
    }
  });

  // POST /api/v1/auth/refresh
  app.post('/refresh', async (request, reply) => {
    const refreshToken = (request.cookies as Record<string, string>)['refresh_token'];
    if (!refreshToken) return reply.code(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: '갱신 토큰이 없습니다.' } });

    const tokens = await authService.refreshTokens(refreshToken);
    reply.setCookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV !== 'development',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 30 * 24 * 3600,
    });
    return reply.send(ok({ accessToken: tokens.accessToken }));
  });

  // POST /api/v1/auth/logout
  app.post('/logout', async (request, reply) => {
    const refreshToken = (request.cookies as Record<string, string>)['refresh_token'];
    if (refreshToken) await authService.logout(refreshToken);
    reply.clearCookie('refresh_token', { path: '/api/v1/auth' });
    return reply.send(ok(null, '로그아웃되었습니다.'));
  });

  // GET /api/v1/auth/me
  app.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const user = await authService.getMe(request.user!.id);
    return reply.send(ok(user));
  });

  // PATCH /api/v1/auth/me/profile
  app.patch('/me/profile', { preHandler: [authenticate] }, async (request, reply) => {
    const body = request.body as authService.UpdateProfileDto;
    const user = await authService.updateProfile(request.user!.id, body);
    return reply.send(ok(user, '프로필이 업데이트되었습니다.'));
  });

  // GET /api/v1/auth/me/stats
  app.get('/me/stats', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = request.user!.id;
    const [{ enrolledCount }] = await db
      .select({ enrolledCount: sql<number>`COUNT(*)` })
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.status, 'active')));
    const [{ completedLessons }] = await db
      .select({ completedLessons: sql<number>`COUNT(*)` })
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.isCompleted, true)));
    return reply.send(ok({ enrolledCount: Number(enrolledCount), completedLessons: Number(completedLessons) }));
  });

  // POST /api/v1/auth/forgot-password
  app.post('/forgot-password', async (request, reply) => {
    // IP당 시간당 5회 제한 (이메일 폭격/사용자 열거 방지)
    const fpKey = `forgot_pw:${request.ip}`;
    const fpCount = await redis.incr(fpKey);
    if (fpCount === 1) await redis.expire(fpKey, 3600);
    if (fpCount > 5) {
      return reply.code(429).send({ success: false, error: { code: 'TOO_MANY_REQUESTS', message: '요청이 너무 많습니다. 1시간 후 다시 시도해 주세요.' } });
    }

    const body = forgotPasswordSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: '유효한 이메일을 입력해 주세요.' } });

    await authService.forgotPassword(body.data.email);
    return reply.send(ok(null, '비밀번호 재설정 이메일을 발송했습니다.'));
  });

  // POST /api/v1/auth/reset-password
  app.post('/reset-password', async (request, reply) => {
    const body = resetPasswordSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: body.error.issues[0].message } });

    await authService.resetPassword(body.data.token, body.data.newPassword);
    return reply.send(ok(null, '비밀번호가 재설정되었습니다.'));
  });

  // GET /api/v1/auth/verify-email?token=...
  app.get('/verify-email', async (request, reply) => {
    const { token } = request.query as { token?: string };
    if (!token) return reply.code(400).send({ success: false, error: { code: 'MISSING_TOKEN', message: '토큰이 없습니다.' } });

    await authService.verifyEmail(token);
    return reply.redirect(`${env.FRONTEND_URL}/auth/email-verified`);
  });

  // POST /api/v1/auth/resend-verification
  app.post('/resend-verification', async (request, reply) => {
    const body = resendVerificationSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: '유효한 이메일을 입력해 주세요.' } });

    await authService.resendVerification(body.data.email);
    return reply.send(ok(null, '인증 이메일을 재발송했습니다.'));
  });

  // GET /api/v1/auth/google
  app.get('/google', async (_request, reply) => {
    if (!env.GOOGLE_CLIENT_ID) return reply.code(503).send({ success: false, error: { code: 'NOT_CONFIGURED', message: 'Google OAuth가 설정되지 않았습니다.' } });
    const state = generateId();
    const url = await authService.getGoogleUrl(state);
    return reply.redirect(url);
  });

  // GET /api/v1/auth/google/callback
  app.get('/google/callback', async (request, reply) => {
    const { code } = request.query as { code?: string };
    if (!code) return reply.redirect(`${env.FRONTEND_URL}/login?error=cancelled`);

    const result = await authService.handleGoogleCallback(code);
    reply.setCookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV !== 'development',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 30 * 24 * 3600,
    });
    return reply.redirect(`${env.FRONTEND_URL}/auth/callback?token=${result.accessToken}`);
  });

  // GET /api/v1/auth/kakao
  app.get('/kakao', async (_request, reply) => {
    if (!env.KAKAO_REST_API_KEY) return reply.code(503).send({ success: false, error: { code: 'NOT_CONFIGURED', message: 'Kakao OAuth가 설정되지 않았습니다.' } });
    const state = generateId();
    const url = await authService.getKakaoUrl(state);
    return reply.redirect(url);
  });

  // GET /api/v1/auth/kakao/callback
  app.get('/kakao/callback', async (request, reply) => {
    const { code } = request.query as { code?: string };
    if (!code) return reply.redirect(`${env.FRONTEND_URL}/login?error=cancelled`);

    const result = await authService.handleKakaoCallback(code);
    reply.setCookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV !== 'development',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 30 * 24 * 3600,
    });
    return reply.redirect(`${env.FRONTEND_URL}/auth/callback?token=${result.accessToken}`);
  });

  // GET /api/v1/auth/web3/nonce?address=0x...
  app.get('/web3/nonce', async (request, reply) => {
    const { address } = request.query as { address?: string };
    if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: '유효한 지갑 주소를 입력해 주세요. (0x로 시작하는 42자)' } });
    }

    const result = await authService.getWeb3Nonce(address);
    return reply.send(ok(result));
  });

  // POST /api/v1/auth/web3/verify
  app.post('/web3/verify', async (request, reply) => {
    const body = request.body as { message?: string; signature?: string };
    if (!body.message || !body.signature) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: 'message와 signature가 필요합니다.' } });
    }
    // 입력 크기 제한 (DoS 방지)
    if (typeof body.message !== 'string' || body.message.length > 1000) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 message 형식입니다.' } });
    }
    if (typeof body.signature !== 'string' || body.signature.length > 200) {
      return reply.code(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 signature 형식입니다.' } });
    }

    const result = await authService.verifyWeb3Signature(body.message, body.signature);
    reply.setCookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV !== 'development',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 30 * 24 * 3600,
    });
    return reply.send(ok({ accessToken: result.accessToken, user: result.user }));
  });
}
