import { pgTable, uuid, varchar, integer, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const physicalBooks = pgTable('physical_books', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 200 }).notNull(),
  author: varchar('author', { length: 100 }).notNull().default('COINCRAFT'),
  price: integer('price').notNull(),
  coverImageUrl: text('cover_image_url'),
  description: text('description'),
  stock: integer('stock').notNull().default(100),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
