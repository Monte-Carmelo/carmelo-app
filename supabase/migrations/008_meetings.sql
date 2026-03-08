-- Migration 008: Meetings table
-- Feature: 001-crie-um-app

CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gc_id UUID NOT NULL REFERENCES growth_groups(id) ON DELETE CASCADE,
  lesson_template_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  lesson_title TEXT NOT NULL CHECK (char_length(lesson_title) > 0 AND char_length(lesson_title) <= 255),
  datetime TIMESTAMPTZ NOT NULL,
  comments TEXT,
  registered_by_user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_meetings_gc ON meetings(gc_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_meetings_datetime ON meetings(datetime DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_meetings_lesson_template ON meetings(lesson_template_id) WHERE lesson_template_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_meetings_registered_by ON meetings(registered_by_user_id) WHERE deleted_at IS NULL;

CREATE TRIGGER update_meetings_updated_at
BEFORE UPDATE ON meetings
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leaders_manage_gc_meetings" ON meetings
FOR ALL USING (
  gc_id IN (
    SELECT gc_id
    FROM growth_group_participants
    WHERE person_id = (SELECT person_id FROM users WHERE id = auth.uid())
      AND role IN ('leader', 'co_leader')
      AND status = 'active'
      AND deleted_at IS NULL
  )
);

CREATE POLICY "supervisors_view_meetings" ON meetings
FOR SELECT USING (
  gc_id IN (
    SELECT gc_id
    FROM growth_group_participants
    WHERE person_id = (SELECT person_id FROM users WHERE id = auth.uid())
      AND role = 'supervisor'
      AND status = 'active'
      AND deleted_at IS NULL
  )
  OR gc_id IN (
    SELECT gc_id
    FROM growth_group_participants
    WHERE role = 'supervisor'
      AND status = 'active'
      AND deleted_at IS NULL
      AND person_id IN (
        SELECT person_id
        FROM users
        WHERE hierarchy_path LIKE (
          SELECT hierarchy_path || '%'
          FROM users WHERE id = auth.uid()
        )
      )
  )
);

CREATE POLICY "admins_manage_meetings" ON meetings
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);
