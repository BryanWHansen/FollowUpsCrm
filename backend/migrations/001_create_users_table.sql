-- Migration: Create users table
-- Description: Creates the users table for authentication and authorization

CREATE TABLE IF NOT EXISTS users (
  userId SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  lastLogin TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Note: Run this migration before adding userId to other tables
-- Next steps: Add userId foreign key to customers and purchasedvehicles tables
