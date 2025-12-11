-- Migration: Add offer_reminders table
-- Description: Allow users to set reminders for upcoming offers

CREATE TABLE IF NOT EXISTS offer_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    
    -- Reminder status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notified_at TIMESTAMPTZ,
    
    -- Notification preferences
    notify_via_app BOOLEAN NOT NULL DEFAULT TRUE,
    notify_via_email BOOLEAN NOT NULL DEFAULT FALSE,
    notify_via_push BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint: one active reminder per user per offer
    UNIQUE(user_id, offer_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_offer_reminders_user_id ON offer_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_offer_reminders_offer_id ON offer_reminders(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_reminders_is_active ON offer_reminders(is_active);
CREATE INDEX IF NOT EXISTS idx_offer_reminders_notified_at ON offer_reminders(notified_at) WHERE notified_at IS NULL;

-- Add RLS policies
ALTER TABLE offer_reminders ENABLE ROW LEVEL SECURITY;

-- Users can only see their own reminders
CREATE POLICY "Users can view own reminders" ON offer_reminders
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own reminders
CREATE POLICY "Users can create own reminders" ON offer_reminders
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own reminders
CREATE POLICY "Users can update own reminders" ON offer_reminders
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own reminders
CREATE POLICY "Users can delete own reminders" ON offer_reminders
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_offer_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_offer_reminders_updated_at
    BEFORE UPDATE ON offer_reminders
    FOR EACH ROW
    EXECUTE FUNCTION update_offer_reminders_updated_at();
