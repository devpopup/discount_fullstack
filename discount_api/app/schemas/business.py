# app/schemas/business.py
from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator
from typing import Optional, Dict, Any, List, Union
from datetime import datetime
from decimal import Decimal
import uuid


# ============================================================================
# CATEGORY SCHEMAS
# ============================================================================

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int  # Changed from UUID to int
    created_at: datetime


# ============================================================================
# BUSINESS SCHEMAS
# ============================================================================

class BusinessBase(BaseModel):
    business_name: str = Field(..., min_length=2, max_length=200)
    business_description: Optional[str] = Field(None, max_length=1000)
    business_address: str = Field(..., min_length=5, max_length=500)
    phone_number: str = Field(..., min_length=10, max_length=20)
    business_website: Optional[str] = None
    avatar_url: Optional[str] = None
    business_hours: Optional[Dict[str, Any]] = None
    category_id: int = Field(..., description="Business category is required")



class BusinessCreate(BusinessBase):
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    formatted_address: Optional[str] = Field(None, max_length=500)
    place_id: Optional[str] = Field(None, max_length=255)
    address_components: Optional[Union[List[Dict[str, Any]], Dict[str, Any]]] = None
    
    @field_validator('business_website')
    @classmethod
    def validate_website(cls, v):
        if v and not v.startswith(('http://', 'https://')):
            raise ValueError('Website must start with http:// or https://')
        return v


class BusinessUpdate(BaseModel):
    business_name: Optional[str] = Field(None, min_length=2, max_length=200)
    business_description: Optional[str] = Field(None, max_length=1000)
    business_address: Optional[str] = Field(None, min_length=5, max_length=500)
    phone_number: Optional[str] = Field(None, min_length=10, max_length=20)
    business_website: Optional[str] = None
    avatar_url: Optional[str] = None
    business_hours: Optional[Dict[str, Any]] = None
    category_id: Optional[int] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    formatted_address: Optional[str] = Field(None, max_length=500)
    place_id: Optional[str] = Field(None, max_length=255)
    address_components: Optional[Union[List[Dict[str, Any]], Dict[str, Any]]] = None

    @field_validator('business_website')
    @classmethod
    def validate_website(cls, v):
        if v and not v.startswith(('http://', 'https://')):
            raise ValueError('Website must start with http:// or https://')
        return v


