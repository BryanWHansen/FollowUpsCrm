-- Migration: Create followups table
-- Description: Creates the followups table for generated follow-up tasks

CREATE TABLE IF NOT EXISTS followups (
  followupId SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL,
  customerId INTEGER NOT NULL,
  interactionId INTEGER NOT NULL,
  templateId INTEGER NOT NULL,
  scheduledDate DATE NOT NULL,
  completedDate DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  messageSubject VARCHAR(255),
  messageBody TEXT NOT NULL,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_followups_userid 
    FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE,
  CONSTRAINT fk_followups_customerid 
    FOREIGN KEY (customerId) REFERENCES customers(customerId) ON DELETE CASCADE,
  CONSTRAINT fk_followups_interactionid 
    FOREIGN KEY (interactionId) REFERENCES interactions(interactionId) ON DELETE CASCADE,
  CONSTRAINT fk_followups_templateid 
    FOREIGN KEY (templateId) REFERENCES followuptemplates(templateId) ON DELETE RESTRICT,
  
  -- Validation constraints
  CONSTRAINT chk_status_valid 
    CHECK (status IN ('pending', 'completed', 'dismissed', 'snoozed'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_followups_userid ON followups(userId);
CREATE INDEX IF NOT EXISTS idx_followups_customerid ON followups(customerId);
CREATE INDEX IF NOT EXISTS idx_followups_interactionid ON followups(interactionId);
CREATE INDEX IF NOT EXISTS idx_followups_templateid ON followups(templateId);
CREATE INDEX IF NOT EXISTS idx_followups_status ON followups(status);
CREATE INDEX IF NOT EXISTS idx_followups_scheduleddate ON followups(scheduledDate);
