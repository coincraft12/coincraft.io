import { eq, and, sql, desc } from 'drizzle-orm';
import { db } from '../../db';
import { courses, chapters, lessons, enrollments, lessonProgress, users } from '../../db/schema';
import { createVideoProvider } from '../../lib/video-provider';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LessonDetail {
  id: string;
  title: string;
  type: string;
  videoProvider: string | null;
  embedUrl: string | null;
  textContent: string | null;
  duration: number | null;
  isPreview: boolean;
  courseId: string;
  chapterId: string;
  watchedSeconds: number;
}

export interface EnrollmentItem {
  enrollmentId: string;
  courseId: string;
  slug: string;
  title: string;
  thumbnailUrl: string | null;
  progressPercent: number;
  enrolledAt: Date;
  instructor: { id: string; name: string; avatarUrl: string | null } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeError(message: string, code: string, statusCode: number): Error {
  return Object.assign(new Error(message), { code, statusCode });
}

// ─── Service functions ────────────────────────────────────────────────────────

export async function enrollFree(userId: string, courseId: string): Promise<void> {
  const [course] = await db
    .select({ id: courses.id, isFree: courses.isFree, isPublished: courses.isPublished })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course || !course.isFree || !course.isPublished) {
    throw makeError('수강 신청 권한이 없습니다.', 'FORBIDDEN', 403);
  }

  const [existing] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
    .limit(1);

  if (existing) {
    throw makeError('이미 수강 신청한 강좌입니다.', 'ALREADY_ENROLLED', 409);
  }

  await db.insert(enrollments).values({
    userId,
    courseId,
    status: 'active',
  });
}

export async function checkEnrollmentAccess(userId: string, courseId: string): Promise<boolean> {
  const [enrollment] = await db
    .select({ id: enrollments.id, expiresAt: enrollments.expiresAt })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, courseId),
        eq(enrollments.status, 'active')
      )
    )
    .limit(1);

  if (!enrollment) return false;
  if (enrollment.expiresAt && enrollment.expiresAt < new Date()) return false;
  return true;
}

export async function getLessonDetail(lessonId: string, userId?: string): Promise<LessonDetail> {
  const [lesson] = await db
    .select({
      id: lessons.id,
      title: lessons.title,
      type: lessons.type,
      videoProvider: lessons.videoProvider,
      videoUrl: lessons.videoUrl,
      textContent: lessons.textContent,
      duration: lessons.duration,
      isPreview: lessons.isPreview,
      courseId: lessons.courseId,
      chapterId: lessons.chapterId,
    })
    .from(lessons)
    .where(and(eq(lessons.id, lessonId), eq(lessons.isPublished, true)))
    .limit(1);

  if (!lesson) {
    throw makeError('레슨을 찾을 수 없습니다.', 'NOT_FOUND', 404);
  }

  if (!lesson.isPreview) {
    if (!userId) {
      throw makeError('수강 권한이 없습니다.', 'FORBIDDEN', 403);
    }
    const hasAccess = await checkEnrollmentAccess(userId, lesson.courseId);
    if (!hasAccess) {
      throw makeError('수강 권한이 없습니다.', 'FORBIDDEN', 403);
    }
  }

  let embedUrl: string | null = null;
  if (lesson.videoProvider && lesson.videoUrl) {
    try {
      const provider = createVideoProvider(lesson.videoProvider);
      embedUrl = provider.getEmbedUrl(lesson.videoUrl);
    } catch {
      // invalid provider — leave embedUrl null
    }
  }

  let watchedSeconds = 0;
  if (userId) {
    const [prog] = await db
      .select({ watchedSeconds: lessonProgress.watchedSeconds })
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)))
      .limit(1);
    watchedSeconds = prog?.watchedSeconds ?? 0;
  }

  return {
    id: lesson.id,
    title: lesson.title,
    type: lesson.type,
    videoProvider: lesson.videoProvider ?? null,
    embedUrl,
    textContent: lesson.textContent ?? null,
    duration: lesson.duration ?? null,
    isPreview: lesson.isPreview,
    courseId: lesson.courseId,
    chapterId: lesson.chapterId,
    watchedSeconds,
  };
}

