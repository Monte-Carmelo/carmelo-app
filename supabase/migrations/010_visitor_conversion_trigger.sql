-- Migration 010: Visitor Auto-Conversion + Config
-- Feature: 001-crie-um-app
-- Description: Cria tabela de configuração, histórico de conversões e trigger automática

-- Configuração chave-valor
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_config_updated_at
BEFORE UPDATE ON config
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

INSERT INTO config (key, value, description) VALUES
  ('visitor_conversion_threshold', '3', 'Número de visitas para converter visitante automaticamente'),
  ('dashboard_cache_ttl_minutes', '5', 'TTL em minutos do cache de métricas do dashboard');

-- Histórico de conversão de visitantes
CREATE TABLE visitor_conversion_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES growth_group_participants(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  gc_id UUID NOT NULL REFERENCES growth_groups(id) ON DELETE CASCADE,
  converted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  converted_by_user_id UUID REFERENCES users(id),
  conversion_source TEXT NOT NULL CHECK (conversion_source IN ('auto', 'manual')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_visitor_conversion_events_gc ON visitor_conversion_events(gc_id);
CREATE INDEX idx_visitor_conversion_events_visitor ON visitor_conversion_events(visitor_id);
CREATE INDEX idx_visitor_conversion_events_converted_at ON visitor_conversion_events(converted_at DESC);

ALTER TABLE visitor_conversion_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leaders_view_conversion_events" ON visitor_conversion_events
FOR SELECT USING (
  gc_id IN (
    SELECT gc_id
    FROM growth_group_participants AS leader_role
    WHERE leader_role.person_id = (SELECT person_id FROM users WHERE id = auth.uid())
      AND leader_role.role IN ('leader', 'co_leader')
      AND leader_role.status = 'active'
      AND leader_role.deleted_at IS NULL
  )
);

CREATE POLICY "supervisors_view_conversion_events" ON visitor_conversion_events
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

CREATE POLICY "admins_manage_conversion_events" ON visitor_conversion_events
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Função de conversão automática (invocada ao registrar presença de visitante)
CREATE OR REPLACE FUNCTION auto_convert_visitor() RETURNS TRIGGER AS $$
DECLARE
  threshold INT;
  current_count INT;
  meeting_row meetings%ROWTYPE;
  visitor_row visitors%ROWTYPE;
  participant_id UUID;
BEGIN
  SELECT (value::TEXT)::INT INTO threshold
  FROM config WHERE key = 'visitor_conversion_threshold';

  SELECT COUNT(*) INTO current_count
  FROM meeting_visitor_attendance
  WHERE visitor_id = NEW.visitor_id;

  UPDATE visitors
  SET visit_count = current_count,
      last_visit_date = NOW()
  WHERE id = NEW.visitor_id;

  IF current_count >= threshold THEN
    SELECT * INTO visitor_row
    FROM visitors
    WHERE id = NEW.visitor_id
    FOR UPDATE;

    IF visitor_row.status = 'active' THEN
      SELECT * INTO meeting_row
      FROM meetings
      WHERE id = NEW.meeting_id;

      INSERT INTO growth_group_participants (
        gc_id,
        person_id,
        role,
        status,
        joined_at,
        converted_from_visitor_id,
        added_by_user_id
      )
      VALUES (
        meeting_row.gc_id,
        visitor_row.person_id,
        'member',
        'active',
        NOW(),
        visitor_row.id,
        meeting_row.registered_by_user_id
      )
      ON CONFLICT (gc_id, person_id, role) DO UPDATE
      SET status = 'active',
          joined_at = NOW(),
          deleted_at = NULL,
          updated_at = NOW(),
          converted_from_visitor_id = visitor_row.id
      RETURNING id INTO participant_id;

      UPDATE visitors
      SET status = 'converted',
          converted_at = NOW(),
          converted_by_user_id = meeting_row.registered_by_user_id,
          converted_to_participant_id = participant_id
      WHERE id = visitor_row.id;

      INSERT INTO visitor_conversion_events (
        visitor_id,
        participant_id,
        person_id,
        gc_id,
        converted_at,
        converted_by_user_id,
        conversion_source
      )
      VALUES (
        visitor_row.id,
        participant_id,
        visitor_row.person_id,
        meeting_row.gc_id,
        NOW(),
        meeting_row.registered_by_user_id,
        'auto'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_visitor_conversion
AFTER INSERT ON meeting_visitor_attendance
FOR EACH ROW EXECUTE FUNCTION auto_convert_visitor();

ALTER TABLE config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "all_view_config" ON config FOR SELECT USING (true);
CREATE POLICY "admins_manage_config" ON config
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

COMMENT ON TABLE config IS 'Application configuration key-value store.';
COMMENT ON TABLE visitor_conversion_events IS 'Log de conversões de visitantes em membros.';
COMMENT ON FUNCTION auto_convert_visitor() IS 'Atualiza visitas, cria membro em growth_group_participants e registra conversão quando o limiar é atingido.';
