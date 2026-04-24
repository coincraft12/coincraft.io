import { pgTable, uuid, text, jsonb, integer, timestamp, index, varchar } from 'drizzle-orm/pg-core';
import { lessons } from './lessons';

export const lessonQuizzes = pgTable('lesson_quizzes', {
  id: uuid('id').primaryKey().defaultRandom(),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  options: jsonb('options').notNull().$type<string[]>(),
  correctIndex: integer('correct_index').notNull(),
  explanation: text('explanation'),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  lessonIdx: index('lesson_quizzes_lesson_idx').on(table.lessonId),
}));
