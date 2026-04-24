-- [1] Create answer_reactions table - 답변에 대한 평가 (좋아요/싫어요)
CREATE TABLE IF NOT EXISTS "answer_reactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "answer_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "reaction_type" varchar(50) NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "answer_reactions_answer_fk" FOREIGN KEY ("answer_id") REFERENCES "answers"("id") ON DELETE CASCADE,
  CONSTRAINT "answer_reactions_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- [2] Create unique constraint - 사용자당 답변별 1개 평가만
CREATE UNIQUE INDEX IF NOT EXISTS "answer_reactions_answer_user_uniq" ON "answer_reactions"("answer_id", "user_id");

-- [3] Create indexes for answer_reactions table
CREATE INDEX IF NOT EXISTS "answer_reactions_answer_idx" ON "answer_reactions"("answer_id");
CREATE INDEX IF NOT EXISTS "answer_reactions_user_idx" ON "answer_reactions"("user_id");
CREATE INDEX IF NOT EXISTS "answer_reactions_type_idx" ON "answer_reactions"("reaction_type");
CREATE INDEX IF NOT EXISTS "answer_reactions_created_idx" ON "answer_reactions"("created_at" DESC);

-- [4] Create trigger function to sync helpful/unhelpful counts
CREATE OR REPLACE FUNCTION sync_answer_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "answers"
  SET
    "helpful_count" = (SELECT COUNT(*) FROM "answer_reactions" WHERE "answer_id" = NEW."answer_id" AND "reaction_type" = 'helpful'),
    "unhelpful_count" = (SELECT COUNT(*) FROM "answer_reactions" WHERE "answer_id" = NEW."answer_id" AND "reaction_type" = 'unhelpful')
  WHERE "id" = NEW."answer_id";
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- [5] Create trigger on insert/update
DROP TRIGGER IF EXISTS sync_answer_reaction_counts_trigger ON "answer_reactions";
CREATE TRIGGER sync_answer_reaction_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON "answer_reactions"
FOR EACH ROW
EXECUTE FUNCTION sync_answer_reaction_counts();
