-- Migration: Create purchasedvehicles table with userId
-- Description: Creates the purchasedvehicles table with user isolation from the start

CREATE TABLE IF NOT EXISTS purchasedvehicles (
  vehicleId SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL,
  customerId INTEGER NOT NULL,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  purchaseDate DATE,
  salePrice DECIMAL(10,2),
  vin VARCHAR(17),
  color VARCHAR(50),
  mileage INTEGER,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP,
  
  -- Foreign key constraints
  CONSTRAINT fk_purchasedvehicles_userid 
    FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE,
  CONSTRAINT fk_purchasedvehicles_customerid 
    FOREIGN KEY (customerId) REFERENCES customers(customerId) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchasedvehicles_userid ON purchasedvehicles(userId);
CREATE INDEX IF NOT EXISTS idx_purchasedvehicles_customerid ON purchasedvehicles(customerId);
CREATE INDEX IF NOT EXISTS idx_purchasedvehicles_vin ON purchasedvehicles(vin);
