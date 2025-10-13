-- Migration 002: Users table with hierarchical structure
-- Feature: 001-crie-um-app
-- Description: Creates users table with organizational hierarchy support, references people for personal data

-- Users table
CREATE TABLE users (
  -- Identification (synced with Supabase Auth)
  id UUID PRIMARY KEY, -- Same ID as Supabase Auth user
  person_id UUID NOT NULL UNIQUE REFERENCES people(id) ON DELETE CASCADE,

  -- Organizational Hierarchy (parent/child tree)
  hierarchy_parent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  hierarchy_path TEXT NOT NULL DEFAULT '/', -- Ex: '/uuid1/uuid2/uuid3'
  hierarchy_depth INT NOT NULL DEFAULT 0, -- Depth in tree (0=root, 1=direct child, etc.)

  -- Permissions
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_users_person ON users(person_id);
CREATE INDEX idx_users_parent ON users(hierarchy_parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_path ON users USING GIN(hierarchy_path gin_trgm_ops);
CREATE INDEX idx_users_depth ON users(hierarchy_depth) WHERE deleted_at IS NULL;

-- Trigger to auto-update hierarchy_path and hierarchy_depth
CREATE OR REPLACE FUNCTION update_hierarchy_path() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.hierarchy_parent_id IS NULL THEN
    NEW.hierarchy_path := '/' || NEW.id::TEXT;
    NEW.hierarchy_depth := 0;
  ELSE
    SELECT hierarchy_path || '/' || NEW.id::TEXT, hierarchy_depth + 1
    INTO NEW.hierarchy_path, NEW.hierarchy_depth
    FROM users
    WHERE id = NEW.hierarchy_parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_hierarchy_path
BEFORE INSERT OR UPDATE OF hierarchy_parent_id ON users
FOR EACH ROW EXECUTE FUNCTION update_hierarchy_path();

-- Trigger for updated_at
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users see themselves
CREATE POLICY "users_see_self" ON users
FOR SELECT USING (id = auth.uid());

-- Users see people in their hierarchy (subordinates)
CREATE POLICY "users_see_subordinates" ON users
FOR SELECT USING (
  hierarchy_path LIKE (
    SELECT hierarchy_path || '%' FROM users WHERE id = auth.uid()
  )
);

-- Users see their direct supervisor (parent)
CREATE POLICY "users_see_supervisor" ON users
FOR SELECT USING (
  id = (SELECT hierarchy_parent_id FROM users WHERE id = auth.uid())
);

-- Admins see all
CREATE POLICY "admins_see_all_users" ON users
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Comments for documentation
COMMENT ON TABLE users IS 'Users with organizational hierarchy. References people for personal data. Roles (leader, supervisor, coordinator) are ACCUMULATED and derived from relationships, not stored as static fields.';
COMMENT ON COLUMN users.person_id IS 'Reference to people table (1:1 relationship). Personal data (name, email, phone) stored in people.';
COMMENT ON COLUMN users.hierarchy_path IS 'Materialized path for efficient subtree queries. Format: /uuid1/uuid2/uuid3';
COMMENT ON COLUMN users.hierarchy_depth IS 'Depth in the organizational tree. 0=root level (no parent)';
