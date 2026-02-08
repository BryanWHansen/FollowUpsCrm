-- Add email digest preferences to users table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='emaildigestenabled') THEN
        ALTER TABLE users ADD COLUMN emailDigestEnabled BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='emaildigesttime') THEN
        ALTER TABLE users ADD COLUMN emailDigestTime TIME DEFAULT '08:00:00';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='emaildigesttimezone') THEN
        ALTER TABLE users ADD COLUMN emailDigestTimezone VARCHAR(50) DEFAULT 'America/New_York';
    END IF;
END $$;

COMMENT ON COLUMN users.emailDigestEnabled IS 'Whether user wants to receive daily follow-up digest emails';
COMMENT ON COLUMN users.emailDigestTime IS 'Time of day to send digest email (local time)';
COMMENT ON COLUMN users.emailDigestTimezone IS 'IANA timezone for emailDigestTime';