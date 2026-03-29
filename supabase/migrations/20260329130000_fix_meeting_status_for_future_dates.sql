-- Fix meeting status for existing meetings based on their datetime
-- Meetings with future dates should be 'scheduled', not 'completed'

UPDATE meetings
SET status = 'scheduled'
WHERE datetime > NOW()
  AND status = 'completed'
  AND deleted_at IS NULL;

-- Also ensure cancelled meetings remain cancelled regardless of date
-- (This is just a precaution - the previous migration didn't change cancelled meetings)

-- Add a comment to document the logic
COMMENT ON COLUMN meetings.status IS 'Meeting status: scheduled (future meetings), completed (past meetings), cancelled (explicitly cancelled by users)';