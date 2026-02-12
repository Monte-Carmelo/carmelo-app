-- Migration: leaders can insert people and explicit visitors WITH CHECK
-- Feature: W207 - permitir líderes/co-líderes criarem pessoas/visitantes nos próprios GCs

BEGIN;

-- ---------------------------------------------------------------------------
-- people: permitir INSERT para líderes/co-líderes ativos
-- Obs: o vínculo ao GC continua sendo validado na inserção em visitors/participants.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "leaders_create_people" ON people;

CREATE POLICY "leaders_create_people" ON people
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM growth_group_participants leader_role
    WHERE leader_role.person_id = public.auth_person_id()
      AND leader_role.role IN ('leader', 'co_leader')
      AND leader_role.status = 'active'
      AND leader_role.deleted_at IS NULL
  )
);

-- ---------------------------------------------------------------------------
-- visitors: declarar WITH CHECK explicitamente para INSERT/UPDATE
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "leaders_manage_visitors" ON visitors;

CREATE POLICY "leaders_manage_visitors" ON visitors
FOR ALL
USING (
  gc_id IN (
    SELECT public.auth_gc_ids_for_roles(ARRAY['leader', 'co_leader'])
  )
)
WITH CHECK (
  gc_id IN (
    SELECT public.auth_gc_ids_for_roles(ARRAY['leader', 'co_leader'])
  )
);

COMMIT;
