import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { lessons } from './lessons';
import { courses } from './courses';
import { users } from './users';

export const questions = pgTable(
  'questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lessonId: uuid('lesson_id').notNull().references(() => lessons.id, {
      onDelete: 'cascade',
    }),
    courseId: uuid('course_id').notNull().references(() => courses.id, {
      onDelete: 'cascade',
    }),
    userId: uuid('user_id').notNull().references(() => users.id, {
      onDelete: 'cascade',
    }),
    title: varchar('title', { length: 500 }).notNull(),
    content: text('content').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('open'),
    viewCount: integer('view_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    lessonIdx: index('questions_lesson_idx').on(table.lessonId),
    courseIdx: index('questions_course_idx').on(table.courseId),
    userIdx: index('questions_user_idx').on(table.userId),
    lessonCreatedIdx: index('questions_lesson_created_idx').on(
      table.lessonId,
      table.createdAt
    ),
    statusIdx: index('questions_status_idx').on(table.status),
  })
);
