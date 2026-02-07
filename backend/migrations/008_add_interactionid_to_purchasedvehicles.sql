-- Add interactionId to purchased vehicles table
-- This links purchased vehicles to the interaction that led to the purchase

ALTER TABLE purchasedvehicles 
ADD COLUMN interactionId INTEGER;

-- Add foreign key constraint with CASCADE delete
-- When an interaction is deleted, associated purchased vehicles will also be deleted
ALTER TABLE purchasedvehicles
ADD CONSTRAINT fk_purchasedvehicles_interactionid 
FOREIGN KEY (interactionId) 
REFERENCES interactions(interactionId) 
ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_purchasedvehicles_interactionid 
ON purchasedvehicles(interactionId);

-- Note: Column is nullable to support existing records without interactions
-- New records created through the UI should have interactionId populated
