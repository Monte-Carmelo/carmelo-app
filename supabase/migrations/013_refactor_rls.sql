-- Migration 013: Refatorar RLS para usar funções auxiliares e evitar recursão
BEGIN;

-- Funções auxiliares (executam como owner e evitam recursão entre policies)
CREATE OR REPLACE FUNCTION public.auth_person_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT person_id
  FROM users
  WHERE id = auth.uid();
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
    ),
    FALSE
  );
$$;

ALTER FUNCTION public.auth_is_admin() OWNER TO postgres;

CREATE OR REPLACE FUNCTION public.auth_hierarchy_path()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT hierarchy_path
  FROM users
  WHERE id = auth.uid();
$$;

ALTER FUNCTION public.auth_hierarchy_path() OWNER TO postgres;

CREATE OR REPLACE FUNCTION public.auth_supervisor_user_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT hierarchy_parent_id
  FROM users
  WHERE id = auth.uid();
$$;

ALTER FUNCTION public.auth_supervisor_user_id() OWNER TO postgres;

CREATE OR REPLACE FUNCTION public.auth_managed_person_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  WITH current_ctx AS (
    SELECT hierarchy_path
    FROM users
    WHERE id = auth.uid()
  )
  SELECT u.person_id
  FROM users u
  JOIN current_ctx ctx ON TRUE
  WHERE ctx.hierarchy_path IS NOT NULL
    AND u.hierarchy_path LIKE ctx.hierarchy_path || '%';
$$;

ALTER FUNCTION public.auth_managed_person_ids() OWNER TO postgres;

CREATE OR REPLACE FUNCTION public.auth_has_direct_reports()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users u
    WHERE u.hierarchy_parent_id = auth.uid()
  );
$$;

ALTER FUNCTION public.auth_has_direct_reports() OWNER TO postgres;

CREATE OR REPLACE FUNCTION public.auth_gc_ids_for_roles(role_list text[])
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT gc_id
  FROM growth_group_participants
  WHERE person_id = public.auth_person_id()
    AND role = ANY(role_list)
    AND status = 'active'
    AND deleted_at IS NULL;
$$;

ALTER FUNCTION public.auth_gc_ids_for_roles(text[]) OWNER TO postgres;

CREATE OR REPLACE FUNCTION public.auth_supervised_gc_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT gc_id
  FROM growth_group_participants
  WHERE role = 'supervisor'
    AND status = 'active'
    AND deleted_at IS NULL
    AND person_id IN (
      SELECT public.auth_managed_person_ids()
    );
$$;

ALTER FUNCTION public.auth_supervised_gc_ids() OWNER TO postgres;

CREATE OR REPLACE FUNCTION public.auth_people_ids_for_gc_roles(role_list text[])
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT person_id
  FROM growth_group_participants
  WHERE gc_id IN (
    SELECT public.auth_gc_ids_for_roles(role_list)
  )
    AND deleted_at IS NULL;
$$;

ALTER FUNCTION public.auth_people_ids_for_gc_roles(text[]) OWNER TO postgres;

CREATE OR REPLACE FUNCTION public.auth_people_ids_for_supervised_gcs()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT person_id
  FROM growth_group_participants
  WHERE gc_id IN (
    SELECT public.auth_supervised_gc_ids()
  )
    AND deleted_at IS NULL;
$$;

ALTER FUNCTION public.auth_people_ids_for_supervised_gcs() OWNER TO postgres;

-- ---------------------------------------------------------------------------
-- Tabela users
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "users_see_self" ON users;
DROP POLICY IF EXISTS "users_see_subordinates" ON users;
DROP POLICY IF EXISTS "users_see_supervisor" ON users;
DROP POLICY IF EXISTS "admins_see_all_users" ON users;

CREATE POLICY "users_see_self" ON users
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "users_see_supervisor" ON users
FOR SELECT
USING (id = public.auth_supervisor_user_id());

CREATE POLICY "users_see_subordinates" ON users
FOR SELECT
USING (
  person_id IN (
    SELECT public.auth_managed_person_ids()
  )
);

CREATE POLICY "admins_see_all_users" ON users
FOR ALL
USING (public.auth_is_admin())
WITH CHECK (public.auth_is_admin());

-- ---------------------------------------------------------------------------
-- Tabela growth_group_participants
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "users_view_own_gc_roles" ON growth_group_participants;
DROP POLICY IF EXISTS "leaders_manage_growth_group_participants" ON growth_group_participants;
DROP POLICY IF EXISTS "supervisors_view_growth_group_participants" ON growth_group_participants;
DROP POLICY IF EXISTS "coordinators_manage_supervisors" ON growth_group_participants;
DROP POLICY IF EXISTS "admins_manage_growth_group_participants" ON growth_group_participants;

CREATE POLICY "users_view_own_gc_roles" ON growth_group_participants
FOR SELECT
USING (
  person_id = public.auth_person_id()
);

