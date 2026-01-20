-- Migration: Add image support to superadmin offers
-- Description: Adds image_url field to superadmin_offers table to store offer images
-- Date: 2026-01-20

-- =============================================================================
-- Add image_url column to superadmin_offers
-- =============================================================================

ALTER TABLE superadmin_offers
ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN superadmin_offers.image_url IS 'URL to the offer image stored in Supabase storage or external CDN';

-- Create index for faster queries filtering by image presence
CREATE INDEX IF NOT EXISTS idx_superadmin_offers_has_image
ON superadmin_offers(image_url)
WHERE image_url IS NOT NULL;

-- =============================================================================
-- Verification
-- =============================================================================

-- Verify column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'superadmin_offers' AND column_name = 'image_url';
