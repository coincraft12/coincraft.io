import { pgTable, uuid, varchar, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { chapters } from './chapters';
import { lessons } from './lessons';

export const chapterMaterials = pgTable('chapter_materials', {
  id: uuid('id').primaryKey().defaultRandom(),
  chapterId: uuid('chapter_id').notNull().references(() => chapters.id, { onDelete: 'cascade' }),
  lessonId: uuid('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 300 }).notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size'),
  fileType: varchar('file_type', { length: 100 }),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  chapterIdx: index('chapter_materials_chapter_idx').on(table.chapterId),
  lessonIdx: index('chapter_materials_lesson_idx').on(table.lessonId),
}));
