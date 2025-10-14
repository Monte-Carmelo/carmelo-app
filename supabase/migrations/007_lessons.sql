-- Migration 007: Lesson Series and Lessons
-- Feature: 001-crie-um-app

CREATE TABLE lesson_series (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 255),
  description TEXT,
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lesson_series_created_by ON lesson_series(created_by_user_id);

CREATE TRIGGER update_lesson_series_updated_at
BEFORE UPDATE ON lesson_series
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 255),
  description TEXT,
  series_id UUID REFERENCES lesson_series(id) ON DELETE SET NULL,
  link TEXT,
  order_in_series INT,
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lessons_series ON lessons(series_id);
CREATE INDEX idx_lessons_order ON lessons(series_id, order_in_series);

CREATE TRIGGER update_lessons_updated_at
BEFORE UPDATE ON lessons
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- RLS: Anyone can read lessons, only admins can create/edit
ALTER TABLE lesson_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "all_view_series" ON lesson_series FOR SELECT USING (true);
CREATE POLICY "admins_manage_series" ON lesson_series
FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "all_view_lessons" ON lessons FOR SELECT USING (true);
CREATE POLICY "admins_manage_lessons" ON lessons
FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE));
