import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { answers } from './answers';
import { users } from './users';

export const answerReactions = pgTable(
  'answer_reactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    answerId: uuid('answer_id').notNull().references(() => answers.id, {
      onDelete: 'cascade',
    }),
    userId: uuid('user_id').notNull().references(() => users.id, {
      onDelete: 'cascade',
    }),
    reactionType: varchar('reaction_type', { length: 50 }).notNull(), // 'helpful' | 'unhelpful'
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    answerUserUniq: unique('answer_reactions_answer_user_uniq').on(
      table.answerId,
      table.userId
    ),
    answerIdx: index('answer_reactions_answer_idx').on(table.answerId),
    userIdx: index('answer_reactions_user_idx').on(table.userId),
    typeIdx: index('answer_reactions_type_idx').on(table.reactionType),
    createdIdx: index('answer_reactions_created_idx').on(table.createdAt),
  })
);
