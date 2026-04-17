import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../../db';
import { courseReviews, users, enrollments } from '../../db/schema';

export interface ReviewRow {
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  comment: string | null;
  isVisible: boolean;
  createdAt: Date;
  userName: string | null;
  userAvatar: string | null;
}

export async function listCourseReviews(courseId: string): Promise<ReviewRow[]> {
  const rows = await db
    .select({
      id: courseReviews.id,
      userId: courseReviews.userId,
      courseId: courseReviews.courseId,
      rating: courseReviews.rating,
      comment: courseReviews.comment,
      isVisible: courseReviews.isVisible,
      createdAt: courseReviews.createdAt,
      userName: users.name,
      userAvatar: users.avatarUrl,
    })
    .from(courseReviews)
    .leftJoin(users, eq(courseReviews.userId, users.id))
    .where(and(eq(courseReviews.courseId, courseId), eq(courseReviews.isVisible, true)))
    .orderBy(desc(courseReviews.createdAt));

  return rows;
}

export async function createReview(
  userId: string,
  courseId: string,
  rating: number,
  comment?: string,
): Promise<ReviewRow> {
  // Check enrollment
  const [enrollment] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(
      eq(enrollments.userId, userId),
      eq(enrollments.courseId, courseId),
      eq(enrollments.status, 'active'),
    ))
    .limit(1);

  if (!enrollment) {
    throw Object.assign(new Error('수강 중인 강좌에만 리뷰를 작성할 수 있습니다.'), {
      code: 'NOT_ENROLLED',
      statusCode: 403,
    });
  }

  if (rating < 1 || rating > 5) {
    throw Object.assign(new Error('평점은 1에서 5 사이여야 합니다.'), {
      code: 'INVALID_RATING',
      statusCode: 400,
    });
  }

  // Upsert: one review per user per course
  const [review] = await db
    .insert(courseReviews)
    .values({
      userId,
      courseId,
      rating,
      comment: comment ?? null,
    })
    .onConflictDoUpdate({
      target: [courseReviews.userId, courseReviews.courseId],
      set: {
        rating,
        comment: comment ?? null,
        createdAt: new Date(),
      },
    })
    .returning();

  // Fetch with user info
  const [row] = await db
    .select({
      id: courseReviews.id,
      userId: courseReviews.userId,
      courseId: courseReviews.courseId,
      rating: courseReviews.rating,
      comment: courseReviews.comment,
      isVisible: courseReviews.isVisible,
      createdAt: courseReviews.createdAt,
      userName: users.name,
      userAvatar: users.avatarUrl,
    })
    .from(courseReviews)
    .leftJoin(users, eq(courseReviews.userId, users.id))
    .where(eq(courseReviews.id, review.id))
    .limit(1);

  return row;
}

export async function deleteReview(userId: string, reviewId: string): Promise<void> {
  const [review] = await db
    .select({ id: courseReviews.id, userId: courseReviews.userId })
    .from(courseReviews)
    .where(eq(courseReviews.id, reviewId))
    .limit(1);

  if (!review) {
    throw Object.assign(new Error('리뷰를 찾을 수 없습니다.'), {
      code: 'NOT_FOUND',
      statusCode: 404,
    });
  }

  if (review.userId !== userId) {
    throw Object.assign(new Error('본인의 리뷰만 삭제할 수 있습니다.'), {
      code: 'FORBIDDEN',
      statusCode: 403,
    });
  }

  await db.delete(courseReviews).where(eq(courseReviews.id, reviewId));
}

export async function getCourseRating(
  courseId: string,
): Promise<{ averageRating: number; count: number }> {
  const [result] = await db
    .select({
      averageRating: sql<number>`coalesce(avg(${courseReviews.rating}), 0)::float`,
      count: sql<number>`count(*)::int`,
    })
    .from(courseReviews)
    .where(and(eq(courseReviews.courseId, courseId), eq(courseReviews.isVisible, true)));

  return {
    averageRating: result?.averageRating ?? 0,
    count: result?.count ?? 0,
  };
}
