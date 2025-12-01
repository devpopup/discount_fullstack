-- Migration: Add max_claims_per_user to offers table
-- Description: Allows businesses to limit how many times a single user can claim an offer
-- Date: 2025-11-28

-- Add the max_claims_per_user column to offers table
ALTER TABLE offers
ADD COLUMN IF NOT EXISTS max_claims_per_user INTEGER DEFAULT NULL;

-- Add comment to explain the field
COMMENT ON COLUMN offers.max_claims_per_user IS 'Maximum number of times a single user can claim this offer. NULL means no per-user limit.';

-- Optional: Add a check constraint to ensure it's a positive number if set
ALTER TABLE offers
ADD CONSTRAINT check_max_claims_per_user_positive
CHECK (max_claims_per_user IS NULL OR max_claims_per_user > 0);

-- Optional: Create an index on user_id and offer_id in claimed_offers for faster lookup
-- This helps when checking how many times a user has claimed an offer
CREATE INDEX IF NOT EXISTS idx_claimed_offers_user_offer
ON claimed_offers(user_id, offer_id);

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'offers' AND column_name = 'max_claims_per_user';
