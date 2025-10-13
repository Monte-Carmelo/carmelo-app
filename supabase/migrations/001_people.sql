-- Migration 001: People (base entity)
-- Feature: 001-crie-um-app
-- Description: Normalized entity for personal data, avoids duplication between users, members, visitors

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Helper function: update timestamp on UPDATE
CREATE OR REPLACE FUNCTION update_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE people (
  -- Identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 255),
  email TEXT,
  phone TEXT,
  birth_date DATE,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraint: At least email OR phone
  CONSTRAINT person_has_contact CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_people_email ON people(email) WHERE email IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_people_phone ON people(phone) WHERE phone IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_people_name ON people USING GIN(to_tsvector('portuguese', name)) WHERE deleted_at IS NULL;

-- Trigger for updated_at
CREATE TRIGGER update_people_updated_at
BEFORE UPDATE ON people
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Row Level Security (RLS) - enabled now, policies added in migration 012
ALTER TABLE people ENABLE ROW LEVEL SECURITY;

-- Comments
COMMENT ON TABLE people IS 'Base normalized entity: personal data shared between users, members, visitors';
COMMENT ON COLUMN people.name IS 'Person''s full name';
COMMENT ON COLUMN people.email IS 'Email (optional, but at least email OR phone required)';
COMMENT ON COLUMN people.phone IS 'Phone (optional, but at least email OR phone required)';
COMMENT ON COLUMN people.birth_date IS 'Birth date (optional)';
