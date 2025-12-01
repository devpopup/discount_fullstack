# app/schemas/customer.py - Updated with enhanced claim support
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
import uuid

from app.schemas.business import (
    ProductResponse, OfferResponse, BusinessResponse, CategoryResponse
)

# ============================================================================
# ENHANCED SEARCH RESPONSES
# ============================================================================

class BusinessSummary(BaseModel):
    """Simplified business info for search results"""
    business_name: str
    is_verified: bool
    avatar_url: Optional[str] = None


class ProductSearchResponse(ProductResponse):
    """Product response with business info for search"""
    business: Optional[BusinessSummary] = None


class OfferSearchResponse(OfferResponse):
    """Offer response with business info for search"""
    business: Optional[BusinessSummary] = None


# ============================================================================
# ENHANCED CLAIM SCHEMAS
# ============================================================================

class ClaimOfferRequest(BaseModel):
    """Request schema for claiming an offer"""
    claim_type: str = Field(..., pattern="^(online|in_store)$", description="Type of claim: 'online' or 'in_store'")
    redirect_url: Optional[str] = Field(None, description="Optional redirect URL for online claims")
    quantity: Optional[int] = Field(1, ge=1, description="Quantity of items to claim (default: 1)")


class ClaimInfo(BaseModel):
    """Information about how to use a claim"""
    claim_id: str
    claim_type: str
    qr_code: Optional[str] = None
    verification_url: Optional[str] = None
    instructions: str
    manual_entry_text: Optional[str] = None


# ============================================================================
# SAVED OFFERS SCHEMAS
# ============================================================================

class SavedOfferBase(BaseModel):
    user_id: uuid.UUID
    offer_id: uuid.UUID
    saved_at: datetime


class SavedOfferResponse(SavedOfferBase):
    model_config = ConfigDict(from_attributes=True)

    id: int  # bigint in database
    offers: OfferResponse  # Full offer details


class SavedOfferListResponse(BaseModel):
    saved_offers: List[SavedOfferResponse]
    total: int
    page: int
    size: int
    has_next: bool


# ============================================================================
# ENHANCED CLAIMED OFFERS SCHEMAS
# ============================================================================

class ClaimedOfferBase(BaseModel):
    user_id: uuid.UUID
    offer_id: uuid.UUID
    claimed_at: datetime
    is_redeemed: bool = False
    redeemed_at: Optional[datetime] = None
    redemption_notes: Optional[str] = None
    
    # Enhanced claim fields
    claim_type: str = "in_store"
    unique_claim_id: Optional[str] = None
    qr_code_url: Optional[str] = None
    merchant_redirect_url: Optional[str] = None


class ClaimedOfferResponse(ClaimedOfferBase):
    model_config = ConfigDict(from_attributes=True)

    id: int  # bigint in database
    offers: OfferResponse  # Full offer details
    claim_info: Optional[ClaimInfo] = None  # Processed claim information for display


class EnhancedClaimedOfferResponse(BaseModel):
    """Enhanced response with claim display information"""
    model_config = ConfigDict(from_attributes=True)

    # Basic claim info
    id: int  # bigint in database
    user_id: uuid.UUID
    offer_id: uuid.UUID
    claimed_at: datetime
    is_redeemed: bool
    redeemed_at: Optional[datetime] = None
    redemption_notes: Optional[str] = None
    
    # Enhanced claim fields
    claim_type: str
    unique_claim_id: Optional[str] = None
    qr_code_url: Optional[str] = None
    merchant_redirect_url: Optional[str] = None
    
    # Related offer details
    offer: OfferResponse
    
    # Processed claim information for easy frontend consumption
    claim_display: ClaimInfo


class ClaimedOfferListResponse(BaseModel):
    claimed_offers: List[EnhancedClaimedOfferResponse]
    total: int
    page: int
    size: int
    has_next: bool


# ============================================================================
# CLAIM VERIFICATION SCHEMAS (for future merchant endpoints)
# ============================================================================

class ClaimVerificationRequest(BaseModel):
    """Request to verify a claim"""
    claim_identifier: str = Field(..., description="Claim ID or QR code content")
    verification_type: str = Field(..., pattern="^(claim_id|qr_code)$")


class ClaimVerificationResponse(BaseModel):
    """Response for claim verification"""
    is_valid: bool
    claim_id: Optional[str] = None
    offer_title: Optional[str] = None
    customer_name: Optional[str] = None
    business_name: Optional[str] = None
    claimed_at: Optional[datetime] = None
    is_redeemed: bool = False
    redeemed_at: Optional[datetime] = None
    discount_info: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None


class RedeemClaimRequest(BaseModel):
    """Request to redeem a claim"""
    claim_id: str
    redemption_notes: Optional[str] = None


class RedeemClaimResponse(BaseModel):
    """Response for claim redemption"""
    success: bool
    message: str
    redeemed_at: Optional[datetime] = None
    claim_details: Optional[Dict[str, Any]] = None


# ============================================================================
# QR CODE SPECIFIC SCHEMAS
# ============================================================================

class QRCodeResponse(BaseModel):
    """Response for QR code generation"""
    qr_code_data_url: str = Field(..., description="Base64 encoded QR code image")
    verification_url: str = Field(..., description="URL that the QR code points to")
    claim_id: str = Field(..., description="The unique claim ID")
    instructions: str = Field(..., description="Instructions for using the QR code")


