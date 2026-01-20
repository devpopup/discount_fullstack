"""
Superadmin Schemas - For temporary demo offer creation during user acquisition phase
IMPORTANT: These schemas are for temporary functionality and can be completely removed
"""

from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator
from typing import Optional, Dict, Any, List, Union
from datetime import datetime
from decimal import Decimal
import uuid


# ============================================================================
# SUPERADMIN BUSINESS SCHEMAS
# ============================================================================

class SuperadminBusinessBase(BaseModel):
    """Base schema for superadmin business with all required fields"""
    business_name: str = Field(..., min_length=2, max_length=200)
    business_description: Optional[str] = Field(None, max_length=1000)
    business_address: Optional[str] = Field(None, max_length=500)
    phone_number: Optional[str] = Field(None, min_length=10, max_length=20)
    business_website: Optional[str] = None
    avatar_url: Optional[str] = None
    business_hours: Optional[Dict[str, Any]] = None
    category_id: Optional[int] = Field(None, description="Business category")

    # Location fields
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


class SuperadminBusinessCreate(SuperadminBusinessBase):
    """Schema for creating a superadmin business"""
    pass


class SuperadminBusinessUpdate(BaseModel):
    """Schema for updating a superadmin business"""
    business_name: Optional[str] = Field(None, min_length=2, max_length=200)
    business_description: Optional[str] = Field(None, max_length=1000)
    business_address: Optional[str] = Field(None, max_length=500)
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
    is_active: Optional[bool] = None


class SuperadminBusinessResponse(SuperadminBusinessBase):
    """Response schema for superadmin business"""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_by_admin: Optional[uuid.UUID] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


# ============================================================================
# SUPERADMIN OFFER SCHEMAS
# ============================================================================

class SuperadminOfferBase(BaseModel):
    """Base schema for superadmin offer with all required fields"""
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    image_url: Optional[str] = Field(None, description="URL to the offer image")
    discount_type: str = Field(
        ...,
        pattern="^(percentage|fixed|minimum_purchase|quantity_discount|bogo)$",
        description="Type of discount: percentage, fixed, minimum_purchase, quantity_discount, or bogo"
    )
    discount_value: float = Field(..., gt=0, description="Discount amount or percentage")
    original_price: Optional[float] = Field(None, ge=0)
    discounted_price: Optional[float] = Field(None, ge=0)
    start_date: datetime
    expiry_date: datetime
    max_claims: Optional[int] = Field(None, gt=0, description="Total claims allowed (informational only)")
    max_claims_per_user: Optional[int] = Field(None, gt=0, description="Max claims per user (informational only)")

    # Type-specific fields
    minimum_purchase_amount: Optional[float] = Field(None, ge=0, description="Required for minimum_purchase type")
    minimum_quantity: Optional[int] = Field(None, gt=0, description="Required for quantity_discount type")
    buy_quantity: Optional[int] = Field(None, gt=0, description="Required for BOGO type")
    get_quantity: Optional[int] = Field(None, gt=0, description="Required for BOGO type")
    get_discount_percentage: Optional[float] = Field(None, ge=0, le=100, description="Required for BOGO type")
    offer_parameters: Optional[Dict[str, Any]] = Field(None, description="Additional flexible parameters")

    terms_conditions: Optional[str] = Field(None, max_length=2000)

    @field_validator('discount_value')
    @classmethod
    def validate_discount_value(cls, v, info):
        discount_type = info.data.get('discount_type')
        if discount_type == 'percentage' and v > 100:
            raise ValueError('Percentage discount cannot exceed 100%')
        return v

    @field_validator('start_date')
    @classmethod
    def validate_start_date(cls, v):
        from datetime import datetime, timezone
        # Allow a 1-minute grace period for timezone differences
        if v < datetime.now(timezone.utc):
            raise ValueError('Start date/time cannot be in the past')
        return v

    @field_validator('expiry_date')
    @classmethod
    def validate_dates(cls, v, info):
        if 'start_date' in info.data and v <= info.data['start_date']:
            raise ValueError('Expiry date/time must be after start date/time')
        return v

    @field_validator('discounted_price')
    @classmethod
    def validate_discounted_price(cls, v, info):
        original_price = info.data.get('original_price')
        if v is not None and original_price is not None and v >= original_price:
            raise ValueError('Discounted price must be less than original price')
        return v

    @model_validator(mode='after')
    def validate_type_specific_fields(self):
        """Validate that required fields are present for each discount type"""
        if self.discount_type == 'minimum_purchase':
            if self.minimum_purchase_amount is None:
                raise ValueError('minimum_purchase_amount is required for minimum_purchase offers')

        if self.discount_type == 'quantity_discount':
            if self.minimum_quantity is None:
                raise ValueError('minimum_quantity is required for quantity_discount offers')

        if self.discount_type == 'bogo':
            if not all([self.buy_quantity, self.get_quantity, self.get_discount_percentage is not None]):
                raise ValueError('buy_quantity, get_quantity, and get_discount_percentage are required for BOGO offers')

        return self


