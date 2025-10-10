# PopupReach Development Guide - Automated Geofenced Advertising

## Project Overview

PopupReach is transforming from a direct notification platform to a sophisticated **automated geofenced advertising system**. We act as the "middle layer" that converts business offers into targeted ads across Google and Meta platforms.

### Core Concept
- **Businesses** → Create offers inside PopupReach
- **PopupReach** → Automatically pushes offers into geofenced ad campaigns  
- **Customers nearby** → See offers in Google Maps, Instagram, Facebook (feels like "notifications")

## Current System Architecture

### Existing Components
- **Frontend**: Next.js application with business dashboard
- **Backend**: FastAPI (Python) with PostgreSQL database
- **Authentication**: Business and customer auth systems
- **Offer Management**: Businesses can create and manage offers
- **Location Services**: Google Places API integration for business locations

### Current Business Flow
1. Business signs up and creates account
2. Business creates offers through dashboard
3. Offers are stored in database
4. Currently no automated ad distribution (this is what we're building)

## New Development Goals

### Primary Objective
Build an automated system that takes business offers and converts them into geofenced advertising campaigns on Google Ads and Meta Ads platforms.

### Target User Experience
1. **Business**: "Create offer → Select radius → Go live" (under 2 minutes)
2. **Customer**: Sees relevant offers in Google Maps, Instagram, Facebook when near businesses

## Technical Implementation Roadmap

### Phase 1: Foundation & API Setup (Weeks 1-3)

#### Google Ads Integration
- [ ] Set up Google Ads Developer account and API access
- [ ] Implement Google Ads API authentication (OAuth 2.0)
- [ ] Build campaign creation service for Google Local Ads
- [ ] Add location targeting using geofence coordinates
- [ ] Test basic campaign creation and management

**Key APIs**: Google Ads API v16, Google My Business API

#### Meta Ads Integration  
- [ ] Set up Meta for Developers account and app
- [ ] Implement Facebook Marketing API authentication
- [ ] Build campaign creation service for Facebook/Instagram ads
- [ ] Add location-based ad sets with radius targeting
- [ ] Test basic Meta campaign creation

**Key APIs**: Facebook Marketing API v19.0

#### Enhanced Offer Creation
- [ ] Modify existing offer creation to include:
  - Geofence radius selector (100m, 500m, 1km, 2km)
  - Time window controls (start/end times)  
  - Budget allocation options ($10-100/day)
  - Campaign targeting preferences

### Phase 2: Core Automation Engine (Weeks 4-6)

#### Campaign Auto-Generation
- [ ] Build offer-to-ad-campaign conversion system
- [ ] Implement automatic ad copy generation from offer details
- [ ] Create geofence coordinate mapping system
- [ ] Add campaign lifecycle management (start/pause/end)

#### Attribution & Tracking
- [ ] Implement UTM parameter generation for all campaigns
- [ ] Set up conversion tracking and analytics
- [ ] Build attribution dashboard showing:
  - Campaign impressions and clicks
  - Estimated foot traffic
  - ROI calculations
  - Cost per campaign

### Phase 3: Business Dashboard Enhancement (Weeks 7-8)

#### Enhanced Analytics Interface
- [ ] Real-time campaign performance reporting
- [ ] Foot traffic attribution estimates  
- [ ] Campaign comparison and insights
- [ ] Business ROI dashboard

#### Advanced Campaign Controls
- [ ] A/B testing for ad variations
- [ ] Advanced scheduling and recurring offers
- [ ] Competitor location targeting options
- [ ] Custom audience targeting

## Database Schema Updates Required

### New Tables Needed

```sql
-- Ad campaigns table
CREATE TABLE ad_campaigns (
    id SERIAL PRIMARY KEY,
    offer_id INTEGER REFERENCES offers(id),
    business_id INTEGER REFERENCES businesses(id),
    google_campaign_id VARCHAR(255),
    meta_campaign_id VARCHAR(255),
    campaign_status VARCHAR(50),
    daily_budget DECIMAL(10,2),
    geofence_radius INTEGER,
    geofence_lat DECIMAL(10,8),
    geofence_lng DECIMAL(11,8),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaign analytics table  
CREATE TABLE campaign_analytics (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES ad_campaigns(id),
    platform VARCHAR(50), -- 'google' or 'meta'
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    spend DECIMAL(10,2) DEFAULT 0,
    estimated_visits INTEGER DEFAULT 0,
    date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Business ad accounts table
CREATE TABLE business_ad_accounts (
    id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(id),
    google_ads_account_id VARCHAR(255),
    meta_ads_account_id VARCHAR(255),
    google_access_token TEXT,
    meta_access_token TEXT,
    account_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Updates to Existing Tables

```sql
-- Add geofencing fields to offers table
ALTER TABLE offers ADD COLUMN geofence_enabled BOOLEAN DEFAULT false;
ALTER TABLE offers ADD COLUMN geofence_radius INTEGER DEFAULT 1000; -- meters
ALTER TABLE offers ADD COLUMN auto_advertise BOOLEAN DEFAULT false;
ALTER TABLE offers ADD COLUMN daily_ad_budget DECIMAL(10,2) DEFAULT 20.00;
```

## API Endpoints to Develop

### Campaign Management Endpoints

```python
# New endpoints needed in FastAPI backend

POST /api/campaigns/create
# Auto-create Google + Meta campaigns from offer

GET /api/campaigns/{campaign_id}/analytics  
# Get campaign performance data

PUT /api/campaigns/{campaign_id}/status
# Pause/resume/stop campaigns

POST /api/campaigns/{campaign_id}/optimize
# Apply automatic optimizations

GET /api/business/{business_id}/campaigns
# List all campaigns for a business

POST /api/ad-accounts/connect
# Connect business Google/Meta ad accounts
```

### Frontend Components to Build

```typescript
// New React components needed

// Enhanced offer creation with advertising options
<OfferCreationForm />
  - GeofenceRadiusSelector
  - BudgetAllocationControls  
  - CampaignTimingControls
  - AdPreviewGenerator

// Campaign management dashboard
<CampaignDashboard />
  - ActiveCampaignsList
  - CampaignAnalytics
  - PerformanceCharts
  - ROICalculator

// Ad account connection flow
<AdAccountSetup />
  - GoogleAdsConnector
  - MetaAdsConnector  
  - AccountVerification
```

## Business Model & Pricing

### Subscription Tiers
- **Starter**: $100/month - 5 active campaigns, basic analytics
- **Growth**: $200/month - 15 active campaigns, advanced analytics  
- **Pro**: $300/month - Unlimited campaigns, competitor targeting, A/B testing

### Success Metrics
- **Target**: 50+ businesses by Week 12
- **Revenue Goal**: $5,000+ MRR
- **Campaign Performance**: Demonstrable ROI for participating businesses

## Technical Considerations

### API Rate Limits & Costs
- **Google Ads API**: Monitor quota usage and implement rate limiting
- **Meta Marketing API**: Respect API call limits and batch requests
- **Cost Management**: Track ad spend and implement budget controls

### Security & Compliance  
- **OAuth Implementation**: Secure token storage and refresh mechanisms
- **PCI Compliance**: For handling business payment information
- **Data Privacy**: GDPR/CCPA compliance for customer data

### Scalability Planning
- **Database Optimization**: Index campaign and analytics tables
- **Caching Strategy**: Redis for frequently accessed campaign data  
- **Background Jobs**: Queue system for campaign creation and optimization

## Integration Testing Strategy

### Testing Priorities
1. **Google Ads API Integration**: Test campaign creation, targeting, budget management
2. **Meta Ads API Integration**: Test Facebook/Instagram campaign creation  
3. **Geofence Accuracy**: Verify location targeting precision
4. **Attribution Tracking**: Ensure accurate performance measurement
5. **End-to-End Flow**: Business creates offer → ads go live → analytics update

### Beta Testing Plan
- **Phase 1**: 10 existing PopupReach businesses
- **Phase 2**: 15 new businesses recruited specifically for ad testing  
- **Success Criteria**: 80%+ businesses see measurable foot traffic increase

## Post-Launch Optimization

### Immediate Improvements (Weeks 13-16)
- [ ] Machine learning for automatic bid optimization
- [ ] Advanced audience targeting based on business type
- [ ] Seasonal campaign optimization
- [ ] Enhanced attribution modeling

### Future Expansion (Phase 6+)
- [ ] Programmatic advertising networks integration
- [ ] Own customer mobile app with push notifications
- [ ] Advanced competitor analysis and targeting
- [ ] Multi-location business management

## Success Definition

By the end of Phase 5 (Week 12), we should have:
- ✅ Fully automated Google + Meta ad campaign creation
- ✅ 50+ businesses actively using the platform
- ✅ Proven ROI for participating businesses  
- ✅ $5,000+ monthly recurring revenue
- ✅ Technical foundation ready for programmatic expansion

## Getting Started Checklist

### Immediate Actions Required
- [ ] Set up Google Ads Developer account
- [ ] Set up Meta for Developers account  
- [ ] Create API credentials for both platforms
- [ ] Set up development/testing ad accounts
- [ ] Begin implementing OAuth flows for both APIs

### Development Environment Setup
- [ ] Add Google Ads API and Facebook Marketing API SDKs to backend
- [ ] Set up environment variables for API credentials
- [ ] Create development databases with new schema
- [ ] Set up testing framework for API integrations

This guide should provide Claude Dev with comprehensive context for building the automated geofenced advertising system while leveraging your existing PopupReach infrastructure.