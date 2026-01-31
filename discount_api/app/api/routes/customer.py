# app/api/routes/customer.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List
from datetime import datetime, timezone
from app.core.database import supabase
from app.core.config import settings
from app.schemas.business import (
    ProductResponse, ProductListResponse,
    OfferResponse, OfferListResponse,
    BusinessResponse, CategoryResponse,
    MessageResponse
)
from app.schemas.customer import (
    SavedOfferResponse, SavedOfferListResponse,
    ClaimedOfferResponse, ClaimedOfferListResponse,
    OfferSearchResponse, ProductSearchResponse,
    ClaimOfferRequest, ClaimInfo,  # Add these new imports
    EnhancedClaimedOfferResponse, QRCodeResponse  # Add these new imports
)
from app.schemas.user import UserProfile
from app.utils.dependencies import get_current_active_user, get_current_user_optional
import uuid
from datetime import datetime, timezone
from app.core.database import supabase, supabase_admin


# Add this helper function at the top of your customer.py file (after imports)
def calculate_discount_percentage(offer):
    """Calculate discount percentage for display"""
    discount_type = offer.get('discount_type')
    discount_value = offer.get('discount_value', 0)
    original_price = offer.get('original_price', 0)
    discounted_price = offer.get('discounted_price', 0)

    # If it's already a percentage type, return the value
    if discount_type == 'percentage':
        return int(discount_value or 0)

    # For fixed discount, calculate percentage based on original price
    if discount_type == 'fixed' and original_price and original_price > 0:
        discount_amount = float(discount_value or 0)
        return round((discount_amount / original_price) * 100)

    # Fallback: calculate from original vs discounted price
    if original_price and original_price > 0 and discounted_price and discounted_price > 0:
        return round(((original_price - discounted_price) / original_price) * 100)

    return 0

async def enrich_offers_with_product_data(offers_data):
    """Fetch product data for offers and merge it (batch query)"""
    # Batch fetch all products in a single query
    product_ids = list(set(o['product_id'] for o in offers_data if o.get('product_id')))
    products_map = {}
    if product_ids:
        products_result = supabase.table("products").select("*, categories(*)").in_("id", product_ids).execute()
        products_map = {p['id']: p for p in (products_result.data or [])}

    enriched_offers = []
    for offer in offers_data:
        product = products_map.get(offer.get('product_id'))
        if product:
            offer['products'] = product
            if product.get('image_url'):
                image_url = product['image_url']
                if not image_url.startswith('http'):
                    image_url = f"https://lwwhsiaqvkjtlqaxkads.supabase.co/storage/v1/object/public/product-images/{image_url}"
                offer['images'] = [image_url]
            else:
                offer['images'] = []
        else:
            offer['products'] = None
            offer['images'] = []

        # Add discount percentage for client use
        offer['discount_percentage'] = calculate_discount_percentage(offer)

        enriched_offers.append(offer)

    return enriched_offers

router = APIRouter(prefix="/customer", tags=["Customer"])

# ============================================================================
# SEARCH & DISCOVERY
# ============================================================================

@router.get("/search/products", response_model=ProductListResponse)
async def search_products(
    q: Optional[str] = Query(None, description="Search query"),
    category_id: Optional[str] = Query(None, description="Filter by category"),
    business_id: Optional[str] = Query(None, description="Filter by business"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price"),
    sort_by: str = Query("name", regex="^(name|price|created_at)$", description="Sort field"),
    sort_order: str = Query("asc", regex="^(asc|desc)$", description="Sort order"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100)
):
    """Search and filter products with advanced options"""
    
    try:
        # Build query - only active products
        query = supabase.table("products").select(
            "*, categories(*), businesses!inner(business_name, is_verified, avatar_url, latitude, longitude)",
            count="exact"
        ).eq("is_active", True)
        
        # Apply search
        if q:
            # Search in product name and description
            query = query.or_(f"name.ilike.%{q}%,description.ilike.%{q}%")
        
        # Apply filters
        if category_id:
            query = query.eq("category_id", category_id)
        
        if business_id:
            query = query.eq("business_id", business_id)
        
        if min_price is not None:
            query = query.gte("price", min_price)
        
        if max_price is not None:
            query = query.lte("price", max_price)
        
        # Apply sorting
        sort_direction = "asc" if sort_order == "asc" else "desc"
        query = query.order(sort_by, desc=(sort_direction == "desc"))
        
        # Apply pagination
        offset = (page - 1) * size
        query = query.range(offset, offset + size - 1)
        
        result = query.execute()
        
        total = result.count if result.count else 0
        has_next = (page * size) < total
        
        # Transform data to include business info
        products = []
        for product in result.data:
            product_data = product.copy()
            if 'businesses' in product_data:
                product_data['business'] = product_data['businesses']
                del product_data['businesses']
            products.append(ProductSearchResponse(**product_data))
        
        return ProductListResponse(
            products=products,
            total=total,
            page=page,
            size=size,
            has_next=has_next
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Product search failed: {str(e)}"
        )


@router.get("/search/offers", response_model=OfferListResponse)
async def search_offers(
    q: Optional[str] = Query(None, description="Search query"),
    category_id: Optional[str] = Query(None, description="Filter by category"),
    business_id: Optional[str] = Query(None, description="Filter by business"),
    discount_type: Optional[str] = Query(None, regex="^(percentage|fixed)$", description="Discount type"),
    min_discount: Optional[float] = Query(None, ge=0, description="Minimum discount value"),
    max_discount: Optional[float] = Query(None, ge=0, description="Maximum discount value"),
    available_only: bool = Query(True, description="Only show offers with available claims"),
    sort_by: str = Query("discount_value", regex="^(discount_value|expiry_date|created_at)$", description="Sort field"),
    sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100)
):
    """Search and filter offers with advanced options"""
    
    try:
        current_time = datetime.now(timezone.utc).isoformat()
        
        # Build query - only active offers within date range
        query = supabase.table("offers").select(
             "*, products!product_id(*, categories(*)), businesses!inner(business_name, is_verified, avatar_url, latitude, longitude)",
            count="exact"
        ).eq("is_active", True).gte("expiry_date", current_time).lte("start_date", current_time)

        
        # Apply search
        if q:
            # Search in offer title and description
            query = query.or_(f"title.ilike.%{q}%,description.ilike.%{q}%")
        
        # Apply filters
        if category_id:
            # Filter by product category or business category
            query = query.or_(f"products.category_id.eq.{category_id},businesses.category_id.eq.{category_id}")
        
        if business_id:
            query = query.eq("business_id", business_id)
        
        if discount_type:
            query = query.eq("discount_type", discount_type)
        
        if min_discount is not None:
            query = query.gte("discount_value", min_discount)
        
        if max_discount is not None:
            query = query.lte("discount_value", max_discount)
        
        if available_only:
            # Only offers that haven't reached max claims
            # Filter in Python after fetching due to Supabase limitations
            pass

        # Apply sorting
        sort_direction = "asc" if sort_order == "asc" else "desc"
        query = query.order(sort_by, desc=(sort_direction == "desc"))

        # Apply pagination
        offset = (page - 1) * size
        query = query.range(offset, offset + size - 1)

        result = query.execute()

        total = result.count if result.count else 0
        has_next = (page * size) < total

        # Transform data to include business info
        offers = []
        for offer in result.data:
            offer_data = offer.copy()

            # Filter by availability if requested
            if available_only:
                max_claims = offer_data.get('max_claims')
                current_claims = offer_data.get('current_claims', 0)
                # Only include if max_claims is None (unlimited) or current_claims < max_claims
                if max_claims is not None and current_claims >= max_claims:
                    continue

            if 'businesses' in offer_data:
                offer_data['business'] = offer_data['businesses']
                del offer_data['businesses']

            # Transform products to product for consistency
            if 'products' in offer_data:
                offer_data['product'] = offer_data['products']
                del offer_data['products']

            offers.append(OfferSearchResponse(**offer_data))
        
        return OfferListResponse(
            offers=offers,
            total=total,
            page=page,
            size=size,
            has_next=has_next
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Offer search failed: {str(e)}"
        )


@router.get("/offers/trending")
async def get_trending_offers(
    limit: int = Query(10, ge=1, le=50),
    category_id: Optional[str] = None
):
    """Get trending offers based on claims"""

    try:
        # Use timezone-aware datetime to match database timestamps
        current_time = datetime.now(timezone.utc).isoformat()
        
        # Step 1: Get offers WITHOUT trying to join products  
        query = supabase.table("offers").select(
            "*, businesses!inner(business_name, is_verified, avatar_url, business_address, latitude, longitude)", 
            count="exact"
        ).eq("is_active", True).gte("expiry_date", current_time).lte("start_date", current_time)
        
        # Sort by current_claims descending to get most claimed offers
        query = query.order("current_claims", desc=True).limit(limit)
        
        result = query.execute()
        
        # Step 2: Batch fetch product data for all offers in a single query
        product_ids = list(set(o['product_id'] for o in result.data if o.get('product_id')))
        products_map = {}
        if product_ids:
            products_result = supabase.table("products").select("*, categories(*)").in_("id", product_ids).execute()
            products_map = {p['id']: p for p in (products_result.data or [])}

        for offer in result.data:
            offer['products'] = products_map.get(offer.get('product_id'))

        # Step 3: Transform data - return raw dict to preserve all fields
        offers = []
        for offer in result.data:
            offer_data = offer.copy()
            
            # Ensure business data is preserved
            if 'businesses' in offer_data:
                offer_data['business'] = offer_data['businesses']
                # Keep both for compatibility
            
            # Remove the null 'product' field and keep 'products'
            if 'product' in offer_data:
                del offer_data['product']
                
            offers.append(offer_data)
        
        return {
            "offers": offers,
            "total": len(offers),
            "page": 1,
            "size": limit,
            "has_next": False
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get trending offers: {str(e)}"
        )

