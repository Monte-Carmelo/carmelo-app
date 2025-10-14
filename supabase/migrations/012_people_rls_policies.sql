-- Migration 012: People RLS Policies
-- Feature: 001-crie-um-app
-- Description: Policies de visibilidade de pessoas baseadas em growth_group_participants

DROP POLICY IF EXISTS "leaders_view_gc_people" ON people;
DROP POLICY IF EXISTS "supervisors_view_people" ON people;
DROP POLICY IF EXISTS "admins_manage_all_people" ON people;

CREATE POLICY "leaders_view_people_in_gc" ON people
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM growth_group_participants gpr
    WHERE gpr.person_id = people.id
      AND gpr.status = 'active'
      AND gpr.gc_id IN (
        SELECT gc_id
        FROM growth_group_participants leader_role
        WHERE leader_role.person_id = (SELECT person_id FROM users WHERE id = auth.uid())
          AND leader_role.role IN ('leader', 'co_leader')
          AND leader_role.status = 'active'
          AND leader_role.deleted_at IS NULL
      )
  )
  OR EXISTS (
    SELECT 1
    FROM visitors v
    WHERE v.person_id = people.id
      AND v.status = 'active'
      AND v.gc_id IN (
        SELECT gc_id
        FROM growth_group_participants leader_role
        WHERE leader_role.person_id = (SELECT person_id FROM users WHERE id = auth.uid())
          AND leader_role.role IN ('leader', 'co_leader')
          AND leader_role.status = 'active'
          AND leader_role.deleted_at IS NULL
      )
  )
);

CREATE POLICY "supervisors_view_people" ON people
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM growth_group_participants gpr
    WHERE gpr.person_id = people.id
      AND gpr.status = 'active'
      AND gpr.gc_id IN (
        SELECT gc_id
        FROM growth_group_participants supervisor_role
        WHERE supervisor_role.person_id = (SELECT person_id FROM users WHERE id = auth.uid())
          AND supervisor_role.role = 'supervisor'
          AND supervisor_role.status = 'active'
          AND supervisor_role.deleted_at IS NULL
      )
  )
  OR EXISTS (
    SELECT 1
    FROM growth_group_participants gpr
    WHERE gpr.person_id = people.id
      AND gpr.status = 'active'
      AND gpr.gc_id IN (
        SELECT gc_id
        FROM growth_group_participants supervisor_role
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
  )
  OR EXISTS (
    SELECT 1
    FROM visitors v
    WHERE v.person_id = people.id
      AND v.status = 'active'
      AND v.gc_id IN (
        SELECT gc_id
        FROM growth_group_participants supervisor_role
        WHERE supervisor_role.person_id = (SELECT person_id FROM users WHERE id = auth.uid())
          AND supervisor_role.role = 'supervisor'
          AND supervisor_role.status = 'active'
          AND supervisor_role.deleted_at IS NULL
      )
  )
);

CREATE POLICY "admins_manage_all_people" ON people
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

COMMENT ON POLICY "leaders_view_people_in_gc" ON people IS 'Líderes/co-líderes enxergam pessoas vinculadas aos seus GCs (papéis e visitantes ativos).';
COMMENT ON POLICY "supervisors_view_people" ON people IS 'Supervisores enxergam pessoas dos GCs supervisionados direta ou indiretamente.';
