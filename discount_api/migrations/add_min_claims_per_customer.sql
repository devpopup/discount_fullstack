-- Migration: Add min_claims_per_customer to offers table
-- Description: Allows businesses to set a minimum quantity required per claim
-- Date: 2025-12-24

-- Add the min_claims_per_customer column to offers table
ALTER TABLE offers
ADD COLUMN IF NOT EXISTS min_claims_per_customer INTEGER DEFAULT NULL;

-- Add comment to explain the field
COMMENT ON COLUMN offers.min_claims_per_customer IS 'Minimum quantity that must be claimed in a single claim. NULL or 1 means no minimum requirement.';

-- Optional: Add a check constraint to ensure it's a positive number if set
ALTER TABLE offers
ADD CONSTRAINT check_min_claims_per_customer_positive
CHECK (min_claims_per_customer IS NULL OR min_claims_per_customer > 0);

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'offers' AND column_name = 'min_claims_per_customer';
