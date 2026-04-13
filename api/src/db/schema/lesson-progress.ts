import { pgTable, uuid, boolean, integer, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { lessons } from './lessons';
import { courses } from './courses';

export const lessonProgress = pgTable('lesson_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id),
  courseId: uuid('course_id').notNull().references(() => courses.id),
  isCompleted: boolean('is_completed').notNull().default(false),
  watchedSeconds: integer('watched_seconds').notNull().default(0),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => ({
  userLessonUniq: unique('lesson_progress_user_lesson_uniq').on(table.userId, table.lessonId),
  userIdx: index('lesson_progress_user_idx').on(table.userId),
}));
