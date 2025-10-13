-- Migration 003: Growth Groups table
-- Feature: 001-crie-um-app
-- Description: Creates growth_groups table (GCs). Leaders and supervisors are many-to-many via separate tables.

CREATE TABLE growth_groups (
  -- Identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 255),

  -- Mode and Location
  mode TEXT NOT NULL CHECK (mode IN ('in_person', 'online', 'hybrid')),
  address TEXT, -- Required if in_person
  weekday INT CHECK (weekday BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  time TIME,

  -- State
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'multiplying')),

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT address_if_in_person CHECK (
    mode = 'online' OR mode = 'hybrid' OR (mode = 'in_person' AND address IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_gc_name ON growth_groups(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_gc_status ON growth_groups(status) WHERE deleted_at IS NULL;

-- Triggers
CREATE TRIGGER update_growth_groups_updated_at
BEFORE UPDATE ON growth_groups
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Row Level Security (RLS)
-- NOTE: Policies will be created in migration 004 after gc_leaders/gc_supervisors tables exist
ALTER TABLE growth_groups ENABLE ROW LEVEL SECURITY;

-- Comments
COMMENT ON TABLE growth_groups IS 'Growth groups (GCs). Leaders and supervisors are defined in gc_leaders and gc_supervisors tables (many-to-many).';
COMMENT ON COLUMN growth_groups.mode IS 'Meeting mode: in_person, online, or hybrid';
COMMENT ON COLUMN growth_groups.address IS 'Address - required if mode=in_person';
COMMENT ON COLUMN growth_groups.weekday IS 'Day of week: 0=Sunday, 6=Saturday';
