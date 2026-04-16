import type { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { createHmac } from 'node:crypto';
import { db } from '../../db';
import { users, courses, enrollments, instructors } from '../../db/schema';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/require-role';
import { ok, created } from '../../utils/response';

const ACTION_SECRET = process.env.JWT_ACCESS_SECRET ?? 'coincraft-action-secret';
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'https://coincraft.io';

function b64(data: Buffer | string) {
  return (Buffer.isBuffer(data) ? data : Buffer.from(data)).toString('base64url');
}

function makeActionToken(instructorId: string, action: 'approve' | 'reject'): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = { instructorId, action, iat: now, exp: now + 7 * 86400 };
  const header = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64(JSON.stringify(payload));
  const sig = b64(createHmac('sha256', ACTION_SECRET).update(`${header}.${body}`).digest());
  return `${header}.${body}.${sig}`;
}

function verifyActionToken(token: string): { instructorId: string; action: 'approve' | 'reject' } {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('invalid');
  const [header, body, sig] = parts;
  const expected = b64(createHmac('sha256', ACTION_SECRET).update(`${header}.${body}`).digest());
  if (sig !== expected) throw new Error('invalid signature');
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('expired');
  return payload;
}

export function makeInstructorActionUrls(instructorId: string, apiBase: string) {
  const approveToken = makeActionToken(instructorId, 'approve');
  const rejectToken = makeActionToken(instructorId, 'reject');
  return {
    approveUrl: `${apiBase}/api/v1/admin/instructors/action?token=${approveToken}`,
    rejectUrl: `${apiBase}/api/v1/admin/instructors/action?token=${rejectToken}`,
  };
}

const enrollSchema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력해주세요.'),
  courseId: z.string().uuid('올바른 강좌 ID를 입력해주세요.'),
});

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  const preHandler = [authenticate, requireRole('admin')];

  // POST /api/v1/admin/enroll — 관리자 무료 입과
  app.post('/enroll', { preHandler }, async (request, reply) => {
    const body = enrollSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: body.error.issues[0].message },
      });
    }

    const { email, courseId } = body.data;

    // 사용자 조회
    const [targetUser] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!targetUser) {
      return reply.code(404).send({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: '해당 이메일의 사용자를 찾을 수 없습니다.' },
      });
    }

    // 강좌 조회
    const [course] = await db
      .select({ id: courses.id, title: courses.title })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (!course) {
      return reply.code(404).send({
        success: false,
        error: { code: 'COURSE_NOT_FOUND', message: '강좌를 찾을 수 없습니다.' },
      });
    }

    // 이미 수강 중인지 확인
    const [existing] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(and(eq(enrollments.userId, targetUser.id), eq(enrollments.courseId, courseId)))
      .limit(1);

    if (existing) {
      return reply.code(409).send({
        success: false,
        error: { code: 'ALREADY_ENROLLED', message: '이미 수강 중인 강좌입니다.' },
      });
    }

    // 무료 입과 등록 (payment_id=null)
    await db.insert(enrollments).values({
      userId: targetUser.id,
      courseId,
      status: 'active',
      paymentId: null,
    });

    return reply.code(201).send(
      created(
        {
          success: true,
          userId: targetUser.id,
          courseId,
          courseName: course.title,
          userEmail: targetUser.email,
          userName: targetUser.name,
        },
        `${targetUser.name}님을 ${course.title} 강좌에 무료 입과시켰습니다.`
      )
    );
  });

  // GET /api/v1/admin/courses — 강좌 목록 (드롭다운용, 전체)
  app.get('/courses', { preHandler }, async (_request, reply) => {
    const allCourses = await db
      .select({ id: courses.id, title: courses.title, slug: courses.slug, isPublished: courses.isPublished })
      .from(courses)
      .orderBy(courses.title);
    return reply.send(ok(allCourses));
  });

  // GET /api/v1/admin/instructors/action?token=xxx — 이메일 승인/거절 링크 (토큰 인증)
  app.get('/instructors/action', async (request, reply) => {
    const { token } = request.query as { token?: string };

    function htmlPage(title: string, message: string, color: string) {
      return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>${title}</title>
      <style>body{margin:0;font-family:sans-serif;background:#0f172a;display:flex;align-items:center;justify-content:center;min-height:100vh;}
      .box{background:#1e293b;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:48px;max-width:440px;text-align:center;}
      h1{color:${color};font-size:24px;margin:0 0 12px;} p{color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 24px;}
      a{display:inline-block;background:#f59e0b;color:#000;font-weight:700;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;}</style></head>
      <body><div class="box"><h1>${title}</h1><p>${message}</p><a href="${FRONTEND_URL}">CoinCraft 홈으로</a></div></body></html>`;
    }

    if (!token) {
      return reply.type('text/html; charset=utf-8').send(Buffer.from(htmlPage('잘못된 요청', '토큰이 없습니다.', '#ef4444')));
    }

    let payload: { instructorId: string; action: 'approve' | 'reject' };
    try {
      payload = verifyActionToken(token);
    } catch {
      return reply.type('text/html; charset=utf-8').send(Buffer.from(htmlPage('링크 만료', '이 링크는 만료되었거나 유효하지 않습니다.<br>7일이 지난 링크는 사용할 수 없습니다.', '#f59e0b')));
    }

    const { instructorId, action } = payload;

    const [instructor] = await db
      .select({ id: instructors.id, isApproved: instructors.isApproved, userId: instructors.userId })
      .from(instructors)
      .where(eq(instructors.id, instructorId))
      .limit(1);

    if (!instructor) {
      return reply.type('text/html; charset=utf-8').send(Buffer.from(htmlPage('오류', '강사 정보를 찾을 수 없습니다.', '#ef4444')));
    }

    if (action === 'approve') {
      await db.update(instructors).set({ isApproved: true, updatedAt: new Date() }).where(eq(instructors.id, instructorId));
      await db.update(users).set({ role: 'instructor' }).where(eq(users.id, instructor.userId!));

      // 신청자에게 승인 알림
      try {
        const [user] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, instructor.userId!)).limit(1);
        if (user) {
          const { sendAdminNotification } = await import('../../lib/admin-notify');
          await sendAdminNotification(`강사 승인 — ${user.name}님`, `안녕하세요 ${user.name}님,<br><br>강사 신청이 <strong style="color:#22c55e;">승인</strong>되었습니다. 이제 강좌를 만들 수 있습니다.<br><br><a href="${FRONTEND_URL}/instructor" style="display:inline-block;background:#f59e0b;color:#000;font-weight:700;padding:10px 24px;border-radius:8px;text-decoration:none;">강사 대시보드 바로가기</a>`);
        }
      } catch { /* 알림 실패 무시 */ }

      return reply.type('text/html; charset=utf-8').send(Buffer.from(htmlPage('승인 완료 ✓', '강사 신청이 승인되었습니다.<br>해당 사용자는 이제 강사로 활동할 수 있습니다.', '#22c55e')));
    } else {
      await db.update(instructors).set({ isApproved: false, updatedAt: new Date() }).where(eq(instructors.id, instructorId));

      return reply.type('text/html; charset=utf-8').send(Buffer.from(htmlPage('거절 완료', '강사 신청이 거절되었습니다.', '#ef4444')));
    }
  });
}
