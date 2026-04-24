import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { lessons } from './lessons';
import { courses } from './courses';
import { users } from './users';

export const lessonReviews = pgTable(
  'lesson_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lessonId: uuid('lesson_id').notNull().references(() => lessons.id, {
      onDelete: 'cascade',
    }),
    courseId: uuid('course_id').notNull().references(() => courses.id, {
      onDelete: 'cascade',
    }),
    userId: uuid('user_id').notNull().references(() => users.id, {
      onDelete: 'cascade',
    }),
    rating: integer('rating').notNull(), // 1-5
    content: text('content').notNull(),
    imageUrls: text('image_urls').array(),
    isVisible: boolean('is_visible').notNull().default(true),
    helpfulCount: integer('helpful_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    lessonUserUniq: unique('lesson_reviews_lesson_user_uniq').on(
      table.lessonId,
      table.userId
    ),
    lessonIdx: index('lesson_reviews_lesson_idx').on(table.lessonId),
    courseIdx: index('lesson_reviews_course_idx').on(table.courseId),
    userIdx: index('lesson_reviews_user_idx').on(table.userId),
    visibleRatingIdx: index('lesson_reviews_visible_rating_idx').on(
      table.lessonId,
      table.isVisible,
      table.rating
    ),
    createdIdx: index('lesson_reviews_created_idx').on(table.createdAt),
    helpfulIdx: index('lesson_reviews_helpful_idx').on(table.helpfulCount),
  })
);
