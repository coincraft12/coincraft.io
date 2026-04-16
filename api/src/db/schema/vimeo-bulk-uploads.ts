import { pgTable, uuid, varchar, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { courses } from './courses';
import { lessons } from './lessons';
import { users } from './users';

export const vimeoBulkUploads = pgTable('vimeo_bulk_uploads', {
  id: uuid('id').primaryKey().defaultRandom(),
  instructorId: uuid('instructor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  filename: varchar('filename', { length: 500 }).notNull(),
  videoUri: text('video_uri'),              // /videos/12345
  vimeoUrl: text('vimeo_url'),              // https://vimeo.com/12345/hash
  status: varchar('status', { length: 20 }).notNull().default('uploading'), // uploading | processing | done | error
  progress: integer('progress').notNull().default(0),
  errorMsg: text('error_msg'),
  lessonId: uuid('lesson_id').references(() => lessons.id, { onDelete: 'set null' }), // null = 미연결
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  courseIdx: index('vimeo_bulk_uploads_course_idx').on(table.courseId),
  instructorIdx: index('vimeo_bulk_uploads_instructor_idx').on(table.instructorId),
}));
