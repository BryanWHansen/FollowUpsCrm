-- Migration: Create followuptemplates table
-- Description: Creates the followuptemplates table for user-customizable follow-up templates

CREATE TABLE IF NOT EXISTS followuptemplates (
  templateId SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL,
  templateName VARCHAR(100) NOT NULL,
  interactionType VARCHAR(50) NOT NULL,
  daysAfter INTEGER NOT NULL,
  messageSubject VARCHAR(255),
  messageBody TEXT NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP,
  
  -- Foreign key constraint
  CONSTRAINT fk_followuptemplates_userid 
    FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE,
  
  -- Validation constraints
  CONSTRAINT chk_daysafter_positive CHECK (daysAfter > 0)
);

-- Create indexes for performance
CREATE INDEX idx_followuptemplates_userid ON followuptemplates(userId);
CREATE INDEX idx_followuptemplates_type ON followuptemplates(interactionType);
CREATE INDEX idx_followuptemplates_active ON followuptemplates(isActive);
