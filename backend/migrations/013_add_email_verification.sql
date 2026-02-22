-- Migration: Add email verification fields
-- Description: Adds email verification fields to users table and sets existing users as verified

-- Add email verification columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS verification_token_expiry TIMESTAMP;

-- Grandfather in existing users as verified
UPDATE users 
SET email_verified = TRUE 
WHERE email_verified = FALSE;

-- Create index on verification token for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);

-- Note: New users will have email_verified = FALSE by default
-- They must verify their email before performing actions
