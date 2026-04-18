import { pgTable, uuid, varchar, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { physicalBooks } from './physical-books';
import { payments } from './payments';

export const bookOrders = pgTable('book_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  bookId: uuid('book_id').notNull().references(() => physicalBooks.id),
  paymentId: uuid('payment_id').references(() => payments.id),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  shippingName: varchar('shipping_name', { length: 100 }).notNull(),
  shippingPhone: varchar('shipping_phone', { length: 20 }).notNull(),
  postalCode: varchar('postal_code', { length: 10 }).notNull(),
  shippingAddress: text('shipping_address').notNull(),
  shippingDetail: text('shipping_detail'),
  quantity: integer('quantity').notNull().default(1),
  totalAmount: integer('total_amount').notNull(),
  trackingNumber: varchar('tracking_number', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