@router.get("/offers/expiring-soon")
async def get_expiring_offers(
    hours: int = Query(24, ge=1, le=168, description="Hours until expiry"),
    limit: int = Query(10, ge=1, le=50)
):
    """Get offers expiring within specified hours"""
    
    try:
        from datetime import timedelta
        
        current_time = datetime.now(timezone.utc)
        expiry_threshold = current_time + timedelta(hours=hours)
        
        # Step 1: Get offers WITHOUT product join
        # IMPORTANT: Only include offers that have already started (start_date <= now)
        query = supabase.table("offers").select(
            "*, businesses!inner(business_name, is_verified, avatar_url, business_address, latitude, longitude)"
        ).eq("is_active", True).lte("start_date", current_time.isoformat()).gte("expiry_date", current_time.isoformat()).lte("expiry_date", expiry_threshold.isoformat())
        
        # Sort by expiry date ascending (most urgent first)
        query = query.order("expiry_date", desc=False).limit(limit)
        
        result = query.execute()
        
        # Step 2: Batch fetch product data for all offers in a single query
        product_ids = list(set(o['product_id'] for o in result.data if o.get('product_id')))
        products_map = {}
        if product_ids:
            products_result = supabase.table("products").select("*, categories(*)").in_("id", product_ids).execute()
            products_map = {p['id']: p for p in (products_result.data or [])}

        for offer in result.data:
            offer['products'] = products_map.get(offer.get('product_id'))

        # Step 3: Transform data - return raw dict to preserve all fields
        offers = []
        for offer in result.data:
            offer_data = offer.copy()
            
            # Ensure business data is preserved
            if 'businesses' in offer_data:
                offer_data['business'] = offer_data['businesses']
                # Keep both for compatibility
            
            # Remove the null 'product' field and keep 'products'
            if 'product' in offer_data:
                del offer_data['product']
                
            offers.append(offer_data)
        
        return {
            "offers": offers,
            "total": len(offers),
            "page": 1,
            "size": limit,
            "has_next": False
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get expiring offers: {str(e)}"
        )

# ============================================================================
# SAVED OFFERS (FAVORITES)
# ============================================================================

@router.post("/offers/{offer_id}/save", response_model=SavedOfferResponse)
async def save_offer(
    offer_id: str,
    current_user: UserProfile = Depends(get_current_active_user)
):
    """Save an offer to favorites"""
    
    try:
        # Check if offer exists and is active
        offer_check = supabase.table("offers").select(
            "*, businesses(business_name)"
        ).eq("id", offer_id).eq("is_active", True).execute()
        
        if not offer_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found or not active"
            )
        
        # Check if already saved
        existing_save = supabase.table("saved_offers").select("id").eq("user_id", str(current_user.id)).eq("offer_id", offer_id).execute()
        
        if existing_save.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Offer already saved"
            )
        
        # Save the offer
        # The id field is auto-generated by the database
        save_data = {
            "user_id": str(current_user.id),
            "offer_id": offer_id
        }

        result = supabase.table("saved_offers").insert(save_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save offer"
            )
        
        # Get saved offer with full offer details
        saved_offer = supabase.table("saved_offers").select(
            "*, offers(*, products(*, categories(*)), businesses(business_name, is_verified, avatar_url))"
        ).eq("id", result.data[0]["id"]).execute()
        
        return SavedOfferResponse(**saved_offer.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save offer: {str(e)}"
        )


@router.delete("/offers/{offer_id}/save", response_model=MessageResponse)
async def unsave_offer(
    offer_id: str,
    current_user: UserProfile = Depends(get_current_active_user)
):
    """Remove an offer from favorites"""
    
    try:
        # Delete the saved offer
        result = supabase.table("saved_offers").delete().eq("user_id", str(current_user.id)).eq("offer_id", offer_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Saved offer not found"
            )
        
        return MessageResponse(message="Offer removed from favorites")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unsave offer: {str(e)}"
        )


@router.get("/saved-offers", response_model=SavedOfferListResponse)
async def get_saved_offers(
    current_user: UserProfile = Depends(get_current_active_user),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    active_only: bool = Query(True, description="Only show active offers")
):
    """Get user's saved offers"""

    try:
        # Build query - select from saved_offers table with joined offers data
        # Note: Use 'product' (singular) to match the foreign key relationship
        query = supabase.table("saved_offers").select(
            "*, offers(*, product:products(*, categories(*)), businesses(business_name, is_verified, avatar_url, business_address, latitude, longitude, phone_number, business_website, business_hours))",
            count="exact"
        ).eq("user_id", str(current_user.id))

        # Apply pagination
        offset = (page - 1) * size
        query = query.range(offset, offset + size - 1).order("saved_at", desc=True)

        result = query.execute()

        # Filter for active offers if requested
        saved_offers_data = result.data
        if active_only:
            current_time = datetime.now(timezone.utc)
            saved_offers_data = [
                saved_offer for saved_offer in saved_offers_data
                if saved_offer.get('offers') and
                   saved_offer['offers'].get('is_active') and
                   datetime.fromisoformat(saved_offer['offers']['expiry_date'].replace('Z', '+00:00')) > current_time
            ]

        total = len(saved_offers_data) if active_only else (result.count if result.count else 0)
        has_next = (page * size) < total

        saved_offers = [SavedOfferResponse(**saved_offer) for saved_offer in saved_offers_data]

        return SavedOfferListResponse(
            saved_offers=saved_offers,
            total=total,
            page=page,
            size=size,
            has_next=has_next
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve saved offers: {str(e)}"
        )


@router.get("/saved-offer-ids")
async def get_saved_offer_ids(
    current_user: UserProfile = Depends(get_current_active_user),
):
    """Get just the offer IDs the user has saved (lightweight endpoint for status checks)"""
    try:
        result = supabase.table("saved_offers").select("offer_id").eq("user_id", str(current_user.id)).execute()
        return {"offer_ids": [r["offer_id"] for r in (result.data or [])]}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve saved offer IDs: {str(e)}"
        )


@router.get("/claimed-offer-ids")
async def get_claimed_offer_ids(
    current_user: UserProfile = Depends(get_current_active_user),
):
    """Get just the offer IDs the user has claimed (lightweight endpoint for status checks)"""
    try:
        result = supabase.table("claimed_offers").select("offer_id").eq("user_id", str(current_user.id)).execute()
        return {"offer_ids": list(set(r["offer_id"] for r in (result.data or [])))}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve claimed offer IDs: {str(e)}"
        )


# ============================================================================
# OFFER CLAIMING
# ============================================================================

