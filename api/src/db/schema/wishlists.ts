import { pgTable, uuid, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { courses } from './courses';

export const wishlists = pgTable('wishlists', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  courseId: uuid('course_id').notNull().references(() => courses.id),
  addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userCourseUniq: unique('wishlists_user_course_uniq').on(table.userId, table.courseId),
  userIdx: index('wishlists_user_idx').on(table.userId),
}));
