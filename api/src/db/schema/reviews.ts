import { pgTable, uuid, integer, text, boolean, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { courses } from './courses';

export const courseReviews = pgTable('course_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  courseId: uuid('course_id').notNull().references(() => courses.id),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  isVisible: boolean('is_visible').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userCourseUniq: unique('reviews_user_course_uniq').on(table.userId, table.courseId),
  courseIdx: index('reviews_course_idx').on(table.courseId),
}));
