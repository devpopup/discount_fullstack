-- SQL script to create analytics tables for tracking offer views and clicks
-- Run this in your Supabase SQL editor or database client

-- Create offer_views table for tracking when offers are viewed
CREATE TABLE IF NOT EXISTS public.offer_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable for anonymous views
    ip_address TEXT, -- For tracking anonymous views
    user_agent TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create offer_clicks table for tracking when offers are clicked
CREATE TABLE IF NOT EXISTS public.offer_clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable for anonymous clicks
    ip_address TEXT, -- For tracking anonymous clicks
    user_agent TEXT,
    click_type TEXT DEFAULT 'view_details', -- 'view_details', 'claim', 'website', etc.
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_offer_views_offer_id ON public.offer_views(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_views_viewed_at ON public.offer_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_offer_views_user_id ON public.offer_views(user_id);

CREATE INDEX IF NOT EXISTS idx_offer_clicks_offer_id ON public.offer_clicks(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_clicks_clicked_at ON public.offer_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_offer_clicks_user_id ON public.offer_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_offer_clicks_type ON public.offer_clicks(click_type);

-- Add RLS policies for security
ALTER TABLE public.offer_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_clicks ENABLE ROW LEVEL SECURITY;

-- Policy for businesses to view their own analytics
CREATE POLICY "Businesses can view their offer analytics" ON public.offer_views
    FOR SELECT 
    USING (
        offer_id IN (
            SELECT o.id FROM public.offers o
            JOIN public.businesses b ON o.business_id = b.id
            WHERE b.user_id = auth.uid()
        )
    );

CREATE POLICY "Businesses can view their offer click analytics" ON public.offer_clicks
    FOR SELECT 
    USING (
        offer_id IN (
            SELECT o.id FROM public.offers o
            JOIN public.businesses b ON o.business_id = b.id
            WHERE b.user_id = auth.uid()
        )
    );

-- Policy for inserting analytics data (allow all authenticated users and anonymous)
CREATE POLICY "Anyone can track offer views" ON public.offer_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can track offer clicks" ON public.offer_clicks
    FOR INSERT WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE public.offer_views IS 'Tracks when offers are viewed by users';
COMMENT ON TABLE public.offer_clicks IS 'Tracks when offers are clicked by users';

COMMENT ON COLUMN public.offer_views.user_id IS 'User who viewed the offer (nullable for anonymous views)';
COMMENT ON COLUMN public.offer_views.ip_address IS 'IP address for anonymous view tracking';

COMMENT ON COLUMN public.offer_clicks.click_type IS 'Type of click: view_details, claim, website, etc.';
COMMENT ON COLUMN public.offer_clicks.user_id IS 'User who clicked the offer (nullable for anonymous clicks)';
COMMENT ON COLUMN public.offer_clicks.ip_address IS 'IP address for anonymous click tracking';