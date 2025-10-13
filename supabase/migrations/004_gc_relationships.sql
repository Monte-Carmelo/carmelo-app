-- Migration 004: GC Leaders and Supervisors (many-to-many relationships)
-- Feature: 001-crie-um-app
-- Description: Creates gc_leaders and gc_supervisors tables with constraints ensuring at least 1 leader/supervisor per GC

-- GC Leaders table (many-to-many)
CREATE TABLE gc_leaders (
  -- Relationship
  gc_id UUID NOT NULL REFERENCES growth_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Leadership type
  role TEXT NOT NULL DEFAULT 'leader' CHECK (role IN ('leader', 'co_leader')),

  -- Audit
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  added_by_user_id UUID REFERENCES users(id),

  -- Composite PK (a user can be both leader and co-leader of the same GC if needed, e.g., couple)
  PRIMARY KEY (gc_id, user_id, role)
);

-- Indexes
CREATE INDEX idx_gc_leaders_user ON gc_leaders(user_id);
CREATE INDEX idx_gc_leaders_gc ON gc_leaders(gc_id);

-- Constraint: At least 1 leader per GC (validated via trigger)
CREATE OR REPLACE FUNCTION check_gc_has_leader() RETURNS TRIGGER AS $$
BEGIN
  -- On delete, ensure at least 1 leader remains
  IF TG_OP = 'DELETE' THEN
    IF NOT EXISTS (
      SELECT 1 FROM gc_leaders
      WHERE gc_id = OLD.gc_id AND (gc_id, user_id, role) != (OLD.gc_id, OLD.user_id, OLD.role)
    ) THEN
      RAISE EXCEPTION 'GC must have at least 1 leader';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_gc_has_leader
BEFORE DELETE ON gc_leaders
FOR EACH ROW EXECUTE FUNCTION check_gc_has_leader();

-- Row Level Security (RLS)
-- NOTE: Some policies will be created after gc_supervisors table exists
ALTER TABLE gc_leaders ENABLE ROW LEVEL SECURITY;

-- Leaders see their own relationships
CREATE POLICY "users_see_own_leadership" ON gc_leaders
FOR SELECT USING (user_id = auth.uid());

-- Admins manage all
CREATE POLICY "admins_manage_gc_leaders" ON gc_leaders
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

-- GC Supervisors table (many-to-many)
CREATE TABLE gc_supervisors (
  -- Relationship
  gc_id UUID NOT NULL REFERENCES growth_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Audit
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  added_by_user_id UUID REFERENCES users(id),

  -- Primary key
  PRIMARY KEY (gc_id, user_id)
);

-- Indexes
CREATE INDEX idx_gc_supervisors_user ON gc_supervisors(user_id);
CREATE INDEX idx_gc_supervisors_gc ON gc_supervisors(gc_id);

-- Constraint: At least 1 supervisor per GC
CREATE OR REPLACE FUNCTION check_gc_has_supervisor() RETURNS TRIGGER AS $$
BEGIN
  -- On delete, ensure at least 1 supervisor remains
  IF TG_OP = 'DELETE' THEN
    IF NOT EXISTS (
      SELECT 1 FROM gc_supervisors
      WHERE gc_id = OLD.gc_id AND (gc_id, user_id) != (OLD.gc_id, OLD.user_id)
    ) THEN
      RAISE EXCEPTION 'GC must have at least 1 supervisor';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_gc_has_supervisor
BEFORE DELETE ON gc_supervisors
FOR EACH ROW EXECUTE FUNCTION check_gc_has_supervisor();

-- Row Level Security (RLS)
ALTER TABLE gc_supervisors ENABLE ROW LEVEL SECURITY;

-- Supervisors see their own relationships
CREATE POLICY "users_see_own_supervision" ON gc_supervisors
FOR SELECT USING (user_id = auth.uid());

