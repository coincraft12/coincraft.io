import { pgTable, uuid, varchar, numeric, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  productType: varchar('product_type', { length: 30 }).notNull(),
  productId: uuid('product_id').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('KRW'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  provider: varchar('provider', { length: 20 }).notNull(),
  providerPaymentId: varchar('provider_payment_id', { length: 100 }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  refundedAt: timestamp('refunded_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdx: index('payments_user_idx').on(table.userId),
  statusIdx: index('payments_status_idx').on(table.status),
}));
