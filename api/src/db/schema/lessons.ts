import { pgTable, uuid, varchar, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { chapters } from './chapters';
import { courses } from './courses';

export const lessons = pgTable('lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  chapterId: uuid('chapter_id').notNull().references(() => chapters.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 300 }).notNull(),
  type: varchar('type', { length: 20 }).notNull().default('video'),
  videoProvider: varchar('video_provider', { length: 20 }),
  videoUrl: text('video_url'),
  duration: integer('duration').default(0),
  isPreview: boolean('is_preview').notNull().default(false),
  isPublished: boolean('is_published').notNull().default(false),
  textContent: text('text_content'),
  transcript: text('transcript'),
  notesStatus: varchar('notes_status', { length: 20 }).notNull().default('none'),
  quizStatus: varchar('quiz_status', { length: 20 }).notNull().default('none'),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  chapterIdx: index('lessons_chapter_idx').on(table.chapterId),
  courseIdx: index('lessons_course_idx').on(table.courseId),
}));
