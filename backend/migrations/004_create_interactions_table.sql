-- Migration: Create interactions table
-- Description: Creates the interactions table to track customer interactions

CREATE TABLE IF NOT EXISTS interactions (
  interactionId SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL,
  customerId INTEGER NOT NULL,
  interactionType VARCHAR(50) NOT NULL,
  interactionDate DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_interactions_userid 
    FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE,
  CONSTRAINT fk_interactions_customerid 
    FOREIGN KEY (customerId) REFERENCES customers(customerId) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_interactions_userid ON interactions(userId);
CREATE INDEX IF NOT EXISTS idx_interactions_customerid ON interactions(customerId);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(interactionType);
CREATE INDEX IF NOT EXISTS idx_interactions_date ON interactions(interactionDate);
