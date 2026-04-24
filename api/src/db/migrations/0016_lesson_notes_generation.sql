ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "transcript" text;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "notes_status" varchar(20) NOT NULL DEFAULT 'none';
