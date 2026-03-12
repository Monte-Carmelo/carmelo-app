BEGIN;

CREATE OR REPLACE FUNCTION public.auth_person_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT person_id
  FROM users
  WHERE id = auth.uid()
    AND deleted_at IS NULL;
$$;

ALTER FUNCTION public.auth_person_id() OWNER TO postgres;

CREATE OR REPLACE FUNCTION public.auth_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (
      SELECT is_admin
      FROM users
      WHERE id = auth.uid()
        AND deleted_at IS NULL
    ),
    FALSE
  );
$$;

ALTER FUNCTION public.auth_is_admin() OWNER TO postgres;

CREATE OR REPLACE FUNCTION public.auth_gc_ids_for_roles(role_list text[])
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT ggp.gc_id
  FROM growth_group_participants ggp
  JOIN growth_groups gg ON gg.id = ggp.gc_id
  WHERE ggp.person_id = public.auth_person_id()
    AND ggp.role = ANY(role_list)
    AND ggp.status = 'active'
    AND ggp.deleted_at IS NULL
    AND gg.status = 'active'
    AND gg.deleted_at IS NULL;
$$;

ALTER FUNCTION public.auth_gc_ids_for_roles(text[]) OWNER TO postgres;

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
    SELECT ggp.gc_id, ggp.role
    FROM growth_group_participants ggp
    JOIN growth_groups gg ON gg.id = ggp.gc_id
    WHERE ggp.person_id = (SELECT person_id FROM current_person)
      AND ggp.status = 'active'
      AND ggp.deleted_at IS NULL
      AND gg.status = 'active'
      AND gg.deleted_at IS NULL
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
    SELECT DISTINCT ggp.gc_id
    FROM growth_group_participants ggp
    JOIN growth_groups gg ON gg.id = ggp.gc_id
    WHERE ggp.person_id = (SELECT person_id FROM current_person)
      AND ggp.status = 'active'
      AND ggp.deleted_at IS NULL
      AND ggp.role IN ('leader', 'supervisor')
      AND gg.status = 'active'
      AND gg.deleted_at IS NULL
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
    JOIN growth_groups gg
      ON gg.id = ggp_sup.gc_id
     AND gg.status = 'active'
     AND gg.deleted_at IS NULL
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

CREATE OR REPLACE FUNCTION public.auth_supervised_gc_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT ggp.gc_id
  FROM growth_group_participants ggp
  JOIN growth_groups gg ON gg.id = ggp.gc_id
  WHERE ggp.person_id = public.auth_person_id()
    AND ggp.role = 'supervisor'
    AND ggp.status = 'active'
    AND ggp.deleted_at IS NULL
    AND gg.status = 'active'
    AND gg.deleted_at IS NULL;
$$;

ALTER FUNCTION public.auth_supervised_gc_ids() OWNER TO postgres;

DROP VIEW IF EXISTS user_gc_roles;
CREATE VIEW user_gc_roles AS
SELECT
  u.id AS user_id,
  p.name,
  p.email,
  u.is_admin,

  EXISTS (
    SELECT 1
    FROM growth_group_participants gpr
    JOIN growth_groups gg ON gg.id = gpr.gc_id
    WHERE gpr.person_id = u.person_id
      AND gpr.role = 'leader'
      AND gpr.status = 'active'
      AND gpr.deleted_at IS NULL
      AND gg.status = 'active'
      AND gg.deleted_at IS NULL
  ) AS is_leader,

  EXISTS (
    SELECT 1
    FROM growth_group_participants gpr
    JOIN growth_groups gg ON gg.id = gpr.gc_id
    WHERE gpr.person_id = u.person_id
      AND gpr.role = 'supervisor'
      AND gpr.status = 'active'
      AND gpr.deleted_at IS NULL
      AND gg.status = 'active'
      AND gg.deleted_at IS NULL
  ) AS is_supervisor,

  EXISTS (
    SELECT 1
    FROM growth_group_participants ggp_sup
    JOIN growth_groups gg
      ON gg.id = ggp_sup.gc_id
     AND gg.status = 'active'
     AND gg.deleted_at IS NULL
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

  (
    SELECT COUNT(DISTINCT gpr.gc_id)
    FROM growth_group_participants gpr
    JOIN growth_groups gg ON gg.id = gpr.gc_id
    WHERE gpr.person_id = u.person_id
      AND gpr.role = 'leader'
      AND gpr.status = 'active'
      AND gpr.deleted_at IS NULL
      AND gg.status = 'active'
      AND gg.deleted_at IS NULL
  ) AS gcs_led,

  (
    SELECT COUNT(DISTINCT gpr.gc_id)
    FROM growth_group_participants gpr
    JOIN growth_groups gg ON gg.id = gpr.gc_id
    WHERE gpr.person_id = u.person_id
      AND gpr.role = 'supervisor'
      AND gpr.status = 'active'
      AND gpr.deleted_at IS NULL
      AND gg.status = 'active'
      AND gg.deleted_at IS NULL
  ) AS gcs_supervised,

  (
    SELECT COUNT(DISTINCT ggp_lead.person_id)
    FROM growth_group_participants ggp_sup
    JOIN growth_groups gg
      ON gg.id = ggp_sup.gc_id
     AND gg.status = 'active'
     AND gg.deleted_at IS NULL
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

COMMENT ON VIEW user_gc_roles IS 'User accumulated roles derived from active growth_group_participants in active growth_groups.';

COMMIT;
