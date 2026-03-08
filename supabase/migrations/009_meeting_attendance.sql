-- Migration 009: Meeting Attendance tables
-- Feature: 001-crie-um-app

CREATE TABLE meeting_member_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES growth_group_participants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (meeting_id, participant_id)
);

CREATE INDEX idx_member_attendance_meeting ON meeting_member_attendance(meeting_id);
CREATE INDEX idx_member_attendance_participant ON meeting_member_attendance(participant_id);

ALTER TABLE meeting_member_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leaders_manage_member_attendance" ON meeting_member_attendance
FOR ALL USING (
  meeting_id IN (
    SELECT m.id
    FROM meetings m
    WHERE m.gc_id IN (
      SELECT gc_id
      FROM growth_group_participants
      WHERE person_id = (SELECT person_id FROM users WHERE id = auth.uid())
        AND role IN ('leader', 'co_leader')
        AND status = 'active'
        AND deleted_at IS NULL
    )
  )
);

CREATE POLICY "supervisors_view_member_attendance" ON meeting_member_attendance
FOR SELECT USING (
  meeting_id IN (
    SELECT m.id
    FROM meetings m
    WHERE m.gc_id IN (
      SELECT gc_id
      FROM growth_group_participants
      WHERE person_id = (SELECT person_id FROM users WHERE id = auth.uid())
        AND role = 'supervisor'
        AND status = 'active'
        AND deleted_at IS NULL
    )
  )
);

CREATE POLICY "admins_manage_member_attendance" ON meeting_member_attendance
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

-- ---------------------------------------------------------------------------

CREATE TABLE meeting_visitor_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (meeting_id, visitor_id)
);

CREATE INDEX idx_visitor_attendance_meeting ON meeting_visitor_attendance(meeting_id);
CREATE INDEX idx_visitor_attendance_visitor ON meeting_visitor_attendance(visitor_id);

ALTER TABLE meeting_visitor_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leaders_manage_visitor_attendance" ON meeting_visitor_attendance
FOR ALL USING (
  meeting_id IN (
    SELECT m.id
    FROM meetings m
    WHERE m.gc_id IN (
      SELECT gc_id
      FROM growth_group_participants
      WHERE person_id = (SELECT person_id FROM users WHERE id = auth.uid())
        AND role IN ('leader', 'co_leader')
        AND status = 'active'
        AND deleted_at IS NULL
    )
  )
);

CREATE POLICY "supervisors_view_visitor_attendance" ON meeting_visitor_attendance
FOR SELECT USING (
  meeting_id IN (
    SELECT m.id
    FROM meetings m
    WHERE m.gc_id IN (
      SELECT gc_id
      FROM growth_group_participants
      WHERE person_id = (SELECT person_id FROM users WHERE id = auth.uid())
        AND role = 'supervisor'
        AND status = 'active'
        AND deleted_at IS NULL
    )
  )
);

CREATE POLICY "admins_manage_visitor_attendance" ON meeting_visitor_attendance
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);
