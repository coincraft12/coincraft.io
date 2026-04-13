import { pgTable, uuid, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { coupons } from './coupons';
import { users } from './users';
import { payments } from './payments';

export const couponUsages = pgTable('coupon_usages', {
  id: uuid('id').primaryKey().defaultRandom(),
  couponId: uuid('coupon_id').notNull().references(() => coupons.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  paymentId: uuid('payment_id').references(() => payments.id),
  usedAt: timestamp('used_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  couponUserUniq: unique('coupon_usages_coupon_user_uniq').on(table.couponId, table.userId),
  couponIdx: index('coupon_usages_coupon_idx').on(table.couponId),
}));
