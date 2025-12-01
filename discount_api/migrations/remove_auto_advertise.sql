-- Migration: Remove auto_advertise and daily_ad_budget columns from offers table
-- Date: 2025-11-29
-- Description: Cleanup script to remove unused auto-advertising feature

-- Remove auto_advertise column if it exists
ALTER TABLE offers DROP COLUMN IF EXISTS auto_advertise;

-- Remove daily_ad_budget column if it exists
ALTER TABLE offers DROP COLUMN IF EXISTS daily_ad_budget;

-- Verification query (run separately to check)
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'offers'
-- AND column_name IN ('auto_advertise', 'daily_ad_budget');