@router.post("/offers/{offer_id}/claim", response_model=dict)
async def claim_offer(
    offer_id: str,
    claim_data: ClaimOfferRequest,
    current_user: UserProfile = Depends(get_current_active_user)
):
    """Enhanced claim offer with support for online and in-store claims"""
    
    try:
        # Use timezone-aware datetime for consistent comparisons
        current_time = datetime.now(timezone.utc)
        
        print(f"Processing claim for user: {current_user.id}, offer: {offer_id}")
        print(f"Claim type: {claim_data.claim_type}")
        
        # Check if offer exists and is claimable
        offer_check = supabase.table("offers").select("*").eq("id", offer_id).eq("is_active", True).execute()
        
        if not offer_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found or not active"
            )
        
        offer = offer_check.data[0]
        print(f"Found offer: {offer.get('title', 'No title')}")
        
        # Parse dates from database - handle both formats
        try:
            start_date_str = offer["start_date"]
            expiry_date_str = offer["expiry_date"]
            
            # Remove 'Z' and add proper timezone info if needed
            if start_date_str.endswith('Z'):
                start_date_str = start_date_str[:-1] + '+00:00'
            if expiry_date_str.endswith('Z'):
                expiry_date_str = expiry_date_str[:-1] + '+00:00'
            
            start_date = datetime.fromisoformat(start_date_str)
            expiry_date = datetime.fromisoformat(expiry_date_str)
            
            # Ensure dates are timezone-aware
            if start_date.tzinfo is None:
                start_date = start_date.replace(tzinfo=timezone.utc)
            if expiry_date.tzinfo is None:
                expiry_date = expiry_date.replace(tzinfo=timezone.utc)
                
        except (ValueError, KeyError) as e:
            print(f"Error parsing offer dates: {e}")
            print(f"Start date: {offer.get('start_date')}")
            print(f"Expiry date: {offer.get('expiry_date')}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Invalid offer date format"
            )
        
        # Check if offer is within valid date range
        if current_time < start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Offer has not started yet"
            )
        
        if current_time > expiry_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Offer has expired"
            )
        
        # Check if max claims reached (total limit)
        if offer["max_claims"] and offer["current_claims"] >= offer["max_claims"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Offer has reached maximum claims"
            )

        # Check user's claim count for this offer (using admin client for reliability)
        user_claims = supabase_admin.table("claimed_offers").select("id, quantity, is_redeemed").eq("user_id", str(current_user.id)).eq("offer_id", offer_id).execute()
        user_claim_count = len(user_claims.data) if user_claims.data else 0

        # Find any unredeemed claims (we'll update this instead of creating a new one)
        unredeemed_claim = next((claim for claim in (user_claims.data or []) if not claim.get("is_redeemed", False)), None)

        # Calculate total quantity claimed by user
        total_quantity_claimed = sum(claim.get("quantity", 1) for claim in (user_claims.data or []))
        new_quantity = claim_data.quantity if hasattr(claim_data, 'quantity') else 1
        total_after_claim = total_quantity_claimed + new_quantity

        # Check minimum quantity requirement
        min_claims_per_customer = offer.get("min_claims_per_customer")
        if min_claims_per_customer and new_quantity < min_claims_per_customer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Minimum claim quantity is {min_claims_per_customer} units. You tried to claim {new_quantity}."
            )

        # Check if max_claims_per_user limit reached (checking total quantity, not claim count)
        max_claims_per_user = offer.get("max_claims_per_user")
        if max_claims_per_user and total_after_claim > max_claims_per_user:
            remaining = max_claims_per_user - total_quantity_claimed

            # Handle different error scenarios with clear messages
            if total_quantity_claimed >= max_claims_per_user:
                # User has already reached or exceeded their limit
                if total_quantity_claimed > max_claims_per_user:
                    # Data inconsistency - user somehow exceeded limit
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"You have exceeded your claim limit for this offer. You have claimed {total_quantity_claimed} units, but the maximum allowed is {max_claims_per_user}. Please contact support if you believe this is an error."
                    )
                else:
                    # User has exactly reached their limit
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"You have reached your claim limit for this offer ({max_claims_per_user}/{max_claims_per_user} units used)."
                    )
            else:
                # User is trying to claim more than remaining
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"You have already claimed {total_quantity_claimed} of this offer. Maximum allowed is {max_claims_per_user}. You can only claim {remaining} more unit{'s' if remaining != 1 else ''}."
                )

        # If max_claims_per_user is not set, check if user already claimed once (backward compatibility)
        if not max_claims_per_user and user_claim_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already claimed this offer"
            )
        
        # Import claim utilities
        try:
            from app.utils.claim_utils import ensure_unique_claim_id, generate_qr_code, get_claim_display_info
        except ImportError as e:
            print(f"Import error for claim utilities: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Claim utilities not available"
            )

        # Check if we should update existing claim or create new one
        if unredeemed_claim:
            # UPDATE existing unredeemed claim - add to quantity
            print(f"Found unredeemed claim {unredeemed_claim['id']}, updating quantity...")
            new_total_quantity = unredeemed_claim.get("quantity", 1) + new_quantity

            result = supabase_admin.table("claimed_offers").update({
                "quantity": new_total_quantity
            }).eq("id", unredeemed_claim["id"]).execute()

            if not result.data:
                print("Failed to update claim record")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update claim"
                )

            print(f"Successfully updated claim quantity to {new_total_quantity}")
            claim_id = unredeemed_claim["id"]

            # Get existing claim's unique_claim_id and qr_code for response
            # We need to fetch the full claim to get these values
            full_claim = supabase_admin.table("claimed_offers").select("unique_claim_id, qr_code_url, claim_type").eq("id", claim_id).execute()
            if full_claim.data:
                unique_claim_id = full_claim.data[0].get("unique_claim_id")
                qr_code_data_url = full_claim.data[0].get("qr_code_url")
                verification_url = None  # Will be generated in display info
            else:
                unique_claim_id = None
                qr_code_data_url = None
                verification_url = None

        else:
            # CREATE new claim
            print("No unredeemed claim found, creating new claim...")

            # Generate unique claim ID for all claims (using admin client for checking)
            unique_claim_id = ensure_unique_claim_id(supabase_admin)
            print(f"Generated unique claim ID: {unique_claim_id}")

            # Prepare claim data based on claim type
            # The id field is auto-generated by the database (bigint auto-increment)
            claim_record = {
                "user_id": str(current_user.id),
                "offer_id": offer_id,
                "claim_type": claim_data.claim_type,
                "unique_claim_id": unique_claim_id,
                "claimed_at": current_time.isoformat(),
                "quantity": claim_data.quantity if hasattr(claim_data, 'quantity') else 1
            }

            print(f"Prepared claim record: {claim_record}")

            # Generate QR code and verification URL for in-store claims
            qr_code_data_url = None
            verification_url = None

            if claim_data.claim_type == "in_store":
                try:
                    qr_code_data_url, verification_url = generate_qr_code(unique_claim_id)
                    claim_record["qr_code_url"] = qr_code_data_url
                    print(f"Generated QR code and verification URL")
                except Exception as e:
                    print(f"QR code generation failed: {e}")
                    # Continue without QR code - user can still use manual claim ID
                    claim_record["qr_code_url"] = None

            elif claim_data.claim_type == "online":
                # For online claims, use the provided redirect URL or the offer's business website
                redirect_url = getattr(claim_data, 'redirect_url', None)
                if not redirect_url:
                    # Get business website from the offer's business
                    business_check = supabase_admin.table("businesses").select("business_website").eq("id", offer["business_id"]).execute()
                    if business_check.data and business_check.data[0]["business_website"]:
                        redirect_url = business_check.data[0]["business_website"]
                    else:
                        # Default dead link as mentioned
                        redirect_url = "https://merchant-website-placeholder.com"

                claim_record["merchant_redirect_url"] = redirect_url
                print(f"Set redirect URL: {redirect_url}")

            # Insert the claim record using ADMIN CLIENT to bypass RLS
            print("Inserting claim record using admin client...")
            result = supabase_admin.table("claimed_offers").insert(claim_record).execute()

            if not result.data:
                print("Failed to insert claim record")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to claim offer"
                )

            print(f"Successfully inserted claim: {result.data[0]['id']}")
            claim_id = result.data[0]['id']

            # Increment offer claim count using admin client (only for new claims)
            update_result = supabase_admin.table("offers").update({
                "current_claims": offer["current_claims"] + 1
            }).eq("id", offer_id).execute()

            print(f"Updated offer claim count: {update_result.data}")
        
        # Get claimed offer with full details using admin client
        claimed_offer_result = supabase_admin.table("claimed_offers").select(
            "*, offers(*, products(*, categories(*)), businesses(business_name, is_verified, avatar_url))"
        ).eq("id", claim_id).execute()
        
        if not claimed_offer_result.data:
            print("Failed to retrieve claimed offer details")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve claimed offer details"
            )
        
        claimed_offer_data = claimed_offer_result.data[0]
        print(f"Retrieved claimed offer data successfully")
        
        # Generate claim display information
        try:
            claim_display_info = get_claim_display_info(
                claim_data.claim_type,
                unique_claim_id,
                qr_code_data_url
            )
        except Exception as e:
            print(f"Error generating claim display info: {e}")
            claim_display_info = {
                "claim_id": unique_claim_id,
                "claim_type": claim_data.claim_type,
                "instructions": "Claim processed successfully"
            }
        
        # Prepare response based on claim type
        response_data = {
            "success": True,
            "claim_type": claim_data.claim_type,
            "claim_id": unique_claim_id,
            "claimed_at": current_time.isoformat(),
            "offer": claimed_offer_data["offers"],
            "claim_display": claim_display_info
        }
        
        # Add type-specific data
        if claim_data.claim_type == "in_store":
            response_data.update({
                "qr_code": qr_code_data_url,
                "verification_url": verification_url,
                "message": "Offer claimed successfully! Show the QR code or claim ID to the merchant for redemption."
            })
        
        elif claim_data.claim_type == "online":
            # Get redirect URL from the claimed offer data
            merchant_redirect_url = claimed_offer_data.get("merchant_redirect_url")
            response_data.update({
                "redirect_url": merchant_redirect_url,
                "message": "Offer claimed successfully! You will be redirected to the merchant's website."
            })
        
        print(f"Returning successful response for claim: {unique_claim_id}")
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error claiming offer: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to claim offer: {str(e)}"
        )



# Add new endpoint to get QR code for existing claims
@router.get("/claimed-offers/{claim_id}/qr", response_model=dict)
async def get_claim_qr_code(
    claim_id: str,
    current_user: UserProfile = Depends(get_current_active_user)
):
    """Get QR code for an existing in-store claim"""
    
    try:
        # Get the claimed offer using admin client
        claimed_offer = supabase_admin.table("claimed_offers").select(
            "*, offers(title, business_id)"
        ).eq("unique_claim_id", claim_id).eq("user_id", str(current_user.id)).execute()
        
        if not claimed_offer.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Claim not found"
            )
        
        claim_data = claimed_offer.data[0]
        
        # Check if it's an in-store claim
        if claim_data.get("claim_type") != "in_store":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="QR code is only available for in-store claims"
            )
        
        # Check if already redeemed
        if claim_data.get("is_redeemed"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This claim has already been redeemed"
            )
        
        # Get or generate QR code
        qr_code_url = claim_data.get("qr_code_url")
        
        if not qr_code_url:
            # Generate QR code if it doesn't exist
            try:
                from app.utils.claim_utils import generate_qr_code
                qr_code_data_url, verification_url = generate_qr_code(claim_id)
                
                # Update the record with the generated QR code using admin client
                supabase_admin.table("claimed_offers").update({
                    "qr_code_url": qr_code_data_url
                }).eq("id", claim_data["id"]).execute()
                
                qr_code_url = qr_code_data_url
                
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to generate QR code: {str(e)}"
                )
        
        # Generate display information
        from app.utils.claim_utils import get_claim_display_info
        display_info = get_claim_display_info("in_store", claim_id, qr_code_url)
        
        return {
            "claim_id": claim_id,
            "offer_title": claim_data["offers"]["title"],
            "qr_code": qr_code_url,
            "verification_url": display_info.get("verification_url"),
            "instructions": display_info.get("instructions"),
            "manual_entry_text": display_info.get("manual_entry_text"),
            "is_redeemed": claim_data.get("is_redeemed", False),
            "claimed_at": claim_data.get("claimed_at")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve QR code: {str(e)}"
        )


@router.get("/claimed-offers", response_model=dict)
async def get_claimed_offers(
    current_user: UserProfile = Depends(get_current_active_user),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    redeemed_only: Optional[bool] = Query(None, description="Filter by redemption status"),
    claim_type: Optional[str] = Query(None, regex="^(online|in_store)$", description="Filter by claim type")
):
    """Get user's claimed offers with enhanced claim information"""
    
    try:
        # Build query
        query = supabase.table("claimed_offers").select(
            "*, offers(*, products(*, categories(*)), businesses(business_name, is_verified, avatar_url))",
            count="exact"
        ).eq("user_id", str(current_user.id))
        
        if redeemed_only is not None:
            query = query.eq("is_redeemed", redeemed_only)
        
        if claim_type:
            query = query.eq("claim_type", claim_type)
        
        # Apply pagination
        offset = (page - 1) * size
        query = query.range(offset, offset + size - 1).order("claimed_at", desc=True)
        
        result = query.execute()
        
        total = result.count if result.count else 0
        has_next = (page * size) < total
        
        # Process claimed offers with display information
        enhanced_claimed_offers = []
        
        for claimed_offer in result.data:
            # Generate claim display info
            try:
                from app.utils.claim_utils import get_claim_display_info
                
                claim_display = get_claim_display_info(
                    claimed_offer.get("claim_type", "in_store"),
                    claimed_offer.get("unique_claim_id"),
                    claimed_offer.get("qr_code_url")
                )
                
                # Create enhanced response
                enhanced_offer = {
                    "id": claimed_offer["id"],
                    "user_id": claimed_offer["user_id"],
                    "offer_id": claimed_offer["offer_id"],
                    "claimed_at": claimed_offer["claimed_at"],
                    "is_redeemed": claimed_offer.get("is_redeemed", False),
                    "redeemed_at": claimed_offer.get("redeemed_at"),
                    "redemption_notes": claimed_offer.get("redemption_notes"),
                    "claim_type": claimed_offer.get("claim_type", "in_store"),
                    "unique_claim_id": claimed_offer.get("unique_claim_id"),
                    "qr_code_url": claimed_offer.get("qr_code_url"),
                    "merchant_redirect_url": claimed_offer.get("merchant_redirect_url"),
                    "offer": claimed_offer["offers"],
                    "claim_display": claim_display
                }
                
                enhanced_claimed_offers.append(enhanced_offer)
                
            except Exception as e:
                print(f"Error processing claimed offer {claimed_offer['id']}: {e}")
                # Include without display info if processing fails
                enhanced_claimed_offers.append(claimed_offer)
        
        return {
            "claimed_offers": enhanced_claimed_offers,
            "total": total,
            "page": page,
            "size": size,
            "has_next": has_next,
            "summary": {
                "total_claims": total,
                "in_store_claims": len([c for c in enhanced_claimed_offers if c.get("claim_type") == "in_store"]),
                "online_claims": len([c for c in enhanced_claimed_offers if c.get("claim_type") == "online"]),
                "redeemed_claims": len([c for c in enhanced_claimed_offers if c.get("is_redeemed")]),
                "pending_claims": len([c for c in enhanced_claimed_offers if not c.get("is_redeemed")])
            }
        }
        
    except Exception as e:
        print(f"Error retrieving claimed offers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve claimed offers: {str(e)}"
        )


