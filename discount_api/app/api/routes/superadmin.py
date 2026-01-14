"""
Superadmin Routes - For temporary demo offer creation during user acquisition phase
IMPORTANT: These routes are for temporary functionality and can be completely removed
Uses Supabase client for consistency with the rest of the application
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
import uuid
from datetime import datetime

from app.core.database import supabase, supabase_admin
from app.utils.dependencies import get_current_superadmin_user
from app.schemas.user import UserProfile
from app.schemas.superadmin import (
    SuperadminBusinessCreate,
    SuperadminBusinessUpdate,
    SuperadminBusinessResponse,
    SuperadminBusinessListResponse,
    SuperadminOfferCreate,
    SuperadminOfferUpdate,
    SuperadminOfferResponse,
    SuperadminOfferListResponse,
    SuperadminOfferWithBusinessCreate,
    SuperadminOfferWithBusinessResponse,
)

router = APIRouter(prefix="/superadmin", tags=["superadmin"])


# ============================================================================
# BUSINESS ENDPOINTS
# ============================================================================

@router.post("/businesses", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_superadmin_business(
    business_data: SuperadminBusinessCreate,
    current_user: UserProfile = Depends(get_current_superadmin_user)
):
    """
    Create a demo business for testing purposes.
    Only accessible by superadmins.
    """
    try:
        # Prepare business data
        data = business_data.model_dump()
        data['created_by_admin'] = str(current_user.id)
        data['id'] = str(uuid.uuid4())
        data['created_at'] = datetime.utcnow().isoformat()
        data['updated_at'] = datetime.utcnow().isoformat()

        # Insert into superadmin_businesses table
        result = supabase_admin.table("superadmin_businesses").insert(data).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create business"
            )

        return result.data[0]

    except Exception as e:
        print(f"Error creating superadmin business: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create business: {str(e)}"
        )


@router.get("/businesses", response_model=dict)
async def list_superadmin_businesses(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    is_active: Optional[bool] = Query(None),
    category_id: Optional[int] = Query(None),
    current_user: UserProfile = Depends(get_current_superadmin_user)
):
    """
    List all superadmin businesses with pagination.
    Only accessible by superadmins.
    """
    try:
        # Build query
        query = supabase_admin.table("superadmin_businesses").select("*", count="exact")

        # Apply filters
        if is_active is not None:
            query = query.eq("is_active", is_active)
        if category_id:
            query = query.eq("category_id", category_id)

        # Get total count
        count_result = query.execute()
        total = count_result.count if count_result.count else 0

        # Apply pagination
        offset = (page - 1) * size
        query = query.order("created_at", desc=True).range(offset, offset + size - 1)

        result = query.execute()
        businesses = result.data or []

        has_next = offset + size < total

        return {
            "businesses": businesses,
            "total": total,
            "page": page,
            "size": size,
            "has_next": has_next
        }

    except Exception as e:
        print(f"Error listing superadmin businesses: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list businesses: {str(e)}"
        )


@router.get("/businesses/{business_id}", response_model=dict)
async def get_superadmin_business(
    business_id: str,
    current_user: UserProfile = Depends(get_current_superadmin_user)
):
    """
    Get a specific superadmin business by ID.
    Only accessible by superadmins.
    """
    try:
        result = supabase_admin.table("superadmin_businesses").select("*").eq("id", business_id).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting superadmin business: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get business: {str(e)}"
        )


@router.put("/businesses/{business_id}", response_model=dict)
async def update_superadmin_business(
    business_id: str,
    business_data: SuperadminBusinessUpdate,
    current_user: UserProfile = Depends(get_current_superadmin_user)
):
    """
    Update a superadmin business.
    Only accessible by superadmins.
    """
    try:
        # Prepare update data
        update_data = business_data.model_dump(exclude_unset=True)
        update_data['updated_at'] = datetime.utcnow().isoformat()

        # Update business
        result = supabase_admin.table("superadmin_businesses").update(update_data).eq("id", business_id).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating superadmin business: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update business: {str(e)}"
        )


@router.delete("/businesses/{business_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_superadmin_business(
    business_id: str,
    current_user: UserProfile = Depends(get_current_superadmin_user)
):
    """
    Delete a superadmin business and all its offers.
    Only accessible by superadmins.
    """
    try:
        result = supabase_admin.table("superadmin_businesses").delete().eq("id", business_id).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )

        return None

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting superadmin business: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete business: {str(e)}"
        )


# ============================================================================
# OFFER ENDPOINTS
# ============================================================================

@router.post("/offers", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_superadmin_offer_with_business(
    offer_data: SuperadminOfferWithBusinessCreate,
    current_user: UserProfile = Depends(get_current_superadmin_user)
):
    """
    Create a demo offer with business details in one request.
    This is the main endpoint for the specialized superadmin form.
    Only accessible by superadmins.
    """
    try:
        business_id = None

        # Check if using existing business or creating new one
        if offer_data.existing_business_id:
            # Use existing business
            business_result = supabase_admin.table("superadmin_businesses").select("*").eq(
                "id", str(offer_data.existing_business_id)
            ).execute()

            if not business_result.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Existing business not found"
                )

            business = business_result.data[0]
            business_id = business['id']
        else:
            # Create new business
            business_data = {
                'id': str(uuid.uuid4()),
                'created_by_admin': str(current_user.id),
                'business_name': offer_data.business_name,
                'business_description': offer_data.business_description,
                'business_address': offer_data.business_address,
                'phone_number': offer_data.phone_number,
                'business_website': offer_data.business_website,
                'avatar_url': offer_data.avatar_url,
                'business_hours': offer_data.business_hours,
                'category_id': offer_data.category_id,
                'latitude': offer_data.latitude,
                'longitude': offer_data.longitude,
                'formatted_address': offer_data.formatted_address,
                'place_id': offer_data.place_id,
                'address_components': offer_data.address_components,
                'is_active': True,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }

            business_result = supabase_admin.table("superadmin_businesses").insert(business_data).execute()

            if not business_result.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create business"
                )

            business = business_result.data[0]
            business_id = business['id']

        # Create offer
        offer_insert_data = {
            'id': str(uuid.uuid4()),
            'superadmin_business_id': business_id,
            'created_by_admin': str(current_user.id),
            'title': offer_data.offer_title,
            'description': offer_data.offer_description,
            'discount_type': offer_data.discount_type,
            'discount_value': offer_data.discount_value,
            'original_price': offer_data.original_price,
            'discounted_price': offer_data.discounted_price,
            'start_date': offer_data.start_date.isoformat() if offer_data.start_date else None,
            'expiry_date': offer_data.expiry_date.isoformat() if offer_data.expiry_date else None,
            'max_claims': offer_data.max_claims,
            'current_claims': 0,
            'max_claims_per_user': offer_data.max_claims_per_user,
            'minimum_purchase_amount': offer_data.minimum_purchase_amount,
            'minimum_quantity': offer_data.minimum_quantity,
            'buy_quantity': offer_data.buy_quantity,
            'get_quantity': offer_data.get_quantity,
            'get_discount_percentage': offer_data.get_discount_percentage,
            'offer_parameters': offer_data.offer_parameters,
            'terms_conditions': offer_data.terms_conditions,
            'is_active': True,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }

        offer_result = supabase_admin.table("superadmin_offers").insert(offer_insert_data).execute()

        if not offer_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create offer"
            )

        offer = offer_result.data[0]

        return {
            "success": True,
            "message": "Offer created successfully",
            "business": business,
            "offer": offer
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating superadmin offer: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create offer: {str(e)}"
        )


@router.get("/offers", response_model=dict)
async def list_superadmin_offers(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    is_active: Optional[bool] = Query(None),
    business_id: Optional[str] = Query(None),
    discount_type: Optional[str] = Query(None),
    current_user: UserProfile = Depends(get_current_superadmin_user)
):
    """
    List all superadmin offers with pagination.
    Only accessible by superadmins.
    """
    try:
        # Build query
        query = supabase_admin.table("superadmin_offers").select(
            "*, superadmin_businesses(*)",
            count="exact"
        )

        # Apply filters
        if is_active is not None:
            query = query.eq("is_active", is_active)
        if business_id:
            query = query.eq("superadmin_business_id", business_id)
        if discount_type:
            query = query.eq("discount_type", discount_type)

        # Get total count
        count_result = query.execute()
        total = count_result.count if count_result.count else 0

        # Apply pagination
        offset = (page - 1) * size
        query = query.order("created_at", desc=True).range(offset, offset + size - 1)

        result = query.execute()
        offers = result.data or []

        # Transform response to match expected structure
        for offer in offers:
            if 'superadmin_businesses' in offer:
                offer['business'] = offer['superadmin_businesses']
                del offer['superadmin_businesses']

        has_next = offset + size < total

        return {
            "offers": offers,
            "total": total,
            "page": page,
            "size": size,
            "has_next": has_next
        }

    except Exception as e:
        print(f"Error listing superadmin offers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list offers: {str(e)}"
        )


@router.get("/offers/{offer_id}", response_model=dict)
async def get_superadmin_offer(
    offer_id: str,
    current_user: UserProfile = Depends(get_current_superadmin_user)
):
    """
    Get a specific superadmin offer by ID.
    Only accessible by superadmins.
    """
    try:
        result = supabase_admin.table("superadmin_offers").select(
            "*, superadmin_businesses(*)"
        ).eq("id", offer_id).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )

        offer = result.data[0]

        # Transform response
        if 'superadmin_businesses' in offer:
            offer['business'] = offer['superadmin_businesses']
            del offer['superadmin_businesses']

        return offer

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting superadmin offer: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get offer: {str(e)}"
        )


@router.put("/offers/{offer_id}", response_model=dict)
async def update_superadmin_offer(
    offer_id: str,
    offer_data: SuperadminOfferUpdate,
    current_user: UserProfile = Depends(get_current_superadmin_user)
):
    """
    Update a superadmin offer.
    Only accessible by superadmins.
    """
    try:
        # Prepare update data
        update_data = offer_data.model_dump(exclude_unset=True)

        # Convert datetime objects to ISO format strings
        if 'start_date' in update_data and update_data['start_date']:
            update_data['start_date'] = update_data['start_date'].isoformat() if hasattr(update_data['start_date'], 'isoformat') else update_data['start_date']
        if 'expiry_date' in update_data and update_data['expiry_date']:
            update_data['expiry_date'] = update_data['expiry_date'].isoformat() if hasattr(update_data['expiry_date'], 'isoformat') else update_data['expiry_date']

        update_data['updated_at'] = datetime.utcnow().isoformat()

        # Update offer
        result = supabase_admin.table("superadmin_offers").update(update_data).eq("id", offer_id).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )

        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating superadmin offer: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update offer: {str(e)}"
        )


@router.delete("/offers/{offer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_superadmin_offer(
    offer_id: str,
    current_user: UserProfile = Depends(get_current_superadmin_user)
):
    """
    Delete a superadmin offer.
    Only accessible by superadmins.
    """
    try:
        result = supabase_admin.table("superadmin_offers").delete().eq("id", offer_id).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )

        return None

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting superadmin offer: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete offer: {str(e)}"
        )
