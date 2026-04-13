import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import { db } from '../../db';
import {
  courses,
  chapters,
  lessons,
  enrollments,
  payments,
  users,
} from '../../db/schema';
import { generateSlug } from '../../utils/slug';
import type {
  CreateCourseInput,
  UpdateCourseInput,
  CreateChapterInput,
  CreateLessonInput,
  UpdateLessonInput,
} from './instructor.schema';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeError(message: string, code: string, status: number): Error {
  return Object.assign(new Error(message), { code, status });
}

// ─── Course ───────────────────────────────────────────────────────────────────

export interface InstructorCourse {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  level: string;
  category: string | null;
  price: string;
  isFree: boolean;
  isPublished: boolean;
  totalLessons: number;
  totalDuration: number;
  averageRating: string | null;
  reviewCount: number;
  enrollmentCount: number;
  createdAt: Date;
}

export async function getInstructorCourses(instructorId: string): Promise<InstructorCourse[]> {
  const rows = await db
    .select({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
      shortDescription: courses.shortDescription,
      thumbnailUrl: courses.thumbnailUrl,
      level: courses.level,
      category: courses.category,
      price: courses.price,
      isFree: courses.isFree,
      isPublished: courses.isPublished,
      totalLessons: courses.totalLessons,
      totalDuration: courses.totalDuration,
      averageRating: courses.averageRating,
      reviewCount: courses.reviewCount,
      createdAt: courses.createdAt,
      enrollmentCount: sql<number>`(
        SELECT COUNT(*)::int FROM enrollments e
        WHERE e.course_id = ${courses.id} AND e.status = 'active'
      )`,
    })
    .from(courses)
    .where(eq(courses.instructorId, instructorId))
    .orderBy(desc(courses.createdAt));

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    shortDescription: r.shortDescription ?? null,
    thumbnailUrl: r.thumbnailUrl ?? null,
    level: r.level,
    category: r.category ?? null,
    price: r.price,
    isFree: r.isFree,
    isPublished: r.isPublished,
    totalLessons: r.totalLessons,
    totalDuration: r.totalDuration,
    averageRating: r.averageRating ?? null,
    reviewCount: r.reviewCount,
    enrollmentCount: r.enrollmentCount,
    createdAt: r.createdAt,
  }));
}

export async function createCourse(instructorId: string, input: CreateCourseInput): Promise<InstructorCourse> {
  const rawSlug = input.slug ?? generateSlug(input.title);
  const slug = rawSlug || `course-${Date.now()}`;

  const [existing] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.slug, slug))
    .limit(1);

  if (existing) {
    throw makeError('이미 사용 중인 슬러그입니다.', 'CONFLICT', 409);
  }

  const [created] = await db
    .insert(courses)
    .values({
      slug,
      title: input.title,
      description: undefined,
      shortDescription: input.shortDescription ?? undefined,
      thumbnailUrl: input.thumbnailUrl ?? undefined,
      level: input.level,
      category: input.category ?? undefined,
      price: String(input.price),
      isFree: input.isFree,
      instructorId,
    })
    .returning();

  return {
    id: created.id,
    slug: created.slug,
    title: created.title,
    shortDescription: created.shortDescription ?? null,
    thumbnailUrl: created.thumbnailUrl ?? null,
    level: created.level,
    category: created.category ?? null,
    price: created.price,
    isFree: created.isFree,
    isPublished: created.isPublished,
    totalLessons: created.totalLessons,
    totalDuration: created.totalDuration,
    averageRating: created.averageRating ?? null,
    reviewCount: created.reviewCount,
    enrollmentCount: 0,
    createdAt: created.createdAt,
  };
}

