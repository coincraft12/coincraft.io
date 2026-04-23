CREATE TABLE IF NOT EXISTS "chapter_materials" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "chapter_id" uuid NOT NULL REFERENCES "chapters"("id") ON DELETE CASCADE,
  "title" varchar(300) NOT NULL,
  "file_url" text NOT NULL,
  "file_size" integer,
  "file_type" varchar(100),
  "order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "chapter_materials_chapter_idx" ON "chapter_materials" ("chapter_id");