class SuperadminOfferCreate(SuperadminOfferBase):
    """Schema for creating a superadmin offer (no business_id needed, will be created)"""
    pass


class SuperadminOfferUpdate(BaseModel):
    """Schema for updating a superadmin offer"""
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    image_url: Optional[str] = Field(None, description="URL to the offer image")
    discount_type: Optional[str] = Field(None, pattern="^(percentage|fixed|minimum_purchase|quantity_discount|bogo)$")
    discount_value: Optional[float] = Field(None, gt=0)
    original_price: Optional[float] = Field(None, ge=0)
    discounted_price: Optional[float] = Field(None, ge=0)
    start_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    max_claims: Optional[int] = Field(None, gt=0)
    max_claims_per_user: Optional[int] = Field(None, gt=0)
    minimum_purchase_amount: Optional[float] = Field(None, ge=0)
    minimum_quantity: Optional[int] = Field(None, gt=0)
    buy_quantity: Optional[int] = Field(None, gt=0)
    get_quantity: Optional[int] = Field(None, gt=0)
    get_discount_percentage: Optional[float] = Field(None, ge=0, le=100)
    offer_parameters: Optional[Dict[str, Any]] = None
    terms_conditions: Optional[str] = Field(None, max_length=2000)
    is_active: Optional[bool] = None


class SuperadminOfferResponse(SuperadminOfferBase):
    """Response schema for superadmin offer"""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    superadmin_business_id: uuid.UUID
    created_by_admin: Optional[uuid.UUID] = None
    current_claims: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    # Include business details in response
    business: Optional[SuperadminBusinessResponse] = None


# ============================================================================
# COMBINED CREATE SCHEMA (Business + Offer in one request)
# ============================================================================