@router.delete("/offers/{offer_id}/claim")
async def unclaim_offer(
    offer_id: str,
    current_user: UserProfile = Depends(get_current_active_user)
):
    """Remove/unclaim an offer that hasn't been redeemed yet"""

    try:
        # Check if the claim exists and belongs to the user
        claim_check = supabase_admin.table("claimed_offers").select("*").eq(
            "user_id", str(current_user.id)
        ).eq("offer_id", offer_id).execute()

        if not claim_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Claim not found"
            )

        claim = claim_check.data[0]

        # Don't allow unclaiming if already redeemed
        if claim.get("is_redeemed"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot unclaim an offer that has already been redeemed"
            )

        # Delete the claim using admin client
        delete_result = supabase_admin.table("claimed_offers").delete().eq(
            "id", claim["id"]
        ).execute()

        if not delete_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to unclaim offer"
            )

        # Decrement the offer's claim count
        offer_check = supabase_admin.table("offers").select("current_claims").eq("id", offer_id).execute()
        if offer_check.data:
            current_claims = offer_check.data[0].get("current_claims", 0)
            if current_claims > 0:
                supabase_admin.table("offers").update({
                    "current_claims": current_claims - 1
                }).eq("id", offer_id).execute()

        return {
            "success": True,
            "message": "Offer unclaimed successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error unclaiming offer: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unclaim offer: {str(e)}"
        )


@router.get("/offers/{offer_id}/status")
async def get_offer_status(
    offer_id: str,
    current_user: Optional[UserProfile] = Depends(get_current_user_optional)
):
    """Get offer status for current user with enhanced claim information"""
    
    try:
        # Get basic offer info
        offer_check = supabase.table("offers").select("*").eq("id", offer_id).eq("is_active", True).execute()
        
        if not offer_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )
        
        status_info = {
            "offer_id": offer_id,
            "is_available": True,
            "is_saved": False,
            "is_claimed": False,
            "can_claim": True,
            "reason": None,
            "claimed_info": None
        }
        
        if not current_user:
            return status_info
        
        offer = offer_check.data[0]
        current_time = datetime.now(timezone.utc)
        
        # Check availability with proper timezone handling
        try:
            start_date_str = offer["start_date"]
            expiry_date_str = offer["expiry_date"]
            
            # Remove 'Z' and add proper timezone info if needed
            if start_date_str.endswith('Z'):
                start_date_str = start_date_str[:-1] + '+00:00'
            if expiry_date_str.endswith('Z'):
                expiry_date_str = expiry_date_str[:-1] + '+00:00'
            
            start_date = datetime.fromisoformat(start_date_str)
            expiry_date = datetime.fromisoformat(expiry_date_str)
            
            # Ensure dates are timezone-aware
            if start_date.tzinfo is None:
                start_date = start_date.replace(tzinfo=timezone.utc)
            if expiry_date.tzinfo is None:
                expiry_date = expiry_date.replace(tzinfo=timezone.utc)
                
        except (ValueError, KeyError) as e:
            print(f"Error parsing offer dates in status check: {e}")
            # If date parsing fails, assume offer is available
            start_date = current_time
            expiry_date = current_time
        
        if current_time < start_date:
            status_info["can_claim"] = False
            status_info["reason"] = "Offer has not started yet"
        elif current_time > expiry_date:
            status_info["is_available"] = False
            status_info["can_claim"] = False
            status_info["reason"] = "Offer has expired"
        elif offer["max_claims"] and offer["current_claims"] >= offer["max_claims"]:
            status_info["can_claim"] = False
            status_info["reason"] = "Maximum claims reached"
        
        # Check if saved
        saved_check = supabase.table("saved_offers").select("id").eq("user_id", str(current_user.id)).eq("offer_id", offer_id).execute()
        status_info["is_saved"] = bool(saved_check.data)
        
        # Check if claimed and get claim info
        claimed_check = supabase.table("claimed_offers").select("*").eq("user_id", str(current_user.id)).eq("offer_id", offer_id).execute()
        if claimed_check.data:
            claim = claimed_check.data[0]
            status_info["is_claimed"] = True
            status_info["can_claim"] = False
            status_info["reason"] = "Already claimed"
            
            # Include claim display information
            try:
                from app.utils.claim_utils import get_claim_display_info
                
                claim_display = get_claim_display_info(
                    claim.get("claim_type", "in_store"),
                    claim.get("unique_claim_id"),
                    claim.get("qr_code_url")
                )
                
                status_info["claimed_info"] = claim_display
                status_info["claimed_info"]["is_redeemed"] = claim.get("is_redeemed", False)
                status_info["claimed_info"]["claimed_at"] = claim.get("claimed_at")
                
            except Exception as e:
                print(f"Error generating claim display info: {e}")
        
        return status_info
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting offer status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get offer status: {str(e)}"
        )


# ============================================================================
# BUSINESS DISCOVERY
# ============================================================================

@router.get("/businesses", response_model=ProductListResponse)
async def discover_businesses(
    category_id: Optional[str] = None,
    verified_only: bool = Query(True, description="Only show verified businesses"),
    has_active_offers: bool = Query(False, description="Only businesses with active offers"),
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100)
):
    """Discover businesses with filters"""

    try:
        # Build query
        query = supabase.table("businesses").select("*, categories(*)", count="exact")

        if verified_only:
            query = query.eq("is_verified", True)

        if category_id:
            query = query.eq("category_id", category_id)

        if search:
            query = query.ilike("business_name", f"%{search}%")

        if has_active_offers:
            current_time = datetime.now(timezone.utc).isoformat()
            # This would need a join - simplified for now
            query = query.eq("is_verified", True)  # Placeholder logic

        # Apply pagination
        offset = (page - 1) * size
        query = query.range(offset, offset + size - 1).order("business_name")

        result = query.execute()

        total = result.count if result.count else 0
        has_next = (page * size) < total

        businesses = [BusinessResponse(**business) for business in result.data]

        return {
            "businesses": businesses,
            "total": total,
            "page": page,
            "size": size,
            "has_next": has_next
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to discover businesses: {str(e)}"
        )