class BusinessResponse(BusinessBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    formatted_address: Optional[str] = None
    place_id: Optional[str] = None
    address_components: Optional[Union[List[Dict[str, Any]], Dict[str, Any]]] = None
    category: Optional[CategoryResponse] = None


# ============================================================================
# PRODUCT SCHEMAS
# ============================================================================

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    image_url: Optional[str] = None
    category_id: Optional[int] = None  # Changed from UUID to int
    stock_quantity: Optional[int] = Field(None, ge=0)
    tags: Optional[str] = Field(None, max_length=500)
    is_active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    price: Optional[Decimal] = Field(None, ge=0)
    image_url: Optional[str] = None
    category_id: Optional[int] = None  # Changed from UUID to int
    stock_quantity: Optional[int] = Field(None, ge=0)
    tags: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    business_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None
    business: Optional[Dict[str, Any]] = None
    
    @field_validator('price', mode='before')
    @classmethod
    def convert_decimal_to_float(cls, v):
        """Convert Decimal to float for JSON serialization"""
        if isinstance(v, Decimal):
            return float(v)
        return v


# ============================================================================
# OFFER SCHEMAS
# ============================================================================

class OfferBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    discount_type: str = Field(..., pattern="^(percentage|fixed)$")
    discount_value: float = Field(..., gt=0)  # Changed from Decimal to float
    original_price: Optional[float] = Field(None, ge=0)  # Changed from Decimal to float
    discounted_price: Optional[float] = Field(None, ge=0)  # Changed from Decimal to float
    start_date: datetime
    expiry_date: datetime
    max_claims: Optional[int] = Field(None, gt=0)
    max_claims_per_user: Optional[int] = Field(None, gt=0, description="Maximum units a single user can claim for this offer")
    min_claims_per_customer: Optional[int] = Field(None, gt=0, description="Minimum units required per claim")
    terms_conditions: Optional[str] = Field(None, max_length=2000)
    product_id: Optional[uuid.UUID] = None

    @field_validator('discount_value')
    @classmethod
    def validate_discount_value(cls, v, info):
        if info.data.get('discount_type') == 'percentage' and v > 100:
            raise ValueError('Percentage discount cannot exceed 100%')
        return v

    @field_validator('expiry_date')
    @classmethod
    def validate_dates(cls, v, info):
        if 'start_date' in info.data and v <= info.data['start_date']:
            raise ValueError('Expiry date must be after start date')
        return v

    @field_validator('discounted_price')
    @classmethod
    def validate_discounted_price(cls, v, info):
        original_price = info.data.get('original_price')
        if v is not None and original_price is not None and v >= original_price:
            raise ValueError('Discounted price must be less than original price')
        return v


class OfferCreate(OfferBase):
    pass


class OfferUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    discount_type: Optional[str] = Field(None, pattern="^(percentage|fixed)$")
    discount_value: Optional[float] = Field(None, gt=0)  # Changed from Decimal to float
    original_price: Optional[float] = Field(None, ge=0)  # Changed from Decimal to float
    discounted_price: Optional[float] = Field(None, ge=0)  # Changed from Decimal to float
    start_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    max_claims: Optional[int] = Field(None, gt=0)
    max_claims_per_user: Optional[int] = Field(None, gt=0, description="Maximum units a single user can claim for this offer")
    min_claims_per_customer: Optional[int] = Field(None, gt=0, description="Minimum units required per claim")
    terms_conditions: Optional[str] = Field(None, max_length=2000)
    product_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None


class OfferResponse(OfferBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    business_id: uuid.UUID
    current_claims: int
    is_active: bool
    created_at: datetime
    product: Optional[ProductResponse] = None
    
    @field_validator('discount_value', 'original_price', 'discounted_price', mode='before')
    @classmethod
    def convert_decimal_to_float(cls, v):
        """Convert Decimal to float for JSON serialization"""
        if isinstance(v, Decimal):
            return float(v)
        return v


# ============================================================================
# LIST RESPONSES
# ============================================================================

class BusinessListResponse(BaseModel):
    businesses: List[BusinessResponse]
    total: int
    page: int
    size: int
    has_next: bool


class ProductListResponse(BaseModel):
    products: List[ProductResponse]
    total: int
    page: int
    size: int
    has_next: bool


class OfferListResponse(BaseModel):
    offers: List[OfferResponse]
    total: int
    page: int
    size: int
    has_next: bool


# ============================================================================
# BUSINESS USER REGISTRATION
# ============================================================================

# In discount_api/app/schemas/business.py
class BusinessUserRegistration(BaseModel):
    """Combined user + business registration"""
    # User fields
    email: str = Field(..., description="User email")
    password: str = Field(..., min_length=6, description="User password")
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    
    # Business fields
    business_name: str = Field(..., min_length=2, max_length=200)
    business_description: Optional[str] = Field(None, max_length=1000)
    business_address: str = Field(..., min_length=5, max_length=500)
    business_phone: str = Field(..., min_length=10, max_length=20)
    business_website: Optional[str] = None
    avatar_url: Optional[str] = None
    business_hours: Optional[Dict[str, Any]] = None
    category_id: int = Field(..., description="Business category is required")
    
    # Location fields - SIMPLIFIED
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    formatted_address: Optional[str] = None
    place_id: Optional[str] = None
    address_components: Optional[Union[List[Dict[str, Any]], Dict[str, Any]]] = None
    
    # Handle phone_number mapping
    phone_number: Optional[str] = None

    @field_validator('business_website')
    @classmethod
    def validate_website(cls, v):
        if not v or str(v).strip() == "":
            return None
        
        v = str(v).strip()
        if not v.startswith(('http://', 'https://')):
            return f"https://{v}"
        return v

    # Simplified validator
    @field_validator('address_components', mode='before')
    @classmethod
    def validate_address_components(cls, v):
        # Just return None for anything that's not a proper dict
        if isinstance(v, dict):
            return v
        return None
        
# ============================================================================
# GENERIC RESPONSES
# ============================================================================

class MessageResponse(BaseModel):
    message: str
    success: bool = True


# Add these schemas to your existing discount_api/app/schemas/business.py file

# ============================================================================
# REDEMPTION SCHEMAS
# ============================================================================

class ClaimVerificationRequest(BaseModel):
    """Request to verify a claim for redemption"""
    claim_identifier: str = Field(..., min_length=1, description="Claim ID or QR code content")
    verification_type: str = Field("claim_id", pattern="^(claim_id|qr_code)$", description="Type of identifier")


class CustomerInfo(BaseModel):
    """Customer information for redemption"""
    name: str
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class DiscountInfo(BaseModel):
    """Discount information for display"""
    discount_type: str
    discount_value: float
    discount_text: str
    original_price: Optional[float] = None
    discounted_price: Optional[float] = None
    savings_amount: float


class ClaimDetails(BaseModel):
    """Detailed information about a claim"""
    id: uuid.UUID
    claim_id: str
    claim_type: str
    claimed_at: datetime
    customer: CustomerInfo
    offer: Dict[str, Any]  # Simplified offer info
    discount_info: DiscountInfo


class ClaimVerificationResponse(BaseModel):
    """Response for claim verification"""
    is_valid: bool
    claim_id: Optional[str] = None
    claim_details: Optional[ClaimDetails] = None
    error_message: Optional[str] = None
    error_code: Optional[str] = None
    redeemed_at: Optional[datetime] = None
    redemption_notes: Optional[str] = None


class RedemptionRequest(BaseModel):
    """Request to complete a redemption"""
    claim_id: str = Field(..., min_length=1)
    redemption_notes: Optional[str] = Field(None, max_length=500)


class RedemptionDetails(BaseModel):
    """Details about a completed redemption"""
    claim_id: str
    redeemed_at: datetime
    customer_name: str
    customer_email: Optional[str] = None
    offer_title: str
    business_name: str
    redemption_notes: Optional[str] = None


class RedemptionResponse(BaseModel):
    """Response for redemption completion"""
    success: bool
    message: str
    redemption_details: Optional[RedemptionDetails] = None
    error_code: Optional[str] = None


class RedemptionHistoryItem(BaseModel):
    """Single item in redemption history"""
    id: uuid.UUID
    claim_id: Optional[str] = None
    claim_type: str
    customer: CustomerInfo
    offer: Dict[str, Any]
    claimed_at: datetime
    is_redeemed: bool
    redeemed_at: Optional[datetime] = None
    redemption_notes: Optional[str] = None


class RedemptionSummary(BaseModel):
    """Summary statistics for redemptions"""
    total_claims: int
    redeemed_claims: int
    pending_claims: int
    total_savings_provided: float
    redemption_rate: float


class RedemptionPagination(BaseModel):
    """Pagination info for redemption history"""
    page: int
    limit: int
    total: int
    total_pages: int
    has_next: bool
    has_prev: bool


class RedemptionHistoryResponse(BaseModel):
    """Response for redemption history"""
    redemptions: List[RedemptionHistoryItem]
    pagination: RedemptionPagination
    summary: RedemptionSummary


class DailyRedemptionStats(BaseModel):
    """Daily statistics for chart display"""
    date: str
    claims: int
    redemptions: int


class ClaimTypeStats(BaseModel):
    """Statistics by claim type"""
    in_store: int = 0
    online: int = 0


class RedemptionStatsResponse(BaseModel):
    """Comprehensive redemption statistics"""
    period_days: int
    date_range: Dict[str, str]
    total_claims: int
    total_redemptions: int
    pending_redemptions: int
    redemption_rate: float
    total_savings_provided: float
    daily_breakdown: List[DailyRedemptionStats]
    claim_types: ClaimTypeStats


# ============================================================================
# QR CODE AND VERIFICATION SCHEMAS
# ============================================================================

class QRCodeGenerationRequest(BaseModel):
    """Request to generate QR code for a claim"""
    claim_id: str = Field(..., min_length=1)
    base_url: Optional[str] = None


class QRCodeResponse(BaseModel):
    """Response with QR code data"""
    claim_id: str
    qr_code_data_url: str
    verification_url: str
    instructions: str
    manual_entry_text: str


class ClaimStatusInfo(BaseModel):
    """Status information for a claim"""
    status: str  # active, redeemed, expired, expiring_soon
    status_text: str
    status_color: str
    action_available: bool
    is_redeemed: bool
    claimed_at: datetime
    redeemed_at: Optional[datetime] = None
    hours_since_claim: float
    time_until_expiry: Optional[float] = None
    redemption_notes: Optional[str] = None


# ============================================================================
# RECEIPT AND AUDIT SCHEMAS
# ============================================================================

class RedemptionReceipt(BaseModel):
    """Receipt data for a redemption"""
    receipt_id: str
    redemption_date: datetime
    business: Dict[str, Any]
    customer: CustomerInfo
    offer: Dict[str, Any]
    discount: DiscountInfo
    claim: Dict[str, Any]
    generated_at: datetime


class RedemptionAuditLog(BaseModel):
    """Audit log entry for redemption tracking"""
    id: uuid.UUID
    action: str  # verify, redeem, error
    claim_id: str
    business_id: uuid.UUID
    user_id: uuid.UUID  # Business user who performed action
    details: Dict[str, Any]
    timestamp: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


# ============================================================================
# BULK OPERATIONS SCHEMAS (Future Use)
# ============================================================================

class BulkRedemptionRequest(BaseModel):
    """Request for bulk redemption operations"""
    claim_ids: List[str] = Field(..., min_items=1, max_items=50)
    redemption_notes: Optional[str] = None


class BulkRedemptionResult(BaseModel):
    """Result for a single claim in bulk operation"""
    claim_id: str
    success: bool
    message: str
    error_code: Optional[str] = None


class BulkRedemptionResponse(BaseModel):
    """Response for bulk redemption operations"""
    total_processed: int
    successful_redemptions: int
    failed_redemptions: int
    results: List[BulkRedemptionResult]


# ============================================================================
# ERROR RESPONSE SCHEMAS
# ============================================================================

class RedemptionErrorResponse(BaseModel):
    """Standardized error response for redemption operations"""
    error: bool = True
    error_code: str
    error_message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.now)
    request_id: Optional[str] = None


# ============================================================================
# WEBHOOK SCHEMAS (Future Use)
# ============================================================================

class RedemptionWebhookPayload(BaseModel):
    """Webhook payload for redemption events"""
    event_type: str  # claim.redeemed, claim.verified, claim.expired
    event_id: uuid.UUID
    timestamp: datetime
    business_id: uuid.UUID
    claim_id: str
    offer_id: uuid.UUID
    customer_id: uuid.UUID
    data: Dict[str, Any]


# ============================================================================
# ANALYTICS SCHEMAS (Future Use)
# ============================================================================

class RedemptionTrends(BaseModel):
    """Trends analysis for redemptions"""
    period: str  # daily, weekly, monthly
    current_period: Dict[str, Any]
    previous_period: Dict[str, Any]
    growth_rate: float
    trend_direction: str  # up, down, stable


class PopularOffers(BaseModel):
    """Most popular offers by redemption"""
    offer_id: uuid.UUID
    offer_title: str
    total_claims: int
    total_redemptions: int
    redemption_rate: float
    rank: int


class CustomerSegments(BaseModel):
    """Customer segments based on redemption behavior"""
    segment_name: str
    customer_count: int
    avg_redemptions_per_customer: float
    total_savings_provided: float
    characteristics: List[str]



# app/schemas/business.py - Updated Offer Schemas
from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional, Dict, Any
from datetime import datetime
from decimal import Decimal
import uuid

# ============================================================================
# UPDATED OFFER SCHEMAS
# ============================================================================

class OfferBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    discount_type: str = Field(..., pattern="^(percentage|fixed|minimum_purchase|quantity_discount|bogo)$")
    discount_value: float = Field(..., ge=0)  # Now allows 0 for BOGO offers
    original_price: Optional[float] = Field(None, ge=0)
    discounted_price: Optional[float] = Field(None, ge=0)
    start_date: datetime
    expiry_date: datetime
    max_claims: Optional[int] = Field(None, gt=0)
    max_claims_per_user: Optional[int] = Field(None, gt=0, description="Maximum units a single user can claim for this offer")
    min_claims_per_customer: Optional[int] = Field(None, gt=0, description="Minimum units required per claim")
    terms_conditions: Optional[str] = Field(None, max_length=2000)
    product_id: Optional[uuid.UUID] = None

    # New fields for different offer types
    minimum_purchase_amount: Optional[float] = Field(None, ge=0, description="Minimum purchase required (for minimum_purchase offers)")
    minimum_quantity: Optional[int] = Field(None, gt=0, description="Minimum quantity required (for quantity_discount offers)")
    buy_quantity: Optional[int] = Field(None, gt=0, description="Number of items to buy (for BOGO offers)")
    get_quantity: Optional[int] = Field(None, gt=0, description="Number of items to get (for BOGO offers)")
    get_discount_percentage: Optional[float] = Field(None, ge=0, le=100, description="Discount percentage for get items (for BOGO offers)")
    offer_parameters: Optional[Dict[str, Any]] = Field(None, description="Additional offer-specific parameters")

    @field_validator('discount_value')
    @classmethod
    def validate_discount_value(cls, v, info):
        discount_type = info.data.get('discount_type')
        if discount_type == 'percentage' and v > 100:
            raise ValueError('Percentage discount cannot exceed 100%')
        return v

    @field_validator('expiry_date')
    @classmethod
    def validate_dates(cls, v, info):
        if 'start_date' in info.data and v <= info.data['start_date']:
            raise ValueError('Expiry date must be after start date')
        return v

    @field_validator('discounted_price')
    @classmethod
    def validate_discounted_price(cls, v, info):
        original_price = info.data.get('original_price')
        if v is not None and original_price is not None and v >= original_price:
            raise ValueError('Discounted price must be less than original price')
        return v

    @field_validator('minimum_purchase_amount')
    @classmethod
    def validate_minimum_purchase(cls, v, info):
        discount_type = info.data.get('discount_type')
        if discount_type == 'minimum_purchase' and v is None:
            raise ValueError('minimum_purchase_amount is required for minimum_purchase offers')
        if discount_type != 'minimum_purchase' and v is not None:
            raise ValueError('minimum_purchase_amount should only be set for minimum_purchase offers')
        return v

    @field_validator('minimum_quantity')
    @classmethod
    def validate_minimum_quantity(cls, v, info):
        discount_type = info.data.get('discount_type')
        if discount_type == 'quantity_discount' and v is None:
            raise ValueError('minimum_quantity is required for quantity_discount offers')
        if discount_type != 'quantity_discount' and v is not None:
            raise ValueError('minimum_quantity should only be set for quantity_discount offers')
        return v

    @field_validator('buy_quantity')
    @classmethod
    def validate_buy_quantity(cls, v, info):
        discount_type = info.data.get('discount_type')
        if discount_type == 'bogo' and v is None:
            raise ValueError('buy_quantity is required for BOGO offers')
        if discount_type != 'bogo' and v is not None:
            raise ValueError('buy_quantity should only be set for BOGO offers')
        return v

    @field_validator('get_quantity')
    @classmethod
    def validate_get_quantity(cls, v, info):
        discount_type = info.data.get('discount_type')
        if discount_type == 'bogo' and v is None:
            raise ValueError('get_quantity is required for BOGO offers')
        if discount_type != 'bogo' and v is not None:
            raise ValueError('get_quantity should only be set for BOGO offers')
        return v

    @field_validator('get_discount_percentage')
    @classmethod
    def validate_get_discount_percentage(cls, v, info):
        discount_type = info.data.get('discount_type')
        if discount_type == 'bogo' and v is None:
            raise ValueError('get_discount_percentage is required for BOGO offers')
        if discount_type != 'bogo' and v is not None:
            raise ValueError('get_discount_percentage should only be set for BOGO offers')
        return v


class OfferCreate(OfferBase):
    """Schema for creating new offers"""
    pass


class OfferUpdate(BaseModel):
    """Schema for updating existing offers"""
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    discount_type: Optional[str] = Field(None, pattern="^(percentage|fixed|minimum_purchase|quantity_discount|bogo)$")
    discount_value: Optional[float] = Field(None, ge=0)
    original_price: Optional[float] = Field(None, ge=0)
    discounted_price: Optional[float] = Field(None, ge=0)
    start_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    max_claims: Optional[int] = Field(None, gt=0)
    max_claims_per_user: Optional[int] = Field(None, gt=0, description="Maximum units a single user can claim for this offer")
    min_claims_per_customer: Optional[int] = Field(None, gt=0, description="Minimum units required per claim")
    terms_conditions: Optional[str] = Field(None, max_length=2000)
    product_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None

    # New fields for different offer types
    minimum_purchase_amount: Optional[float] = Field(None, ge=0)
    minimum_quantity: Optional[int] = Field(None, gt=0)
    buy_quantity: Optional[int] = Field(None, gt=0)
    get_quantity: Optional[int] = Field(None, gt=0)
    get_discount_percentage: Optional[float] = Field(None, ge=0, le=100)
    offer_parameters: Optional[Dict[str, Any]] = None


class OfferResponse(OfferBase):
    """Schema for offer responses"""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    business_id: uuid.UUID
    current_claims: int
    is_active: bool
    created_at: datetime
    product: Optional['ProductResponse'] = None
    business: Optional['BusinessSummary'] = None
    images: Optional[List[str]] = None  # Add images field

    @field_validator('discount_value', 'original_price', 'discounted_price',
                    'minimum_purchase_amount', 'get_discount_percentage', mode='before')
    @classmethod
    def convert_decimal_to_float(cls, v):
        """Convert Decimal to float for JSON serialization"""
        if isinstance(v, Decimal):
            return float(v)
        return v

    @model_validator(mode='after')
    def populate_images(self):
        """Populate images from product if not already set"""
        if not self.images and self.product and hasattr(self.product, 'image_url') and self.product.image_url:
            # Construct full Supabase URL if it's a relative path
            image_url = self.product.image_url
            if not image_url.startswith('http'):
                # Construct full Supabase storage URL
                image_url = f"https://lwwhsiaqvkjtlqaxkads.supabase.co/storage/v1/object/public/product-images/{image_url}"
            self.images = [image_url]
        return self


# ============================================================================
# OFFER CALCULATION UTILITIES
# ============================================================================

class OfferCalculationResult(BaseModel):
    """Result of offer calculation"""
    is_valid: bool
    final_price: float
    discount_amount: float
    savings_amount: float
    message: str
    error_reason: Optional[str] = None


class OfferCalculationRequest(BaseModel):
    """Request for calculating offer discount"""
    offer_id: uuid.UUID
    quantity: int = Field(..., gt=0)
    cart_total: Optional[float] = Field(None, ge=0)
    
    
# ============================================================================
# OFFER DISPLAY HELPERS
# ============================================================================

class OfferDisplayInfo(BaseModel):
    """Processed offer information for frontend display"""
    offer_id: uuid.UUID
    title: str
    description: Optional[str]
    discount_type: str
    display_text: str  # Human-readable offer description
    savings_text: str  # e.g., "Save up to $10"
    conditions_text: Optional[str]  # e.g., "Minimum purchase $50"
    is_available: bool
    reason_unavailable: Optional[str] = None


# ============================================================================
# BUSINESS SUMMARY FOR OFFERS
# ============================================================================

class BusinessSummary(BaseModel):
    """Simplified business info for offer responses"""
    business_name: str
    is_verified: bool
    avatar_url: Optional[str] = None