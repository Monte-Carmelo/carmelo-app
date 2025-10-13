-- Migration 006: Visitors table
-- Feature: 001-crie-um-app
-- Description: Visitors tracking, references people for personal data

CREATE TABLE visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL UNIQUE REFERENCES people(id) ON DELETE CASCADE,
  visit_count INT NOT NULL DEFAULT 0,
  first_visit_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_visit_date TIMESTAMPTZ,
  converted_to_member_at TIMESTAMPTZ,
  converted_by_user_id UUID REFERENCES users(id),
  converted_to_member_id UUID REFERENCES members(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_visitors_person ON visitors(person_id);
CREATE INDEX idx_visitors_not_converted ON visitors(visit_count) WHERE converted_to_member_at IS NULL;

CREATE TRIGGER update_visitors_updated_at
BEFORE UPDATE ON visitors
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Row Level Security (RLS) - enabled now, policies added in migration 012
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