@router.get("/businesses/{business_id}/offers")
async def get_business_offers(
    business_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Get all active offers from a specific business (for QR code scanning)"""

    try:
        # Get business details
        business_result = supabase.table("businesses").select(
            "id, business_name, avatar_url, business_address, latitude, longitude, phone_number, business_website, business_hours"
        ).eq("id", business_id).execute()

        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )

        business_data = business_result.data[0]

        # Get current time for active offers check
        current_time = datetime.now(timezone.utc).isoformat()

        # Get active offers for this business (without product join first)
        query = supabase.table("offers").select(
            "*", count="exact"
        ).eq("business_id", business_id).eq("is_active", True).gte("expiry_date", current_time).lte("start_date", current_time)

        # Apply pagination
        offset = (page - 1) * limit
        query = query.order("created_at", desc=True).range(offset, offset + limit - 1)

        result = query.execute()

        total = result.count if result.count else 0
        has_more = (offset + limit) < total

        # Enrich offers with product data using the centralized enrichment function
        enriched_offers = await enrich_offers_with_product_data(result.data)

        # Add business data to each offer for consistency with other endpoints
        for offer in enriched_offers:
            offer['business'] = business_data
            offer['businesses'] = business_data  # For compatibility

        # Convert decimals to floats for JSON serialization
        enriched_offers = convert_decimals_to_float(enriched_offers)
        business_data = convert_decimals_to_float(business_data)

        return {
            "business": business_data,
            "offers": enriched_offers,
            "total": total,
            "page": page,
            "limit": limit,
            "has_more": has_more
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching business offers: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch business offers: {str(e)}"
        )


# In your discount_api/app/api/routes/business.py or customer.py
def format_product_response(product):
    """Format product response with proper image URL"""
    if hasattr(product, 'image_url') and product.image_url:
        # Ensure image URL is complete
        if not product.image_url.startswith('http'):
            base_url = settings.supabase_url
            product.image_url = f"{base_url}/storage/v1/object/public/product-images/{product.image_url}"
    return product

@router.get("/products/{product_id}")
async def get_product_by_id(product_id: str):
    """Get a single product by ID"""
    
    try:
        result = supabase.table("products").select(
            "*, categories(*), businesses(business_name, is_verified, avatar_url)"
        ).eq("id", product_id).eq("is_active", True).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        product = result.data[0]
        
        # Transform data to include business info
        if 'businesses' in product:
            product['business'] = product['businesses']
            del product['businesses']
            
        return {"product": product}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve product: {str(e)}"
        )


# offers nearby
# In discount_api/app/api/routes/customer.py (or add to existing customer routes)
from fastapi import APIRouter, Query, HTTPException, status
from typing import Optional
from app.core.database import supabase_admin
from app.utils.dependencies import get_current_active_user
from app.schemas.user import UserProfile
from decimal import Decimal

def convert_decimals_to_float(data):
    """Convert Decimal fields to float in a dictionary or list"""
    if isinstance(data, dict):
        return {key: convert_decimals_to_float(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [convert_decimals_to_float(item) for item in data]
    elif isinstance(data, Decimal):
        return float(data)
    else:
        return data

@router.get("/offers/nearby", response_model=dict)
async def get_offers_nearby(
    lat: float = Query(..., description="User latitude", ge=-90, le=90),
    lng: float = Query(..., description="User longitude", ge=-180, le=180),
    radius: float = Query(10.0, description="Search radius in kilometers", gt=0, le=50),
    limit: int = Query(20, description="Maximum results", gt=0, le=100),
    category_id: Optional[str] = Query(None, description="Filter by category")
):
    """Find offers near a location with geofencing support"""
    try:
        # Get current time for active offers check
        current_time = datetime.now(timezone.utc).isoformat()

        # Get all active offers with business location data
        result = supabase_admin.table("offers").select(
            "*, businesses!inner(id, business_name, is_verified, avatar_url, business_address, latitude, longitude)"
        ).eq("is_active", True).gte("expiry_date", current_time).lte("start_date", current_time).execute()

        all_offers = result.data or []

        # Filter offers based on geofencing logic
        nearby_offers = []
        for offer in all_offers:
            business = offer.get('businesses', {})
            business_lat = business.get('latitude')
            business_lng = business.get('longitude')

            if not business_lat or not business_lng:
                continue

            # Calculate distance between user and business (in meters)
            from math import radians, sin, cos, sqrt, atan2

            R = 6371000  # Earth's radius in meters
            lat1, lng1 = radians(lat), radians(lng)
            lat2, lng2 = radians(float(business_lat)), radians(float(business_lng))

            dlat = lat2 - lat1
            dlng = lng2 - lng1

            a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlng/2)**2
            c = 2 * atan2(sqrt(a), sqrt(1-a))
            distance_meters = R * c

            # Check geofencing: if geofence_enabled, use geofence_radius, otherwise use search radius
            geofence_enabled = offer.get('geofence_enabled', False)
            geofence_radius = offer.get('geofence_radius', 1000)  # default 1km in meters

            if geofence_enabled:
                # For geofenced offers, user must be within the specific geofence radius
                if distance_meters <= geofence_radius:
                    offer['distance_km'] = round(distance_meters / 1000, 2)
                    offer['within_geofence'] = True
                    nearby_offers.append(offer)
            else:
                # For non-geofenced offers, use the general search radius
                if distance_meters <= (radius * 1000):  # convert km to meters
                    offer['distance_km'] = round(distance_meters / 1000, 2)
                    offer['within_geofence'] = False
                    nearby_offers.append(offer)

        # Sort by geofence priority (geofenced first), then by distance
        nearby_offers.sort(key=lambda x: (not x.get('within_geofence', False), x['distance_km']))
        offers = nearby_offers[:limit]

        # Filter by category if specified
        if category_id and offers:
            # Get businesses in this category
            category_businesses = supabase_admin.table("businesses").select("id").eq("category_id", category_id).execute()
            business_ids = [b["id"] for b in category_businesses.data] if category_businesses.data else []

            # Filter offers
            offers = [offer for offer in offers if offer["business_id"] in business_ids]

        # Convert decimals to floats for JSON serialization
        offers = convert_decimals_to_float(offers)

        # Batch fetch product data for all nearby offers in a single query
        product_ids = list(set(o['product_id'] for o in offers if o.get('product_id')))
        products_map = {}
        if product_ids:
            products_result = supabase_admin.table("products").select("*, categories(*)").in_("id", product_ids).execute()
            products_map = {p['id']: p for p in (products_result.data or [])}

        for offer in offers:
            offer['products'] = products_map.get(offer.get('product_id'))

        # Add additional computed fields
        for offer in offers:
            # Calculate savings
            if offer["discount_type"] == "percentage":
                savings = (offer["original_price"] or 0) * (offer["discount_value"] or 0) / 100
                offer["savings_amount"] = round(savings, 2)
                offer["discount_text"] = f"{offer['discount_value']}% off"
            else:
                offer["savings_amount"] = offer["discount_value"] or 0
                offer["discount_text"] = f"${offer['discount_value']} off"
            
            # Calculate remaining claims
            if offer["max_claims"]:
                offer["remaining_claims"] = max(0, offer["max_claims"] - (offer["current_claims"] or 0))
                offer["claim_percentage"] = (offer["current_claims"] or 0) / offer["max_claims"] * 100
            else:
                offer["remaining_claims"] = None
                offer["claim_percentage"] = 0
            
            # Round distance
            offer["distance_km"] = round(offer["distance_km"], 2)
        
        return {
            "offers": offers,
            "search_location": {
                "latitude": lat,
                "longitude": lng
            },
            "search_radius_km": radius,
            "total_found": len(offers),
            "message": f"Found {len(offers)} offers within {radius}km"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search offers: {str(e)}"
        )

@router.post("/offers/search-by-address", response_model=dict)
async def search_offers_by_address(
    search_data: dict,
    radius: float = Query(10.0, description="Search radius in kilometers", gt=0, le=50),
    limit: int = Query(20, description="Maximum results", gt=0, le=100)
):
    """Search offers by address (geocode address first)"""
    try:
        address = search_data.get("address", "").strip()
        if not address:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Address is required"
            )
        
        # Import geocoding utility (you'll need to create this)
        from app.utils.geocoding import geocode_address
        
        # Geocode the address
        location = await geocode_address(address)
        if not location:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not find location for the provided address"
            )
        
        # Search offers using the geocoded coordinates
        result = supabase_admin.rpc('get_nearby_offers', {
            'user_lat': location["latitude"],
            'user_lng': location["longitude"],
            'search_radius': radius,
            'result_limit': limit
        }).execute()
        
        offers = convert_decimals_to_float(result.data or [])
        
        return {
            "offers": offers,
            "search_address": address,
            "geocoded_location": location,
            "search_radius_km": radius,
            "total_found": len(offers),
            "message": f"Found {len(offers)} offers near {address}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error searching by address: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search by address: {str(e)}"
        )

@router.get("/offers/categories", response_model=dict)
async def get_offer_categories():
    """Get all categories that have active offers"""
    try:
        # Get categories with active offers
        result = supabase_admin.rpc('get_categories_with_offers').execute()
        
        if not result.data:
            # Fallback: get all categories
            categories_result = supabase_admin.table("categories").select("*").order("name").execute()
            categories = categories_result.data or []
        else:
            categories = result.data
        
        return {
            "categories": categories,
            "total": len(categories)
        }
        
    except Exception as e:
        print(f"Error getting categories: {e}")
        # Fallback to simple category list
        categories_result = supabase_admin.table("categories").select("*").order("name").execute()
        return {
            "categories": categories_result.data or [],
            "total": len(categories_result.data or [])
        }
    

# app/api/routes/customer.py - Updated routes for new offer types
from fastapi import APIRouter, Query, HTTPException, status, Depends
from typing import Optional, Dict, Any
from datetime import datetime

from app.core.database import supabase, supabase_admin
from app.schemas.user import UserProfile
from app.utils.dependencies import get_current_active_user
from app.utils.offer_calculations import OfferCalculator

@router.get("/offers/search", response_model=dict)
async def search_offers(
    q: Optional[str] = Query(None, description="Search query"),
    category_id: Optional[str] = Query(None, description="Filter by category"),
    business_id: Optional[str] = Query(None, description="Filter by business"),
    discount_type: Optional[str] = Query(None, regex="^(percentage|fixed|minimum_purchase|quantity_discount|bogo)$", description="Discount type"),
    min_discount: Optional[float] = Query(None, ge=0, description="Minimum discount value"),
    max_discount: Optional[float] = Query(None, ge=0, description="Maximum discount value"),
    available_only: bool = Query(True, description="Only show offers with available claims"),
    sort_by: str = Query("discount_value", regex="^(discount_value|expiry_date|created_at)$", description="Sort field"),
    sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100)
):
    """Search and filter offers with support for all discount types"""
    
    try:
        current_time = datetime.now(timezone.utc).isoformat()
        
        # Build query - only active offers within date range
        query = supabase.table("offers").select(
            "*, products!product_id(*, categories(*)), businesses!inner(business_name, is_verified, avatar_url, latitude, longitude)",
            count="exact"
        ).eq("is_active", True).gte("expiry_date", current_time).lte("start_date", current_time)

        # Apply search
        if q:
            query = query.or_(f"title.ilike.%{q}%,description.ilike.%{q}%")
        
        # Apply filters
        if category_id:
            query = query.or_(f"products.category_id.eq.{category_id},businesses.category_id.eq.{category_id}")
        
        if business_id:
            query = query.eq("business_id", business_id)
        
        if discount_type:
            query = query.eq("discount_type", discount_type)
        
        if min_discount is not None:
            query = query.gte("discount_value", min_discount)
        
        if max_discount is not None:
            query = query.lte("discount_value", max_discount)
        
        if available_only:
            # Only show offers that still have claims available
            # Supabase doesn't support complex OR conditions well, so we'll filter in Python after
            pass
        
        # Apply sorting
        desc_order = sort_order == "desc"
        query = query.order(sort_by, desc=desc_order)
        
        # Apply pagination
        offset = (page - 1) * size
        query = query.range(offset, offset + size - 1)
        
        result = query.execute()
        
        total = result.count if result.count else 0
        total_pages = (total + size - 1) // size
        
        # Process offers and add display information
        enhanced_offers = []
        for offer in result.data:
            offer_data = convert_decimals_to_float(offer)

            # Filter by availability if requested
            if available_only:
                max_claims = offer_data.get('max_claims')
                current_claims = offer_data.get('current_claims', 0)
                # Only include if max_claims is None (unlimited) or current_claims < max_claims
                if max_claims is not None and current_claims >= max_claims:
                    continue

            # Fix structure for frontend
            if 'products' in offer_data:
                offer_data['product'] = offer_data['products']
                del offer_data['products']
            if 'businesses' in offer_data:
                offer_data['business'] = offer_data['businesses']
                del offer_data['businesses']

            # Add display information
            offer_data['display_text'] = OfferCalculator.get_offer_display_text(offer_data)
            offer_data['conditions_text'] = get_offer_conditions_text(offer_data)

            enhanced_offers.append(offer_data)
        
        return {
            "offers": enhanced_offers,
            "pagination": {
                "page": page,
                "size": size,
                "total": total,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            },
            "filters_applied": {
                "search": q,
                "category_id": category_id,
                "business_id": business_id,
                "discount_type": discount_type,
                "min_discount": min_discount,
                "max_discount": max_discount
            }
        }
        
    except Exception as e:
        print(f"Error searching offers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search offers: {str(e)}"
        )


# ============================================================================
# UPCOMING OFFERS & REMINDERS
# ============================================================================

@router.get("/offers/upcoming", response_model=OfferListResponse)
async def get_upcoming_offers(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: Optional[UserProfile] = Depends(get_current_user_optional)
):
    """Get upcoming/scheduled offers (start_date in the future)"""

    try:
        now = datetime.now(timezone.utc)

        # Step 1: Query for upcoming offers WITHOUT product join (like trending/expiring endpoints)
        # Only get offers where start_date is NOT NULL and is in the future
        query = supabase.table("offers").select(
            "*, businesses!inner(id, business_name, business_address, avatar_url, is_verified, latitude, longitude, timezone)",
            count="exact"
        ).eq("is_active", True).not_.is_("start_date", "null").gt("start_date", now.isoformat())

        # Apply pagination
        offset = (page - 1) * limit
        query = query.order("start_date", desc=False).range(offset, offset + limit - 1)

        result = query.execute()

        if not result.data:
            return {
                "offers": [],
                "total": 0,
                "page": page,
                "size": limit,
                "has_next": False
            }

        total_count = result.count or 0

        # Step 2: Batch fetch product data for all offers in a single query
        product_ids = list(set(o['product_id'] for o in result.data if o.get('product_id')))
        products_map = {}
        if product_ids:
            products_result = supabase.table("products").select("*, categories(*)").in_("id", product_ids).execute()
            products_map = {p['id']: p for p in (products_result.data or [])}

        for offer in result.data:
            offer['products'] = products_map.get(offer.get('product_id'))

        # Step 3: If user is logged in, check which offers they have reminders for
        reminder_offer_ids = set()
        if current_user:
            reminders_result = supabase.table("offer_reminders").select("offer_id").eq(
                "user_id", str(current_user.id)
            ).eq("is_active", True).execute()

            if reminders_result.data:
                reminder_offer_ids = {r['offer_id'] for r in reminders_result.data}

        # Step 4: Transform data and add reminder status
        offers_data = []
        for offer in result.data:
            offer_data = offer.copy()

            # Ensure business data is preserved
            if 'businesses' in offer_data:
                offer_data['business'] = offer_data['businesses']
                # Keep both for compatibility

            # Use 'product' (singular) to match frontend expectations for detail pages
            # Keep 'products' for compatibility with list views
            if 'products' in offer_data and offer_data['products']:
                offer_data['product'] = offer_data['products']

            # Add display information (like search endpoint does)
            # TEMPORARILY DISABLED FOR DEBUGGING
            # offer_data['display_text'] = OfferCalculator.get_offer_display_text(offer_data)
            # offer_data['conditions_text'] = get_offer_conditions_text(offer_data)

            # Add reminder status
            offer_data['has_reminder'] = offer_data['id'] in reminder_offer_ids

            offers_data.append(offer_data)

        # Convert decimals
        offers_data = convert_decimals_to_float(offers_data)

        return {
            "offers": offers_data,
            "total": total_count,
            "page": page,
            "size": limit,
            "has_next": (offset + limit) < total_count
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch upcoming offers: {str(e)}"
        )


@router.post("/offers/{offer_id}/remind", response_model=MessageResponse)
async def set_offer_reminder(
    offer_id: str,
    current_user: UserProfile = Depends(get_current_active_user)
):
    """Set a reminder for an upcoming offer"""
    
    try:
        # Verify offer exists and is upcoming
        offer_result = supabase.table("offers").select("*").eq("id", offer_id).execute()
        
        if not offer_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )
        
        offer = offer_result.data[0]
        start_date = datetime.fromisoformat(offer['start_date'].replace('Z', '+00:00'))
        now = datetime.now(timezone.utc)
        
        if start_date <= now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot set reminder for an offer that has already started"
            )
        
        # Check if reminder already exists
        existing_reminder = supabase.table("offer_reminders").select("*").eq(
            "user_id", str(current_user.id)
        ).eq("offer_id", offer_id).execute()
        
        if existing_reminder.data:
            # Reactivate if it exists
            supabase.table("offer_reminders").update({
                "is_active": True,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }).eq("id", existing_reminder.data[0]['id']).execute()
            
            return {
                "message": "Reminder reactivated successfully",
                "success": True
            }
        
        # Create new reminder
        reminder_data = {
            "user_id": str(current_user.id),
            "offer_id": offer_id,
            "is_active": True,
            "notify_via_app": True,
            "notify_via_push": True,
            "notify_via_email": False
        }
        
        supabase.table("offer_reminders").insert(reminder_data).execute()
        
        return {
            "message": "Reminder set successfully! You'll be notified when this offer goes live.",
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error setting reminder: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to set reminder: {str(e)}"
        )


@router.delete("/offers/{offer_id}/remind", response_model=MessageResponse)
async def remove_offer_reminder(
    offer_id: str,
    current_user: UserProfile = Depends(get_current_active_user)
):
    """Remove a reminder for an upcoming offer"""
    
    try:
        # Find the reminder
        reminder_result = supabase.table("offer_reminders").select("*").eq(
            "user_id", str(current_user.id)
        ).eq("offer_id", offer_id).eq("is_active", True).execute()
        
        if not reminder_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reminder not found"
            )
        
        # Deactivate the reminder
        supabase.table("offer_reminders").update({
            "is_active": False,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", reminder_result.data[0]['id']).execute()
        
        return {
            "message": "Reminder removed successfully",
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error removing reminder: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove reminder: {str(e)}"
        )


@router.get("/reminders")
async def get_my_reminders(
    current_user: UserProfile = Depends(get_current_active_user)
):
    """Get all active reminders for the current user"""
    
    try:
        # Get active reminders with offer details
        reminders_result = supabase.table("offer_reminders").select(
            """
            *,
            offers(
                *,
                products(*),
                businesses(
                    business_name,
                    business_address,
                    avatar_url,
                    is_verified,
                    latitude,
                    longitude
                )
            )
            """
        ).eq("user_id", str(current_user.id)).eq("is_active", True).order(
            "created_at", desc=True
        ).execute()
        
        if not reminders_result.data:
            return {
                "reminders": [],
                "total": 0
            }
        
        # Filter out reminders for offers that have already started or expired
        now = datetime.now(timezone.utc)
        active_reminders = []
        
        for reminder in reminders_result.data:
            if reminder.get('offers'):
                offer = reminder['offers']
                start_date = datetime.fromisoformat(offer['start_date'].replace('Z', '+00:00'))
                expiry_date = datetime.fromisoformat(offer['expiry_date'].replace('Z', '+00:00'))
                
                # Only include if offer hasn't started yet and hasn't expired
                if start_date > now and expiry_date > now:
                    active_reminders.append(reminder)
        
        # Convert decimals
        active_reminders = convert_decimals_to_float(active_reminders)
        
        return {
            "reminders": active_reminders,
            "total": len(active_reminders)
        }
        
    except Exception as e:
        print(f"Error fetching reminders: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch reminders: {str(e)}"
        )
@router.get("/offers/{offer_id}", response_model=dict)
async def get_offer_details(
    offer_id: str,
    current_user: Optional[UserProfile] = Depends(get_current_user_optional)
):
    """Get detailed offer information with calculation examples"""
    
    try:
        # Get offer with all related data including complete business info
        result = supabase.table("offers").select(
            "*, products(*, categories(*)), businesses(business_name, is_verified, avatar_url, business_address, latitude, longitude, phone_number, business_website, business_hours)"
        ).eq("id", offer_id).eq("is_active", True).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found or inactive"
            )
        
        offer_data = convert_decimals_to_float(result.data[0])
        
        # Fix structure for frontend
        if 'products' in offer_data:
            offer_data['product'] = offer_data['products']
            del offer_data['products']
        if 'businesses' in offer_data:
            offer_data['business'] = offer_data['businesses']
            del offer_data['businesses']
        
        # Add enhanced display information
        offer_data['display_text'] = OfferCalculator.get_offer_display_text(offer_data)
        offer_data['conditions_text'] = get_offer_conditions_text(offer_data)
        
        # Add calculation examples for different quantities
        item_price = float(offer_data['product']['price']) if offer_data['product']['price'] else 0
        calculation_examples = []
        
        # Generate examples based on offer type
        if offer_data['discount_type'] in ['percentage', 'fixed']:
            quantities = [1, 2, 5]
        elif offer_data['discount_type'] == 'quantity_discount':
            min_qty = offer_data.get('minimum_quantity', 1)
            quantities = [min_qty - 1, min_qty, min_qty + 2] if min_qty > 1 else [1, 3, 5]
        elif offer_data['discount_type'] == 'bogo':
            buy_qty = offer_data.get('buy_quantity', 1)
            quantities = [buy_qty - 1, buy_qty, buy_qty * 2] if buy_qty > 1 else [1, 2, 4]
        else:
            quantities = [1, 2, 5]
        
        for qty in quantities:
            if qty > 0:
                calc_result = OfferCalculator.calculate_discount(
                    offer_data=offer_data,
                    quantity=qty,
                    cart_total=item_price * qty,  # Simple cart total for examples
                    item_price=item_price
                )
                calculation_examples.append({
                    'quantity': qty,
                    'calculation': calc_result
                })
        
        offer_data['calculation_examples'] = calculation_examples
        
        # Check if user has saved or claimed this offer
        if current_user:
            # Check if saved
            saved_check = supabase.table("saved_offers").select("id").eq("user_id", str(current_user.id)).eq("offer_id", offer_id).execute()
            offer_data['is_saved'] = len(saved_check.data) > 0
            
            # Check if claimed
            claimed_check = supabase.table("claimed_offers").select("id, is_redeemed").eq("user_id", str(current_user.id)).eq("offer_id", offer_id).execute()
            offer_data['is_claimed'] = len(claimed_check.data) > 0
            if offer_data['is_claimed']:
                offer_data['is_redeemed'] = claimed_check.data[0]['is_redeemed']
        else:
            offer_data['is_saved'] = False
            offer_data['is_claimed'] = False
            offer_data['is_redeemed'] = False
        
        # Check if offer is still available for claiming
        max_claims = offer_data.get('max_claims')
        current_claims = offer_data.get('current_claims', 0)
        offer_data['can_claim'] = max_claims is None or current_claims < max_claims
        offer_data['claims_remaining'] = None if max_claims is None else max_claims - current_claims

        # Get total claim and redemption statistics in a single query
        try:
            all_claims = supabase.table("claimed_offers").select("id, is_redeemed").eq("offer_id", offer_id).execute()
            all_claims_data = all_claims.data or []
            offer_data['claimed_count'] = len(all_claims_data)
            offer_data['redeemed_count'] = sum(1 for c in all_claims_data if c.get('is_redeemed'))
        except Exception as stats_error:
            offer_data['claimed_count'] = 0
            offer_data['redeemed_count'] = 0

        return {"offer": offer_data}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting offer details: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve offer: {str(e)}"
        )


@router.post("/offers/{offer_id}/calculate", response_model=dict)
async def calculate_customer_discount(
    offer_id: str,
    calculation_request: Dict[str, Any]
):
    """Calculate discount for a customer's specific purchase scenario"""
    
    try:
        quantity = calculation_request.get("quantity", 1)
        cart_total = calculation_request.get("cart_total")
        
        # Get offer data
        result = supabase.table("offers").select(
            "*, products(price)"
        ).eq("id", offer_id).eq("is_active", True).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found or inactive"
            )
        
        offer_data = result.data[0]
        item_price = float(offer_data["products"]["price"]) if offer_data["products"]["price"] else 0
        
        # Calculate discount
        calculation_result = OfferCalculator.calculate_discount(
            offer_data=offer_data,
            quantity=quantity,
            cart_total=cart_total,
            item_price=item_price
        )
        
        return {
            "calculation": calculation_result,
            "offer_display_text": OfferCalculator.get_offer_display_text(offer_data),
            "item_price": item_price,
            "quantity": quantity
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error calculating customer discount: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Calculation failed: {str(e)}"
        )


