import { pgTable, uuid, varchar, integer, boolean, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { certExams } from './cert-exams';

export const examAttempts = pgTable('exam_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  examId: uuid('exam_id').notNull().references(() => certExams.id),
  status: varchar('status', { length: 20 }).notNull().default('in_progress'),
  score: integer('score'),
  isPassed: boolean('is_passed'),
  answers: jsonb('answers'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  gradedAt: timestamp('graded_at', { withTimezone: true }),
}, (table) => ({
  userIdx: index('exam_attempts_user_idx').on(table.userId),
  examIdx: index('exam_attempts_exam_idx').on(table.examId),
}));
