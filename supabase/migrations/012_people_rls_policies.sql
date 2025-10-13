-- Migration 012: People and Visitors RLS Policies
-- Feature: 001-crie-um-app
-- Description: Row Level Security policies for people and visitors tables (after all dependent tables exist)

-- Leaders see people from their GCs (members + visitors via meetings)
CREATE POLICY "leaders_view_gc_people" ON people
FOR SELECT USING (
  id IN (
    SELECT person_id FROM members WHERE gc_id IN (SELECT gc_id FROM gc_leaders WHERE user_id = auth.uid())
  )
  OR
  id IN (
    SELECT person_id FROM visitors WHERE id IN (
      SELECT visitor_id FROM meeting_attendance WHERE meeting_id IN (
        SELECT id FROM meetings WHERE gc_id IN (SELECT gc_id FROM gc_leaders WHERE user_id = auth.uid())
      )
    )
  )
);

-- Supervisors see people from supervised GCs
CREATE POLICY "supervisors_view_people" ON people
FOR SELECT USING (
  id IN (
    SELECT person_id FROM members WHERE gc_id IN (SELECT gc_id FROM gc_supervisors WHERE user_id = auth.uid())
  )
  OR
  id IN (
    SELECT person_id FROM visitors WHERE id IN (
      SELECT visitor_id FROM meeting_attendance WHERE meeting_id IN (
        SELECT id FROM meetings WHERE gc_id IN (SELECT gc_id FROM gc_supervisors WHERE user_id = auth.uid())
      )
    )
  )
);

-- Admins view and manage all
CREATE POLICY "admins_manage_all_people" ON people
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

-- ===== VISITORS RLS POLICIES =====

-- Leaders view and manage visitors who attended their meetings
CREATE POLICY "leaders_manage_meeting_visitors" ON visitors
FOR ALL USING (
  id IN (
    SELECT ma.visitor_id FROM meeting_attendance ma
    JOIN meetings m ON m.id = ma.meeting_id
    WHERE m.gc_id IN (SELECT gc_id FROM gc_leaders WHERE user_id = auth.uid())
  )
);

-- Supervisors view visitors from supervised GC meetings
CREATE POLICY "supervisors_view_visitors" ON visitors
FOR SELECT USING (
  id IN (
    SELECT ma.visitor_id FROM meeting_attendance ma
    JOIN meetings m ON m.id = ma.meeting_id
    WHERE m.gc_id IN (SELECT gc_id FROM gc_supervisors WHERE user_id = auth.uid())
  )
);

-- Admins manage all
CREATE POLICY "admins_manage_visitors" ON visitors
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);
