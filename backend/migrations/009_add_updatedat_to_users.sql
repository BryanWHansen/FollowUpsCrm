-- Migration: Add updatedAt column to users table
-- Description: Adds updatedAt timestamp column to track when user information is modified
-- This migration is re-runnable and will only add the column if it doesn't exist

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'updatedat'
  ) THEN
    ALTER TABLE users ADD COLUMN updatedAt TIMESTAMP DEFAULT NOW();
    
    -- Update existing records to set updatedAt to createdAt initially
    UPDATE users SET updatedAt = createdAt WHERE updatedAt IS NULL;
    
    RAISE NOTICE 'Column updatedAt added to users table';
  ELSE
    RAISE NOTICE 'Column updatedAt already exists in users table';
  END IF;
END $$;
