-- Add interactionId to purchased vehicles table
-- This links purchased vehicles to the interaction that led to the purchase

-- Add column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchasedvehicles' 
        AND column_name = 'interactionid'
    ) THEN
        ALTER TABLE purchasedvehicles 
        ADD COLUMN interactionId INTEGER;
    END IF;
END $$;

-- Add foreign key constraint with CASCADE delete if it doesn't exist
-- When an interaction is deleted, associated purchased vehicles will also be deleted
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_purchasedvehicles_interactionid'
        AND table_name = 'purchasedvehicles'
    ) THEN
        ALTER TABLE purchasedvehicles
        ADD CONSTRAINT fk_purchasedvehicles_interactionid 
        FOREIGN KEY (interactionId) 
        REFERENCES interactions(interactionId) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Create index for better query performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_purchasedvehicles_interactionid 
ON purchasedvehicles(interactionId);

-- Note: Column is nullable to support existing records without interactions
-- New records created through the UI should have interactionId populated