# ============================================================================
# UNIFIED OFFERS ENDPOINT (Regular + Superadmin)
# ============================================================================

@router.get("/all-offers", response_model=dict)
async def get_all_offers(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    lat: Optional[float] = Query(None, description="User latitude for distance calculation", ge=-90, le=90),
    lng: Optional[float] = Query(None, description="User longitude for distance calculation", ge=-180, le=180),
    category_id: Optional[int] = Query(None, description="Filter by category"),
    user: Optional[UserProfile] = Depends(get_current_user_optional)
):
    """
    Get all offers (both regular business offers and superadmin demo offers).
    Superadmin offers are marked with source='superadmin' and cannot be claimed.
    Regular offers are marked with source='business'.
    """
    from app.core.config import settings

    try:
        current_time = datetime.now(timezone.utc).isoformat()
        all_offers = []

        # ===== FETCH REGULAR BUSINESS OFFERS =====
        query = supabase.table("offers").select(
            "*, businesses!inner(id, business_name, is_verified, avatar_url, business_address, latitude, longitude, category_id), products(name, image_url)"
        ).eq("is_active", True).gte("expiry_date", current_time).lte("start_date", current_time)

        if category_id:
            query = query.eq("businesses.category_id", category_id)

        result = query.execute()
        business_offers = result.data or []

        # Transform and mark as business source
        for offer in business_offers:
            offer_copy = offer.copy()
            offer_copy['source'] = 'business'
            offer_copy['can_claim'] = True  # Regular offers can be claimed
            offer_copy['is_demo'] = False

            # Flatten business data
            if 'businesses' in offer_copy:
                offer_copy['business'] = offer_copy['businesses']
                del offer_copy['businesses']

            # Calculate distance if lat/lng provided
            if lat is not None and lng is not None:
                business = offer_copy.get('business', {})
                business_lat = business.get('latitude')
                business_lng = business.get('longitude')

                if business_lat and business_lng:
                    from math import radians, sin, cos, sqrt, atan2
                    R = 6371  # Earth's radius in km
                    lat1, lng1 = radians(lat), radians(lng)
                    lat2, lng2 = radians(float(business_lat)), radians(float(business_lng))
                    dlat, dlng = lat2 - lat1, lng2 - lng1
                    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlng/2)**2
                    c = 2 * atan2(sqrt(a), sqrt(1-a))
                    offer_copy['distance_km'] = round(R * c, 2)

            all_offers.append(offer_copy)

        # ===== FETCH SUPERADMIN OFFERS (if feature enabled) =====
        if settings.enable_superadmin_offers:
            # Use supabase_admin to fetch superadmin offers (bypasses RLS to ensure all fields are returned)
            sa_query = supabase_admin.table("superadmin_offers").select(
                "*, superadmin_businesses(*)"
            ).eq("is_active", True).gte("expiry_date", current_time).lte("start_date", current_time)

            if category_id:
                sa_query = sa_query.eq("superadmin_businesses.category_id", category_id)

            sa_result = sa_query.execute()
            superadmin_offers = sa_result.data or []

            # Transform and mark as superadmin source
            for sa_offer in superadmin_offers:
                business = sa_offer.get('superadmin_businesses', {})

                # Debug: log image_url for superadmin offers
                print(f"[DEBUG] Superadmin offer {sa_offer.get('id')}: image_url = {sa_offer.get('image_url')}")

                # Extract and convert price fields properly
                original_price = float(sa_offer.get('original_price') or 0)
                discounted_price = float(sa_offer.get('discounted_price') or 0)
                discount_value = float(sa_offer.get('discount_value') or 0)

                # Calculate discount percentage for display
                if sa_offer.get('discount_type') == 'percentage':
                    discount_percentage = discount_value
                elif original_price and original_price > 0:
                    saving = original_price - discounted_price
                    discount_percentage = round((saving / original_price) * 100, 1)
                else:
                    discount_percentage = 0

                # Build images array from image_url for frontend compatibility
                sa_image_url = sa_offer.get('image_url')
                sa_images = []
                if sa_image_url:
                    if not sa_image_url.startswith('http'):
                        sa_image_url = f"https://lwwhsiaqvkjtlqaxkads.supabase.co/storage/v1/object/public/product-images/{sa_image_url}"
                    sa_images = [sa_image_url]

                offer_dict = {
                    'id': sa_offer.get('id'),
                    # Map offer_title/offer_description to title/description for frontend
                    'title': sa_offer.get('offer_title') or sa_offer.get('title'),
                    'offer_title': sa_offer.get('offer_title'),  # Keep original field
                    'description': sa_offer.get('offer_description') or sa_offer.get('description'),
                    'offer_description': sa_offer.get('offer_description'),  # Keep original field
                    'image_url': sa_image_url,  # Offer image (full URL)
                    'images': sa_images,  # Images array for frontend compatibility
                    'discount_type': sa_offer.get('discount_type'),
                    'discount_value': discount_value,
                    'discount_percentage': discount_percentage,  # Add calculated percentage
                    'original_price': original_price,
                    'discounted_price': discounted_price,
                    'start_date': sa_offer.get('start_date'),
                    'expiry_date': sa_offer.get('expiry_date'),
                    'max_claims': sa_offer.get('max_claims'),
                    'current_claims': sa_offer.get('current_claims', 0),
                    'terms_conditions': sa_offer.get('terms_conditions'),
                    'is_active': sa_offer.get('is_active'),
                    'created_at': sa_offer.get('created_at'),

                    # Mark as superadmin offer
                    'source': 'superadmin',
                    'can_claim': False,  # Superadmin offers CANNOT be claimed
                    'is_demo': True,

                    # Business data
                    'business': {
                        'id': business.get('id'),
                        'business_name': business.get('business_name'),
                        'is_verified': False,  # Demo businesses are not verified
                        'avatar_url': business.get('avatar_url'),
                        'business_address': business.get('business_address'),
                        'latitude': business.get('latitude'),
                        'longitude': business.get('longitude'),
                        'phone_number': business.get('phone_number'),
                        'business_website': business.get('business_website'),
                        'category_id': business.get('category_id'),
                    } if business else None
                }

                # Calculate distance if lat/lng provided
                if lat is not None and lng is not None and business:
                    business_lat = business.get('latitude')
                    business_lng = business.get('longitude')

                    if business_lat and business_lng:
                        from math import radians, sin, cos, sqrt, atan2
                        R = 6371  # Earth's radius in km
                        lat1, lng1 = radians(lat), radians(lng)
                        lat2, lng2 = radians(float(business_lat)), radians(float(business_lng))
                        dlat, dlng = lat2 - lat1, lng2 - lng1
                        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlng/2)**2
                        c = 2 * atan2(sqrt(a), sqrt(1-a))
                        offer_dict['distance_km'] = round(R * c, 2)

                all_offers.append(offer_dict)

        # ===== SORT AND PAGINATE =====
        # Sort by distance if lat/lng provided, otherwise by created date
        if lat is not None and lng is not None:
            all_offers.sort(key=lambda x: x.get('distance_km', float('inf')))
        else:
            all_offers.sort(key=lambda x: x.get('created_at', ''), reverse=True)

        # Pagination
        total = len(all_offers)
        offset = (page - 1) * size
        paginated_offers = all_offers[offset:offset + size]
        has_next = offset + size < total

        # Convert decimals to float
        paginated_offers = convert_decimals_to_float(paginated_offers)

        return {
            "offers": paginated_offers,
            "total": total,
            "page": page,
            "size": size,
            "has_next": has_next,
            "counts": {
                "business_offers": len([o for o in all_offers if o.get('source') == 'business']),
                "demo_offers": len([o for o in all_offers if o.get('source') == 'superadmin'])
            }
        }

    except Exception as e:
        print(f"Error fetching all offers: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch offers: {str(e)}"
        )


