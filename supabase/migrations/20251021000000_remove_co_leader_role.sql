-- Migration 015: Remove co_leader role distinction
-- Feature: Allow multiple leaders per GC without co_leader distinction
-- Description: Converts all co_leader roles to leader and updates related policies

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Convert all co_leaders to leaders
-- ---------------------------------------------------------------------------
UPDATE growth_group_participants
SET role = 'leader'
WHERE role = 'co_leader' AND deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- 2. Update role constraint to remove co_leader
-- ---------------------------------------------------------------------------
ALTER TABLE growth_group_participants
DROP CONSTRAINT IF EXISTS growth_group_participants_role_check;

ALTER TABLE growth_group_participants
ADD CONSTRAINT growth_group_participants_role_check
CHECK (role IN ('member', 'leader', 'supervisor'));

-- ---------------------------------------------------------------------------
-- 3. Update RLS policies that reference co_leader
-- ---------------------------------------------------------------------------

-- Policy: leaders_manage_growth_group_participants
DROP POLICY IF EXISTS "leaders_manage_growth_group_participants" ON growth_group_participants;
CREATE POLICY "leaders_manage_growth_group_participants" ON growth_group_participants
FOR ALL USING (
  gc_id IN (
    SELECT gc_id FROM growth_group_participants leader_role
    WHERE leader_role.person_id = (SELECT person_id FROM users WHERE id = auth.uid())
      AND leader_role.role = 'leader'
      AND leader_role.status = 'active'
      AND leader_role.deleted_at IS NULL
  )
)
WITH CHECK (
  gc_id IN (
    SELECT gc_id FROM growth_group_participants leader_role
    WHERE leader_role.person_id = (SELECT person_id FROM users WHERE id = auth.uid())
      AND leader_role.role = 'leader'
      AND leader_role.status = 'active'
      AND leader_role.deleted_at IS NULL
  )
  AND role IN ('member', 'leader')
);

-- Policy: leaders_view_own_gcs
DROP POLICY IF EXISTS "leaders_view_own_gcs" ON growth_groups;
CREATE POLICY "leaders_view_own_gcs" ON growth_groups
FOR SELECT USING (
  id IN (
    SELECT gc_id FROM growth_group_participants
    WHERE person_id = (SELECT person_id FROM users WHERE id = auth.uid())
      AND role = 'leader'
      AND status = 'active'
      AND deleted_at IS NULL
  )
);

-- Policy: leaders_edit_own_gcs
DROP POLICY IF EXISTS "leaders_edit_own_gcs" ON growth_groups;
CREATE POLICY "leaders_edit_own_gcs" ON growth_groups
FOR UPDATE USING (
  id IN (
    SELECT gc_id FROM growth_group_participants
    WHERE person_id = (SELECT person_id FROM users WHERE id = auth.uid())
      AND role = 'leader'
      AND status = 'active'
      AND deleted_at IS NULL
  )
);

-- ---------------------------------------------------------------------------
-- 4. Update functions that reference co_leader
-- ---------------------------------------------------------------------------

-- Function: auth_managed_person_ids
CREATE OR REPLACE FUNCTION public.auth_managed_person_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  WITH current_person AS (
    SELECT public.auth_person_id() AS person_id
  ), active_roles AS (
    SELECT gc_id, role
    FROM growth_group_participants
    WHERE person_id = (SELECT person_id FROM current_person)
      AND status = 'active'
      AND deleted_at IS NULL
  )
  SELECT DISTINCT ggp.person_id
  FROM active_roles ar
  JOIN growth_group_participants ggp
    ON ggp.gc_id = ar.gc_id
   AND ggp.status = 'active'
   AND ggp.deleted_at IS NULL
  WHERE
    (ar.role = 'leader' AND ggp.role IN ('member', 'leader'))
    OR (ar.role = 'supervisor' AND ggp.role IN ('leader', 'member', 'supervisor'))
  UNION
  SELECT person_id FROM current_person;
$$;

ALTER FUNCTION public.auth_managed_person_ids() OWNER TO postgres;

