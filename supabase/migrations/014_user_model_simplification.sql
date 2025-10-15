-- Migration 014: Simplify users model removing hierarchy, align with GC relationships
BEGIN;

-- ---------------------------------------------------------------------------
-- Preparação: remover estruturas dependentes da hierarquia
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS user_gc_roles;

DROP POLICY IF EXISTS "users_see_supervisor" ON users;
DROP POLICY IF EXISTS "users_see_subordinates" ON users;
DROP POLICY IF EXISTS "coordinators_create_gcs" ON growth_groups;

DROP TRIGGER IF EXISTS set_hierarchy_path ON users;
DROP FUNCTION IF EXISTS update_hierarchy_path();

DROP INDEX IF EXISTS idx_users_parent;
DROP INDEX IF EXISTS idx_users_path;
DROP INDEX IF EXISTS idx_users_depth;

-- ---------------------------------------------------------------------------
-- Ajuste da tabela users: remover colunas de hierarquia e reforçar vínculo com auth.users
-- ---------------------------------------------------------------------------
ALTER TABLE users
  DROP COLUMN IF EXISTS hierarchy_parent_id,
  DROP COLUMN IF EXISTS hierarchy_path,
  DROP COLUMN IF EXISTS hierarchy_depth;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_auth_user_fkey'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_auth_user_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
    ALTER TABLE users VALIDATE CONSTRAINT users_auth_user_fkey;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Funções auxiliares baseadas em growth_group_participants
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.auth_hierarchy_path();
DROP FUNCTION IF EXISTS public.auth_supervisor_user_id();
DROP FUNCTION IF EXISTS public.auth_managed_person_ids();
DROP FUNCTION IF EXISTS public.auth_has_direct_reports();

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
    (
      ar.role IN ('leader', 'co_leader')
      AND ggp.role IN ('member', 'leader', 'co_leader')
    )
    OR (
      ar.role = 'supervisor'
      AND ggp.role IN ('leader', 'co_leader', 'member', 'supervisor')
    )
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
    SELECT DISTINCT gc_id
    FROM growth_group_participants
    WHERE person_id = (SELECT person_id FROM current_person)
      AND status = 'active'
      AND deleted_at IS NULL
      AND role IN ('leader', 'co_leader', 'supervisor')
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
    JOIN growth_group_participants ggp_lead
      ON ggp_lead.gc_id = ggp_sup.gc_id
     AND ggp_lead.status = 'active'
     AND ggp_lead.deleted_at IS NULL
    WHERE ggp_sup.person_id = public.auth_person_id()
      AND ggp_sup.role = 'supervisor'
      AND ggp_sup.status = 'active'
      AND ggp_sup.deleted_at IS NULL
      AND ggp_lead.role IN ('leader', 'co_leader')
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
  SELECT gc_id
  FROM growth_group_participants
  WHERE person_id = public.auth_person_id()
    AND role = 'supervisor'
    AND status = 'active'
    AND deleted_at IS NULL;
$$;

ALTER FUNCTION public.auth_supervised_gc_ids() OWNER TO postgres;

-- ---------------------------------------------------------------------------
-- Recriar policies afetadas
-- ---------------------------------------------------------------------------
CREATE POLICY "users_see_subordinates" ON users
FOR SELECT
USING (
  person_id IN (
    SELECT public.auth_managed_person_ids()
  )
);

CREATE POLICY "users_see_supervisor" ON users
FOR SELECT
USING (
  id IN (
    SELECT public.auth_supervisor_user_ids()
  )
);

CREATE POLICY "coordinators_create_gcs" ON growth_groups
FOR INSERT
WITH CHECK (
  public.auth_has_direct_reports()
  OR public.auth_is_admin()
);

-- ---------------------------------------------------------------------------
-- Atualizar view user_gc_roles para refletir novo modelo
-- ---------------------------------------------------------------------------
CREATE VIEW user_gc_roles AS
SELECT
  u.id AS user_id,
  p.name,
  p.email,
  u.is_admin,

  EXISTS (
    SELECT 1
    FROM growth_group_participants gpr
    WHERE gpr.person_id = u.person_id
      AND gpr.role IN ('leader', 'co_leader')
      AND gpr.status = 'active'
      AND gpr.deleted_at IS NULL
  ) AS is_leader,

  EXISTS (
    SELECT 1
    FROM growth_group_participants gpr
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
      AND ggp_lead.role IN ('leader','co_leader')
      AND ggp_lead.person_id <> u.person_id
  ) AS is_coordinator,

  (SELECT COUNT(DISTINCT gc_id)
   FROM growth_group_participants gpr
   WHERE gpr.person_id = u.person_id
     AND gpr.role IN ('leader','co_leader')
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
     AND ggp_lead.role IN ('leader','co_leader')
     AND ggp_lead.person_id <> u.person_id
  ) AS direct_subordinates

FROM users u
JOIN people p ON p.id = u.person_id
WHERE u.deleted_at IS NULL;

COMMENT ON VIEW user_gc_roles IS 'User accumulated roles derived from growth_group_participants.';

COMMIT;
