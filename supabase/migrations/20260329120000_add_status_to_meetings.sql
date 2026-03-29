-- Add meeting_status enum type
CREATE TYPE meeting_status AS ENUM ('scheduled', 'completed', 'cancelled');

-- Add status column to meetings table with default 'scheduled'
ALTER TABLE meetings
  ADD COLUMN status meeting_status NOT NULL DEFAULT 'scheduled';

-- Set existing meetings to 'completed' since they were already registered
UPDATE meetings SET status = 'completed' WHERE deleted_at IS NULL;

-- Create index for filtering by status
CREATE INDEX idx_meetings_status ON meetings (status);
