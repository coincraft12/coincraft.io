import { eq, and, ilike, sql, desc, asc } from 'drizzle-orm';
import { db } from '../../db';
import { courses, chapters, lessons, enrollments, users } from '../../db/schema';
import type { CoursesQuery } from './courses.schema';

export interface CourseListItem {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  level: string;
  category: string | null;
  price: string;
  isFree: boolean;
  totalLessons: number;
  totalDuration: number;
  averageRating: string | null;
  reviewCount: number;
  instructor: { id: string; name: string; avatarUrl: string | null } | null;
}

export interface CourseDetail extends CourseListItem {
  description: string | null;
  isEnrolled: boolean;
  chapters: {
    id: string;
    title: string;
    order: number;
    lessons: {
      id: string;
      title: string;
      type: string;
      duration: number | null;
      isPreview: boolean;
      order: number;
    }[];
  }[];
}

export interface PaginatedCourses {
  data: CourseListItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export async function listCourses(query: CoursesQuery, userId?: string): Promise<PaginatedCourses> {
  const { category, level, isFree, q, sort, page, limit } = query;
  const offset = (page - 1) * limit;

  const conditions = [eq(courses.isPublished, true)];
  if (category) conditions.push(eq(courses.category, category));
  if (level) conditions.push(eq(courses.level, level));
  if (isFree !== undefined) conditions.push(eq(courses.isFree, isFree));
  if (q) conditions.push(ilike(courses.title, `%${q}%`));

  const orderBy = sort === 'popular'
    ? [desc(courses.reviewCount)]
    : sort === 'price_asc'
    ? [asc(courses.price)]
    : sort === 'price_desc'
    ? [desc(courses.price)]
    : [desc(courses.createdAt)];

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(courses)
    .where(and(...conditions));

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
      totalLessons: courses.totalLessons,
      totalDuration: courses.totalDuration,
      averageRating: courses.averageRating,
      reviewCount: courses.reviewCount,
      instructorId: courses.instructorId,
      instructorName: users.name,
      instructorAvatar: users.avatarUrl,
    })
    .from(courses)
    .leftJoin(users, eq(courses.instructorId, users.id))
    .where(and(...conditions))
    .orderBy(...orderBy)
    .limit(limit)
    .offset(offset);

  const data: CourseListItem[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    shortDescription: r.shortDescription,
    thumbnailUrl: r.thumbnailUrl,
    level: r.level,
    category: r.category,
    price: r.price,
    isFree: r.isFree,
    totalLessons: r.totalLessons,
    totalDuration: r.totalDuration,
    averageRating: r.averageRating,
    reviewCount: r.reviewCount,
    instructor: r.instructorId
      ? { id: r.instructorId, name: r.instructorName ?? '', avatarUrl: r.instructorAvatar ?? null }
      : null,
  }));

  return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function getCourseBySlug(slug: string, userId?: string): Promise<CourseDetail> {
  const [course] = await db
    .select({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
      description: courses.description,
      shortDescription: courses.shortDescription,
      thumbnailUrl: courses.thumbnailUrl,
      level: courses.level,
      category: courses.category,
      price: courses.price,
      isFree: courses.isFree,
      totalLessons: courses.totalLessons,
      totalDuration: courses.totalDuration,
      averageRating: courses.averageRating,
      reviewCount: courses.reviewCount,
      instructorId: courses.instructorId,
      instructorName: users.name,
      instructorAvatar: users.avatarUrl,
    })
    .from(courses)
    .leftJoin(users, eq(courses.instructorId, users.id))
    .where(and(eq(courses.slug, slug), eq(courses.isPublished, true)))
    .limit(1);

  if (!course) throw Object.assign(new Error('강좌를 찾을 수 없습니다.'), { code: 'NOT_FOUND', status: 404 });

  // 수강 여부
  let isEnrolled = false;
  if (userId) {
    const [enrollment] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, course.id)))
      .limit(1);
    isEnrolled = !!enrollment;
  }

  // 챕터 + 레슨 커리큘럼
  const chapterRows = await db
    .select()
    .from(chapters)
    .where(and(eq(chapters.courseId, course.id), eq(chapters.isPublished, true)))
    .orderBy(asc(chapters.order));

  const lessonRows = await db
    .select({
      id: lessons.id,
      chapterId: lessons.chapterId,
      title: lessons.title,
      type: lessons.type,
      duration: lessons.duration,
      isPreview: lessons.isPreview,
      order: lessons.order,
    })
    .from(lessons)
    .where(and(eq(lessons.courseId, course.id), eq(lessons.isPublished, true)))
    .orderBy(asc(lessons.order));

  const chaptersWithLessons = chapterRows.map((ch) => ({
    id: ch.id,
    title: ch.title,
    order: ch.order,
    lessons: lessonRows
      .filter((l) => l.chapterId === ch.id)
      .map((l) => ({
        id: l.id,
        title: l.title,
        type: l.type,
        duration: l.duration,
        isPreview: l.isPreview,
        order: l.order,
      })),
  }));

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    shortDescription: course.shortDescription,
    thumbnailUrl: course.thumbnailUrl,
    level: course.level,
    category: course.category,
    price: course.price,
    isFree: course.isFree,
    totalLessons: course.totalLessons,
    totalDuration: course.totalDuration,
    averageRating: course.averageRating,
    reviewCount: course.reviewCount,
    instructor: course.instructorId
      ? { id: course.instructorId, name: course.instructorName ?? '', avatarUrl: course.instructorAvatar ?? null }
      : null,
    isEnrolled,
    chapters: chaptersWithLessons,
  };
}
