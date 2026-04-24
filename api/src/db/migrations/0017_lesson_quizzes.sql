CREATE TABLE IF NOT EXISTS "lesson_quizzes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "lesson_id" uuid NOT NULL REFERENCES "lessons"("id") ON DELETE CASCADE,
  "question" text NOT NULL,
  "options" jsonb NOT NULL,
  "correct_index" integer NOT NULL,
  "explanation" text,
  "order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "lesson_quizzes_lesson_idx" ON "lesson_quizzes" ("lesson_id");

ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "quiz_status" varchar(20) NOT NULL DEFAULT 'none';