class SuperadminOfferWithBusinessCreate(BaseModel):
    """
    Combined schema for creating both business and offer in one request.
    This is the main schema for the superadmin specialized form.
    """
    # Business fields
    business_name: str = Field(..., min_length=2, max_length=200, description="Name of the business")
    business_description: Optional[str] = Field(None, max_length=1000, description="Description of the business")
    business_address: Optional[str] = Field(None, max_length=500, description="Physical address")
    phone_number: Optional[str] = Field(None, min_length=10, max_length=20, description="Contact phone number")
    business_website: Optional[str] = Field(None, description="Business website URL")
    avatar_url: Optional[str] = Field(None, description="Business logo/avatar URL")
    business_hours: Optional[Dict[str, Any]] = Field(None, description="Operating hours")
    category_id: Optional[int] = Field(None, description="Business category ID")

    # Location fields
    latitude: Optional[float] = Field(None, ge=-90, le=90, description="Latitude coordinate")
    longitude: Optional[float] = Field(None, ge=-180, le=180, description="Longitude coordinate")
    formatted_address: Optional[str] = Field(None, max_length=500, description="Full formatted address")
    place_id: Optional[str] = Field(None, max_length=255, description="Google Places ID")
    address_components: Optional[Union[List[Dict[str, Any]], Dict[str, Any]]] = Field(None, description="Address components")

    # Offer fields
    offer_title: str = Field(..., min_length=3, max_length=200, description="Offer title")
    offer_description: Optional[str] = Field(None, max_length=1000, description="Offer description")
    offer_image_url: Optional[str] = Field(None, description="URL to the offer image")
    discount_type: str = Field(
        ...,
        pattern="^(percentage|fixed|minimum_purchase|quantity_discount|bogo)$",
        description="Type of discount"
    )
    discount_value: float = Field(..., gt=0, description="Discount amount or percentage")
    original_price: Optional[float] = Field(None, ge=0, description="Original price before discount")
    discounted_price: Optional[float] = Field(None, ge=0, description="Price after discount")
    start_date: datetime = Field(..., description="Offer start date and time")
    expiry_date: datetime = Field(..., description="Offer expiry date and time")
    max_claims: Optional[int] = Field(None, gt=0, description="Maximum total claims allowed")
    max_claims_per_user: Optional[int] = Field(None, gt=0, description="Maximum claims per user")

    # Type-specific discount fields
    minimum_purchase_amount: Optional[float] = Field(None, ge=0, description="Minimum purchase for discount (minimum_purchase type)")
    minimum_quantity: Optional[int] = Field(None, gt=0, description="Minimum quantity required (quantity_discount type)")
    buy_quantity: Optional[int] = Field(None, gt=0, description="Quantity to buy (BOGO type)")
    get_quantity: Optional[int] = Field(None, gt=0, description="Quantity to get (BOGO type)")
    get_discount_percentage: Optional[float] = Field(None, ge=0, le=100, description="Discount on free items (BOGO type)")
    offer_parameters: Optional[Dict[str, Any]] = Field(None, description="Additional offer parameters")

    terms_conditions: Optional[str] = Field(None, max_length=2000, description="Offer terms and conditions")

    # Optional: Link to existing superadmin business (if creating multiple offers for same business)
    existing_business_id: Optional[uuid.UUID] = Field(None, description="ID of existing superadmin business (if applicable)")

    @field_validator('business_website')
    @classmethod
    def validate_website(cls, v):
        if v and not v.startswith(('http://', 'https://')):
            raise ValueError('Website must start with http:// or https://')
        return v

    @field_validator('discount_value')
    @classmethod
    def validate_discount_value(cls, v, info):
        discount_type = info.data.get('discount_type')
        if discount_type == 'percentage' and v > 100:
            raise ValueError('Percentage discount cannot exceed 100%')
        return v

    @field_validator('start_date')
    @classmethod
    def validate_start_date(cls, v):
        from datetime import datetime, timezone
        if v < datetime.now(timezone.utc):
            raise ValueError('Start date/time cannot be in the past')
        return v

    @field_validator('expiry_date')
    @classmethod
    def validate_dates(cls, v, info):
        if 'start_date' in info.data and v <= info.data['start_date']:
            raise ValueError('Expiry date/time must be after start date/time')
        return v

    @field_validator('discounted_price')
    @classmethod
    def validate_discounted_price(cls, v, info):
        original_price = info.data.get('original_price')
        if v is not None and original_price is not None and v >= original_price:
            raise ValueError('Discounted price must be less than original price')
        return v

    @model_validator(mode='after')
    def validate_type_specific_fields(self):
        """Validate that required fields are present for each discount type"""
        if self.discount_type == 'minimum_purchase':
            if self.minimum_purchase_amount is None:
                raise ValueError('minimum_purchase_amount is required for minimum_purchase offers')

        if self.discount_type == 'quantity_discount':
            if self.minimum_quantity is None:
                raise ValueError('minimum_quantity is required for quantity_discount offers')

        if self.discount_type == 'bogo':
            if not all([self.buy_quantity, self.get_quantity, self.get_discount_percentage is not None]):
                raise ValueError('buy_quantity, get_quantity, and get_discount_percentage are required for BOGO offers')

        return self


class SuperadminOfferWithBusinessResponse(BaseModel):
    """Response after creating offer with business"""
    model_config = ConfigDict(from_attributes=True)

    success: bool
    message: str
    business: SuperadminBusinessResponse
    offer: SuperadminOfferResponse


# ============================================================================
# LIST RESPONSES
# ============================================================================

class SuperadminBusinessListResponse(BaseModel):
    """Paginated list of superadmin businesses"""
    businesses: List[SuperadminBusinessResponse]
    total: int
    page: int
    size: int
    has_next: bool


class SuperadminOfferListResponse(BaseModel):
    """Paginated list of superadmin offers"""
    offers: List[SuperadminOfferResponse]
    total: int
    page: int
    size: int
    has_next: bool