export async function updateCourse(
  instructorId: string,
  courseId: string,
  input: UpdateCourseInput
): Promise<InstructorCourse> {
  const [course] = await db
    .select({ id: courses.id, instructorId: courses.instructorId })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) throw makeError('강좌를 찾을 수 없습니다.', 'NOT_FOUND', 404);
  if (course.instructorId !== instructorId) throw makeError('접근 권한이 없습니다.', 'FORBIDDEN', 403);

  if (input.slug) {
    const [existing] = await db
      .select({ id: courses.id })
      .from(courses)
      .where(and(eq(courses.slug, input.slug)))
      .limit(1);
    if (existing && existing.id !== courseId) {
      throw makeError('이미 사용 중인 슬러그입니다.', 'CONFLICT', 409);
    }
  }

  const updateData: Partial<typeof courses.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (input.title !== undefined) updateData.title = input.title;
  if (input.slug !== undefined) updateData.slug = input.slug;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.shortDescription !== undefined) updateData.shortDescription = input.shortDescription;
  if (input.thumbnailUrl !== undefined) updateData.thumbnailUrl = input.thumbnailUrl;
  if (input.level !== undefined) updateData.level = input.level;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.price !== undefined) updateData.price = String(input.price);
  if (input.isFree !== undefined) updateData.isFree = input.isFree;
  if (input.isPublished !== undefined) updateData.isPublished = input.isPublished;

  const [updated] = await db
    .update(courses)
    .set(updateData)
    .where(eq(courses.id, courseId))
    .returning();

  const enrollmentCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(enrollments)
    .where(and(eq(enrollments.courseId, courseId), eq(enrollments.status, 'active')));

  return {
    id: updated.id,
    slug: updated.slug,
    title: updated.title,
    shortDescription: updated.shortDescription ?? null,
    thumbnailUrl: updated.thumbnailUrl ?? null,
    level: updated.level,
    category: updated.category ?? null,
    price: updated.price,
    isFree: updated.isFree,
    isPublished: updated.isPublished,
    totalLessons: updated.totalLessons,
    totalDuration: updated.totalDuration,
    averageRating: updated.averageRating ?? null,
    reviewCount: updated.reviewCount,
    enrollmentCount: enrollmentCount[0]?.count ?? 0,
    createdAt: updated.createdAt,
  };
}

// ─── Chapter ──────────────────────────────────────────────────────────────────

export interface ChapterItem {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  order: number;
  isPublished: boolean;
  createdAt: Date;
  lessons: LessonItem[];
}

export async function addChapter(
  instructorId: string,
  courseId: string,
  input: CreateChapterInput
): Promise<ChapterItem> {
  const [course] = await db
    .select({ id: courses.id, instructorId: courses.instructorId })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) throw makeError('강좌를 찾을 수 없습니다.', 'NOT_FOUND', 404);
  if (course.instructorId !== instructorId) throw makeError('접근 권한이 없습니다.', 'FORBIDDEN', 403);

  const [created] = await db
    .insert(chapters)
    .values({
      courseId,
      title: input.title,
      description: input.description ?? undefined,
      order: input.order,
      isPublished: input.isPublished,
    })
    .returning();

  return {
    id: created.id,
    courseId: created.courseId,
    title: created.title,
    description: created.description ?? null,
    order: created.order,
    isPublished: created.isPublished,
    createdAt: created.createdAt,
    lessons: [],
  };
}

// ─── Lesson ───────────────────────────────────────────────────────────────────

export interface LessonItem {
  id: string;
  chapterId: string;
  courseId: string;
  title: string;
  type: string;
  videoProvider: string | null;
  videoUrl: string | null;
  duration: number | null;
  isPreview: boolean;
  isPublished: boolean;
  order: number;
  createdAt: Date;
}

export async function addLesson(
  instructorId: string,
  chapterId: string,
  input: CreateLessonInput
): Promise<LessonItem> {
  const [chapter] = await db
    .select({ id: chapters.id, courseId: chapters.courseId })
    .from(chapters)
    .where(eq(chapters.id, chapterId))
    .limit(1);

  if (!chapter) throw makeError('챕터를 찾을 수 없습니다.', 'NOT_FOUND', 404);

  const [course] = await db
    .select({ id: courses.id, instructorId: courses.instructorId })
    .from(courses)
    .where(eq(courses.id, chapter.courseId))
    .limit(1);

  if (!course || course.instructorId !== instructorId) {
    throw makeError('접근 권한이 없습니다.', 'FORBIDDEN', 403);
  }

  const [created] = await db
    .insert(lessons)
    .values({
      chapterId,
      courseId: chapter.courseId,
      title: input.title,
      type: input.type,
      videoProvider: input.videoProvider ?? undefined,
      videoUrl: input.videoUrl ?? undefined,
      duration: input.duration,
      isPreview: input.isPreview,
      isPublished: input.isPublished,
      textContent: input.textContent ?? undefined,
      order: input.order,
    })
    .returning();

  // Update totalLessons on the course
  await db
    .update(courses)
    .set({
      totalLessons: sql`(SELECT COUNT(*)::int FROM lessons WHERE course_id = ${chapter.courseId} AND is_published = true)`,
      totalDuration: sql`(SELECT COALESCE(SUM(duration), 0)::int FROM lessons WHERE course_id = ${chapter.courseId} AND is_published = true)`,
      updatedAt: new Date(),
    })
    .where(eq(courses.id, chapter.courseId));

  return {
    id: created.id,
    chapterId: created.chapterId,
    courseId: created.courseId,
    title: created.title,
    type: created.type,
    videoProvider: created.videoProvider ?? null,
    videoUrl: created.videoUrl ?? null,
    duration: created.duration ?? null,
    isPreview: created.isPreview,
    isPublished: created.isPublished,
    order: created.order,
    createdAt: created.createdAt,
  };
}

