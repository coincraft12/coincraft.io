import { eq, and } from 'drizzle-orm';
import { db } from '../../db';
import { wishlists, courses, enrollments } from '../../db/schema';

export interface WishlistCourse {
  wishlistId: string;
  addedAt: Date;
  courseId: string;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  price: string;
  originalPrice: string | null;
}

export async function toggleWishlist(
  userId: string,
  courseId: string,
): Promise<{ wishlisted: boolean }> {
  const [enrolled] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId), eq(enrollments.status, 'active')))
    .limit(1);

  if (enrolled) return { wishlisted: false };

  const [existing] = await db
    .select({ id: wishlists.id })
    .from(wishlists)
    .where(and(eq(wishlists.userId, userId), eq(wishlists.courseId, courseId)))
    .limit(1);

  if (existing) {
    await db.delete(wishlists).where(eq(wishlists.id, existing.id));
    return { wishlisted: false };
  }

  await db.insert(wishlists).values({ userId, courseId });
  return { wishlisted: true };
}

export async function listUserWishlists(userId: string): Promise<WishlistCourse[]> {
  const rows = await db
    .select({
      wishlistId: wishlists.id,
      addedAt: wishlists.addedAt,
      courseId: courses.id,
      title: courses.title,
      slug: courses.slug,
      thumbnailUrl: courses.thumbnailUrl,
      price: courses.price,
      originalPrice: courses.originalPrice,
    })
    .from(wishlists)
    .innerJoin(courses, eq(wishlists.courseId, courses.id))
    .where(eq(wishlists.userId, userId));

  return rows.map((r) => ({
    wishlistId: r.wishlistId,
    addedAt: r.addedAt,
    courseId: r.courseId,
    title: r.title,
    slug: r.slug,
    thumbnailUrl: r.thumbnailUrl,
    price: r.price,
    originalPrice: r.originalPrice ?? null,
  }));
}

export async function isWishlisted(userId: string, courseId: string): Promise<boolean> {
  const [enrolled] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId), eq(enrollments.status, 'active')))
    .limit(1);

  if (enrolled) return false;

  const [row] = await db
    .select({ id: wishlists.id })
    .from(wishlists)
    .where(and(eq(wishlists.userId, userId), eq(wishlists.courseId, courseId)))
    .limit(1);

  return !!row;
}
