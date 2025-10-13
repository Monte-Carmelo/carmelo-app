-- Migration 009: Meeting Attendance table
-- Feature: 001-crie-um-app

CREATE TABLE meeting_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  visitor_id UUID REFERENCES visitors(id) ON DELETE CASCADE,
  attendance_type TEXT NOT NULL CHECK (attendance_type IN ('member', 'visitor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Either member_id or visitor_id must be set, but not both
  CONSTRAINT member_or_visitor CHECK (
    (member_id IS NOT NULL AND visitor_id IS NULL AND attendance_type = 'member')
    OR
    (visitor_id IS NOT NULL AND member_id IS NULL AND attendance_type = 'visitor')
  )
);

CREATE INDEX idx_attendance_meeting ON meeting_attendance(meeting_id);
CREATE INDEX idx_attendance_member ON meeting_attendance(member_id) WHERE member_id IS NOT NULL;
CREATE INDEX idx_attendance_visitor ON meeting_attendance(visitor_id) WHERE visitor_id IS NOT NULL;

ALTER TABLE meeting_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leaders_view_attendance" ON meeting_attendance
FOR SELECT USING (
  meeting_id IN (
    SELECT id FROM meetings WHERE gc_id IN (
      SELECT gc_id FROM gc_leaders WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "supervisors_view_attendance" ON meeting_attendance
FOR SELECT USING (
  meeting_id IN (
    SELECT id FROM meetings WHERE gc_id IN (
      SELECT gc_id FROM gc_supervisors WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "leaders_register_attendance" ON meeting_attendance
FOR INSERT WITH CHECK (
  meeting_id IN (
    SELECT id FROM meetings WHERE gc_id IN (
      SELECT gc_id FROM gc_leaders WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "admins_manage_attendance" ON meeting_attendance
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);