CREATE POLICY "leaders_manage_growth_group_participants" ON growth_group_participants
FOR ALL
USING (
  gc_id IN (
    SELECT public.auth_gc_ids_for_roles(ARRAY['leader','co_leader'])
  )
)
WITH CHECK (
  gc_id IN (
    SELECT public.auth_gc_ids_for_roles(ARRAY['leader','co_leader'])
  )
  AND role IN ('member', 'co_leader')
);

CREATE POLICY "supervisors_view_growth_group_participants" ON growth_group_participants
FOR SELECT
USING (
  gc_id IN (
    SELECT public.auth_gc_ids_for_roles(ARRAY['supervisor'])
  )
  OR gc_id IN (
    SELECT public.auth_supervised_gc_ids()
  )
);

CREATE POLICY "coordinators_manage_supervisors" ON growth_group_participants
FOR ALL
USING (
  role = 'supervisor'
  AND gc_id IN (
    SELECT public.auth_supervised_gc_ids()
  )
)
WITH CHECK (role = 'supervisor');

CREATE POLICY "admins_manage_growth_group_participants" ON growth_group_participants
FOR ALL
USING (public.auth_is_admin());

-- ---------------------------------------------------------------------------
-- Tabela growth_groups
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "leaders_view_own_gcs" ON growth_groups;
DROP POLICY IF EXISTS "leaders_edit_own_gcs" ON growth_groups;
DROP POLICY IF EXISTS "supervisors_view_gcs" ON growth_groups;
DROP POLICY IF EXISTS "supervisors_view_subordinate_gcs" ON growth_groups;
DROP POLICY IF EXISTS "coordinators_create_gcs" ON growth_groups;
DROP POLICY IF EXISTS "admins_manage_all_gcs" ON growth_groups;

CREATE POLICY "leaders_view_own_gcs" ON growth_groups
FOR SELECT
USING (
  id IN (
    SELECT public.auth_gc_ids_for_roles(ARRAY['leader','co_leader'])
  )
);

CREATE POLICY "leaders_edit_own_gcs" ON growth_groups
FOR UPDATE
USING (
  id IN (
    SELECT public.auth_gc_ids_for_roles(ARRAY['leader','co_leader'])
  )
);

CREATE POLICY "supervisors_view_gcs" ON growth_groups
FOR SELECT
USING (
  id IN (
    SELECT public.auth_gc_ids_for_roles(ARRAY['supervisor'])
  )
);

CREATE POLICY "supervisors_view_subordinate_gcs" ON growth_groups
FOR SELECT
USING (
  id IN (
    SELECT public.auth_supervised_gc_ids()
  )
);

CREATE POLICY "coordinators_create_gcs" ON growth_groups
FOR INSERT
WITH CHECK (
  public.auth_has_direct_reports()
  OR public.auth_is_admin()
);

CREATE POLICY "admins_manage_all_gcs" ON growth_groups
FOR ALL
USING (public.auth_is_admin());

-- ---------------------------------------------------------------------------
-- Tabela visitors
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "leaders_manage_visitors" ON visitors;
DROP POLICY IF EXISTS "supervisors_view_visitors" ON visitors;
DROP POLICY IF EXISTS "admins_manage_visitors" ON visitors;

CREATE POLICY "leaders_manage_visitors" ON visitors
FOR ALL
USING (
  gc_id IN (
    SELECT public.auth_gc_ids_for_roles(ARRAY['leader','co_leader'])
  )
);

CREATE POLICY "supervisors_view_visitors" ON visitors
FOR SELECT
USING (
  gc_id IN (
    SELECT public.auth_gc_ids_for_roles(ARRAY['supervisor'])
  )
  OR gc_id IN (
    SELECT public.auth_supervised_gc_ids()
  )
);

CREATE POLICY "admins_manage_visitors" ON visitors
FOR ALL
USING (public.auth_is_admin());

-- ---------------------------------------------------------------------------
-- Tabela meetings
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "leaders_manage_meetings" ON meetings;
DROP POLICY IF EXISTS "supervisors_view_meetings" ON meetings;
DROP POLICY IF EXISTS "admins_manage_meetings" ON meetings;

CREATE POLICY "leaders_manage_meetings" ON meetings
FOR ALL
USING (
  gc_id IN (
    SELECT public.auth_gc_ids_for_roles(ARRAY['leader','co_leader'])
  )
);

CREATE POLICY "supervisors_view_meetings" ON meetings
FOR SELECT
USING (
  gc_id IN (
    SELECT public.auth_gc_ids_for_roles(ARRAY['supervisor'])
  )
  OR gc_id IN (
    SELECT public.auth_supervised_gc_ids()
  )
);

CREATE POLICY "admins_manage_meetings" ON meetings
FOR ALL
USING (public.auth_is_admin());

-- ---------------------------------------------------------------------------
-- Tabelas de attendance
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "leaders_manage_member_attendance" ON meeting_member_attendance;
DROP POLICY IF EXISTS "supervisors_view_member_attendance" ON meeting_member_attendance;
DROP POLICY IF EXISTS "admins_manage_member_attendance" ON meeting_member_attendance;

