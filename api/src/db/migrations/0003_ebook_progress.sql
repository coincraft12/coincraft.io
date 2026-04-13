CREATE TABLE IF NOT EXISTS "ebook_reading_progress" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "ebook_id" uuid NOT NULL REFERENCES "ebooks"("id") ON DELETE CASCADE,
  "last_page" integer NOT NULL DEFAULT 1,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ebook_reading_progress_user_ebook_unique" UNIQUE("user_id", "ebook_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ebook_reading_progress_user_idx" ON "ebook_reading_progress" ("user_id");