export async function updateLessonProgress(
  userId: string,
  lessonId: string,
  watchedSeconds: number
): Promise<void> {
  const [lesson] = await db
    .select({ courseId: lessons.courseId })
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);

  if (!lesson) {
    throw makeError('레슨을 찾을 수 없습니다.', 'NOT_FOUND', 404);
  }

  const courseId = lesson.courseId;

  // 수강 권한 확인 (미수강자의 진도 기록 방지)
  const hasAccess = await checkEnrollmentAccess(userId, courseId);
  if (!hasAccess) {
    throw makeError('수강 권한이 없습니다.', 'FORBIDDEN', 403);
  }

  const [existing] = await db
    .select({ watchedSeconds: lessonProgress.watchedSeconds })
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)))
    .limit(1);

  const newWatchedSeconds = existing
    ? Math.max(existing.watchedSeconds, watchedSeconds)
    : watchedSeconds;

  await db
    .insert(lessonProgress)
    .values({
      userId,
      lessonId,
      courseId,
      watchedSeconds: newWatchedSeconds,
    })
    .onConflictDoUpdate({
      target: [lessonProgress.userId, lessonProgress.lessonId],
      set: {
        watchedSeconds: sql`GREATEST(lesson_progress.watched_seconds, ${watchedSeconds})`,
      },
    });
}

export async function completeLesson(
  userId: string,
  lessonId: string
): Promise<{ progressPercent: number }> {
  const [lesson] = await db
    .select({ courseId: lessons.courseId })
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);

  if (!lesson) {
    throw makeError('레슨을 찾을 수 없습니다.', 'NOT_FOUND', 404);
  }

  const courseId = lesson.courseId;

  // 수강 권한 확인 (수강 등록 없이 완료 표시 방지)
  const hasAccess = await checkEnrollmentAccess(userId, courseId);
  if (!hasAccess) {
    throw makeError('수강 권한이 없습니다.', 'FORBIDDEN', 403);
  }

  await db
    .insert(lessonProgress)
    .values({
      userId,
      lessonId,
      courseId,
      isCompleted: true,
      completedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [lessonProgress.userId, lessonProgress.lessonId],
      set: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });

  const progressPercent = await recalculateProgress(userId, courseId);
  return { progressPercent };
}

export async function recalculateProgress(userId: string, courseId: string): Promise<number> {
  const [totalRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(lessons)
    .where(and(eq(lessons.courseId, courseId), eq(lessons.isPublished, true)));

  const total = totalRow?.count ?? 0;

  if (total === 0) {
    await db
      .update(enrollments)
      .set({ progressPercent: 0 })
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));
    return 0;
  }

  const [completedRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.courseId, courseId),
        eq(lessonProgress.isCompleted, true)
      )
    );

  const completed = completedRow?.count ?? 0;
  const percent = Math.round((completed / total) * 100);

  await db
    .update(enrollments)
    .set({ progressPercent: percent })
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));

  return percent;
}

export async function getMyEnrollments(userId: string): Promise<EnrollmentItem[]> {
  const rows = await db
    .select({
      enrollmentId: enrollments.id,
      courseId: enrollments.courseId,
      slug: courses.slug,
      title: courses.title,
      thumbnailUrl: courses.thumbnailUrl,
      progressPercent: enrollments.progressPercent,
      enrolledAt: enrollments.enrolledAt,
      instructorId: courses.instructorId,
      instructorName: users.name,
      instructorAvatar: users.avatarUrl,
    })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .leftJoin(users, eq(courses.instructorId, users.id))
    .where(and(eq(enrollments.userId, userId), eq(enrollments.status, 'active')))
    .orderBy(desc(enrollments.enrolledAt));

  return rows.map((r) => ({
    enrollmentId: r.enrollmentId,
    courseId: r.courseId,
    slug: r.slug,
    title: r.title,
    thumbnailUrl: r.thumbnailUrl ?? null,
    progressPercent: r.progressPercent,
    enrolledAt: r.enrolledAt,
    instructor: r.instructorId
      ? { id: r.instructorId, name: r.instructorName ?? '', avatarUrl: r.instructorAvatar ?? null }
      : null,
  }));
}

export async function getCourseProgress(
  userId: string,
  courseId: string
): Promise<Record<string, boolean>> {
  const rows = await db
    .select({
      lessonId: lessonProgress.lessonId,
      isCompleted: lessonProgress.isCompleted,
    })
    .from(lessonProgress)
    .where(
      and(eq(lessonProgress.userId, userId), eq(lessonProgress.courseId, courseId))
    );

  const result: Record<string, boolean> = {};
  for (const row of rows) {
    result[row.lessonId] = row.isCompleted;
  }
  return result;
}
