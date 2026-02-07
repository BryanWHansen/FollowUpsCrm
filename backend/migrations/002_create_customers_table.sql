-- Migration: Create customers table with userId
-- Description: Creates the customers table with user isolation from the start

CREATE TABLE IF NOT EXISTS customers (
  customerId SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  preferredName VARCHAR(100),
  birthday DATE,
  phoneNumber VARCHAR(20),
  address TEXT,
  email VARCHAR(255),
  notes TEXT,
  lastContactDate DATE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP,
  
  -- Foreign key constraint
  CONSTRAINT fk_customers_userid 
    FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_customers_userid ON customers(userId);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_lastname ON customers(lastName);
