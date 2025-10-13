-- Migration 010: Visitor Auto-Conversion Trigger
-- Feature: 001-crie-um-app
-- Description: Automatically converts visitors to members after N visits (configurable)

-- Configuration table
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_config_updated_at
BEFORE UPDATE ON config
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Insert default config: 3 visits to convert
INSERT INTO config (key, value, description) VALUES
('visitor_conversion_threshold', '3', 'Number of visits required to auto-convert visitor to member');

-- Auto-conversion trigger
CREATE OR REPLACE FUNCTION auto_convert_visitor() RETURNS TRIGGER AS $$
DECLARE
  threshold INT;
  current_count INT;
BEGIN
  -- Only for visitors (not members)
  IF NEW.visitor_id IS NOT NULL THEN
    -- Get threshold from config
    SELECT (value::TEXT)::INT INTO threshold
    FROM config WHERE key = 'visitor_conversion_threshold';

    -- Count visits for this visitor
    SELECT COUNT(*) INTO current_count
    FROM meeting_attendance
    WHERE visitor_id = NEW.visitor_id;

    -- If reached threshold, mark as converted
    IF current_count >= threshold THEN
      -- Get the user who registered the meeting
      UPDATE visitors
      SET
        converted_to_member_at = NOW(),
        converted_by_user_id = (
          SELECT registered_by_user_id
          FROM meetings
          WHERE id = NEW.meeting_id
        ),
        visit_count = current_count
      WHERE id = NEW.visitor_id
        AND converted_to_member_at IS NULL; -- Only if not already converted
    ELSE
      -- Update visit count
      UPDATE visitors
      SET visit_count = current_count
      WHERE id = NEW.visitor_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_visitor_conversion
AFTER INSERT ON meeting_attendance
FOR EACH ROW EXECUTE FUNCTION auto_convert_visitor();

-- RLS for config table
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "all_view_config" ON config FOR SELECT USING (true);
CREATE POLICY "admins_manage_config" ON config
FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE));

COMMENT ON TABLE config IS 'Application configuration key-value store';
COMMENT ON FUNCTION auto_convert_visitor() IS 'Automatically marks visitors as converted after N visits (threshold from config table)';
