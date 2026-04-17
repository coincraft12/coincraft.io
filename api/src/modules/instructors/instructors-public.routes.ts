import type { FastifyInstance } from 'fastify';
import { eq, asc } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../db';
import { instructors, users } from '../../db/schema';
import { authenticate } from '../../middleware/authenticate';
import { ok, created } from '../../utils/response';

const applySchema = z.object({
  bio: z.string().min(10, '소개는 10자 이상 입력해주세요.'),
  career: z.string().min(5, '경력을 입력해주세요.'),
  photoUrl: z.string().url('올바른 사진 URL을 입력해주세요.').optional(),
  specialties: z.array(z.string().max(30)).max(10).optional(),
});

export async function instructorsPublicRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/v1/instructors — 승인된 강사 목록
  app.get('/', async (_request, reply) => {
    const rows = await db
      .select({
        id: instructors.id,
        userId: instructors.userId,
        bio: instructors.bio,
        career: instructors.career,
        photoUrl: instructors.photoUrl,
        specialties: instructors.specialties,
        isApproved: instructors.isApproved,
        createdAt: instructors.createdAt,
        name: users.name,
        avatarUrl: users.avatarUrl,
      })
      .from(instructors)
      .leftJoin(users, eq(instructors.userId, users.id))
      .where(eq(instructors.isApproved, true))
      .orderBy(asc(instructors.createdAt));

    const data = rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      name: r.name ?? '',
      bio: r.bio,
      career: r.career,
      photoUrl: r.photoUrl ?? r.avatarUrl ?? null,
      specialties: r.specialties ?? [],
      createdAt: r.createdAt,
    }));

    return reply.send(ok(data));
  });

  // GET /api/v1/instructors/:id — 강사 상세 + 강좌 목록
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const [row] = await db
      .select({
        id: instructors.id,
        userId: instructors.userId,
        bio: instructors.bio,
        career: instructors.career,
        photoUrl: instructors.photoUrl,
        specialties: instructors.specialties,
        name: users.name,
        avatarUrl: users.avatarUrl,
      })
      .from(instructors)
      .leftJoin(users, eq(instructors.userId, users.id))
      .where(eq(instructors.id, id))
      .limit(1);

    if (!row) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: '강사를 찾을 수 없습니다.' } });
    }

    const { courses } = await import('../../db/schema');
    const { eq: eqCourse, and } = await import('drizzle-orm');
    const courseRows = await db
      .select({
        id: courses.id,
        slug: courses.slug,
        title: courses.title,
        shortDescription: courses.shortDescription,
        thumbnailUrl: courses.thumbnailUrl,
        level: courses.level,
        category: courses.category,
        price: courses.price,
        originalPrice: courses.originalPrice,
        isFree: courses.isFree,
        totalLessons: courses.totalLessons,
        totalDuration: courses.totalDuration,
        averageRating: courses.averageRating,
        reviewCount: courses.reviewCount,
      })
      .from(courses)
      .where(and(eqCourse(courses.instructorId, row.userId!), eqCourse(courses.isPublished, true)));

    return reply.send(ok({
      id: row.id,
      userId: row.userId,
      name: row.name ?? '',
      bio: row.bio,
      career: row.career,
      photoUrl: row.photoUrl ?? row.avatarUrl ?? null,
      specialties: row.specialties ?? [],
      courses: courseRows,
    }));
  });

  // POST /api/v1/instructors/apply — 강사 신청 (인증 필요)
  app.post('/apply', { preHandler: [authenticate] }, async (request, reply) => {
    const body = applySchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: body.error.issues[0].message },
      });
    }

    const userId = request.user!.id;

    // 이미 신청한 경우 확인
    const [existing] = await db
      .select({ id: instructors.id })
      .from(instructors)
      .where(eq(instructors.userId, userId))
      .limit(1);

    if (existing) {
      return reply.code(409).send({
        success: false,
        error: { code: 'ALREADY_APPLIED', message: '이미 강사 신청이 되어 있습니다.' },
      });
    }

    const [newInstructor] = await db
      .insert(instructors)
      .values({
        userId,
        bio: body.data.bio,
        career: body.data.career,
        photoUrl: body.data.photoUrl ?? null,
        specialties: body.data.specialties ?? null,
        isApproved: false,
      })
      .returning({ id: instructors.id, userId: instructors.userId, isApproved: instructors.isApproved });

    // 관리자 알림 발송 (승인/거절 버튼 포함)
    try {
      const { sendAdminNotification } = await import('../../lib/admin-notify');
      const { makeInstructorActionUrls } = await import('../admin/admin.routes');
      const [user] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
      const apiBase = process.env.API_PUBLIC_URL ?? 'http://localhost:4000';
      const { approveUrl, rejectUrl } = makeInstructorActionUrls(newInstructor.id, apiBase);

      await sendAdminNotification(
        '강사 신청 접수',
        `<p><strong>신청자:</strong> ${user?.name ?? userId} (${user?.email ?? ''})</p>
         <p><strong>소개:</strong></p><p style="background:#0f172a;padding:12px;border-radius:8px;">${body.data.bio}</p>
         <p><strong>경력:</strong></p><p style="background:#0f172a;padding:12px;border-radius:8px;">${body.data.career}</p>
         ${body.data.specialties?.length ? `<p><strong>전문 분야:</strong> ${body.data.specialties.map(s => `#${s}`).join(' ')}</p>` : ''}
         <div style="margin-top:28px;display:flex;gap:12px;">
           <a href="${approveUrl}" style="display:inline-block;background:#22c55e;color:#000;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px;">✓ 승인</a>
           &nbsp;&nbsp;
           <a href="${rejectUrl}" style="display:inline-block;background:#ef4444;color:#fff;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px;">✕ 거절</a>
         </div>
         <p style="margin-top:16px;font-size:12px;color:#64748b;">이 링크는 7일 후 만료됩니다.</p>`
      );
    } catch {
      // 알림 실패는 무시
    }

    return reply.code(201).send(created(newInstructor, '강사 신청이 완료되었습니다. 검토 후 승인됩니다.'));
  });
}
