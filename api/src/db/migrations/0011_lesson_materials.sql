ALTER TABLE "chapter_materials" ADD COLUMN IF NOT EXISTS "lesson_id" uuid REFERENCES "lessons"("id") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS "chapter_materials_lesson_idx" ON "chapter_materials" ("lesson_id");