CREATE POLICY "leaders_manage_member_attendance" ON meeting_member_attendance
FOR ALL
USING (
  meeting_id IN (
    SELECT m.id
    FROM meetings AS m
    WHERE m.gc_id IN (
      SELECT public.auth_gc_ids_for_roles(ARRAY['leader','co_leader'])
    )
  )
);

CREATE POLICY "supervisors_view_member_attendance" ON meeting_member_attendance
FOR SELECT
USING (
  meeting_id IN (
    SELECT m.id
    FROM meetings AS m
    WHERE m.gc_id IN (
      SELECT public.auth_gc_ids_for_roles(ARRAY['supervisor'])
    )
    OR m.gc_id IN (
      SELECT public.auth_supervised_gc_ids()
    )
  )
);

CREATE POLICY "admins_manage_member_attendance" ON meeting_member_attendance
FOR ALL
USING (public.auth_is_admin());

DROP POLICY IF EXISTS "leaders_manage_visitor_attendance" ON meeting_visitor_attendance;
DROP POLICY IF EXISTS "supervisors_view_visitor_attendance" ON meeting_visitor_attendance;
DROP POLICY IF EXISTS "admins_manage_visitor_attendance" ON meeting_visitor_attendance;

CREATE POLICY "leaders_manage_visitor_attendance" ON meeting_visitor_attendance
FOR ALL
USING (
  meeting_id IN (
    SELECT m.id
    FROM meetings AS m
    WHERE m.gc_id IN (
      SELECT public.auth_gc_ids_for_roles(ARRAY['leader','co_leader'])
    )
  )
);

CREATE POLICY "supervisors_view_visitor_attendance" ON meeting_visitor_attendance
FOR SELECT
USING (
  meeting_id IN (
    SELECT m.id
    FROM meetings AS m
    WHERE m.gc_id IN (
      SELECT public.auth_gc_ids_for_roles(ARRAY['supervisor'])
    )
    OR m.gc_id IN (
      SELECT public.auth_supervised_gc_ids()
    )
  )
);

CREATE POLICY "admins_manage_visitor_attendance" ON meeting_visitor_attendance
FOR ALL
USING (public.auth_is_admin());

-- ---------------------------------------------------------------------------
-- visitor_conversion_events
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "leaders_view_conversion_events" ON visitor_conversion_events;
DROP POLICY IF EXISTS "supervisors_view_conversion_events" ON visitor_conversion_events;
DROP POLICY IF EXISTS "admins_manage_conversion_events" ON visitor_conversion_events;

CREATE POLICY "leaders_view_conversion_events" ON visitor_conversion_events
FOR SELECT
USING (
  gc_id IN (
    SELECT public.auth_gc_ids_for_roles(ARRAY['leader','co_leader'])
  )
);

CREATE POLICY "supervisors_view_conversion_events" ON visitor_conversion_events
FOR SELECT
USING (
  gc_id IN (
    SELECT public.auth_gc_ids_for_roles(ARRAY['supervisor'])
  )
  OR gc_id IN (
    SELECT public.auth_supervised_gc_ids()
  )
);

CREATE POLICY "admins_manage_conversion_events" ON visitor_conversion_events
FOR ALL
USING (public.auth_is_admin());

-- ---------------------------------------------------------------------------
-- Pessoas
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "leaders_view_gc_people" ON people;
DROP POLICY IF EXISTS "leaders_edit_gc_people" ON people;
DROP POLICY IF EXISTS "supervisors_view_people" ON people;
DROP POLICY IF EXISTS "supervisors_manage_conversion_people" ON people;
DROP POLICY IF EXISTS "admins_manage_all_people" ON people;

CREATE POLICY "leaders_view_gc_people" ON people
FOR SELECT
USING (
  id IN (
    SELECT public.auth_people_ids_for_gc_roles(ARRAY['leader','co_leader'])
  )
);

CREATE POLICY "leaders_edit_gc_people" ON people
FOR UPDATE
USING (
  id IN (
    SELECT public.auth_people_ids_for_gc_roles(ARRAY['leader','co_leader'])
  )
)
WITH CHECK (
  id IN (
    SELECT public.auth_people_ids_for_gc_roles(ARRAY['leader','co_leader'])
  )
);

CREATE POLICY "supervisors_view_people" ON people
FOR SELECT
USING (
  id IN (
    SELECT public.auth_people_ids_for_gc_roles(ARRAY['supervisor'])
  )
  OR id IN (
    SELECT public.auth_people_ids_for_supervised_gcs()
  )
);

CREATE POLICY "supervisors_manage_conversion_people" ON people
FOR UPDATE
USING (
  id IN (
    SELECT public.auth_people_ids_for_gc_roles(ARRAY['supervisor'])
  )
)
WITH CHECK (
  id IN (
    SELECT public.auth_people_ids_for_gc_roles(ARRAY['supervisor'])
  )
);

CREATE POLICY "admins_manage_all_people" ON people
FOR ALL
USING (public.auth_is_admin());

COMMIT;
