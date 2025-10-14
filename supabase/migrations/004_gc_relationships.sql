-- Migration 004: Growth Group Participants (relacionamentos pessoa ↔ GC)
-- Feature: 001-crie-um-app
-- Description: Unifica líderes, supervisores e membros na tabela growth_group_participants

CREATE TABLE growth_group_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gc_id UUID NOT NULL REFERENCES growth_groups(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('member', 'leader', 'co_leader', 'supervisor')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  added_by_user_id UUID REFERENCES users(id),
  converted_from_visitor_id UUID, -- FK adicionada após criação de visitors
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (gc_id, person_id, role)
);

CREATE INDEX idx_growth_group_participants_gc_active ON growth_group_participants(gc_id) WHERE deleted_at IS NULL AND status = 'active';
CREATE INDEX idx_growth_group_participants_person ON growth_group_participants(person_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_growth_group_participants_role ON growth_group_participants(role) WHERE deleted_at IS NULL;

-- Uma pessoa só pode ter uma membresia ativa por vez
CREATE UNIQUE INDEX uq_growth_group_participants_active_membership
ON growth_group_participants(person_id)
WHERE role = 'member' AND status = 'active' AND deleted_at IS NULL;

CREATE TRIGGER update_growth_group_participants_updated_at
BEFORE UPDATE ON growth_group_participants
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE OR REPLACE FUNCTION ensure_gc_role_minimum() RETURNS TRIGGER AS $$
DECLARE
  required_role TEXT := TG_ARGV[0];
  target_gc UUID := COALESCE(OLD.gc_id, NEW.gc_id);
  target_id UUID := COALESCE(NEW.id, OLD.id);
BEGIN
  IF required_role IS NULL THEN
    RAISE EXCEPTION 'ensure_gc_role_minimum requer role';
  END IF;

  IF TG_OP = 'DELETE'
     OR (TG_OP = 'UPDATE'
         AND OLD.role = required_role
         AND OLD.status = 'active'
         AND (NEW.role <> required_role OR NEW.status <> 'active' OR NEW.deleted_at IS NOT NULL)) THEN

    IF NOT EXISTS (
      SELECT 1 FROM growth_group_participants gpr
      WHERE gpr.gc_id = target_gc
        AND gpr.role = required_role
        AND gpr.status = 'active'
        AND gpr.deleted_at IS NULL
        AND gpr.id <> target_id
    ) THEN
      RAISE EXCEPTION 'GC % deve manter pelo menos um % ativo', target_gc, required_role;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_gc_has_leader
BEFORE UPDATE OR DELETE ON growth_group_participants
FOR EACH ROW
WHEN (OLD.role = 'leader' AND OLD.status = 'active' AND OLD.deleted_at IS NULL)
EXECUTE FUNCTION ensure_gc_role_minimum('leader');

CREATE TRIGGER ensure_gc_has_supervisor
BEFORE UPDATE OR DELETE ON growth_group_participants
FOR EACH ROW
WHEN (OLD.role = 'supervisor' AND OLD.status = 'active' AND OLD.deleted_at IS NULL)
EXECUTE FUNCTION ensure_gc_role_minimum('supervisor');

ALTER TABLE growth_group_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_gc_roles" ON growth_group_participants
FOR SELECT USING (
  person_id = (SELECT person_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "leaders_manage_growth_group_participants" ON growth_group_participants
FOR ALL USING (
  gc_id IN (
    SELECT gc_id FROM growth_group_participants leader_role
    WHERE leader_role.person_id = (SELECT person_id FROM users WHERE id = auth.uid())
      AND leader_role.role IN ('leader', 'co_leader')
      AND leader_role.status = 'active'
      AND leader_role.deleted_at IS NULL
  )
)
WITH CHECK (
  gc_id IN (
    SELECT gc_id FROM growth_group_participants leader_role
    WHERE leader_role.person_id = (SELECT person_id FROM users WHERE id = auth.uid())
      AND leader_role.role IN ('leader', 'co_leader')
      AND leader_role.status = 'active'
      AND leader_role.deleted_at IS NULL
  )
  AND role IN ('member', 'co_leader')
);

CREATE POLICY "supervisors_view_growth_group_participants" ON growth_group_participants
FOR SELECT USING (
  gc_id IN (
    SELECT gc_id FROM growth_group_participants supervisor_role
    WHERE supervisor_role.person_id = (SELECT person_id FROM users WHERE id = auth.uid())
      AND supervisor_role.role = 'supervisor'
      AND supervisor_role.status = 'active'
      AND supervisor_role.deleted_at IS NULL
  )
  OR gc_id IN (
    SELECT gc_id FROM growth_group_participants supervisor_role
    WHERE supervisor_role.role = 'supervisor'
      AND supervisor_role.status = 'active'
      AND supervisor_role.deleted_at IS NULL
      AND supervisor_role.person_id IN (
        SELECT person_id FROM users
        WHERE hierarchy_path LIKE (
          SELECT hierarchy_path || '%'
          FROM users WHERE id = auth.uid()
        )
      )
  )
);

CREATE POLICY "coordinators_manage_supervisors" ON growth_group_participants
FOR ALL USING (
  role = 'supervisor'
  AND gc_id IN (
    SELECT gc_id FROM growth_group_participants supervisor_role
    WHERE supervisor_role.role = 'supervisor'
      AND supervisor_role.status = 'active'
      AND supervisor_role.deleted_at IS NULL
      AND supervisor_role.person_id IN (
        SELECT person_id FROM users
        WHERE hierarchy_path LIKE (
          SELECT hierarchy_path || '%'
          FROM users WHERE id = auth.uid()
        )
      )
  )
)
WITH CHECK (role = 'supervisor');

CREATE POLICY "admins_manage_growth_group_participants" ON growth_group_participants
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

COMMENT ON TABLE growth_group_participants IS 'Relaciona pessoas a GCs com papéis (member, leader, co_leader, supervisor).';
COMMENT ON COLUMN growth_group_participants.role IS 'Papel desempenhado pela pessoa no GC.';
COMMENT ON COLUMN growth_group_participants.converted_from_visitor_id IS 'Visitor.id que originou a membresia (opcional).';

-- ---------------------------------------------------------------------------
-- RLS em growth_groups (agora que growth_group_participants está disponível)
-- ---------------------------------------------------------------------------

CREATE POLICY "leaders_view_own_gcs" ON growth_groups
FOR SELECT USING (
  id IN (
    SELECT gc_id
    FROM growth_group_participants
    WHERE person_id = (SELECT person_id FROM users WHERE id = auth.uid())
      AND role IN ('leader', 'co_leader')
      AND status = 'active'
      AND deleted_at IS NULL
  )
);

CREATE POLICY "leaders_edit_own_gcs" ON growth_groups
FOR UPDATE USING (
  id IN (
    SELECT gc_id
    FROM growth_group_participants
    WHERE person_id = (SELECT person_id FROM users WHERE id = auth.uid())
      AND role IN ('leader', 'co_leader')
      AND status = 'active'
      AND deleted_at IS NULL
  )
);

CREATE POLICY "supervisors_view_gcs" ON growth_groups
FOR SELECT USING (
  id IN (
    SELECT gc_id
    FROM growth_group_participants
    WHERE person_id = (SELECT person_id FROM users WHERE id = auth.uid())
      AND role = 'supervisor'
      AND status = 'active'
      AND deleted_at IS NULL
  )
);

CREATE POLICY "supervisors_view_subordinate_gcs" ON growth_groups
FOR SELECT USING (
  id IN (
    SELECT gc_id
    FROM growth_group_participants
    WHERE role = 'supervisor'
      AND status = 'active'
      AND deleted_at IS NULL
      AND person_id IN (
        SELECT person_id
        FROM users
        WHERE hierarchy_path LIKE (
          SELECT hierarchy_path || '%'
          FROM users WHERE id = auth.uid()
        )
      )
  )
);

CREATE POLICY "coordinators_create_gcs" ON growth_groups
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM users u2 WHERE u2.hierarchy_parent_id = users.id
      )
  )
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

CREATE POLICY "admins_manage_all_gcs" ON growth_groups
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);
