-- Migration 011: Dashboard metrics views
-- Feature: 001-crie-um-app
-- Description: Views para métricas e papéis derivados a partir de growth_group_participants

CREATE OR REPLACE VIEW dashboard_metrics AS
WITH gc_stats AS (
  SELECT
    gc.id AS gc_id,
    gc.name AS gc_name,

    COUNT(DISTINCT m.id) FILTER (WHERE m.datetime >= DATE_TRUNC('month', NOW())) AS meetings_current_month,

    COALESCE(AVG(attendance_count.count), 0)::DECIMAL(10,2) AS avg_attendance_30d,

    (SELECT COUNT(*) FROM growth_group_participants gpr
     WHERE gpr.gc_id = gc.id
       AND gpr.role = 'member'
       AND gpr.status = 'active'
       AND gpr.deleted_at IS NULL) AS total_active_members,

    (SELECT COUNT(*) FROM growth_group_participants gpr
     WHERE gpr.gc_id = gc.id
       AND gpr.role = 'member'
       AND gpr.joined_at >= NOW() - INTERVAL '30 days') AS new_members_30d,

    (SELECT COUNT(*) FROM visitor_conversion_events vce
     WHERE vce.gc_id = gc.id
       AND vce.converted_at >= NOW() - INTERVAL '30 days') AS conversions_30d,

    (SELECT COUNT(DISTINCT v.id) FROM visitors v
     JOIN meeting_visitor_attendance mva ON mva.visitor_id = v.id
     JOIN meetings m2 ON m2.id = mva.meeting_id
     WHERE m2.gc_id = gc.id
       AND mva.created_at >= NOW() - INTERVAL '30 days') AS unique_visitors_30d

  FROM growth_groups gc
  LEFT JOIN meetings m ON m.gc_id = gc.id
  LEFT JOIN LATERAL (
    SELECT (
      (SELECT COUNT(*) FROM meeting_member_attendance mma WHERE mma.meeting_id = m.id)
      +
      (SELECT COUNT(*) FROM meeting_visitor_attendance mva WHERE mva.meeting_id = m.id)
    ) AS count
  ) attendance_count ON TRUE
  WHERE gc.deleted_at IS NULL
  GROUP BY gc.id
)
SELECT
  gc_id,
  gc_name,
  meetings_current_month,
  ROUND(avg_attendance_30d, 1) AS average_attendance,
  total_active_members,
  new_members_30d AS growth_30d,
  conversions_30d,
  unique_visitors_30d,
  CASE
    WHEN unique_visitors_30d > 0 THEN ROUND((conversions_30d::DECIMAL / unique_visitors_30d) * 100, 1)
    ELSE 0
  END AS conversion_rate_pct
FROM gc_stats;

COMMENT ON VIEW dashboard_metrics IS 'Dashboard metrics per GC: meetings, attendance, members, conversions, leadership counts.';

DROP VIEW IF EXISTS user_roles;

CREATE VIEW user_gc_roles AS
SELECT
  u.id AS user_id,
  p.name,
  p.email,
  u.is_admin,

  EXISTS (
    SELECT 1
    FROM growth_group_participants gpr
    WHERE gpr.person_id = u.person_id
      AND gpr.role IN ('leader', 'co_leader')
      AND gpr.status = 'active'
      AND gpr.deleted_at IS NULL
  ) AS is_leader,

  EXISTS (
    SELECT 1
    FROM growth_group_participants gpr
    WHERE gpr.person_id = u.person_id
      AND gpr.role = 'supervisor'
      AND gpr.status = 'active'
      AND gpr.deleted_at IS NULL
  ) AS is_supervisor,

  EXISTS (
    SELECT 1
    FROM users u2
    WHERE u2.hierarchy_parent_id = u.id
      AND u2.deleted_at IS NULL
  ) AS is_coordinator,

  (SELECT COUNT(DISTINCT gc_id)
   FROM growth_group_participants gpr
   WHERE gpr.person_id = u.person_id
     AND gpr.role IN ('leader','co_leader')
     AND gpr.status = 'active'
     AND gpr.deleted_at IS NULL) AS gcs_led,

  (SELECT COUNT(DISTINCT gc_id)
   FROM growth_group_participants gpr
   WHERE gpr.person_id = u.person_id
     AND gpr.role = 'supervisor'
     AND gpr.status = 'active'
     AND gpr.deleted_at IS NULL) AS gcs_supervised,

  (SELECT COUNT(*)
   FROM users u2
   WHERE u2.hierarchy_parent_id = u.id
     AND u2.deleted_at IS NULL) AS direct_subordinates

FROM users u
JOIN people p ON p.id = u.person_id
WHERE u.deleted_at IS NULL;

COMMENT ON VIEW user_gc_roles IS 'User accumulated roles derived from growth_group_participants + hierarchy.';