@router.get("/all-offers/{offer_id}", response_model=dict)
async def get_unified_offer_details(
    offer_id: str,
    current_user: Optional[UserProfile] = Depends(get_current_user_optional)
):
    """
    Get detailed offer information from either business or superadmin offers.
    This endpoint unifies access to both offer types for the customer frontend.
    """

    try:
        offer_data = None
        source = None
        can_claim = True
        is_demo = False

        # First, try to get from business offers
        result = supabase.table("offers").select(
            "*, products(*, categories(*)), businesses(business_name, is_verified, avatar_url, business_address, latitude, longitude, phone_number, business_website, business_hours)"
        ).eq("id", offer_id).eq("is_active", True).execute()

        if result.data:
            offer_data = convert_decimals_to_float(result.data[0])
            source = "business"

            # Fix structure for frontend
            if 'products' in offer_data:
                offer_data['product'] = offer_data['products']
                del offer_data['products']
            if 'businesses' in offer_data:
                offer_data['business'] = offer_data['businesses']
                del offer_data['businesses']
        else:
            # Not found in business offers, try superadmin offers
            if settings.enable_superadmin_offers:
                result = supabase_admin.table("superadmin_offers").select(
                    "*, superadmin_businesses(*)"
                ).eq("id", offer_id).eq("is_active", True).execute()

                if result.data:
                    offer_data = convert_decimals_to_float(result.data[0])
                    source = "superadmin"
                    can_claim = False  # Demo offers cannot be claimed
                    is_demo = True

                    # Ensure price fields are properly set as floats
                    offer_data['original_price'] = float(offer_data.get('original_price') or 0)
                    offer_data['discounted_price'] = float(offer_data.get('discounted_price') or 0)
                    offer_data['discount_value'] = float(offer_data.get('discount_value') or 0)

                    # Map offer_title to title for frontend compatibility
                    if 'offer_title' in offer_data and 'title' not in offer_data:
                        offer_data['title'] = offer_data['offer_title']

                    # Map offer_description to description for frontend compatibility
                    if 'offer_description' in offer_data and 'description' not in offer_data:
                        offer_data['description'] = offer_data['offer_description']

                    # Calculate discount percentage for display
                    if offer_data['discount_type'] == 'percentage':
                        offer_data['discount_percentage'] = offer_data['discount_value']
                    elif offer_data['original_price'] and offer_data['original_price'] > 0:
                        saving = offer_data['original_price'] - offer_data['discounted_price']
                        offer_data['discount_percentage'] = round((saving / offer_data['original_price']) * 100, 1)
                    else:
                        offer_data['discount_percentage'] = 0

                    # Transform superadmin offer to match business offer structure
                    if 'superadmin_businesses' in offer_data:
                        business_data = offer_data['superadmin_businesses']
                        # Create a business object that matches the expected structure
                        offer_data['business'] = {
                            'business_name': business_data.get('business_name'),
                            'is_verified': False,  # Superadmin businesses are not verified
                            'avatar_url': None,
                            'business_address': business_data.get('business_address'),
                            'latitude': business_data.get('latitude'),
                            'longitude': business_data.get('longitude'),
                            'phone_number': business_data.get('phone_number'),
                            'business_website': business_data.get('business_website'),
                            'business_hours': business_data.get('business_hours')
                        }
                        del offer_data['superadmin_businesses']

                    # Ensure image_url is a full URL and build images array
                    detail_image_url = offer_data.get('image_url')
                    if detail_image_url and not detail_image_url.startswith('http'):
                        detail_image_url = f"https://lwwhsiaqvkjtlqaxkads.supabase.co/storage/v1/object/public/product-images/{detail_image_url}"
                        offer_data['image_url'] = detail_image_url
                    offer_data['images'] = [detail_image_url] if detail_image_url else []

                    # Create a mock product object for display
                    offer_data['product'] = {
                        'id': None,
                        'price': offer_data['original_price'],  # Use the already validated float
                        'image_url': detail_image_url,  # Use offer's image (full URL)
                        'product_name': offer_data.get('offer_title') or offer_data.get('title'),
                        'description': offer_data.get('offer_description') or offer_data.get('description'),
                        'categories': None
                    }

        if not offer_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found or inactive"
            )

        # Add source metadata
        offer_data['source'] = source
        offer_data['can_claim'] = can_claim
        offer_data['is_demo'] = is_demo

        # Add enhanced display information
        offer_data['display_text'] = OfferCalculator.get_offer_display_text(offer_data)
        offer_data['conditions_text'] = get_offer_conditions_text(offer_data)

        # Add calculation examples for different quantities
        item_price = float(offer_data['product']['price']) if offer_data['product']['price'] else 0
        calculation_examples = []

        # Generate examples based on offer type
        if offer_data['discount_type'] in ['percentage', 'fixed']:
            quantities = [1, 2, 5]
        elif offer_data['discount_type'] == 'quantity_discount':
            min_qty = offer_data.get('minimum_quantity', 1)
            quantities = [min_qty - 1, min_qty, min_qty + 2] if min_qty > 1 else [1, 3, 5]
        elif offer_data['discount_type'] == 'bogo':
            buy_qty = offer_data.get('buy_quantity', 1)
            quantities = [buy_qty - 1, buy_qty, buy_qty * 2] if buy_qty > 1 else [1, 2, 4]
        else:
            quantities = [1, 2, 5]

        for qty in quantities:
            if qty > 0:
                calc_result = OfferCalculator.calculate_discount(
                    offer_data=offer_data,
                    quantity=qty,
                    cart_total=item_price * qty,
                    item_price=item_price
                )
                calculation_examples.append({
                    'quantity': qty,
                    'calculation': calc_result
                })

        offer_data['calculation_examples'] = calculation_examples

        # For business offers, check if user has saved or claimed
        if source == "business" and current_user:
            # Check if saved
            saved_check = supabase.table("saved_offers").select("id").eq("user_id", str(current_user.id)).eq("offer_id", offer_id).execute()
            offer_data['is_saved'] = len(saved_check.data) > 0

            # Check if claimed
            claimed_check = supabase.table("claimed_offers").select("id, is_redeemed").eq("user_id", str(current_user.id)).eq("offer_id", offer_id).execute()
            offer_data['is_claimed'] = len(claimed_check.data) > 0
            if offer_data['is_claimed']:
                offer_data['is_redeemed'] = claimed_check.data[0]['is_redeemed']

            # Check if user has an active reminder for this offer
            reminder_check = supabase.table("offer_reminders").select("id").eq("user_id", str(current_user.id)).eq("offer_id", offer_id).eq("is_active", True).execute()
            offer_data['has_reminder'] = len(reminder_check.data) > 0

            # Get claim statistics in a single query
            all_claims = supabase.table("claimed_offers").select("id, is_redeemed").eq("offer_id", offer_id).execute()
            all_claims_data = all_claims.data or []
            offer_data['claimed_count'] = len(all_claims_data)
            offer_data['redeemed_count'] = sum(1 for c in all_claims_data if c.get('is_redeemed'))
        else:
            # Demo offers or unauthenticated users
            offer_data['is_saved'] = False
            offer_data['is_claimed'] = False
            offer_data['is_redeemed'] = False
            offer_data['has_reminder'] = False
            offer_data['claimed_count'] = 0
            offer_data['redeemed_count'] = 0

        # Check if offer is still available for claiming (business offers only)
        if source == "business":
            max_claims = offer_data.get('max_claims')
            current_claims = offer_data.get('current_claims', 0)
            offer_data['can_claim'] = max_claims is None or current_claims < max_claims
            offer_data['claims_remaining'] = None if max_claims is None else max_claims - current_claims
        else:
            offer_data['claims_remaining'] = 0

        return {"offer": offer_data}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting unified offer details: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve offer: {str(e)}"
        )


