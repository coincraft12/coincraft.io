import { pgTable, uuid, varchar, text, boolean, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const blogPosts = pgTable('blog_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  title: varchar('title', { length: 300 }).notNull(),
  content: text('content'),
  excerpt: text('excerpt'),
  coverImageUrl: text('cover_image_url'),
  authorId: uuid('author_id').references(() => users.id),
  category: varchar('category', { length: 50 }),
  tags: text('tags').array(),
  isPublished: boolean('is_published').notNull().default(false),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  viewCount: integer('view_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  slugIdx: index('blog_posts_slug_idx').on(table.slug),
  publishedIdx: index('blog_posts_published_idx').on(table.isPublished),
}));
