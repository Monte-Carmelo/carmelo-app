-- Migration: Create events table and related objects
-- Feature: 005-funcionalidade-de-eventos
-- Date: 2025-10-20

BEGIN;

-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location TEXT,
  banner_url TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Create indexes
CREATE INDEX idx_events_date
  ON events(event_date)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_events_status
  ON events(status)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_events_created_by
  ON events(created_by_user_id);

CREATE INDEX idx_events_year_date
  ON events(EXTRACT(YEAR FROM event_date), event_date)
  WHERE deleted_at IS NULL;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER events_updated_at_trigger
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins manage all events
CREATE POLICY "admins_manage_all_events"
ON events
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE is_admin = true
  )
);

-- RLS Policy: Users view active events
CREATE POLICY "users_view_active_events"
ON events
FOR SELECT
USING (
  deleted_at IS NULL
  AND auth.uid() IN (
    SELECT id FROM users
  )
);

COMMIT;