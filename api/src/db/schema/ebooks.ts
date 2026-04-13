import { pgTable, uuid, varchar, text, boolean, integer, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const ebooks = pgTable('ebooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  title: varchar('title', { length: 300 }).notNull(),
  authorId: uuid('author_id').references(() => users.id),
  description: text('description'),
  coverImageUrl: text('cover_image_url'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull().default('0'),
  isFree: boolean('is_free').notNull().default(false),
  isPublished: boolean('is_published').notNull().default(false),
  pdfUrl: text('pdf_url'),
  epubUrl: text('epub_url'),
  pageCount: integer('page_count'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  slugIdx: index('ebooks_slug_idx').on(table.slug),
}));
