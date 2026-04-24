-- [1] Create questions table - 강의별 Q&A 질문
CREATE TABLE IF NOT EXISTS "questions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "lesson_id" uuid NOT NULL,
  "course_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "title" varchar(500) NOT NULL,
  "content" text NOT NULL,
  "status" varchar(50) NOT NULL DEFAULT 'open',
  "view_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "questions_lesson_fk" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE,
  CONSTRAINT "questions_course_fk" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE,
  CONSTRAINT "questions_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- [2] Create indexes for questions table
CREATE INDEX IF NOT EXISTS "questions_lesson_idx" ON "questions"("lesson_id");
CREATE INDEX IF NOT EXISTS "questions_course_idx" ON "questions"("course_id");
CREATE INDEX IF NOT EXISTS "questions_user_idx" ON "questions"("user_id");
CREATE INDEX IF NOT EXISTS "questions_lesson_created_idx" ON "questions"("lesson_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "questions_status_idx" ON "questions"("status");
