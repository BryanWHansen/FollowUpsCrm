-- Migration: Add customerStatus field to customers table
-- This allows distinguishing between leads and customers

-- Add customerStatus column with CHECK constraint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'customerstatus'
    ) THEN
        ALTER TABLE customers 
        ADD COLUMN customerStatus VARCHAR(20) NOT NULL DEFAULT 'lead'
        CHECK (customerStatus IN ('lead', 'customer'));
    END IF;
END $$;

-- Add index for performance on status queries
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(customerStatus);

-- Migrate existing data:
-- Set customerStatus to 'customer' if the record has any purchase interaction
-- Otherwise set to 'lead'
UPDATE customers
SET customerStatus = CASE 
    WHEN EXISTS (
        SELECT 1 FROM interactions 
        WHERE interactions.customerId = customers.customerId 
        AND interactions.interactionType = 'purchase'
    ) THEN 'customer'
    ELSE 'lead'
END
WHERE customerStatus = 'lead'; -- Only update records that still have default value
