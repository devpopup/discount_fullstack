-- Performance indexes for common query patterns
-- Run this migration in the Supabase SQL editor

-- Offers: active + date range filtering (used by ALL list endpoints)
CREATE INDEX IF NOT EXISTS idx_offers_active_dates ON offers(is_active, start_date, expiry_date);

-- Offers: business lookup
CREATE INDEX IF NOT EXISTS idx_offers_business_id ON offers(business_id);

-- Offers: product lookup
CREATE INDEX IF NOT EXISTS idx_offers_product_id ON offers(product_id) WHERE product_id IS NOT NULL;

-- Offers: trending sort
CREATE INDEX IF NOT EXISTS idx_offers_current_claims ON offers(current_claims DESC) WHERE is_active = true;

-- Saved offers: user+offer composite (for favorite lookups)
CREATE INDEX IF NOT EXISTS idx_saved_offers_user_offer ON saved_offers(user_id, offer_id);

-- Products: business lookup
CREATE INDEX IF NOT EXISTS idx_products_business_id ON products(business_id);
