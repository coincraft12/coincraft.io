import { pgTable, uuid, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  isConfirmed: boolean('is_confirmed').notNull().default(false),
  confirmToken: varchar('confirm_token', { length: 100 }),
  subscribedAt: timestamp('subscribed_at', { withTimezone: true }).notNull().defaultNow(),
  unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
});
