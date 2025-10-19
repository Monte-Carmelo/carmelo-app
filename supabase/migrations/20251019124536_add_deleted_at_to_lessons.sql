-- Add deleted_at column to lesson_series table
ALTER TABLE lesson_series
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add deleted_at column to lessons table
ALTER TABLE lessons
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for soft-deleted series queries
CREATE INDEX idx_lesson_series_deleted_at ON lesson_series(deleted_at)
WHERE deleted_at IS NULL;

-- Create index for soft-deleted lessons queries
CREATE INDEX idx_lessons_deleted_at ON lessons(deleted_at)
WHERE deleted_at IS NULL;
