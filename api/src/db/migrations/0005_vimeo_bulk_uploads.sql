CREATE TABLE IF NOT EXISTS vimeo_bulk_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  filename VARCHAR(500) NOT NULL,
  video_uri TEXT,
  vimeo_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'uploading',
  progress INT NOT NULL DEFAULT 0,
  error_msg TEXT,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vimeo_bulk_uploads_course_idx ON vimeo_bulk_uploads(course_id);
CREATE INDEX IF NOT EXISTS vimeo_bulk_uploads_instructor_idx ON vimeo_bulk_uploads(instructor_id);
