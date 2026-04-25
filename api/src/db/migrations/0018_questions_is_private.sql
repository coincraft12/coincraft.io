ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "is_private" boolean NOT NULL DEFAULT false;
