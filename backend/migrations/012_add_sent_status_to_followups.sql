-- Migration: Add 'sent' status to followups
-- Description: Adds 'sent' as a valid status for followups to track when email digests are sent

-- Drop the existing constraint
ALTER TABLE followups
DROP CONSTRAINT IF EXISTS chk_status_valid;

-- Add the new constraint with 'sent' status
ALTER TABLE followups
ADD CONSTRAINT chk_status_valid 
  CHECK (status IN ('pending', 'sent', 'completed', 'dismissed', 'snoozed'));

COMMENT ON COLUMN followups.status IS 'Status: pending (not sent), sent (email sent), completed (user marked done), dismissed, snoozed';
