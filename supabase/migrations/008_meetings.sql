-- Migration 008: Meetings table
-- Feature: 001-crie-um-app

CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gc_id UUID NOT NULL REFERENCES growth_groups(id) ON DELETE CASCADE,
  datetime TIMESTAMPTZ NOT NULL,
  lesson_id UUID REFERENCES lessons(id),
  registered_by_user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meetings_gc ON meetings(gc_id);
CREATE INDEX idx_meetings_datetime ON meetings(datetime DESC);
CREATE INDEX idx_meetings_registered_by ON meetings(registered_by_user_id);

CREATE TRIGGER update_meetings_updated_at
BEFORE UPDATE ON meetings
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leaders_view_gc_meetings" ON meetings
FOR SELECT USING (
  gc_id IN (SELECT gc_id FROM gc_leaders WHERE user_id = auth.uid())
);

CREATE POLICY "supervisors_view_meetings" ON meetings
FOR SELECT USING (
  gc_id IN (SELECT gc_id FROM gc_supervisors WHERE user_id = auth.uid())
  OR
  gc_id IN (
    SELECT gc_id FROM gc_supervisors
    WHERE user_id IN (
      SELECT id FROM users WHERE hierarchy_path LIKE (SELECT hierarchy_path || '%' FROM users WHERE id = auth.uid())
    )
  )
);

CREATE POLICY "leaders_create_meetings" ON meetings
FOR INSERT WITH CHECK (
  gc_id IN (SELECT gc_id FROM gc_leaders WHERE user_id = auth.uid())
);

CREATE POLICY "admins_manage_meetings" ON meetings
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);