-- Supervisors see supervisor relationships of GCs they supervise
CREATE POLICY "supervisors_view_gc_supervisors" ON gc_supervisors
FOR SELECT USING (
  gc_id IN (SELECT gc_id FROM gc_supervisors WHERE user_id = auth.uid())
);

-- Coordinators can add/remove supervisors from GCs supervised by subordinates
CREATE POLICY "coordinators_manage_supervisors" ON gc_supervisors
FOR ALL USING (
  gc_id IN (
    SELECT gc_id FROM gc_supervisors
    WHERE user_id IN (
      SELECT id FROM users
      WHERE hierarchy_path LIKE (
        SELECT hierarchy_path || '%' FROM users WHERE id = auth.uid()
      )
    )
  )
);

-- Admins manage all
CREATE POLICY "admins_manage_gc_supervisors" ON gc_supervisors
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Comments
COMMENT ON TABLE gc_leaders IS 'Many-to-many relationship between GCs and leaders. A GC MUST have at least 1 leader (enforced by trigger).';
COMMENT ON COLUMN gc_leaders.role IS 'leader=main leader, co_leader=co-leader (e.g., spouse)';
COMMENT ON TABLE gc_supervisors IS 'Many-to-many relationship between GCs and supervisors. A GC MUST have at least 1 supervisor (enforced by trigger).';

-- ==============================================================================
-- ADDITIONAL RLS POLICIES (now that both gc_leaders and gc_supervisors exist)
-- ==============================================================================

-- Supervisors see leaders of GCs they supervise
CREATE POLICY "supervisors_view_gc_leaders" ON gc_leaders
FOR SELECT USING (
  gc_id IN (SELECT gc_id FROM gc_supervisors WHERE user_id = auth.uid())
);

-- Coordinators can add/remove leaders from GCs supervised by subordinates
CREATE POLICY "coordinators_manage_leaders" ON gc_leaders
FOR ALL USING (
  gc_id IN (
    SELECT gc_id FROM gc_supervisors
    WHERE user_id IN (
      SELECT id FROM users
      WHERE hierarchy_path LIKE (
        SELECT hierarchy_path || '%' FROM users WHERE id = auth.uid()
      )
    )
  )
);

-- ==============================================================================
-- RLS POLICIES FOR growth_groups (now that gc_leaders/gc_supervisors exist)
-- ==============================================================================

-- Leaders see GCs they lead (via gc_leaders)
CREATE POLICY "leaders_view_own_gcs" ON growth_groups
FOR SELECT USING (
  id IN (SELECT gc_id FROM gc_leaders WHERE user_id = auth.uid())
);

-- Leaders can edit GCs they lead
CREATE POLICY "leaders_edit_own_gcs" ON growth_groups
FOR UPDATE USING (
  id IN (SELECT gc_id FROM gc_leaders WHERE user_id = auth.uid())
);

-- Supervisors see GCs they supervise (via gc_supervisors)
CREATE POLICY "supervisors_view_gcs" ON growth_groups
FOR SELECT USING (
  id IN (SELECT gc_id FROM gc_supervisors WHERE user_id = auth.uid())
);

-- Supervisors see GCs supervised by their subordinates (via hierarchy)
CREATE POLICY "supervisors_view_subordinates_gcs" ON growth_groups
FOR SELECT USING (
  id IN (
    SELECT gc_id FROM gc_supervisors
    WHERE user_id IN (
      SELECT id FROM users
      WHERE hierarchy_path LIKE (
        SELECT hierarchy_path || '%' FROM users WHERE id = auth.uid()
      )
    )
  )
);

-- Coordinators can create GCs (assigning subordinate leaders/supervisors)
CREATE POLICY "coordinators_create_gcs" ON growth_groups
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM users u2 WHERE u2.hierarchy_parent_id = users.id
      )
  )
  OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Admins see and edit all
CREATE POLICY "admins_manage_all_gcs" ON growth_groups
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);
