-- Migration: Create gc_multiplication_events table
-- Feature: 004-area-administrativa
-- Date: 2025-10-18
-- Description: Tabela para auditar e rastrear eventos de multiplicação de Grupos de Crescimento

-- Create table
CREATE TABLE IF NOT EXISTS gc_multiplication_events (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Referências
  original_gc_id UUID NOT NULL REFERENCES growth_groups(id),
  new_gc_ids UUID[] NOT NULL,
  multiplied_by_user_id UUID NOT NULL REFERENCES users(id),

  -- Metadados
  multiplied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_gc_mult_original
  ON gc_multiplication_events(original_gc_id);

CREATE INDEX IF NOT EXISTS idx_gc_mult_user
  ON gc_multiplication_events(multiplied_by_user_id);

CREATE INDEX IF NOT EXISTS idx_gc_mult_date
  ON gc_multiplication_events(multiplied_at DESC);

-- Constraints
ALTER TABLE gc_multiplication_events
  ADD CONSTRAINT chk_new_gcs_not_empty
  CHECK (array_length(new_gc_ids, 1) > 0);

-- Comments
COMMENT ON TABLE gc_multiplication_events IS
  'Log de eventos de multiplicação de GCs. Registra qual GC originou quais novos GCs e por qual admin.';

COMMENT ON COLUMN gc_multiplication_events.original_gc_id IS
  'ID do GC original que foi multiplicado';

COMMENT ON COLUMN gc_multiplication_events.new_gc_ids IS
  'Array de IDs dos novos GCs criados a partir do original';

COMMENT ON COLUMN gc_multiplication_events.multiplied_by_user_id IS
  'ID do usuário admin que executou a multiplicação';

COMMENT ON COLUMN gc_multiplication_events.notes IS
  'Observações opcionais sobre o processo de multiplicação';
