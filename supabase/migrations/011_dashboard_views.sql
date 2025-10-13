-- Migration 011: Dashboard metrics views
-- Feature: 001-crie-um-app
-- Description: Pre-computed views for dashboard metrics (frequency, growth, conversions)

CREATE VIEW dashboard_metrics AS
SELECT
  gc.id as gc_id,
  gc.name as gc_name,
  gc.status,

  -- Meeting metrics (current month)
  COUNT(DISTINCT m.id) FILTER (WHERE m.datetime >= DATE_TRUNC('month', NOW())) as total_meetings_current_month,

  -- Average attendance
  COALESCE(AVG(attendance_count.count), 0)::DECIMAL(10,2) as average_attendance,

  -- Active members count
  (
    SELECT COUNT(*) FROM members
    WHERE gc_id = gc.id AND status = 'active'
  ) as total_active_members,

  -- Conversions (last 30 days)
  (
    SELECT COUNT(DISTINCT v.id)
    FROM visitors v
    JOIN meeting_attendance ma ON ma.visitor_id = v.id
    JOIN meetings m2 ON m2.id = ma.meeting_id
    WHERE m2.gc_id = gc.id
      AND v.converted_to_member_at IS NOT NULL
      AND v.converted_to_member_at >= NOW() - INTERVAL '30 days'
  ) as conversions_last_month,

  -- Growth rate (members joined last 30 days)
  (
    SELECT COUNT(*) FROM members
    WHERE gc_id = gc.id
      AND status = 'active'
      AND joined_at >= NOW() - INTERVAL '30 days'
  ) as new_members_last_month,

  -- Leaders and supervisors
  (SELECT COUNT(*) FROM gc_leaders WHERE gc_id = gc.id) as total_leaders,
  (SELECT COUNT(*) FROM gc_supervisors WHERE gc_id = gc.id) as total_supervisors

FROM growth_groups gc
LEFT JOIN meetings m ON m.gc_id = gc.id
  AND m.datetime >= DATE_TRUNC('month', NOW())
LEFT JOIN LATERAL (
  SELECT COUNT(*) as count
  FROM meeting_attendance
  WHERE meeting_id = m.id
) attendance_count ON true
WHERE gc.deleted_at IS NULL
GROUP BY gc.id, gc.name, gc.status;

COMMENT ON VIEW dashboard_metrics IS 'Dashboard metrics per GC: meetings, attendance, members, conversions, growth';

-- Helper view: User roles (accumulated)
CREATE VIEW user_roles AS
SELECT
  u.id as user_id,
  p.name,
  p.email,

  -- Is leader?
  EXISTS (
    SELECT 1 FROM gc_leaders gl
    JOIN growth_groups gc ON gc.id = gl.gc_id
    WHERE gl.user_id = u.id AND gc.deleted_at IS NULL
  ) as is_leader,

  -- Is supervisor?
  EXISTS (
    SELECT 1 FROM gc_supervisors gs
    JOIN growth_groups gc ON gc.id = gs.gc_id
    WHERE gs.user_id = u.id AND gc.deleted_at IS NULL
  ) as is_supervisor,

  -- Is coordinator? (has subordinates in hierarchy)
  EXISTS (
    SELECT 1 FROM users u2
    WHERE u2.hierarchy_parent_id = u.id AND u2.deleted_at IS NULL
  ) as is_coordinator,

  -- Is admin?
  u.is_admin,

  -- GC counts
  (SELECT COUNT(DISTINCT gc_id) FROM gc_leaders WHERE user_id = u.id) as gcs_led,
  (SELECT COUNT(DISTINCT gc_id) FROM gc_supervisors WHERE user_id = u.id) as gcs_supervised,
  (SELECT COUNT(*) FROM users WHERE hierarchy_parent_id = u.id AND deleted_at IS NULL) as direct_subordinates

FROM users u
JOIN people p ON p.id = u.person_id
WHERE u.deleted_at IS NULL;

COMMENT ON VIEW user_roles IS 'User accumulated roles and counts. Roles are NOT exclusive - a user can be leader+supervisor+coordinator simultaneously';