export async function updateLesson(
  instructorId: string,
  lessonId: string,
  input: UpdateLessonInput
): Promise<LessonItem> {
  const [lesson] = await db
    .select({
      id: lessons.id,
      chapterId: lessons.chapterId,
      courseId: lessons.courseId,
    })
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);

  if (!lesson) throw makeError('레슨을 찾을 수 없습니다.', 'NOT_FOUND', 404);

  const [course] = await db
    .select({ id: courses.id, instructorId: courses.instructorId })
    .from(courses)
    .where(eq(courses.id, lesson.courseId))
    .limit(1);

  if (!course || course.instructorId !== instructorId) {
    throw makeError('접근 권한이 없습니다.', 'FORBIDDEN', 403);
  }

  const updateData: Partial<typeof lessons.$inferInsert> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.type !== undefined) updateData.type = input.type;
  if (input.videoProvider !== undefined) updateData.videoProvider = input.videoProvider ?? undefined;
  if (input.videoUrl !== undefined) updateData.videoUrl = input.videoUrl ?? undefined;
  if (input.duration !== undefined) updateData.duration = input.duration;
  if (input.isPreview !== undefined) updateData.isPreview = input.isPreview;
  if (input.isPublished !== undefined) updateData.isPublished = input.isPublished;
  if (input.textContent !== undefined) updateData.textContent = input.textContent ?? undefined;
  if (input.order !== undefined) updateData.order = input.order;

  const [updated] = await db
    .update(lessons)
    .set(updateData)
    .where(eq(lessons.id, lessonId))
    .returning();

  // Update course totals
  await db
    .update(courses)
    .set({
      totalLessons: sql`(SELECT COUNT(*)::int FROM lessons WHERE course_id = ${lesson.courseId} AND is_published = true)`,
      totalDuration: sql`(SELECT COALESCE(SUM(duration), 0)::int FROM lessons WHERE course_id = ${lesson.courseId} AND is_published = true)`,
      updatedAt: new Date(),
    })
    .where(eq(courses.id, lesson.courseId));

  return {
    id: updated.id,
    chapterId: updated.chapterId,
    courseId: updated.courseId,
    title: updated.title,
    type: updated.type,
    videoProvider: updated.videoProvider ?? null,
    videoUrl: updated.videoUrl ?? null,
    duration: updated.duration ?? null,
    isPreview: updated.isPreview,
    isPublished: updated.isPublished,
    order: updated.order,
    createdAt: updated.createdAt,
  };
}

// ─── Students ─────────────────────────────────────────────────────────────────

export interface StudentItem {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  enrolledAt: Date;
  progressPercent: number;
  status: string;
}

export async function getCourseStudents(
  instructorId: string,
  courseId: string
): Promise<StudentItem[]> {
  const [course] = await db
    .select({ id: courses.id, instructorId: courses.instructorId })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) throw makeError('강좌를 찾을 수 없습니다.', 'NOT_FOUND', 404);
  if (course.instructorId !== instructorId) throw makeError('접근 권한이 없습니다.', 'FORBIDDEN', 403);

  const rows = await db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      enrolledAt: enrollments.enrolledAt,
      progressPercent: enrollments.progressPercent,
      status: enrollments.status,
    })
    .from(enrollments)
    .innerJoin(users, eq(enrollments.userId, users.id))
    .where(eq(enrollments.courseId, courseId))
    .orderBy(desc(enrollments.enrolledAt));

  return rows.map((r) => ({
    userId: r.userId,
    name: r.name,
    email: r.email,
    avatarUrl: r.avatarUrl ?? null,
    enrolledAt: r.enrolledAt,
    progressPercent: r.progressPercent,
    status: r.status,
  }));
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface InstructorStats {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: string;
  courseStats: {
    courseId: string;
    title: string;
    slug: string;
    enrollmentCount: number;
    revenue: string;
  }[];
}

