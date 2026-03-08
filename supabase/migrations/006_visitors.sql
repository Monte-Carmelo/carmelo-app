-- Migration 006: Visitors (tracking de presença por GC)
-- Feature: 001-crie-um-app
-- Description: Registra visitantes vinculados a growth_groups e prepara vínculos de conversão

CREATE TABLE visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  gc_id UUID NOT NULL REFERENCES growth_groups(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'converted', 'inactive')),
  visit_count INT NOT NULL DEFAULT 0,
  first_visit_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_visit_date TIMESTAMPTZ,

  converted_at TIMESTAMPTZ,
  converted_by_user_id UUID REFERENCES users(id),
  converted_to_participant_id UUID REFERENCES growth_group_participants(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (person_id, gc_id)
);

CREATE INDEX idx_visitors_gc_active ON visitors(gc_id) WHERE status = 'active';
CREATE INDEX idx_visitors_person ON visitors(person_id);
CREATE INDEX idx_visitors_status ON visitors(status);

CREATE TRIGGER update_visitors_updated_at
BEFORE UPDATE ON visitors
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leaders_manage_visitors" ON visitors
FOR ALL USING (
  gc_id IN (
    SELECT gc_id
    FROM growth_group_participants AS leader_role
    WHERE leader_role.person_id = (SELECT person_id FROM users WHERE id = auth.uid())
      AND leader_role.role IN ('leader', 'co_leader')
      AND leader_role.status = 'active'
      AND leader_role.deleted_at IS NULL
  )
);

CREATE POLICY "supervisors_view_visitors" ON visitors
FOR SELECT USING (
  gc_id IN (
    SELECT gc_id
    FROM growth_group_participants AS supervisor_role
    WHERE supervisor_role.person_id = (SELECT person_id FROM users WHERE id = auth.uid())
      AND supervisor_role.role = 'supervisor'
      AND supervisor_role.status = 'active'
      AND supervisor_role.deleted_at IS NULL
  )
  OR gc_id IN (
    SELECT gc_id
    FROM growth_group_participants AS supervisor_role
    WHERE supervisor_role.role = 'supervisor'
      AND supervisor_role.status = 'active'
      AND supervisor_role.deleted_at IS NULL
      AND supervisor_role.person_id IN (
        SELECT person_id
        FROM users
        WHERE hierarchy_path LIKE (
          SELECT hierarchy_path || '%'
          FROM users WHERE id = auth.uid()
        )
      )
  )
);

CREATE POLICY "admins_manage_visitors" ON visitors
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Agora que visitors existe, liga growth_group_participants.converted_from_visitor_id
ALTER TABLE growth_group_participants
  ADD CONSTRAINT fk_growth_group_participants_converted_from_visitor
  FOREIGN KEY (converted_from_visitor_id)
  REFERENCES visitors(id) ON DELETE SET NULL;
