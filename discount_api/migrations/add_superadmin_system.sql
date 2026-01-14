-- Migration: Add Superadmin System for Temporary Offer Creation
-- Description: Creates isolated superadmin tables for creating demo offers during user acquisition phase
--              These tables are completely drop-safe and can be removed without affecting main system
-- Date: 2026-01-07
-- Purpose: Allow superadmins to create offers for businesses during onboarding/testing
--          Offers are view-only (no claiming) to drive user acquisition

-- =============================================================================
-- STEP 1: Add superadmin flag to profiles
-- =============================================================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN DEFAULT false;

COMMENT ON COLUMN profiles.is_superadmin IS 'Temporary flag for superadmin users who can create demo offers. Will be removed after user acquisition phase.';

CREATE INDEX IF NOT EXISTS idx_profiles_is_superadmin ON profiles(is_superadmin) WHERE is_superadmin = true;

-- =============================================================================
-- STEP 2: Create superadmin_businesses table (isolated from main businesses)
-- =============================================================================

CREATE TABLE IF NOT EXISTS superadmin_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_admin UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Business identity fields
  business_name TEXT NOT NULL,
  business_description TEXT,
  business_address TEXT,
  phone_number TEXT,
  business_website TEXT,
  avatar_url TEXT,
  business_hours JSONB,

  -- Category reference (ON DELETE SET NULL to prevent cascading issues)
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,

  -- Location fields (for map display and filtering)
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  formatted_address TEXT,
  place_id TEXT,
  address_components JSONB,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT check_business_name_length CHECK (char_length(business_name) >= 2)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_superadmin_businesses_active ON superadmin_businesses(is_active);
