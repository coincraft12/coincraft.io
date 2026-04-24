import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { questions } from './questions';
import { users } from './users';

export const answers = pgTable(
  'answers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionId: uuid('question_id').notNull().references(() => questions.id, {
      onDelete: 'cascade',
    }),
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    content: text('content').notNull(),
    type: varchar('type', { length: 50 }).notNull(), // 'ai' | 'instructor'
    status: varchar('status', { length: 50 })
      .notNull()
      .default('ai_pending'), // 'ai_pending' | 'ai_answered' | 'instructor_revised' | 'ai_regenerated'

    // 답변 채택 (질문자만 가능)
    isAccepted: boolean('is_accepted').notNull().default(false),
    acceptedBy: uuid('accepted_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),

    // 답변 평가 (좋아요/싫어요)
    helpfulCount: integer('helpful_count').notNull().default(0),
    unhelpfulCount: integer('unhelpful_count').notNull().default(0),

    // AI 답변 관련
    aiModel: varchar('ai_model', { length: 255 }),
    aiTokensUsed: integer('ai_tokens_used'),

    // 강사 보완
    instructorRevision: text('instructor_revision'),
    instructorRevisedAt: timestamp('instructor_revised_at', {
      withTimezone: true,
    }),
    instructorRevisedBy: uuid('instructor_revised_by').references(
      () => users.id,
      {
        onDelete: 'set null',
      }
    ),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    questionTypeUniq: unique('answers_question_type_uniq').on(
      table.questionId,
      table.type
    ),
    questionIdx: index('answers_question_idx').on(table.questionId),
    userIdx: index('answers_user_idx').on(table.userId),
    typeIdx: index('answers_type_idx').on(table.type),
    isAcceptedIdx: index('answers_is_accepted_idx').on(table.isAccepted),
    instructorRevisedIdx: index('answers_instructor_revised_idx').on(
      table.instructorRevisedBy
    ),
    createdIdx: index('answers_created_idx').on(table.createdAt),
  })
);
