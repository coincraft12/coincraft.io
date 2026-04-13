import { pgTable, uuid, text, jsonb, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { certExams } from './cert-exams';

export const examQuestions = pgTable('exam_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  examId: uuid('exam_id').notNull().references(() => certExams.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  options: jsonb('options').notNull(),
  correctIndex: integer('correct_index').notNull(),
  explanation: text('explanation'),
  order: integer('order').notNull().default(0),
  points: integer('points').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  examIdx: index('exam_questions_exam_idx').on(table.examId),
}));