CREATE INDEX IF NOT EXISTS idx_superadmin_businesses_category ON superadmin_businesses(category_id);
CREATE INDEX IF NOT EXISTS idx_superadmin_businesses_location ON superadmin_businesses(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_superadmin_businesses_created_by ON superadmin_businesses(created_by_admin);

-- Comments
COMMENT ON TABLE superadmin_businesses IS 'Temporary table for demo businesses created by superadmins. Completely isolated from main businesses table. Can be dropped without affecting production data.';
COMMENT ON COLUMN superadmin_businesses.created_by_admin IS 'Reference to superadmin who created this demo business';

-- =============================================================================
-- STEP 3: Create superadmin_offers table (isolated from main offers)
-- =============================================================================

CREATE TABLE IF NOT EXISTS superadmin_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  superadmin_business_id UUID NOT NULL REFERENCES superadmin_businesses(id) ON DELETE CASCADE,
  created_by_admin UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Core offer fields
  title TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'minimum_purchase', 'quantity_discount', 'bogo')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  original_price NUMERIC CHECK (original_price >= 0),
  discounted_price NUMERIC CHECK (discounted_price >= 0),

  -- Date range
  start_date TIMESTAMPTZ NOT NULL,
  expiry_date TIMESTAMPTZ NOT NULL,

  -- Claim limits (informational only - no actual claiming)
  max_claims INTEGER CHECK (max_claims > 0),
  current_claims INTEGER DEFAULT 0 CHECK (current_claims >= 0),
  max_claims_per_user INTEGER CHECK (max_claims_per_user > 0),

  -- Type-specific discount fields
  minimum_purchase_amount NUMERIC CHECK (minimum_purchase_amount >= 0),
  minimum_quantity INTEGER CHECK (minimum_quantity > 0),
  buy_quantity INTEGER CHECK (buy_quantity > 0),
  get_quantity INTEGER CHECK (get_quantity > 0),
  get_discount_percentage NUMERIC CHECK (get_discount_percentage >= 0 AND get_discount_percentage <= 100),
  offer_parameters JSONB,

  -- Status and terms
  is_active BOOLEAN DEFAULT true,
  terms_conditions TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT check_title_length CHECK (char_length(title) >= 3),
  CONSTRAINT check_expiry_after_start CHECK (expiry_date > start_date),
  CONSTRAINT check_discounted_less_than_original CHECK (
    original_price IS NULL OR
    discounted_price IS NULL OR
    discounted_price < original_price
  ),
  CONSTRAINT check_percentage_discount_max CHECK (
    discount_type != 'percentage' OR
    discount_value <= 100
  ),
  CONSTRAINT check_minimum_purchase_fields CHECK (
    discount_type != 'minimum_purchase' OR
    minimum_purchase_amount IS NOT NULL
  ),
  CONSTRAINT check_quantity_discount_fields CHECK (
    discount_type != 'quantity_discount' OR
    minimum_quantity IS NOT NULL
  ),
  CONSTRAINT check_bogo_fields CHECK (
    discount_type != 'bogo' OR
    (buy_quantity IS NOT NULL AND get_quantity IS NOT NULL AND get_discount_percentage IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_superadmin_offers_business ON superadmin_offers(superadmin_business_id);
CREATE INDEX IF NOT EXISTS idx_superadmin_offers_active ON superadmin_offers(is_active, expiry_date);
CREATE INDEX IF NOT EXISTS idx_superadmin_offers_type ON superadmin_offers(discount_type);
CREATE INDEX IF NOT EXISTS idx_superadmin_offers_dates ON superadmin_offers(start_date, expiry_date);
CREATE INDEX IF NOT EXISTS idx_superadmin_offers_created_by ON superadmin_offers(created_by_admin);

-- Comments
COMMENT ON TABLE superadmin_offers IS 'Temporary table for demo offers created by superadmins. VIEW-ONLY: Users cannot claim these offers. Used for user acquisition and onboarding. Can be dropped without affecting production data.';
COMMENT ON COLUMN superadmin_offers.superadmin_business_id IS 'Reference to superadmin_businesses table (NOT main businesses table)';
COMMENT ON COLUMN superadmin_offers.current_claims IS 'Informational only - offers cannot actually be claimed';

-- =============================================================================
-- STEP 4: Create analytics tables (optional, for tracking engagement)
-- =============================================================================

CREATE TABLE IF NOT EXISTS superadmin_offer_views (
  id BIGSERIAL PRIMARY KEY,
  superadmin_offer_id UUID NOT NULL REFERENCES superadmin_offers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  viewed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_superadmin_views_offer ON superadmin_offer_views(superadmin_offer_id);
CREATE INDEX IF NOT EXISTS idx_superadmin_views_user ON superadmin_offer_views(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_superadmin_views_date ON superadmin_offer_views(viewed_at);

COMMENT ON TABLE superadmin_offer_views IS 'Tracks views of superadmin offers. Can be dropped without affecting production data.';

CREATE TABLE IF NOT EXISTS superadmin_offer_clicks (
  id BIGSERIAL PRIMARY KEY,
  superadmin_offer_id UUID NOT NULL REFERENCES superadmin_offers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  click_type TEXT, -- 'view_details', 'view_location', etc.
  clicked_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_superadmin_clicks_offer ON superadmin_offer_clicks(superadmin_offer_id);
CREATE INDEX IF NOT EXISTS idx_superadmin_clicks_user ON superadmin_offer_clicks(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_superadmin_clicks_date ON superadmin_offer_clicks(clicked_at);

COMMENT ON TABLE superadmin_offer_clicks IS 'Tracks clicks/interactions with superadmin offers. Can be dropped without affecting production data.';

-- =============================================================================
-- STEP 5: Update timestamp trigger (match existing pattern)
-- =============================================================================

-- Create or replace function for updating timestamps
CREATE OR REPLACE FUNCTION update_superadmin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for superadmin_businesses
DROP TRIGGER IF EXISTS set_superadmin_businesses_updated_at ON superadmin_businesses;
CREATE TRIGGER set_superadmin_businesses_updated_at
BEFORE UPDATE ON superadmin_businesses
FOR EACH ROW
EXECUTE FUNCTION update_superadmin_updated_at();

-- Trigger for superadmin_offers
DROP TRIGGER IF EXISTS set_superadmin_offers_updated_at ON superadmin_offers;
CREATE TRIGGER set_superadmin_offers_updated_at
BEFORE UPDATE ON superadmin_offers
FOR EACH ROW
EXECUTE FUNCTION update_superadmin_updated_at();

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify all tables were created
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'superadmin%'
ORDER BY table_name;

-- Verify is_superadmin column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'is_superadmin';

-- =============================================================================
-- ROLLBACK SCRIPT (for when ready to remove)
-- =============================================================================

-- IMPORTANT: Uncomment and run these when ready to remove superadmin system
--
-- -- Drop analytics tables first
-- DROP TABLE IF EXISTS superadmin_offer_clicks CASCADE;
-- DROP TABLE IF EXISTS superadmin_offer_views CASCADE;
--
-- -- Drop core superadmin tables
-- DROP TABLE IF EXISTS superadmin_offers CASCADE;
-- DROP TABLE IF EXISTS superadmin_businesses CASCADE;
--
-- -- Drop trigger function
-- DROP FUNCTION IF EXISTS update_superadmin_updated_at() CASCADE;
--
-- -- Remove superadmin flag from profiles
-- DROP INDEX IF EXISTS idx_profiles_is_superadmin;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS is_superadmin;
--
-- -- Verify cleanup
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name LIKE 'superadmin%';

-- =============================================================================
-- NOTES FOR DEVELOPERS
-- =============================================================================

-- 1. These tables are TEMPORARY and will be dropped after user acquisition phase
-- 2. Superadmin offers are VIEW-ONLY - users cannot claim them
-- 3. No foreign keys from main system to superadmin system (drop-safe design)
-- 4. All superadmin references use ON DELETE SET NULL or CASCADE to prevent issues
-- 5. Use feature flag ENABLE_SUPERADMIN_OFFERS in code to toggle functionality
-- 6. When main businesses sign up, they start fresh (no data migration from superadmin tables)