def get_offer_conditions_text(offer_data: Dict[str, Any]) -> Optional[str]:
    """Generate human-readable conditions text for an offer"""
    discount_type = offer_data.get('discount_type')
    conditions = []
    
    if discount_type == 'minimum_purchase':
        min_purchase = offer_data.get('minimum_purchase_amount', 0)
        conditions.append(f"Minimum purchase of ${min_purchase:.2f} required")
    
    elif discount_type == 'quantity_discount':
        min_qty = offer_data.get('minimum_quantity', 0)
        conditions.append(f"Must purchase {min_qty} or more items")
    
    elif discount_type == 'bogo':
        buy_qty = offer_data.get('buy_quantity', 1)
        conditions.append(f"Must purchase at least {buy_qty} items to qualify")
    
    # Add general conditions
    max_claims = offer_data.get('max_claims')
    if max_claims:
        current_claims = offer_data.get('current_claims', 0)
        remaining = max_claims - current_claims
        if remaining > 0:
            conditions.append(f"Limited offer - {remaining} claims remaining")
        else:
            conditions.append("Offer no longer available")
    
    # Add expiry info
    expiry_date = offer_data.get('expiry_date')
    if expiry_date:
        if isinstance(expiry_date, str):
            expiry_dt = datetime.fromisoformat(expiry_date.replace('Z', '+00:00'))
        else:
            expiry_dt = expiry_date
        
        now = datetime.now(timezone.utc)
        if expiry_dt > now:
            days_remaining = (expiry_dt - now).days
            if days_remaining == 0:
                conditions.append("Expires today")
            elif days_remaining == 1:
                conditions.append("Expires tomorrow")
            else:
                conditions.append(f"Expires in {days_remaining} days")
        else:
            conditions.append("Expired")
    
    return " • ".join(conditions) if conditions else None


def convert_decimals_to_float(data):
    """Convert Decimal fields to float in a dictionary or list"""
    from decimal import Decimal
    if isinstance(data, dict):
        return {key: convert_decimals_to_float(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [convert_decimals_to_float(item) for item in data]
    elif isinstance(data, Decimal):
        return float(data)
    else:
        return data