# ============================================================================
# OFFER STATUS SCHEMA (Updated)
# ============================================================================

class OfferStatus(BaseModel):
    offer_id: str
    is_available: bool
    is_saved: bool
    is_claimed: bool
    can_claim: bool
    reason: Optional[str] = None
    claimed_info: Optional[ClaimInfo] = None  # Include claim info if already claimed


# ============================================================================
# SEARCH FILTERS SCHEMA
# ============================================================================

class ProductFilter(BaseModel):
    category_id: Optional[str] = None
    business_id: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    search_query: Optional[str] = None


class OfferFilter(BaseModel):
    category_id: Optional[str] = None
    business_id: Optional[str] = None
    discount_type: Optional[str] = None
    min_discount: Optional[float] = None
    max_discount: Optional[float] = None
    search_query: Optional[str] = None


# ============================================================================
# ANALYTICS/STATS SCHEMAS (Future Use)
# ============================================================================

class CustomerStats(BaseModel):
    """Customer activity statistics"""
    total_saved_offers: int
    total_claimed_offers: int
    total_redeemed_offers: int
    total_savings: Decimal
    favorite_categories: List[str]
    recent_activity_count: int
    
    # Enhanced claim stats
    online_claims: int = 0
    in_store_claims: int = 0
    pending_redemptions: int = 0


class OfferStats(BaseModel):
    """Offer popularity statistics"""
    total_views: int = 0
    total_saves: int = 0
    total_claims: int = 0
    online_claims: int = 0
    in_store_claims: int = 0
    redemption_rate: float = 0.0
    save_to_claim_ratio: float = 0.0
    popularity_score: float = 0.0


# ============================================================================
# RECOMMENDATION SCHEMAS (Future Use)
# ============================================================================

class RecommendationReason(BaseModel):
    type: str  # "category_preference", "business_preference", "similar_users", etc.
    description: str
    confidence_score: float


class RecommendedOffer(BaseModel):
    offer: OfferResponse
    reasons: List[RecommendationReason]
    relevance_score: float


class RecommendationResponse(BaseModel):
    recommended_offers: List[RecommendedOffer]
    total: int
    recommendation_type: str  # "personalized", "trending", "category_based", etc.


# ============================================================================
# DISCOVERY SCHEMAS
# ============================================================================

class TrendingOffer(BaseModel):
    """Trending offer with popularity metrics"""
    offer: OfferResponse
    claim_count: int
    trend_score: float
    days_active: int


class ExpiringOffer(BaseModel):
    """Offer expiring soon with urgency info"""
    offer: OfferResponse
    hours_remaining: float
    urgency_level: str  # "low", "medium", "high", "critical"


class NearbyBusiness(BaseModel):
    """Business with location context"""
    business: BusinessResponse
    distance_km: Optional[float] = None
    estimated_travel_time: Optional[str] = None


# ============================================================================
# USER PREFERENCES SCHEMAS (Future Use)
# ============================================================================

class CategoryPreference(BaseModel):
    category_id: uuid.UUID
    category_name: str
    preference_score: float  # 0.0 to 1.0
    interaction_count: int


class UserPreferences(BaseModel):
    user_id: uuid.UUID
    preferred_categories: List[CategoryPreference]
    preferred_discount_types: List[str]
    min_discount_threshold: float
    max_travel_distance: Optional[float] = None
    notification_preferences: Dict[str, bool] = {}
    default_claim_type: str = "in_store"  # User's preferred claim type
    updated_at: datetime


# ============================================================================
# NOTIFICATION SCHEMAS (Future Use)
# ============================================================================

class NotificationSettings(BaseModel):
    new_offers_in_categories: bool = True
    offers_expiring_soon: bool = True
    price_drops: bool = True
    nearby_businesses: bool = False
    weekly_digest: bool = True
    claim_reminders: bool = True  # Remind about unredeemed claims


class Notification(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    type: str  # "new_offer", "expiring_soon", "price_drop", "claim_reminder", etc.
    title: str
    message: str
    data: Dict[str, Any] = {}  # Additional context data
    is_read: bool = False
    created_at: datetime


# ============================================================================
# INTERACTION TRACKING SCHEMAS (Future Use)
# ============================================================================

class OfferInteraction(BaseModel):
    """Track user interactions with offers"""
    user_id: uuid.UUID
    offer_id: uuid.UUID
    interaction_type: str  # "view", "save", "unsave", "claim", "share", "redeem"
    created_at: datetime
    context: Optional[Dict[str, Any]] = None  # Search query, source page, etc.


class ClaimInteraction(BaseModel):
    """Track claim-specific interactions"""
    claim_id: str
    interaction_type: str  # "qr_generated", "qr_scanned", "manual_entry", "redeemed"
    created_at: datetime
    metadata: Optional[Dict[str, Any]] = None


class SearchAnalytics(BaseModel):
    """Track search behavior"""
    user_id: Optional[uuid.UUID] = None  # None for anonymous users
    search_query: str
    filters_applied: Dict[str, Any]
    results_count: int
    clicked_results: List[str] = []  # IDs of offers/products clicked
    search_session_id: str
    created_at: datetime