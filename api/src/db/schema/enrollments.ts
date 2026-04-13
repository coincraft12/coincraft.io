import { pgTable, uuid, varchar, timestamp, integer, unique, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { courses } from './courses';

export const enrollments = pgTable('enrollments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  courseId: uuid('course_id').notNull().references(() => courses.id),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  enrolledAt: timestamp('enrolled_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  paymentId: uuid('payment_id'),
  progressPercent: integer('progress_percent').notNull().default(0),
}, (table) => ({
  userCourseUniq: unique('enrollments_user_course_uniq').on(table.userId, table.courseId),
  userIdx: index('enrollments_user_idx').on(table.userId),
}));
