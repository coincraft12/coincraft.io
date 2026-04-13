import { pgTable, uuid, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { ebooks } from './ebooks';
import { payments } from './payments';

export const ebookPurchases = pgTable('ebook_purchases', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  ebookId: uuid('ebook_id').notNull().references(() => ebooks.id),
  paymentId: uuid('payment_id').references(() => payments.id),
  purchasedAt: timestamp('purchased_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userEbookUniq: unique('ebook_purchases_user_ebook_uniq').on(table.userId, table.ebookId),
  userIdx: index('ebook_purchases_user_idx').on(table.userId),
}));
