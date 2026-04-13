import { pgTable, uuid, text, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { ebooks } from './ebooks';

export const ebookReadingProgress = pgTable('ebook_reading_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  ebookId: uuid('ebook_id').notNull().references(() => ebooks.id, { onDelete: 'cascade' }),
  lastCfi: text('last_cfi').notNull().default(''),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userEbookUniq: unique('ebook_reading_progress_user_ebook_unique').on(table.userId, table.ebookId),
  userIdx: index('ebook_reading_progress_user_idx').on(table.userId),
}));
