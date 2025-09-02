-- Migration to add timezone and notification settings to businesses table
-- Run this SQL script on your database to add the missing columns

-- Add timezone column
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS timezone VARCHAR DEFAULT 'America/Toronto';

-- Add notification preference columns
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS promotional_updates BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS transaction_alerts BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN NOT NULL DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN businesses.timezone IS 'Business timezone (e.g., America/Toronto)';
COMMENT ON COLUMN businesses.promotional_updates IS 'Whether business wants to receive promotional updates';
COMMENT ON COLUMN businesses.transaction_alerts IS 'Whether business wants transaction alerts';
COMMENT ON COLUMN businesses.email_notifications IS 'Whether business wants email notifications';

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'businesses' 
AND column_name IN ('timezone', 'promotional_updates', 'transaction_alerts', 'email_notifications')
ORDER BY column_name;