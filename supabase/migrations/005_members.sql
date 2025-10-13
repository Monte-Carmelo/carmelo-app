-- Migration 005: Members table
-- Feature: 001-crie-um-app
-- Description: Members of GCs, references people for personal data

CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  gc_id UUID NOT NULL REFERENCES growth_groups(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  converted_from_visitor_id UUID, -- Will reference visitors table (created later)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraint: A person cannot be an active member of 2 GCs simultaneously
  UNIQUE(person_id, gc_id)
);

CREATE INDEX idx_members_person ON members(person_id);
CREATE INDEX idx_members_gc ON members(gc_id) WHERE deleted_at IS NULL AND status = 'active';
CREATE INDEX idx_members_status ON members(status);

CREATE TRIGGER update_members_updated_at
BEFORE UPDATE ON members
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leaders_view_gc_members" ON members
FOR SELECT USING (
  gc_id IN (SELECT gc_id FROM gc_leaders WHERE user_id = auth.uid())
);

CREATE POLICY "supervisors_view_members" ON members
FOR SELECT USING (
  gc_id IN (SELECT gc_id FROM gc_supervisors WHERE user_id = auth.uid())
  OR
  gc_id IN (
    SELECT gc_id FROM gc_supervisors
    WHERE user_id IN (
      SELECT id FROM users WHERE hierarchy_path LIKE (SELECT hierarchy_path || '%' FROM users WHERE id = auth.uid())
    )
  )
);

CREATE POLICY "leaders_manage_members" ON members
FOR ALL USING (
  gc_id IN (SELECT gc_id FROM gc_leaders WHERE user_id = auth.uid())
);

CREATE POLICY "admins_manage_members" ON members
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);
