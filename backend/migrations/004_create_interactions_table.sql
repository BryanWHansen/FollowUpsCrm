-- Migration: Create interactions table
-- Description: Creates the interactions table to track customer interactions

CREATE TABLE IF NOT EXISTS interactions (
  interactionId SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL,
  customerId INTEGER NOT NULL,
  vehicleId INTEGER,
  interactionType VARCHAR(50) NOT NULL,
  interactionDate DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_interactions_userid 
    FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE,
  CONSTRAINT fk_interactions_customerid 
    FOREIGN KEY (customerId) REFERENCES customers(customerId) ON DELETE CASCADE,
  CONSTRAINT fk_interactions_vehicleid 
    FOREIGN KEY (vehicleId) REFERENCES purchasedvehicles(vehicleId) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_interactions_userid ON interactions(userId);
CREATE INDEX idx_interactions_customerid ON interactions(customerId);
CREATE INDEX idx_interactions_vehicleid ON interactions(vehicleId);
CREATE INDEX idx_interactions_type ON interactions(interactionType);
CREATE INDEX idx_interactions_date ON interactions(interactionDate);
