-- [1] Create answers table - 질문에 대한 답변 (AI 1차 + 강사 2차)
CREATE TABLE IF NOT EXISTS "answers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "question_id" uuid NOT NULL,
  "user_id" uuid,
  "content" text NOT NULL,
  "type" varchar(50) NOT NULL,
  "status" varchar(50) NOT NULL DEFAULT 'ai_pending',

  -- 답변 채택 (질문자만 가능)
  "is_accepted" boolean NOT NULL DEFAULT false,
  "accepted_by" uuid,
  "accepted_at" timestamp with time zone,

  -- 답변 평가 (좋아요/싫어요)
  "helpful_count" integer NOT NULL DEFAULT 0,
  "unhelpful_count" integer NOT NULL DEFAULT 0,

  -- AI 답변 관련
  "ai_model" varchar(255),
  "ai_tokens_used" integer,

  -- 강사 보완
  "instructor_revision" text,
  "instructor_revised_at" timestamp with time zone,
  "instructor_revised_by" uuid,

  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT "answers_question_fk" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE,
  CONSTRAINT "answers_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL,
  CONSTRAINT "answers_accepted_by_fk" FOREIGN KEY ("accepted_by") REFERENCES "users"("id") ON DELETE SET NULL,
  CONSTRAINT "answers_instructor_fk" FOREIGN KEY ("instructor_revised_by") REFERENCES "users"("id") ON DELETE SET NULL
);

-- [2] Create unique constraint - 각 질문에 AI 1개, 강사 1개 답변만
CREATE UNIQUE INDEX IF NOT EXISTS "answers_question_type_uniq" ON "answers"("question_id", "type");

-- [3] Create indexes for answers table
CREATE INDEX IF NOT EXISTS "answers_question_idx" ON "answers"("question_id");
CREATE INDEX IF NOT EXISTS "answers_user_idx" ON "answers"("user_id");
CREATE INDEX IF NOT EXISTS "answers_type_idx" ON "answers"("type");
CREATE INDEX IF NOT EXISTS "answers_is_accepted_idx" ON "answers"("is_accepted");
CREATE INDEX IF NOT EXISTS "answers_instructor_revised_idx" ON "answers"("instructor_revised_by");
CREATE INDEX IF NOT EXISTS "answers_created_idx" ON "answers"("created_at" DESC);
