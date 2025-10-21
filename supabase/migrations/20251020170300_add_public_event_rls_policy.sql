-- Migration: Add public RLS policy for events
-- Feature: 005-funcionalidade-de-eventos
-- Date: 2025-10-20
-- Description: Adicionar política RLS para permitir acesso público aos eventos

BEGIN;

-- 3. Public users can view active events (non-deleted)
CREATE POLICY "public_view_active_events"
ON events
FOR SELECT
USING (
  deleted_at IS NULL
);

COMMIT;