-- Function: auth_supervisor_user_ids
CREATE OR REPLACE FUNCTION public.auth_supervisor_user_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  WITH current_person AS (
    SELECT public.auth_person_id() AS person_id
  ), relevant_gcs AS (
    SELECT DISTINCT gc_id
    FROM growth_group_participants
    WHERE person_id = (SELECT person_id FROM current_person)
      AND status = 'active'
      AND deleted_at IS NULL
      AND role IN ('leader', 'supervisor')
  )
  SELECT u.id
  FROM growth_group_participants ggp
  JOIN users u ON u.person_id = ggp.person_id
  WHERE ggp.gc_id IN (SELECT gc_id FROM relevant_gcs)
    AND ggp.role = 'supervisor'
    AND ggp.status = 'active'
    AND ggp.deleted_at IS NULL
    AND u.deleted_at IS NULL;
$$;

ALTER FUNCTION public.auth_supervisor_user_ids() OWNER TO postgres;

-- Function: auth_has_direct_reports
CREATE OR REPLACE FUNCTION public.auth_has_direct_reports()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM growth_group_participants ggp_sup
    JOIN growth_group_participants ggp_lead
      ON ggp_lead.gc_id = ggp_sup.gc_id
     AND ggp_lead.status = 'active'
     AND ggp_lead.deleted_at IS NULL
    WHERE ggp_sup.person_id = public.auth_person_id()
      AND ggp_sup.role = 'supervisor'
      AND ggp_sup.status = 'active'
      AND ggp_sup.deleted_at IS NULL
      AND ggp_lead.role = 'leader'
      AND ggp_lead.person_id <> public.auth_person_id()
  );
$$;

ALTER FUNCTION public.auth_has_direct_reports() OWNER TO postgres;

-- ---------------------------------------------------------------------------
-- 5. Update user_gc_roles view
-- ---------------------------------------------------------------------------

DROP VIEW IF EXISTS user_gc_roles;
CREATE VIEW user_gc_roles AS
SELECT
  u.id AS user_id,
  p.name,
  p.email,
  u.is_admin,

  EXISTS (
    SELECT 1 FROM growth_group_participants gpr
    WHERE gpr.person_id = u.person_id
      AND gpr.role = 'leader'
      AND gpr.status = 'active'
      AND gpr.deleted_at IS NULL
  ) AS is_leader,

  EXISTS (
    SELECT 1 FROM growth_group_participants gpr
    WHERE gpr.person_id = u.person_id
      AND gpr.role = 'supervisor'
      AND gpr.status = 'active'
      AND gpr.deleted_at IS NULL
  ) AS is_supervisor,

  EXISTS (
    SELECT 1
    FROM growth_group_participants ggp_sup
    JOIN growth_group_participants ggp_lead
      ON ggp_lead.gc_id = ggp_sup.gc_id
     AND ggp_lead.status = 'active'
     AND ggp_lead.deleted_at IS NULL
    WHERE ggp_sup.person_id = u.person_id
      AND ggp_sup.role = 'supervisor'
      AND ggp_sup.status = 'active'
      AND ggp_sup.deleted_at IS NULL
      AND ggp_lead.role = 'leader'
      AND ggp_lead.person_id <> u.person_id
  ) AS is_coordinator,

  (SELECT COUNT(DISTINCT gc_id)
   FROM growth_group_participants gpr
   WHERE gpr.person_id = u.person_id
     AND gpr.role = 'leader'
     AND gpr.status = 'active'
     AND gpr.deleted_at IS NULL) AS gcs_led,

  (SELECT COUNT(DISTINCT gc_id)
   FROM growth_group_participants gpr
   WHERE gpr.person_id = u.person_id
     AND gpr.role = 'supervisor'
     AND gpr.status = 'active'
     AND gpr.deleted_at IS NULL) AS gcs_supervised,

  (SELECT COUNT(DISTINCT ggp_lead.person_id)
   FROM growth_group_participants ggp_sup
   JOIN growth_group_participants ggp_lead
     ON ggp_lead.gc_id = ggp_sup.gc_id
    AND ggp_lead.status = 'active'
    AND ggp_lead.deleted_at IS NULL
   WHERE ggp_sup.person_id = u.person_id
     AND ggp_sup.role = 'supervisor'
     AND ggp_sup.status = 'active'
     AND ggp_sup.deleted_at IS NULL
     AND ggp_lead.role = 'leader'
     AND ggp_lead.person_id <> u.person_id
  ) AS direct_subordinates

FROM users u
JOIN people p ON p.id = u.person_id
WHERE u.deleted_at IS NULL;

COMMENT ON VIEW user_gc_roles IS 'User accumulated roles derived from growth_group_participants (co_leader removed).';

COMMIT;
