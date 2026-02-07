-- Migration: Create customerInterestVehicles table
-- This table tracks customer interest in vehicles (not yet purchased)
-- Allows flexible specificity: from "white pickup" to "black 2025 GMC Sierra Denali"

CREATE TABLE IF NOT EXISTS customerInterestVehicles (
    interestVehicleId SERIAL PRIMARY KEY,
    userId INTEGER NOT NULL,
    customerId INTEGER NOT NULL,
    interactionId INTEGER NOT NULL,
    
    -- Flexible vehicle attributes (all nullable for flexibility)
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    color VARCHAR(50),
    trim VARCHAR(100),
    vehicleType VARCHAR(50), -- e.g., 'pickup', 'sedan', 'suv', 'truck'
    
    notes TEXT,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_interestVehicle_user 
        FOREIGN KEY (userId) 
        REFERENCES users(userId) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_interestVehicle_customer 
        FOREIGN KEY (customerId) 
        REFERENCES customers(customerId) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_interestVehicle_interaction 
        FOREIGN KEY (interactionId) 
        REFERENCES interactions(interactionId) 
        ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_interestVehicles_userId ON customerInterestVehicles(userId);
CREATE INDEX idx_interestVehicles_customerId ON customerInterestVehicles(customerId);
CREATE INDEX idx_interestVehicles_interactionId ON customerInterestVehicles(interactionId);

-- Comments
COMMENT ON TABLE customerInterestVehicles IS 'Tracks customer interest in vehicles across varying levels of specificity';
COMMENT ON COLUMN customerInterestVehicles.vehicleType IS 'General vehicle category: pickup, sedan, suv, truck, etc.';
COMMENT ON COLUMN customerInterestVehicles.make IS 'Optional: Specific make interested in (e.g., GMC, Ford)';
COMMENT ON COLUMN customerInterestVehicles.model IS 'Optional: Specific model interested in (e.g., Sierra, F-150)';
COMMENT ON COLUMN customerInterestVehicles.trim IS 'Optional: Specific trim level (e.g., Denali, Platinum)';
