import { pgTable, uuid, varchar, text, boolean, integer, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  title: varchar('title', { length: 300 }).notNull(),
  description: text('description'),
  shortDescription: varchar('short_description', { length: 500 }),
  thumbnailUrl: text('thumbnail_url'),
  level: varchar('level', { length: 20 }).notNull().default('beginner'),
  category: varchar('category', { length: 50 }),
  price: numeric('price', { precision: 10, scale: 2 }).notNull().default('0'),
  isFree: boolean('is_free').notNull().default(false),
  isPublished: boolean('is_published').notNull().default(false),
  instructorId: uuid('instructor_id').references(() => users.id),
  totalLessons: integer('total_lessons').notNull().default(0),
  totalDuration: integer('total_duration').notNull().default(0),
  averageRating: numeric('average_rating', { precision: 3, scale: 2 }).default('0'),
  reviewCount: integer('review_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  slugIdx: index('courses_slug_idx').on(table.slug),
  instructorIdx: index('courses_instructor_idx').on(table.instructorId),
  categoryIdx: index('courses_category_idx').on(table.category),
  publishedIdx: index('courses_published_idx').on(table.isPublished),
}));