export async function getInstructorStats(instructorId: string): Promise<InstructorStats> {
  const courseRows = await db
    .select({
      id: courses.id,
      title: courses.title,
      slug: courses.slug,
    })
    .from(courses)
    .where(eq(courses.instructorId, instructorId));

  if (courseRows.length === 0) {
    return {
      totalCourses: 0,
      totalStudents: 0,
      totalRevenue: '0',
      courseStats: [],
    };
  }

  const courseIds = courseRows.map((c) => c.id);

  // Enrollment counts per course
  const enrollmentRows = await db
    .select({
      courseId: enrollments.courseId,
      count: sql<number>`count(*)::int`,
    })
    .from(enrollments)
    .where(
      and(
        inArray(enrollments.courseId, courseIds),
        eq(enrollments.status, 'active')
      )
    )
    .groupBy(enrollments.courseId);

  // Revenue per course (completed payments)
  const revenueRows = await db
    .select({
      courseId: payments.productId,
      total: sql<string>`COALESCE(SUM(${payments.amount}), 0)::text`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.productType, 'course'),
        eq(payments.status, 'completed'),
        inArray(payments.productId, courseIds)
      )
    )
    .groupBy(payments.productId);

  const enrollmentMap = new Map(enrollmentRows.map((r) => [r.courseId, r.count]));
  const revenueMap = new Map(revenueRows.map((r) => [r.courseId, r.total]));

  const courseStats = courseRows.map((c) => ({
    courseId: c.id,
    title: c.title,
    slug: c.slug,
    enrollmentCount: enrollmentMap.get(c.id) ?? 0,
    revenue: revenueMap.get(c.id) ?? '0',
  }));

  const totalStudents = courseStats.reduce((sum, c) => sum + c.enrollmentCount, 0);
  const totalRevenue = courseStats
    .reduce((sum, c) => sum + parseFloat(c.revenue), 0)
    .toFixed(2);

  return {
    totalCourses: courseRows.length,
    totalStudents,
    totalRevenue,
    courseStats,
  };
}

// ─── Lesson detail (for edit page) ───────────────────────────────────────────

export async function getLessonForEdit(instructorId: string, lessonId: string): Promise<LessonItem & { textContent: string | null }> {
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);

  if (!lesson) throw makeError('레슨을 찾을 수 없습니다.', 'NOT_FOUND', 404);

  const [course] = await db
    .select({ id: courses.id, instructorId: courses.instructorId })
    .from(courses)
    .where(eq(courses.id, lesson.courseId))
    .limit(1);

  if (!course || course.instructorId !== instructorId) {
    throw makeError('접근 권한이 없습니다.', 'FORBIDDEN', 403);
  }

  return {
    id: lesson.id,
    chapterId: lesson.chapterId,
    courseId: lesson.courseId,
    title: lesson.title,
    type: lesson.type,
    videoProvider: lesson.videoProvider ?? null,
    videoUrl: lesson.videoUrl ?? null,
    duration: lesson.duration ?? null,
    isPreview: lesson.isPreview,
    isPublished: lesson.isPublished,
    order: lesson.order,
    createdAt: lesson.createdAt,
    textContent: lesson.textContent ?? null,
  };
}

// ─── Course detail with chapters/lessons tree ─────────────────────────────────

export interface CourseDetailWithTree extends InstructorCourse {
  description: string | null;
  chapters: ChapterItem[];
}

export async function getCourseDetail(
  instructorId: string,
  courseId: string
): Promise<CourseDetailWithTree> {
  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) throw makeError('강좌를 찾을 수 없습니다.', 'NOT_FOUND', 404);
  if (course.instructorId !== instructorId) throw makeError('접근 권한이 없습니다.', 'FORBIDDEN', 403);

  const chapterRows = await db
    .select()
    .from(chapters)
    .where(eq(chapters.courseId, courseId))
    .orderBy(chapters.order);

  const lessonRows = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, courseId))
    .orderBy(lessons.order);

  const chaptersWithLessons: ChapterItem[] = chapterRows.map((ch) => ({
    id: ch.id,
    courseId: ch.courseId,
    title: ch.title,
    description: ch.description ?? null,
    order: ch.order,
    isPublished: ch.isPublished,
    createdAt: ch.createdAt,
    lessons: lessonRows
      .filter((l) => l.chapterId === ch.id)
      .map((l) => ({
        id: l.id,
        chapterId: l.chapterId,
        courseId: l.courseId,
        title: l.title,
        type: l.type,
        videoProvider: l.videoProvider ?? null,
        videoUrl: l.videoUrl ?? null,
        duration: l.duration ?? null,
        isPreview: l.isPreview,
        isPublished: l.isPublished,
        order: l.order,
        createdAt: l.createdAt,
      })),
  }));

  const [{ enrollmentCount }] = await db
    .select({ enrollmentCount: sql<number>`count(*)::int` })
    .from(enrollments)
    .where(and(eq(enrollments.courseId, courseId), eq(enrollments.status, 'active')));

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description ?? null,
    shortDescription: course.shortDescription ?? null,
    thumbnailUrl: course.thumbnailUrl ?? null,
    level: course.level,
    category: course.category ?? null,
    price: course.price,
    isFree: course.isFree,
    isPublished: course.isPublished,
    totalLessons: course.totalLessons,
    totalDuration: course.totalDuration,
    averageRating: course.averageRating ?? null,
    reviewCount: course.reviewCount,
    enrollmentCount,
    createdAt: course.createdAt,
    chapters: chaptersWithLessons,
  };
}
