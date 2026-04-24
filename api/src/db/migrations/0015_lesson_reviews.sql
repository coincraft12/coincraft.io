-- [1] Create lesson_reviews table - 강의별 후기글
CREATE TABLE IF NOT EXISTS "lesson_reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "lesson_id" uuid NOT NULL,
  "course_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "rating" integer NOT NULL,
  "content" text NOT NULL,
  "image_urls" text[],
  "is_visible" boolean NOT NULL DEFAULT true,
  "helpful_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "lesson_reviews_lesson_fk" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE,
  CONSTRAINT "lesson_reviews_course_fk" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE,
  CONSTRAINT "lesson_reviews_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "lesson_reviews_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5)
);

-- [2] Create unique constraint - 사용자당 강의별 1개 후기만
CREATE UNIQUE INDEX IF NOT EXISTS "lesson_reviews_lesson_user_uniq" ON "lesson_reviews"("lesson_id", "user_id");

-- [3] Create indexes for lesson_reviews table
CREATE INDEX IF NOT EXISTS "lesson_reviews_lesson_idx" ON "lesson_reviews"("lesson_id");
CREATE INDEX IF NOT EXISTS "lesson_reviews_course_idx" ON "lesson_reviews"("course_id");
CREATE INDEX IF NOT EXISTS "lesson_reviews_user_idx" ON "lesson_reviews"("user_id");
CREATE INDEX IF NOT EXISTS "lesson_reviews_visible_rating_idx" ON "lesson_reviews"("lesson_id", "is_visible", "rating" DESC);
CREATE INDEX IF NOT EXISTS "lesson_reviews_created_idx" ON "lesson_reviews"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "lesson_reviews_helpful_idx" ON "lesson_reviews"("helpful_count" DESC);
