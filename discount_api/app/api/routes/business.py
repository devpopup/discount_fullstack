# app/api/routes/business.py
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from typing import Optional, List
from datetime import datetime
import uuid
import os
from pathlib import Path
from decimal import Decimal

from datetime import datetime, timedelta
from datetime import timezone

from app.core.database import supabase, supabase_admin
from app.core.config import settings 
from app.schemas.business import (
    BusinessCreate, BusinessUpdate, BusinessResponse, BusinessListResponse,
    ProductCreate, ProductUpdate, ProductResponse, ProductListResponse,
    OfferCreate, OfferUpdate, OfferResponse, OfferListResponse,
    CategoryResponse, MessageResponse, BusinessUserRegistration
)
from app.schemas.user import UserProfile, UserResponse
from app.utils.dependencies import get_current_active_user, get_current_business_user

router = APIRouter(prefix="/business", tags=["Business"])


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


def prepare_data_for_supabase(data):
    """Convert UUID and Decimal objects to JSON-serializable types"""
    if isinstance(data, dict):
        return {key: prepare_data_for_supabase(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [prepare_data_for_supabase(item) for item in data]
    elif isinstance(data, uuid.UUID):
        return str(data)
    elif isinstance(data, Decimal):
        return float(data)
    else:
        return data

# ============================================================================
# PRODUCT MANAGEMENT WITH PAGINATION AND SEARCH
# ============================================================================

@router.get("/products", response_model=dict)
async def list_my_products(
    current_user: UserProfile = Depends(get_current_business_user),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    sortBy: str = Query("created_at", regex="^(created_at|name|price|updated_at)$"),
    sortOrder: str = Query("desc", regex="^(asc|desc)$")
):
    """List products for the current business with pagination and search"""
    
    try:
        # Get user's business
        business_result = supabase_admin.table("businesses").select("id, business_name").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        business_name = business_result.data[0]["business_name"]
        
        # Build query with proper category join
        query = supabase_admin.table("products").select(
            "*, categories(*)", 
            count="exact"
        ).eq("business_id", business_id)
        
        # Apply search filter
        if search:
            query = query.or_(f"name.ilike.%{search}%,description.ilike.%{search}%")
        
        # Apply sorting
        desc_order = sortOrder == "desc"
        query = query.order(sortBy, desc=desc_order)
        
        # Apply pagination
        offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1)
        
        result = query.execute()
        
        if not result.data:
            return {
                "success": True,
                "products": [],
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total": 0,
                    "pages": 0
                }
            }
        
        # Process products and ensure category data is properly formatted
        processed_products = []
        for product in result.data:
            product_data = convert_decimals_to_float(product)

            # Add business info to each product
            product_data["business"] = {
                "business_name": business_name
            }

            # Ensure category data is properly structured
            if product_data.get("categories"):
                # If categories is returned as object, keep it
                product_data["category"] = product_data["categories"]
            elif not product_data.get("category"):
                # If no category, set default
                product_data["category"] = None
                product_data["categories"] = None

            # Get count of active offers for this product
            active_offers_result = supabase_admin.table("offers").select("id", count="exact").eq("product_id", product['id']).eq("is_active", True).execute()
            product_data["active_offers_count"] = active_offers_result.count or 0

            processed_products.append(product_data)
        
        total = result.count if result.count else 0
        pages = (total + limit - 1) // limit
        
        return {
            "success": True,
            "products": processed_products,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": pages
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error listing products: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list products: {str(e)}"
        )


@router.post("/products", response_model=dict)
async def create_product(
    product_data: ProductCreate,
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Create a new product for the current business"""
    
    try:
        print(f"Creating product for user: {current_user.id}")
        print(f"Product data: {product_data}")
        
        # Get user's business
        business_result = supabase_admin.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found. Please register your business first."
            )
        
        business_id = business_result.data[0]["id"]
        print(f"Business ID: {business_id}")
        
        # Validate category exists if provided
        if product_data.category_id:
            category_check = supabase_admin.table("categories").select("id").eq("id", str(product_data.category_id)).execute()
            if not category_check.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid category ID"
                )
        
        # Create product
        product_dict = product_data.model_dump(exclude_none=True)
        product_dict["business_id"] = business_id
        product_dict["id"] = str(uuid.uuid4())
        
        # Ensure required fields have defaults
        if "is_active" not in product_dict:
            product_dict["is_active"] = True
        
        # Convert price to float to avoid Decimal serialization issues
        if "price" in product_dict and product_dict["price"] is not None:
            product_dict["price"] = float(product_dict["price"])
        
        # Convert UUID objects to strings for Supabase
        product_dict = prepare_data_for_supabase(product_dict)
        
        print(f"Inserting product: {product_dict}")
        
        # Use admin client to bypass RLS for business operations
        result = supabase_admin.table("products").insert(product_dict).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create product"
            )
        
        print(f"Product created: {result.data[0]}")
        
        # Get product with category info and convert any Decimal fields
        product_with_category = supabase_admin.table("products").select(
            "*, categories(*)"
        ).eq("id", result.data[0]["id"]).execute()
        
        # Convert Decimal fields to float for JSON serialization
        product_data = convert_decimals_to_float(product_with_category.data[0])
        
        return {"product": ProductResponse(**product_data)}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating product: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Product creation failed: {str(e)}"
        )


@router.get("/products/{product_id}", response_model=dict)
async def get_product(
    product_id: str,
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Get a specific product owned by the current business"""
    
    try:
        # Get user's business
        business_result = supabase_admin.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Get product
        result = supabase_admin.table("products").select(
            "*, categories(*)"
        ).eq("id", product_id).eq("business_id", business_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        # Convert Decimal fields to float for JSON serialization
        product_data = convert_decimals_to_float(result.data[0])
        
        return {"product": ProductResponse(**product_data)}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve product: {str(e)}"
        )


@router.patch("/products/{product_id}", response_model=dict)
async def update_product(
    product_id: str,
    product_update: ProductUpdate,
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Update a product owned by the current business"""
    
    try:
        # Get user's business
        business_result = supabase_admin.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Update product
        update_data = product_update.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Convert UUID objects to strings for Supabase
        update_data = prepare_data_for_supabase(update_data)
        
        result = supabase_admin.table("products").update(update_data).eq("id", product_id).eq("business_id", business_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        # Get updated product with category info
        product_with_category = supabase_admin.table("products").select(
            "*, categories(*)"
        ).eq("id", result.data[0]["id"]).execute()
        
        # Convert Decimal fields to float for JSON serialization
        product_data = convert_decimals_to_float(product_with_category.data[0])
        
        return {"product": ProductResponse(**product_data)}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Product update failed: {str(e)}"
        )


@router.delete("/products/{product_id}", response_model=MessageResponse)
async def delete_product(
    product_id: str,
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Delete a product owned by the current business"""
    
    try:
        # Get user's business
        business_result = supabase_admin.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Check if product has any active offers
        offers_result = supabase_admin.table("offers").select("id").eq("product_id", product_id).eq("is_active", True).execute()
        
        if offers_result.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete product with active offers. Please deactivate or delete the offers first."
            )
        
        # Delete product
        result = supabase_admin.table("products").delete().eq("id", product_id).eq("business_id", business_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        return MessageResponse(message="Product deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Delete failed: {str(e)}"
        )

# ============================================================================
# IMAGE UPLOAD WITH PROPER ERROR HANDLING
# ============================================================================

@router.post("/products/upload-image", response_model=dict)
async def upload_product_image(
    image: UploadFile = File(...),
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Upload product image with automatic compression and validation"""
    
    try:
        print(f"Starting image upload for user: {current_user.id}")
        print(f"File: {image.filename}, Content-Type: {image.content_type}, Size: {image.size if hasattr(image, 'size') else 'unknown'}")
        
        # Validate file type at upload level
        allowed_content_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if image.content_type not in allowed_content_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed."
            )
        
        # Read file content
        original_data = await image.read()
        print(f"Read {len(original_data)} bytes from uploaded file")
        
        # Import image utilities
        try:
            from app.utils.image_utils import validate_image_file, compress_image, get_image_info
        except ImportError as e:
            print(f"Failed to import image utilities: {e}")
            # Fallback: proceed without compression
            file_content = original_data
            compression_info = {"message": "Image utilities not available, using original"}
        else:
            # Validate the actual image data
            is_valid, validation_message = validate_image_file(original_data)
            if not is_valid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid image: {validation_message}"
                )
            
            # Get original image info
            original_info = get_image_info(original_data)
            print(f"Original image info: {original_info}")
            
            # Set size limit for Supabase (5MB max, but compress to 2MB for better performance)
            max_size = 2 * 1024 * 1024  # 2MB
            
            # Compress image if necessary
            width = original_info.get('width') or 0
            if len(original_data) > max_size or width > 1920:
                print(f"Compressing image from {len(original_data)} bytes...")
                file_content, compression_info = compress_image(
                    original_data, 
                    max_size_bytes=max_size,
                    quality=85,
                    max_dimension=1920
                )
                print(f"Compression info: {compression_info}")
            else:
                file_content = original_data
                compression_info = {
                    "original_size": len(original_data),
                    "compressed_size": len(original_data),
                    "compression_ratio": 0,
                    "message": "No compression needed"
                }
        
        # Final size check
        if len(file_content) > 5 * 1024 * 1024:  # Supabase hard limit
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image too large even after compression. Please use a smaller image."
            )
        
        # Generate unique filename (always .jpg after compression)
        file_extension = ".jpg" if compression_info.get("compression_ratio", 0) > 0 else os.path.splitext(image.filename)[1].lower()
        if not file_extension:
            file_extension = ".jpg"
            
        unique_filename = f"businesses/{str(current_user.id)}/{uuid.uuid4()}{file_extension}"
        
        print(f"Uploading: {unique_filename} ({len(file_content)} bytes)")
        
        # Upload using requests library for better error handling
        try:
            import requests
            
            upload_url = f"{settings.supabase_url}/storage/v1/object/product-images/{unique_filename}"
            
            headers = {
                "Authorization": f"Bearer {settings.supabase_service_role_key}",
                "Content-Type": image.content_type,
                "Cache-Control": "3600"
            }
            
            print(f"Making upload request to: {upload_url}")
            response = requests.post(upload_url, data=file_content, headers=headers, timeout=30)
            
            print(f"Upload response: {response.status_code}")
            if response.status_code not in [200, 201]:
                print(f"Upload failed with response: {response.text}")
                raise Exception(f"Upload failed: {response.status_code} - {response.text}")
            
            print("✅ Upload successful!")
            
        except requests.RequestException as e:
            print(f"❌ Upload request failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Upload failed: {str(e)}"
            )
        except Exception as upload_error:
            print(f"❌ Upload failed: {upload_error}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Upload failed: {str(upload_error)}"
            )
        
        # Generate public URL
        public_url = f"{settings.supabase_url}/storage/v1/object/public/product-images/{unique_filename}"
        
        # Create response with detailed info
        response_data = {
            "path": unique_filename,
            "url": public_url,
            "message": "Image uploaded successfully"
        }
        
        # Include compression info if available
        if compression_info:
            response_data["compression_info"] = compression_info
            if compression_info.get("compression_ratio", 0) > 0:
                response_data["compression_applied"] = True
                response_data["size_reduction"] = f"{compression_info['compression_ratio']:.1f}%"
            else:
                response_data["compression_applied"] = False
        
        print(f"Returning response: {response_data}")
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in image upload: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image upload failed: {str(e)}"
        )


# ============================================================================
# BUSINESS REGISTRATION/MANAGEMENT
# ============================================================================

@router.get("/profile", response_model=dict)
async def get_business_profile(
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Get current business profile"""
    
    try:
        # Get business profile
        result = supabase_admin.table("businesses").select(
            "*, categories(*)"
        ).eq("user_id", str(current_user.id)).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business profile not found"
            )
        
        # Convert any problematic fields
        business_data = convert_decimals_to_float(result.data[0])
        
        return {"business": BusinessResponse(**business_data)}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve business profile: {str(e)}"
        )


@router.post("/upload-logo", response_model=dict)
async def upload_business_logo(
    image: UploadFile = File(...),
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Upload business logo with automatic compression and validation"""
    
    try:
        print(f"Starting business logo upload for user: {current_user.id}")
        print(f"File: {image.filename}, Content-Type: {image.content_type}, Size: {image.size if hasattr(image, 'size') else 'unknown'}")
        
        # Validate file type at upload level
        allowed_content_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if image.content_type not in allowed_content_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed."
            )
        
        # Get user's business
        business_result = supabase_admin.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Read file content
        original_data = await image.read()
        print(f"Read {len(original_data)} bytes from uploaded file")
        
        # Import image utilities
        try:
            from app.utils.image_utils import validate_image_file, compress_image, get_image_info
        except ImportError as e:
            print(f"Failed to import image utilities: {e}")
            # Fallback: proceed without compression
            file_content = original_data
            compression_info = {"message": "Image utilities not available, using original"}
        else:
            # Validate the actual image data
            is_valid, validation_message = validate_image_file(original_data)
            if not is_valid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid image: {validation_message}"
                )
            
            # Get original image info
            original_info = get_image_info(original_data)
            print(f"Original image info: {original_info}")
            
            # Set size limit for Supabase (5MB max, but compress to 2MB for better performance)
            max_size = 2 * 1024 * 1024  # 2MB
            
            # Compress image if necessary (optimize for logos)
            width = original_info.get('width') or 0
            if len(original_data) > max_size or width > 800:
                print(f"Compressing logo from {len(original_data)} bytes...")
                file_content, compression_info = compress_image(
                    original_data, 
                    max_size_bytes=max_size,
                    quality=90,  # Higher quality for logos
                    max_dimension=800  # Good size for business logos
                )
                print(f"Compression info: {compression_info}")
            else:
                file_content = original_data
                compression_info = {
                    "original_size": len(original_data),
                    "compressed_size": len(original_data),
                    "compression_ratio": 0,
                    "message": "No compression needed"
                }
        
        # Final size check
        if len(file_content) > 5 * 1024 * 1024:  # Supabase hard limit
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image too large even after compression. Please use a smaller image."
            )
        
        # Generate unique filename (always .jpg after compression)
        file_extension = ".jpg" if compression_info.get("compression_ratio", 0) > 0 else os.path.splitext(image.filename)[1].lower()
        if not file_extension:
            file_extension = ".jpg"
            
        # Use consistent filename to overwrite previous logo
        consistent_filename = f"business-logos/{business_id}/logo{file_extension}"
        
        print(f"Uploading: {consistent_filename} ({len(file_content)} bytes)")
        
        # Upload using requests library with proper overwrite behavior
        try:
            import requests
            
            # First, try to delete the existing file (ignore if it doesn't exist)
            delete_url = f"{settings.supabase_url}/storage/v1/object/profile-images/{consistent_filename}"
            delete_headers = {
                "Authorization": f"Bearer {settings.supabase_service_role_key}"
            }
            
            print(f"Attempting to delete existing file: {delete_url}")
            delete_response = requests.delete(delete_url, headers=delete_headers, timeout=10)
            print(f"Delete response: {delete_response.status_code}")
            # Don't fail if delete doesn't work - file might not exist
            
            # Now upload the new file
            upload_url = f"{settings.supabase_url}/storage/v1/object/profile-images/{consistent_filename}"
            
            upload_headers = {
                "Authorization": f"Bearer {settings.supabase_service_role_key}",
                "Content-Type": image.content_type,
                "Cache-Control": "3600"
            }
            
            print(f"Making upload request to: {upload_url}")
            response = requests.post(upload_url, data=file_content, headers=upload_headers, timeout=30)
            
            print(f"Upload response: {response.status_code}")
            if response.status_code not in [200, 201]:
                print(f"Upload failed with response: {response.text}")
                raise Exception(f"Upload failed: {response.status_code} - {response.text}")
            
            print("✅ Upload successful!")
            
        except requests.RequestException as e:
            print(f"❌ Upload request failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Upload failed: {str(e)}"
            )
        except Exception as upload_error:
            print(f"❌ Upload failed: {upload_error}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Upload failed: {str(upload_error)}"
            )
        
        # Generate clean public URL (for database storage)
        clean_public_url = f"{settings.supabase_url}/storage/v1/object/public/profile-images/{consistent_filename}"
        
        # Generate cache-busted URL (for immediate display)
        import time
        cache_buster = int(time.time())
        display_url = f"{clean_public_url}?v={cache_buster}"
        
        # Update business record with clean URL (no cache buster in DB)
        update_result = supabase_admin.table("businesses").update({
            "avatar_url": clean_public_url,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", business_id).execute()
        
        if not update_result.data:
            print("Warning: Failed to update business record with logo URL")
        else:
            print(f"✅ Business record updated with logo URL: {clean_public_url}")
        
        # Create response with detailed info (return cache-busted URL for immediate display)
        response_data = {
            "path": consistent_filename,
            "url": display_url,  # Cache-busted for immediate display
            "clean_url": clean_public_url,  # Clean URL for reference
            "message": "Image uploaded successfully"
        }
        
        # Include compression info if available
        if compression_info:
            response_data["compression_info"] = compression_info
            if compression_info.get("compression_ratio", 0) > 0:
                response_data["compression_applied"] = True
                response_data["size_reduction"] = f"{compression_info['compression_ratio']:.1f}%"
            else:
                response_data["compression_applied"] = False
        
        print(f"Returning response: {response_data}")
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in business logo upload: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logo upload failed: {str(e)}"
        )


@router.put("/profile", response_model=dict)
async def update_business_profile(
    profile_update: dict,
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Update current business profile"""
    
    try:
        # Get business profile
        business_result = supabase_admin.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business profile not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Prepare update data - map frontend fields to database fields
        update_data = {}
        field_mapping = {
            "business_name": "business_name",
            "business_address": "business_address",
            "address": "business_address",
            "phone": "phone_number",
            "phone_number": "phone_number",
            "website": "business_website",
            "business_website": "business_website",
            "category": "category_id",
            "category_id": "category_id",
            "avatar_url": "avatar_url",
            "timezone": "timezone",
            "latitude": "latitude",
            "longitude": "longitude",
            "formatted_address": "formatted_address",
            "place_id": "place_id",
            "address_components": "address_components",
            "promotional_updates": "promotional_updates",
            "transaction_alerts": "transaction_alerts",
            "email_notifications": "email_notifications"
        }
        
        for frontend_field, db_field in field_mapping.items():
            if frontend_field in profile_update:
                value = profile_update[frontend_field]
                
                # Special handling for category - convert name to ID if needed
                if frontend_field == "category" and value:
                    # If it's already a UUID, use it directly
                    if isinstance(value, str) and len(value) == 36 and '-' in value:
                        update_data[db_field] = value
                    else:
                        # It's a category name, look up the ID
                        category_result = supabase_admin.table("categories").select("id").eq("name", value).execute()
                        if category_result.data:
                            update_data[db_field] = category_result.data[0]["id"]
                        else:
                            # Category not found, skip this field
                            print(f"Warning: Category '{value}' not found, skipping category update")
                            continue
                else:
                    # Handle website URL formatting and empty strings
                    if db_field == "business_website":
                        if not value or value.strip() == "":
                            update_data[db_field] = None
                        else:
                            # Ensure URL has proper protocol
                            url = value.strip()
                            if url and not url.startswith(('http://', 'https://')):
                                url = 'https://' + url
                            update_data[db_field] = url
                    else:
                        update_data[db_field] = value
        
        # Update user email separately if provided
        if "email" in profile_update:
            user_update_result = supabase_admin.table("profiles").update({
                "email": profile_update["email"]
            }).eq("id", str(current_user.id)).execute()
            
            if not user_update_result.data:
                print("Warning: Failed to update user email")
        
        # Add updated timestamp
        update_data["updated_at"] = datetime.utcnow().isoformat()

        # Debug: Print what we're about to update
        print(f"Updating business {business_id} with data: {update_data}")

        # Convert data for Supabase
        update_data = prepare_data_for_supabase(update_data)

        # Update business profile
        result = supabase_admin.table("businesses").update(update_data).eq("id", business_id).execute()

        # Debug: Print the result
        print(f"Update result: {result.data}")
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business profile not found"
            )
        
        # Get updated business profile with category info
        updated_business = supabase_admin.table("businesses").select(
            "*, categories(*)"
        ).eq("id", business_id).execute()
        
        # Convert any problematic fields
        business_data = convert_decimals_to_float(updated_business.data[0])
        
        return {"business": BusinessResponse(**business_data)}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating business profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update business profile: {str(e)}"
        )

# Update the existing register_business function in business.py

@router.post("/register", response_model=dict)
async def register_business(
    business_data: BusinessCreate,  # Now includes location fields
    current_user: UserProfile = Depends(get_current_active_user)
):
    """Register a business for the current user"""
    
    try:
        # Check if user already has a business
        existing_business = supabase_admin.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if existing_business.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already has a registered business"
            )
        
        # Validate category exists if provided
        if business_data.category_id:
            category_check = supabase_admin.table("categories").select("id").eq("id", str(business_data.category_id)).execute()
            if not category_check.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid category ID"
                )
        
        # Create business with location data
        business_dict = business_data.model_dump(exclude_none=True)
        business_dict["user_id"] = str(current_user.id)
        business_dict["id"] = str(uuid.uuid4())
        
        # Set default values for new fields if not provided
        if "timezone" not in business_dict:
            business_dict["timezone"] = "America/Toronto"
        if "promotional_updates" not in business_dict:
            business_dict["promotional_updates"] = True
        if "transaction_alerts" not in business_dict:
            business_dict["transaction_alerts"] = True
        if "email_notifications" not in business_dict:
            business_dict["email_notifications"] = True
        
        # Handle website URL formatting and empty strings for constraint compliance
        website = business_dict.get("business_website")
        if not website or website.strip() == "":
            business_dict["business_website"] = None
        else:
            # Ensure URL has proper protocol
            url = website.strip()
            if url and not url.startswith(('http://', 'https://')):
                url = 'https://' + url
            business_dict["business_website"] = url
        
        # Handle location data logging
        if business_data.latitude and business_data.longitude:
            print(f"Saving business with coordinates: {business_data.latitude}, {business_data.longitude}")
        elif business_data.business_address:
            print(f"Business address provided without coordinates: {business_data.business_address}")
        
        # Convert UUID objects to strings for Supabase
        business_dict = prepare_data_for_supabase(business_dict)
        
        result = supabase_admin.table("businesses").insert(business_dict).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to register business"
            )
        
        # Update user to be a business user
        supabase_admin.table("profiles").update({"is_business": True}).eq("id", str(current_user.id)).execute()
        
        # Get business with category info
        business_with_category = supabase_admin.table("businesses").select(
            "*, categories(*)"
        ).eq("id", result.data[0]["id"]).execute()
        
        # Convert any problematic fields
        business_data_response = convert_decimals_to_float(business_with_category.data[0])
        
        return {"business": BusinessResponse(**business_data_response)}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Business registration failed: {str(e)}"
        )


@router.post("/register-complete", response_model=dict)
async def register_business_user_complete(
    registration_data: BusinessUserRegistration
):
    try:
        print(f"Complete registration request: {registration_data.email}")
        
        # Check if user already exists
        existing_user = supabase_admin.table("profiles").select("email").eq("email", registration_data.email).execute()
        
        if existing_user.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user with Supabase Auth
        auth_response = supabase_admin.auth.admin.create_user({
            "email": registration_data.email,
            "password": registration_data.password,
            "email_confirm": True
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user account"
            )
        
        user_id = auth_response.user.id
        print(f"✅ Supabase Auth user created: {user_id}")
        
        # Check if profile was auto-created by a trigger
        existing_profile = supabase_admin.table("profiles").select("*").eq("id", user_id).execute()
        
        if existing_profile.data:
            # Profile exists, update it instead of creating
            print("Profile already exists, updating it...")
            update_data = {
                "first_name": registration_data.first_name,
                "last_name": registration_data.last_name,
                "phone": registration_data.phone or registration_data.phone_number,
                "is_business": True,
                "is_active": True
            }
            
            user_result = supabase_admin.table("profiles").update(update_data).eq("id", user_id).execute()
            print(f"✅ Profile updated: {user_result.data}")
        else:
            # Profile doesn't exist, create it
            print("Creating new profile...")
            user_data = {
                "id": user_id,
                "email": registration_data.email,
                "first_name": registration_data.first_name,
                "last_name": registration_data.last_name,
                "phone": registration_data.phone or registration_data.phone_number,
                "is_business": True,
                "is_active": True
            }
            
            user_result = supabase_admin.table("profiles").insert(user_data).execute()
            print(f"✅ Profile created: {user_result.data}")
        
        if not user_result.data:
            # Rollback: delete the auth user
            try:
                supabase_admin.auth.admin.delete_user(user_id)
            except:
                pass
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user profile"
            )
        
        # Validate category if provided
        if registration_data.category_id:
            category_check = supabase_admin.table("categories").select("id").eq("id", str(registration_data.category_id)).execute()
            if not category_check.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid category ID"
                )
        
        # Create business profile
        business_data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "business_name": registration_data.business_name,
            "business_description": registration_data.business_description,
            "business_address": registration_data.business_address,
            "phone_number": registration_data.business_phone or registration_data.phone_number,
            "business_website": registration_data.business_website,
            "avatar_url": registration_data.avatar_url,
            "business_hours": registration_data.business_hours,
            "category_id": str(registration_data.category_id) if registration_data.category_id else None,
            
            # Location fields
            "latitude": registration_data.latitude,
            "longitude": registration_data.longitude,
            "formatted_address": registration_data.formatted_address,
            "place_id": registration_data.place_id,
            "address_components": registration_data.address_components,
            
            # Settings with defaults
            "timezone": getattr(registration_data, 'timezone', 'America/Toronto'),
            "promotional_updates": getattr(registration_data, 'promotional_updates', True),
            "transaction_alerts": getattr(registration_data, 'transaction_alerts', True),
            "email_notifications": getattr(registration_data, 'email_notifications', True),
            
            "is_verified": False
        }
        
        # Handle website URL formatting and empty strings for constraint compliance
        website = business_data.get("business_website")
        if not website or website.strip() == "":
            business_data["business_website"] = None
        else:
            # Ensure URL has proper protocol
            url = website.strip()
            if url and not url.startswith(('http://', 'https://')):
                url = 'https://' + url
            business_data["business_website"] = url
        
        print("Creating business...")
        business_data = prepare_data_for_supabase(business_data)
        business_result = supabase_admin.table("businesses").insert(business_data).execute()
        print(f"✅ Business created: {business_result.data}")
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create business profile"
            )
        
        # Generate token
        from app.core.security import create_access_token
        access_token = create_access_token(subject=registration_data.email)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "email": registration_data.email,
                "first_name": registration_data.first_name,
                "last_name": registration_data.last_name,
                "phone": registration_data.phone or registration_data.phone_number,
                "is_business": True,
                "is_active": True
            },
            "message": "Registration successful"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Registration error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


# Location
# Add these to your business.py routes

@router.get("/location", response_model=dict)
async def get_business_location(
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Get current business location"""
    try:
        business_result = supabase_admin.table("businesses").select(
            "latitude, longitude, business_address, formatted_address, place_id"
        ).eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        return {"location": business_result.data[0]}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get location: {str(e)}"
        )

@router.put("/location", response_model=dict)
async def update_business_location(
    location_data: dict,
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Update business location"""
    try:
        update_data = {
            "latitude": location_data.get("latitude"),
            "longitude": location_data.get("longitude"),
            "business_address": location_data.get("business_address"),
            "formatted_address": location_data.get("formatted_address"),
            "place_id": location_data.get("place_id"),
            "address_components": location_data.get("address_components"),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        result = supabase_admin.table("businesses").update(update_data).eq("user_id", str(current_user.id)).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        return {"message": "Location updated successfully", "location": result.data[0]}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update location: {str(e)}"
        )

# app/api/routes/business.py - Add these offer endpoints to the existing file

# ============================================================================
# OFFER MANAGEMENT WITH PAGINATION AND SEARCH
# ============================================================================

@router.get("/offers", response_model=dict)
async def list_my_offers(
    current_user: UserProfile = Depends(get_current_business_user),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None, regex="^(active|inactive|expired|upcoming)$"),
    product_id: Optional[str] = Query(None),
    sortBy: str = Query("created_at", regex="^(created_at|expiry_date|discount_percentage|current_claims)$"),
    sortOrder: str = Query("desc", regex="^(asc|desc)$")
):
    """List offers for the current business with pagination and search"""
    
    try:
        # Get user's business
        business_result = supabase_admin.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        current_time = datetime.utcnow().isoformat()
        
        # Build query
        query = supabase_admin.table("offers").select(
            "*, products(*, categories(*)), businesses(business_name)", 
            count="exact"
        ).eq("business_id", business_id)
        
        # Apply search filter
        if search:
            query = query.or_(f"title.ilike.%{search}%,description.ilike.%{search}%")
        
        # Apply status filter
        if status:
            if status == "active":
                query = query.eq("is_active", True).lte("start_date", current_time).gte("expiry_date", current_time)
            elif status == "inactive":
                query = query.eq("is_active", False)
            elif status == "expired":
                query = query.lt("expiry_date", current_time)
            elif status == "upcoming":
                query = query.gt("start_date", current_time)
        
        # Apply product filter
        if product_id:
            query = query.eq("product_id", product_id)
        
        # Apply sorting
        desc_order = sortOrder == "desc"
        query = query.order(sortBy, desc=desc_order)
        
        # Apply pagination
        offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1)
        
        result = query.execute()
        
        total = result.count if result.count else 0
        total_pages = (total + limit - 1) // limit
        
        # Convert any Decimal fields to float and fix structure
        offers_data = []
        for offer in result.data:
            offer_data = convert_decimals_to_float(offer)
            # Rename 'products' to 'product' for frontend consistency
            if 'products' in offer_data:
                offer_data['product'] = offer_data['products']
                del offer_data['products']

            # Calculate total units claimed for this offer
            claims_result = supabase_admin.table("claimed_offers").select("quantity").eq("offer_id", offer['id']).execute()
            total_units_claimed = sum(claim.get("quantity", 1) for claim in (claims_result.data or []))
            offer_data['total_units_claimed'] = total_units_claimed

            offers_data.append(offer_data)
        
        return {
            "offers": offers_data,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "totalPages": total_pages
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error listing offers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve offers: {str(e)}"
        )


@router.post("/offers", response_model=dict)
async def create_offer(
    offer_data: dict,
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Create a new offer with proper validation for all discount types"""
    
    try:
        # Get user's business
        business_result = supabase_admin.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Validate product exists and belongs to business
        product_result = supabase_admin.table("products").select("*").eq("id", offer_data["product_id"]).eq("business_id", business_id).execute()
        
        if not product_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        product = product_result.data[0]
        discount_type = offer_data.get("discount_type")
        
        # Validate discount type
        allowed_discount_types = ["percentage", "fixed", "minimum_purchase", "quantity_discount", "bogo"]
        if discount_type not in allowed_discount_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid discount type. Must be one of: {', '.join(allowed_discount_types)}"
            )
        
        # === ENHANCED VALIDATION AND DEFAULT VALUE SETTING ===

        # Validate geofence fields
        geofence_enabled = offer_data.get("geofence_enabled", False)
        geofence_radius = offer_data.get("geofence_radius", 1000)

        # Validate geofence radius
        if geofence_enabled and geofence_radius:
            if not isinstance(geofence_radius, int) or geofence_radius < 100 or geofence_radius > 5000:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Geofence radius must be between 100 and 5000 meters"
                )
        
        # Handle discount_value based on offer type
        if discount_type in ["percentage", "fixed"]:
            if not offer_data.get("discount_value"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"discount_value is required for {discount_type} offers"
                )
        
        elif discount_type == "minimum_purchase":
            if not offer_data.get("discount_value") or not offer_data.get("minimum_purchase_amount"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="discount_value and minimum_purchase_amount are required for minimum_purchase offers"
                )
        
        elif discount_type == "quantity_discount":
            if not offer_data.get("discount_value") or not offer_data.get("minimum_quantity"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="discount_value and minimum_quantity are required for quantity_discount offers"
                )
        
        elif discount_type == "bogo":
            # Validate BOGO-specific fields
            required_bogo_fields = ["buy_quantity", "get_quantity", "get_discount_percentage"]
            missing_fields = [field for field in required_bogo_fields if not offer_data.get(field)]
            if missing_fields:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"BOGO offers require: {', '.join(missing_fields)}"
                )
            
            # CRITICAL FIX: Set discount_value to 0 for BOGO offers to avoid NULL constraint
            offer_data["discount_value"] = 0.0
        
        # === PRICE CALCULATIONS ===
        original_price = float(product["price"]) if product["price"] else 0.0
        
        if discount_type == "percentage":
            discount_amount = (original_price * float(offer_data["discount_value"])) / 100
            discounted_price = original_price - discount_amount
        elif discount_type == "fixed":
            discount_amount = float(offer_data["discount_value"])
            discounted_price = max(0, original_price - discount_amount)
        elif discount_type in ["minimum_purchase", "quantity_discount"]:
            # For these types, price calculation depends on context, so use original price
            discounted_price = original_price
        elif discount_type == "bogo":
            # For BOGO, pricing is complex and context-dependent, use original price
            discounted_price = original_price
        
        # === TITLE GENERATION ===
        title = offer_data.get("title")
        if not title:
            product_name = product['name']
            if discount_type == "percentage":
                title = f"{offer_data['discount_value']}% Off {product_name}"
            elif discount_type == "fixed":
                title = f"${offer_data['discount_value']} Off {product_name}"
            elif discount_type == "minimum_purchase":
                title = f"${offer_data['discount_value']} Off {product_name} (Min. ${offer_data['minimum_purchase_amount']})"
            elif discount_type == "quantity_discount":
                title = f"Buy {offer_data['minimum_quantity']}+ {product_name}, Get {offer_data['discount_value']}% Off Each"
            elif discount_type == "bogo":
                buy_qty = offer_data['buy_quantity']
                get_qty = offer_data['get_quantity']
                discount_pct = offer_data['get_discount_percentage']
                if discount_pct == 100:
                    title = f"Buy {buy_qty} {product_name}, Get {get_qty} Free"
                else:
                    title = f"Buy {buy_qty} {product_name}, Get {get_qty} at {discount_pct}% Off"
        
        # === PREPARE OFFER DATA ===
        offer_dict = {
            "business_id": business_id,
            "product_id": offer_data["product_id"],
            "title": title,
            "description": offer_data.get("description"),
            "discount_type": discount_type,
            "discount_value": float(offer_data.get("discount_value", 0)),  # Always provide a value
            "original_price": original_price,
            "discounted_price": discounted_price,
            "start_date": offer_data["start_date"],
            "expiry_date": offer_data["expiry_date"],
            "max_claims": int(offer_data["max_claims"]) if offer_data.get("max_claims") else None,
            "max_claims_per_user": int(offer_data["max_claims_per_user"]) if offer_data.get("max_claims_per_user") else None,
            "min_claims_per_customer": int(offer_data["min_claims_per_customer"]) if offer_data.get("min_claims_per_customer") else None,
            "current_claims": 0,
            "is_active": offer_data.get("is_active", True),
            "terms_conditions": offer_data.get("terms_conditions"),

            # Geofence fields
            "geofence_enabled": geofence_enabled,
            "geofence_radius": geofence_radius,

            # Type-specific fields (set to None if not applicable)
            "minimum_purchase_amount": float(offer_data.get("minimum_purchase_amount")) if offer_data.get("minimum_purchase_amount") else None,
            "minimum_quantity": int(offer_data.get("minimum_quantity")) if offer_data.get("minimum_quantity") else None,
            "buy_quantity": int(offer_data.get("buy_quantity")) if offer_data.get("buy_quantity") else None,
            "get_quantity": int(offer_data.get("get_quantity")) if offer_data.get("get_quantity") else None,
            "get_discount_percentage": float(offer_data.get("get_discount_percentage")) if offer_data.get("get_discount_percentage") else None,
            "offer_parameters": offer_data.get("offer_parameters")
        }
        
        # Remove None values to avoid database issues
        offer_dict = {k: v for k, v in offer_dict.items() if v is not None}
        
        # Convert data for Supabase
        offer_dict = prepare_data_for_supabase(offer_dict)
        
        print(f"Inserting offer with type {discount_type}: {offer_dict}")
        
        # Insert offer
        result = supabase_admin.table("offers").insert(offer_dict).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create offer"
            )
        
        # Get offer with product info
        offer_with_product = supabase_admin.table("offers").select(
            "*, products(*, categories(*)), businesses(business_name)"
        ).eq("id", result.data[0]["id"]).execute()
        
        return {
            "success": True,
            "message": f"{discount_type.title()} offer created successfully",
            "offer": offer_with_product.data[0] if offer_with_product.data else result.data[0]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Offer creation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Offer creation failed: {str(e)}"
        )


@router.get("/offers/{offer_id}", response_model=dict)
async def get_offer(
    offer_id: str,
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Get a specific offer owned by the current business"""
    
    try:
        # Get user's business
        business_result = supabase_admin.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Get offer
        result = supabase_admin.table("offers").select(
            "*, products(*, categories(*)), businesses(business_name)"
        ).eq("id", offer_id).eq("business_id", business_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )
        
        # Convert and fix structure
        offer_data = convert_decimals_to_float(result.data[0])
        if 'products' in offer_data:
            offer_data['product'] = offer_data['products']
            del offer_data['products']

        # Calculate total units claimed (sum of quantities from all claims)
        claims_result = supabase_admin.table("claimed_offers").select("quantity").eq("offer_id", offer_id).execute()
        total_units_claimed = sum(claim.get("quantity", 1) for claim in (claims_result.data or []))
        offer_data['total_units_claimed'] = total_units_claimed

        # Calculate total units redeemed (sum of quantities from redeemed claims)
        redeemed_result = supabase_admin.table("claimed_offers").select("quantity").eq("offer_id", offer_id).eq("is_redeemed", True).execute()
        total_units_redeemed = sum(claim.get("quantity", 1) for claim in (redeemed_result.data or []))
        offer_data['total_units_redeemed'] = total_units_redeemed

        return {"offer": offer_data}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve offer: {str(e)}"
        )


# Updated app/api/routes/business.py - Replace the existing update_offer function

@router.patch("/offers/{offer_id}", response_model=dict)
async def update_offer(
    offer_id: str,
    offer_update: dict,  # Accept flexible dict for all offer types
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Update an offer owned by the current business - supports all offer types"""
    
    try:
        # Get user's business
        business_result = supabase_admin.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Get current offer
        current_offer = supabase_admin.table("offers").select("*, products(price)").eq("id", offer_id).eq("business_id", business_id).execute()
        
        if not current_offer.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )
        
        current_data = current_offer.data[0]
        
        # Prepare update data
        update_data = {}
        
        # Map all possible fields (both old and new format)
        field_mapping = {
            "title": "title",
            "description": "description",
            "discount_type": "discount_type",
            "discount_value": "discount_value",
            "discount_percentage": "discount_value",  # Map old field to new
            "start_date": "start_date",
            "expiry_date": "expiry_date",
            "max_claims": "max_claims",
            "max_claims_per_user": "max_claims_per_user",
            "min_claims_per_customer": "min_claims_per_customer",
            "is_active": "is_active",
            "terms_conditions": "terms_conditions",
            # Geofence fields
            "geofence_enabled": "geofence_enabled",
            "geofence_radius": "geofence_radius",
            # New fields for different offer types
            "minimum_purchase_amount": "minimum_purchase_amount",
            "minimum_quantity": "minimum_quantity",
            "buy_quantity": "buy_quantity",
            "get_quantity": "get_quantity",
            "get_discount_percentage": "get_discount_percentage",
            "offer_parameters": "offer_parameters"
        }
        
        # Apply updates for fields that are provided
        for frontend_field, db_field in field_mapping.items():
            if frontend_field in offer_update:
                value = offer_update[frontend_field]
                
                # Type conversion based on field
                if db_field in ["discount_value", "minimum_purchase_amount", "get_discount_percentage"]:
                    if value is not None:
                        update_data[db_field] = float(value)
                elif db_field in ["minimum_quantity", "buy_quantity", "get_quantity", "max_claims", "max_claims_per_user", "min_claims_per_customer", "geofence_radius"]:
                    if value is not None:
                        update_data[db_field] = int(value)
                elif db_field in ["geofence_enabled"]:
                    if value is not None:
                        update_data[db_field] = bool(value)
                else:
                    update_data[db_field] = value
        
        # Validate geofence fields if they are being updated
        if "geofence_radius" in update_data:
            geofence_radius = update_data["geofence_radius"]
            if geofence_radius < 100 or geofence_radius > 5000:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Geofence radius must be between 100 and 5000 meters"
                )
        
        # Validate offer data if discount_type is being changed
        if "discount_type" in offer_update:
            discount_type = offer_update["discount_type"]
            allowed_types = ["percentage", "fixed", "minimum_purchase", "quantity_discount", "bogo"]
            
            if discount_type not in allowed_types:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid discount type. Must be one of: {', '.join(allowed_types)}"
                )
            
            # Validate required fields for the new discount type
            merged_data = {**current_data, **offer_update}
            
            if discount_type in ["percentage", "fixed"] and not merged_data.get("discount_value"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"discount_value is required for {discount_type} offers"
                )
            
            if discount_type == "minimum_purchase":
                if not merged_data.get("discount_value") or not merged_data.get("minimum_purchase_amount"):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="discount_value and minimum_purchase_amount are required for minimum_purchase offers"
                    )
            
            if discount_type == "quantity_discount":
                if not merged_data.get("discount_value") or not merged_data.get("minimum_quantity"):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="discount_value and minimum_quantity are required for quantity_discount offers"
                    )
            
            if discount_type == "bogo":
                required_bogo_fields = ["buy_quantity", "get_quantity", "get_discount_percentage"]
                missing_fields = [field for field in required_bogo_fields if not merged_data.get(field)]
                if missing_fields:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"BOGO offers require: {', '.join(missing_fields)}"
                    )
        
        # Recalculate prices if discount values change
        if any(field in offer_update for field in ["discount_value", "discount_percentage", "discount_type"]):
            original_price = float(current_data["products"]["price"]) if current_data["products"]["price"] else 0
            discount_type = offer_update.get("discount_type", current_data.get("discount_type"))
            discount_value = offer_update.get("discount_value", offer_update.get("discount_percentage", current_data.get("discount_value", 0)))
            
            if discount_type == "percentage":
                discount_amount = original_price * (float(discount_value) / 100)
                update_data["discounted_price"] = original_price - discount_amount
            elif discount_type == "fixed":
                discount_amount = min(float(discount_value), original_price)
                update_data["discounted_price"] = original_price - discount_amount
            # For other types, discounted_price is calculated dynamically
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid fields to update"
            )
        
        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        # Convert data for Supabase
        update_data = prepare_data_for_supabase(update_data)
        
        print(f"Updating offer {offer_id} with data: {update_data}")
        
        # Update offer
        result = supabase_admin.table("offers").update(update_data).eq("id", offer_id).eq("business_id", business_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )
        
        # Get updated offer with product info
        offer_with_product = supabase_admin.table("offers").select(
            "*, products(*, categories(*)), businesses(business_name)"
        ).eq("id", result.data[0]["id"]).execute()
        
        # Convert and fix structure
        offer_response = convert_decimals_to_float(offer_with_product.data[0])
        if 'products' in offer_response:
            offer_response['product'] = offer_response['products']
            del offer_response['products']
        
        return {"offer": offer_response}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating offer: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Offer update failed: {str(e)}"
        )
    
# Add this endpoint to app/api/routes/business.py

@router.post("/offers/calculate", response_model=dict)
async def calculate_offer_discount(
    calculation_request: dict,
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Calculate discount for an offer based on quantity and cart total"""
    
    try:
        offer_id = calculation_request.get("offer_id")
        quantity = calculation_request.get("quantity", 1)
        cart_total = calculation_request.get("cart_total")
        
        if not offer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Offer ID is required"
            )
        
        # Get user's business
        business_result = supabase_admin.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Get offer with product info
        offer_result = supabase_admin.table("offers").select(
            "*, products(price)"
        ).eq("id", offer_id).eq("business_id", business_id).execute()
        
        if not offer_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )
        
        offer_data = offer_result.data[0]
        item_price = float(offer_data["products"]["price"]) if offer_data["products"]["price"] else 0
        
        # Calculate discount using utility
        calculation_result = calculate_discount_for_offer(
            offer_data=offer_data,
            quantity=quantity,
            cart_total=cart_total,
            item_price=item_price
        )
        
        return {
            "calculation": calculation_result,
            "offer_display_text": get_offer_display_text(offer_data)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error calculating offer discount: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Calculation failed: {str(e)}"
        )


# Utility functions for offer calculations
def calculate_discount_for_offer(offer_data: dict, quantity: int, cart_total: float = None, item_price: float = 0) -> dict:
    """Calculate discount based on offer type"""
    
    discount_type = offer_data.get('discount_type')
    
    if discount_type == 'percentage':
        return calculate_percentage_discount(offer_data, quantity, item_price)
    elif discount_type == 'fixed':
        return calculate_fixed_discount(offer_data, quantity, item_price)
    elif discount_type == 'minimum_purchase':
        return calculate_minimum_purchase_discount(offer_data, cart_total, quantity)
    elif discount_type == 'quantity_discount':
        return calculate_quantity_discount(offer_data, quantity, item_price)
    elif discount_type == 'bogo':
        return calculate_bogo_discount(offer_data, quantity, item_price)
    else:
        return {
            'is_valid': False,
            'error_reason': f'Unknown discount type: {discount_type}',
            'discount_amount': 0,
            'final_price': item_price * quantity if item_price else 0,
            'savings_amount': 0,
            'message': 'Invalid offer type'
        }


def calculate_percentage_discount(offer_data: dict, quantity: int, item_price: float) -> dict:
    """Calculate percentage discount"""
    if not item_price:
        return {
            'is_valid': False,
            'error_reason': 'Item price required for percentage discount',
            'discount_amount': 0,
            'final_price': 0,
            'savings_amount': 0,
            'message': 'Cannot calculate without item price'
        }
    
    discount_percentage = float(offer_data.get('discount_value', 0))
    total_price = item_price * quantity
    discount_amount = total_price * (discount_percentage / 100)
    final_price = total_price - discount_amount
    
    return {
        'is_valid': True,
        'discount_amount': round(discount_amount, 2),
        'final_price': round(final_price, 2),
        'savings_amount': round(discount_amount, 2),
        'message': f'{discount_percentage}% off - Save ${discount_amount:.2f}'
    }


def calculate_fixed_discount(offer_data: dict, quantity: int, item_price: float) -> dict:
    """Calculate fixed dollar discount"""
    if not item_price:
        return {
            'is_valid': False,
            'error_reason': 'Item price required for fixed discount',
            'discount_amount': 0,
            'final_price': 0,
            'savings_amount': 0,
            'message': 'Cannot calculate without item price'
        }
    
    discount_amount = float(offer_data.get('discount_value', 0))
    total_price = item_price * quantity
    
    # Don't allow discount to exceed total price
    actual_discount = min(discount_amount, total_price)
    final_price = total_price - actual_discount
    
    return {
        'is_valid': True,
        'discount_amount': round(actual_discount, 2),
        'final_price': round(final_price, 2),
        'savings_amount': round(actual_discount, 2),
        'message': f'${actual_discount:.2f} off'
    }


def calculate_minimum_purchase_discount(offer_data: dict, cart_total: float, quantity: int) -> dict:
    """Calculate minimum purchase discount"""
    minimum_purchase = float(offer_data.get('minimum_purchase_amount', 0))
    discount_value = float(offer_data.get('discount_value', 0))
    
    if cart_total is None:
        return {
            'is_valid': False,
            'error_reason': 'Cart total required for minimum purchase discount',
            'discount_amount': 0,
            'final_price': 0,
            'savings_amount': 0,
            'message': 'Cannot calculate without cart total'
        }
    
    if cart_total < minimum_purchase:
        return {
            'is_valid': False,
            'error_reason': f'Minimum purchase of ${minimum_purchase:.2f} required',
            'discount_amount': 0,
            'final_price': cart_total,
            'savings_amount': 0,
            'message': f'Add ${minimum_purchase - cart_total:.2f} more to qualify'
        }
    
    # Don't allow discount to exceed cart total
    actual_discount = min(discount_value, cart_total)
    final_price = cart_total - actual_discount
    
    return {
        'is_valid': True,
        'discount_amount': round(actual_discount, 2),
        'final_price': round(final_price, 2),
        'savings_amount': round(actual_discount, 2),
        'message': f'${actual_discount:.2f} off orders over ${minimum_purchase:.2f}'
    }


def calculate_quantity_discount(offer_data: dict, quantity: int, item_price: float) -> dict:
    """Calculate quantity-based discount"""
    if not item_price:
        return {
            'is_valid': False,
            'error_reason': 'Item price required for quantity discount',
            'discount_amount': 0,
            'final_price': 0,
            'savings_amount': 0,
            'message': 'Cannot calculate without item price'
        }
    
    minimum_quantity = int(offer_data.get('minimum_quantity', 1))
    discount_percentage = float(offer_data.get('discount_value', 0))
    
    if quantity < minimum_quantity:
        total_price = item_price * quantity
        return {
            'is_valid': False,
            'error_reason': f'Minimum quantity of {minimum_quantity} required',
            'discount_amount': 0,
            'final_price': total_price,
            'savings_amount': 0,
            'message': f'Add {minimum_quantity - quantity} more to qualify for {discount_percentage}% off'
        }
    
    total_price = item_price * quantity
    discount_amount = total_price * (discount_percentage / 100)
    final_price = total_price - discount_amount
    
    return {
        'is_valid': True,
        'discount_amount': round(discount_amount, 2),
        'final_price': round(final_price, 2),
        'savings_amount': round(discount_amount, 2),
        'message': f'Buy {minimum_quantity}+ get {discount_percentage}% off each - Save ${discount_amount:.2f}'
    }


def calculate_bogo_discount(offer_data: dict, quantity: int, item_price: float) -> dict:
    """Calculate Buy X Get Y discount"""
    if not item_price:
        return {
            'is_valid': False,
            'error_reason': 'Item price required for BOGO discount',
            'discount_amount': 0,
            'final_price': 0,
            'savings_amount': 0,
            'message': 'Cannot calculate without item price'
        }
    
    buy_quantity = int(offer_data.get('buy_quantity', 1))
    get_quantity = int(offer_data.get('get_quantity', 1))
    get_discount_percentage = float(offer_data.get('get_discount_percentage', 100))
    
    if quantity < buy_quantity:
        total_price = item_price * quantity
        return {
            'is_valid': False,
            'error_reason': f'Need to buy {buy_quantity} items to qualify',
            'discount_amount': 0,
            'final_price': total_price,
            'savings_amount': 0,
            'message': f'Add {buy_quantity - quantity} more to get {get_quantity} free'
        }
    
    # Calculate how many complete BOGO sets the customer qualifies for
    bogo_sets = quantity // buy_quantity
    free_items = min(bogo_sets * get_quantity, quantity - (bogo_sets * buy_quantity))
    
    # Calculate discount
    total_price = item_price * quantity
    discount_per_free_item = item_price * (get_discount_percentage / 100)
    total_discount = free_items * discount_per_free_item
    final_price = total_price - total_discount
    
    # Create descriptive message
    if get_discount_percentage == 100:
        message = f'Buy {buy_quantity} Get {get_quantity} Free - Save ${total_discount:.2f}'
    else:
        message = f'Buy {buy_quantity} Get {get_quantity} at {get_discount_percentage}% off - Save ${total_discount:.2f}'
    
    return {
        'is_valid': True,
        'discount_amount': round(total_discount, 2),
        'final_price': round(final_price, 2),
        'savings_amount': round(total_discount, 2),
        'message': message,
        'bogo_details': {
            'bogo_sets': bogo_sets,
            'free_items': free_items,
            'remaining_items': quantity - (bogo_sets * buy_quantity) - free_items
        }
    }


def get_offer_display_text(offer_data: dict) -> str:
    """Generate human-readable display text for an offer"""
    discount_type = offer_data.get('discount_type')
    
    if discount_type == 'percentage':
        percentage = offer_data.get('discount_value', 0)
        return f"{percentage}% Off"
    
    elif discount_type == 'fixed':
        amount = offer_data.get('discount_value', 0)
        return f"${amount} Off"
    
    elif discount_type == 'minimum_purchase':
        amount = offer_data.get('discount_value', 0)
        minimum = offer_data.get('minimum_purchase_amount', 0)
        return f"${amount} Off Orders Over ${minimum}"
    
    elif discount_type == 'quantity_discount':
        percentage = offer_data.get('discount_value', 0)
        min_qty = offer_data.get('minimum_quantity', 0)
        return f"Buy {min_qty}+ Get {percentage}% Off Each"
    
    elif discount_type == 'bogo':
        buy_qty = offer_data.get('buy_quantity', 1)
        get_qty = offer_data.get('get_quantity', 1)
        discount_pct = offer_data.get('get_discount_percentage', 100)
        
        if discount_pct == 100:
            return f"Buy {buy_qty} Get {get_qty} Free"
        else:
            return f"Buy {buy_qty} Get {get_qty} at {discount_pct}% Off"
    
    return "Special Offer"

@router.patch("/offers/{offer_id}/status", response_model=dict)
async def update_offer_status(
    offer_id: str,
    status_data: dict,
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Update offer status (activate/deactivate)"""
    
    try:
        # Get user's business
        business_result = supabase_admin.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Update offer status
        update_data = {
            "is_active": status_data.get("is_active", True),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase_admin.table("offers").update(update_data).eq("id", offer_id).eq("business_id", business_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )
        
        # Get updated offer with product info
        offer_with_product = supabase_admin.table("offers").select(
            "*, products(*, categories(*)), businesses(business_name)"
        ).eq("id", result.data[0]["id"]).execute()
        
        # Convert and fix structure
        offer_response = convert_decimals_to_float(offer_with_product.data[0])
        if 'products' in offer_response:
            offer_response['product'] = offer_response['products']
            del offer_response['products']
        
        return {"offer": offer_response}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Status update failed: {str(e)}"
        )


@router.delete("/offers/{offer_id}", response_model=MessageResponse)
async def delete_offer(
    offer_id: str,
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Delete an offer owned by the current business"""
    
    try:
        # Get user's business
        business_result = supabase_admin.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]

        # Check if offer has any claims before attempting deletion
        claims_check = supabase_admin.table("claimed_offers").select("id", count="exact").eq("offer_id", offer_id).execute()

        if claims_check.count and claims_check.count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete offer with existing claims. This offer has {claims_check.count} claim(s). Please contact support if you need to remove this offer."
            )

        # Delete offer
        result = supabase_admin.table("offers").delete().eq("id", offer_id).eq("business_id", business_id).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )

        return MessageResponse(message="Offer deleted successfully")

    except HTTPException:
        raise
    except Exception as e:
        # Check if it's a foreign key constraint error
        error_str = str(e)
        if "violates foreign key constraint" in error_str or "23503" in error_str:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete this offer because it has existing claims. Offers with claims cannot be deleted."
            )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete offer. Please try again or contact support."
        )



# Add these endpoints to your existing discount_api/app/api/routes/business.py file

# ============================================================================
# CLAIM REDEMPTION ENDPOINTS
# ============================================================================

@router.post("/redeem/verify", response_model=dict)
async def verify_claim_for_redemption(
    verification_request: dict,  # {"claim_identifier": "CLAIM123", "verification_type": "claim_id|qr_code"}
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Verify a claim for redemption by claim ID or QR code"""
    
    try:
        claim_identifier = verification_request.get("claim_identifier", "").strip()
        verification_type = verification_request.get("verification_type", "claim_id")
        
        if not claim_identifier:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Claim identifier is required"
            )
        
        print(f"Verifying claim: {claim_identifier} for business user: {current_user.id}")
        
        # Get user's business
        business_result = supabase_admin.table("businesses").select("id, business_name").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business = business_result.data[0]
        business_id = business["id"]
        business_name = business["business_name"]
        
        # Extract claim ID from QR code if needed
        if verification_type == "qr_code":
            # QR codes contain verification URLs, extract claim ID
            try:
                # Handle different QR code formats
                if "claim_id=" in claim_identifier:
                    claim_id = claim_identifier.split("claim_id=")[1].split("&")[0]
                elif "/verify/" in claim_identifier:
                    claim_id = claim_identifier.split("/verify/")[1].split("?")[0]
                else:
                    # Assume the QR code content is just the claim ID
                    claim_id = claim_identifier
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid QR code format"
                )
        else:
            claim_id = claim_identifier
        
        print(f"Extracted claim ID: {claim_id}")
        
        # Find the claimed offer
        claimed_offer_result = supabase_admin.table("claimed_offers").select(
            "*, offers(*, products(*, categories(*)), businesses(id, business_name)), profiles!user_id(first_name, last_name, email)"
        ).eq("unique_claim_id", claim_id).execute()
        
        if not claimed_offer_result.data:
            return {
                "is_valid": False,
                "error_message": "Claim not found",
                "error_code": "CLAIM_NOT_FOUND"
            }
        
        claimed_offer = claimed_offer_result.data[0]
        offer = claimed_offer["offers"]
        customer = claimed_offer["profiles"]
        
        print(f"Found claim for offer: {offer.get('title')} by customer: {customer.get('email')}")
        
        # Verify this claim belongs to the current business
        if offer["business_id"] != business_id:
            return {
                "is_valid": False,
                "error_message": "This claim does not belong to your business",
                "error_code": "UNAUTHORIZED_BUSINESS"
            }
        
        # Check if already redeemed
        if claimed_offer.get("is_redeemed", False):
            return {
                "is_valid": False,
                "error_message": "This claim has already been redeemed",
                "error_code": "ALREADY_REDEEMED",
                "redeemed_at": claimed_offer.get("redeemed_at"),
                "redemption_notes": claimed_offer.get("redemption_notes")
            }
        
        # Check if offer is still valid
        current_time = datetime.now(timezone.utc)
        
        try:
            expiry_date_str = offer["expiry_date"]
            if expiry_date_str.endswith('Z'):
                expiry_date_str = expiry_date_str[:-1] + '+00:00'
            
            expiry_date = datetime.fromisoformat(expiry_date_str)
            if expiry_date.tzinfo is None:
                expiry_date = expiry_date.replace(tzinfo=timezone.utc)
                
            if current_time > expiry_date:
                return {
                    "is_valid": False,
                    "error_message": "This offer has expired",
                    "error_code": "OFFER_EXPIRED",
                    "expiry_date": offer["expiry_date"]
                }
                
        except (ValueError, KeyError) as e:
            print(f"Error parsing expiry date: {e}")
            # Continue with verification if date parsing fails
        
        # Calculate discount info
        discount_info = {
            "discount_type": offer["discount_type"],
            "discount_value": float(offer["discount_value"]) if offer["discount_value"] else 0,
            "original_price": float(offer["original_price"]) if offer["original_price"] else 0,
            "discounted_price": float(offer["discounted_price"]) if offer["discounted_price"] else 0
        }
        
        if offer["discount_type"] == "percentage":
            discount_info["discount_text"] = f"{discount_info['discount_value']}% off"
        else:
            discount_info["discount_text"] = f"${discount_info['discount_value']} off"
        
        # Return successful verification
        return {
            "is_valid": True,
            "claim_id": claim_id,
            "claim_details": {
                "id": claimed_offer["id"],
                "claim_id": claim_id,
                "claim_type": claimed_offer.get("claim_type", "in_store"),
                "claimed_at": claimed_offer["claimed_at"],
                "quantity": claimed_offer.get("quantity", 1),
                "customer": {
                    "name": f"{customer.get('first_name', '')} {customer.get('last_name', '')}".strip() or "Customer",
                    "email": customer.get("email"),
                    "first_name": customer.get("first_name"),
                    "last_name": customer.get("last_name")
                },
                "offer": {
                    "id": offer["id"],
                    "title": offer["title"],
                    "description": offer.get("description"),
                    "product_name": offer["products"]["name"] if offer.get("products") else None,
                    "business_name": business_name
                },
                "discount_info": discount_info
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error verifying claim: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify claim: {str(e)}"
        )


@router.post("/redeem/complete", response_model=dict)
async def complete_claim_redemption(
    redemption_request: dict,  # {"claim_id": "CLAIM123", "redemption_notes": "optional notes"}
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Complete the redemption of a verified claim"""
    
    try:
        claim_id = redemption_request.get("claim_id", "").strip()
        redemption_notes = redemption_request.get("redemption_notes", "").strip()
        
        if not claim_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Claim ID is required"
            )
        
        print(f"Completing redemption for claim: {claim_id}")
        
        # Get user's business
        business_result = supabase_admin.table("businesses").select("id, business_name").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business = business_result.data[0]
        business_id = business["id"]
        
        # Find and verify the claimed offer again (security check)
        claimed_offer_result = supabase_admin.table("claimed_offers").select(
            "*, offers(business_id, title, expiry_date), profiles!user_id(first_name, last_name, email)"
        ).eq("unique_claim_id", claim_id).execute()
        
        if not claimed_offer_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Claim not found"
            )
        
        claimed_offer = claimed_offer_result.data[0]
        offer = claimed_offer["offers"]
        customer = claimed_offer["profiles"]
        
        # Verify business ownership
        if offer["business_id"] != business_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only redeem claims for your own business"
            )
        
        # Check if already redeemed
        if claimed_offer.get("is_redeemed", False):
            return {
                "success": False,
                "message": "This claim has already been redeemed",
                "error_code": "ALREADY_REDEEMED",
                "redeemed_at": claimed_offer.get("redeemed_at")
            }
        
        # Mark as redeemed
        current_time = datetime.now(timezone.utc)
        
        redemption_update = {
            "is_redeemed": True,
            "redeemed_at": current_time.isoformat(),
            "redemption_notes": redemption_notes or f"Redeemed by {business['business_name']}"
        }
        
        update_result = supabase_admin.table("claimed_offers").update(redemption_update).eq("id", claimed_offer["id"]).execute()
        
        if not update_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to mark claim as redeemed"
            )
        
        print(f"Successfully redeemed claim {claim_id}")
        
        # Return success response
        return {
            "success": True,
            "message": "Claim redeemed successfully!",
            "redemption_details": {
                "claim_id": claim_id,
                "redeemed_at": current_time.isoformat(),
                "customer_name": f"{customer.get('first_name', '')} {customer.get('last_name', '')}".strip() or "Customer",
                "customer_email": customer.get("email"),
                "offer_title": offer["title"],
                "business_name": business["business_name"],
                "redemption_notes": redemption_notes
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error completing redemption: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete redemption: {str(e)}"
        )


@router.get("/redeem/history", response_model=dict)
async def get_redemption_history(
    current_user: UserProfile = Depends(get_current_business_user),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    offer_id: Optional[str] = Query(None, description="Filter by specific offer"),
    redeemed_only: bool = Query(True, description="Show only redeemed claims")
):
    """Get redemption history for the business"""
    
    try:
        # Get user's business
        business_result = supabase_admin.table("businesses").select("id, business_name").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Build query - get claims for offers belonging to this business
        query = supabase_admin.table("claimed_offers").select(
            "*, offers!inner(id, title, business_id, discount_type, discount_value, original_price, discounted_price, products(name)), profiles!user_id(first_name, last_name, email)",
            count="exact"
        ).eq("offers.business_id", business_id)
        
        if redeemed_only:
            query = query.eq("is_redeemed", True)
        
        if offer_id:
            query = query.eq("offer_id", offer_id)
        
        # Apply date filters
        if start_date:
            try:
                start_datetime = datetime.fromisoformat(start_date).replace(tzinfo=timezone.utc).isoformat()
                if redeemed_only:
                    query = query.gte("redeemed_at", start_datetime)
                else:
                    query = query.gte("claimed_at", start_datetime)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid start_date format. Use YYYY-MM-DD"
                )
        
        if end_date:
            try:
                end_datetime = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59, tzinfo=timezone.utc).isoformat()
                if redeemed_only:
                    query = query.lte("redeemed_at", end_datetime)
                else:
                    query = query.lte("claimed_at", end_datetime)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid end_date format. Use YYYY-MM-DD"
                )
        
        # Apply pagination and sorting
        offset = (page - 1) * limit
        sort_field = "redeemed_at" if redeemed_only else "claimed_at"
        query = query.order(sort_field, desc=True).range(offset, offset + limit - 1)
        
        result = query.execute()
        
        total = result.count if result.count else 0
        total_pages = (total + limit - 1) // limit
        
        # Process results
        redemptions = []
        total_savings_provided = 0
        
        for claim in result.data:
            offer = claim["offers"]
            customer = claim["profiles"]
            
            # Calculate savings
            savings = 0
            if offer["discount_type"] == "percentage" and offer["original_price"]:
                savings = float(offer["original_price"]) * (float(offer["discount_value"]) / 100)
            elif offer["discount_type"] == "fixed":
                savings = float(offer["discount_value"]) if offer["discount_value"] else 0
            
            if claim.get("is_redeemed"):
                total_savings_provided += savings
            
            redemption_data = {
                "id": claim["id"],
                "claim_id": claim.get("unique_claim_id"),
                "claim_type": claim.get("claim_type", "in_store"),
                "customer": {
                    "name": f"{customer.get('first_name', '')} {customer.get('last_name', '')}".strip() or "Customer",
                    "email": customer.get("email"),
                    "first_name": customer.get("first_name"),
                    "last_name": customer.get("last_name")
                },
                "offer": {
                    "id": offer["id"],
                    "title": offer["title"],
                    "product_name": offer["products"]["name"] if offer.get("products") else None,
                    "discount_type": offer["discount_type"],
                    "discount_value": float(offer["discount_value"]) if offer["discount_value"] else 0,
                    "savings_amount": savings
                },
                "claimed_at": claim["claimed_at"],
                "is_redeemed": claim.get("is_redeemed", False),
                "redeemed_at": claim.get("redeemed_at"),
                "redemption_notes": claim.get("redemption_notes")
            }
            
            redemptions.append(redemption_data)
        
        # Calculate summary stats
        redeemed_count = len([r for r in redemptions if r["is_redeemed"]])
        pending_count = len([r for r in redemptions if not r["is_redeemed"]])
        
        return {
            "redemptions": redemptions,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            },
            "summary": {
                "total_claims": total,
                "redeemed_claims": redeemed_count,
                "pending_claims": pending_count,
                "total_savings_provided": round(total_savings_provided, 2),
                "redemption_rate": round((redeemed_count / total * 100) if total > 0 else 0, 1)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting redemption history: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get redemption history: {str(e)}"
        )


@router.get("/redeem/stats", response_model=dict)
async def get_redemption_stats(
    current_user: UserProfile = Depends(get_current_business_user),
    days: int = Query(30, ge=1, le=365, description="Number of days to include in stats")
):
    """Get redemption statistics for the business"""
    
    try:
        # Get user's business
        business_result = supabase_admin.table("businesses").select("id, business_name").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Calculate date range
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days)
        
        # Get claims data
        claims_result = supabase_admin.table("claimed_offers").select(
            "*, offers!inner(business_id, discount_type, discount_value, original_price)"
        ).eq("offers.business_id", business_id).gte("claimed_at", start_date.isoformat()).execute()
        
        if not claims_result.data:
            return {
                "period_days": days,
                "total_claims": 0,
                "total_redemptions": 0,
                "pending_redemptions": 0,
                "redemption_rate": 0,
                "total_savings_provided": 0,
                "daily_breakdown": [],
                "claim_types": {"in_store": 0, "online": 0}
            }
        
        claims = claims_result.data
        
        # Calculate stats
        total_claims = len(claims)
        redeemed_claims = [c for c in claims if c.get("is_redeemed")]
        pending_claims = [c for c in claims if not c.get("is_redeemed")]
        
        total_redemptions = len(redeemed_claims)
        pending_redemptions = len(pending_claims)
        redemption_rate = (total_redemptions / total_claims * 100) if total_claims > 0 else 0
        
        # Calculate total savings provided
        total_savings = 0
        for claim in redeemed_claims:
            offer = claim["offers"]
            if offer["discount_type"] == "percentage" and offer["original_price"]:
                savings = float(offer["original_price"]) * (float(offer["discount_value"]) / 100)
            elif offer["discount_type"] == "fixed":
                savings = float(offer["discount_value"]) if offer["discount_value"] else 0
            else:
                savings = 0
            total_savings += savings
        
        # Claim type breakdown
        claim_types = {"in_store": 0, "online": 0}
        for claim in claims:
            claim_type = claim.get("claim_type", "in_store")
            claim_types[claim_type] = claim_types.get(claim_type, 0) + 1
        
        # Daily breakdown (last 7 days for chart)
        daily_breakdown = []
        for i in range(min(7, days)):
            day_date = end_date - timedelta(days=i)
            day_start = day_date.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            
            day_claims = [c for c in claims if day_start <= datetime.fromisoformat(c["claimed_at"].replace('Z', '+00:00')) <= day_end]
            day_redemptions = [c for c in day_claims if c.get("is_redeemed")]
            
            daily_breakdown.append({
                "date": day_start.strftime("%Y-%m-%d"),
                "claims": len(day_claims),
                "redemptions": len(day_redemptions)
            })
        
        # Reverse to show oldest first
        daily_breakdown.reverse()
        
        return {
            "period_days": days,
            "date_range": {
                "start": start_date.strftime("%Y-%m-%d"),
                "end": end_date.strftime("%Y-%m-%d")
            },
            "total_claims": total_claims,
            "total_redemptions": total_redemptions,
            "pending_redemptions": pending_redemptions,
            "redemption_rate": round(redemption_rate, 1),
            "total_savings_provided": round(total_savings, 2),
            "daily_breakdown": daily_breakdown,
            "claim_types": claim_types
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting redemption stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get redemption stats: {str(e)}"
        )


# ============================================================================
# ANALYTICS ENDPOINTS
# ============================================================================

@router.get("/analytics", response_model=dict)
async def get_business_analytics(
    current_user: UserProfile = Depends(get_current_business_user),
    time_range: str = Query("30", regex="^(1|7|30)$")  # 1 day, 7 days, 30 days
):
    """Get analytics overview for the business"""
    try:
        # Get user's business
        business_result = supabase_admin.table("businesses").select("id, business_name").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Calculate date range
        now = datetime.now(timezone.utc)
        if time_range == "1":
            start_date = now - timedelta(days=1)
        elif time_range == "7":
            start_date = now - timedelta(days=7)
        else:  # 30 days
            start_date = now - timedelta(days=30)
        
        start_date_str = start_date.isoformat()
        
        # Get active offers for this business (using same logic as offers endpoint)
        current_time = datetime.utcnow().isoformat()
        offers_result = supabase_admin.table("offers").select("id", count="exact").eq("business_id", business_id).eq("is_active", True).lte("start_date", current_time).gte("expiry_date", current_time).execute()
        active_offers = offers_result.count or 0
        
        # Get offer IDs once to avoid repeated queries
        offers_data = supabase_admin.table("offers").select("id").eq("business_id", business_id).execute()
        offer_ids = [offer["id"] for offer in (offers_data.data or [])]
        
        if not offer_ids:
            # No offers, return zeros
            total_views = total_clicks = total_claims = 0
        else:
            # Get total views in date range
            views_result = supabase_admin.table("offer_views").select(
                "id", count="exact"
            ).in_("offer_id", offer_ids).gte("viewed_at", start_date_str).execute()
            total_views = views_result.count or 0
            
            # Get total clicks in date range  
            clicks_result = supabase_admin.table("offer_clicks").select(
                "id", count="exact"
            ).in_("offer_id", offer_ids).gte("clicked_at", start_date_str).execute()
            total_clicks = clicks_result.count or 0
            
            # Get total claims in date range
            claims_result = supabase_admin.table("claimed_offers").select(
                "id", count="exact"
            ).in_("offer_id", offer_ids).gte("claimed_at", start_date_str).execute()
            total_claims = claims_result.count or 0
        
        return {
            "success": True,
            "data": {
                "time_range": f"Last {time_range} day{'s' if time_range != '1' else ''}",
                "period": {
                    "start": start_date.strftime("%Y-%m-%d"),
                    "end": now.strftime("%Y-%m-%d")
                },
                "summary": {
                    "active_offers": active_offers,
                    "total_views": total_views,
                    "total_clicks": total_clicks,
                    "total_claims": total_claims
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting business analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get business analytics: {str(e)}"
        )


@router.get("/offers/{offer_id}/analytics", response_model=dict)
async def get_offer_analytics(
    offer_id: str,
    current_user: UserProfile = Depends(get_current_business_user),
    time_range: str = Query("30", regex="^(1|7|30)$")  # 1 day, 7 days, 30 days
):
    """Get analytics for a specific offer"""
    try:
        # Get user's business
        business_result = supabase_admin.table("businesses").select("id, business_name").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Verify offer belongs to this business
        offer_result = supabase_admin.table("offers").select("*").eq("id", offer_id).eq("business_id", business_id).execute()
        
        if not offer_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found or does not belong to your business"
            )
        
        offer = offer_result.data[0]
        
        # Calculate date range
        now = datetime.now(timezone.utc)
        if time_range == "1":
            start_date = now - timedelta(days=1)
        elif time_range == "7":
            start_date = now - timedelta(days=7)
        else:  # 30 days
            start_date = now - timedelta(days=30)
        
        start_date_str = start_date.isoformat()
        
        # Get views for this offer in date range
        views_result = supabase_admin.table("offer_views").select(
            "id", count="exact"
        ).eq("offer_id", offer_id).gte("viewed_at", start_date_str).execute()
        total_views = views_result.count or 0
        
        # Get clicks for this offer in date range
        clicks_result = supabase_admin.table("offer_clicks").select(
            "id", count="exact"
        ).eq("offer_id", offer_id).gte("clicked_at", start_date_str).execute()
        total_clicks = clicks_result.count or 0
        
        # Get claims for this offer in date range
        claims_result = supabase_admin.table("claimed_offers").select(
            "id", count="exact"
        ).eq("offer_id", offer_id).gte("claimed_at", start_date_str).execute()
        total_claims = claims_result.count or 0
        
        return {
            "success": True,
            "data": {
                "offer_id": offer_id,
                "offer_title": offer["title"],
                "time_range": f"Last {time_range} day{'s' if time_range != '1' else ''}",
                "period": {
                    "start": start_date.strftime("%Y-%m-%d"),
                    "end": now.strftime("%Y-%m-%d")
                },
                "metrics": {
                    "views": total_views,
                    "clicks": total_clicks,
                    "claims": total_claims,
                    "click_through_rate": round((total_clicks / total_views * 100) if total_views > 0 else 0, 2),
                    "claim_rate": round((total_claims / total_views * 100) if total_views > 0 else 0, 2)
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting offer analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get offer analytics: {str(e)}"
        )


@router.get("/analytics/offers", response_model=dict)
async def get_offers_analytics_list(
    current_user: UserProfile = Depends(get_current_business_user),
    time_range: str = Query("30", regex="^(1|7|30)$"),  # 1 day, 7 days, 30 days
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100)
):
    """Get analytics for all offers with pagination"""
    try:
        # Get user's business
        business_result = supabase_admin.table("businesses").select("id, business_name").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Calculate date range
        now = datetime.now(timezone.utc)
        if time_range == "1":
            start_date = now - timedelta(days=1)
        elif time_range == "7":
            start_date = now - timedelta(days=7)
        else:  # 30 days
            start_date = now - timedelta(days=30)
        
        start_date_str = start_date.isoformat()
        
        # Get offers with pagination
        offset = (page - 1) * limit
        offers_result = supabase_admin.table("offers").select(
            "id, title, description, discount_type, discount_value, start_date, expiry_date, max_claims, current_claims, is_active, created_at, products(*)",
            count="exact"
        ).eq("business_id", business_id).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        if not offers_result.data:
            return {
                "success": True,
                "data": {
                    "offers": [],
                    "pagination": {
                        "page": page,
                        "limit": limit,
                        "total": 0,
                        "pages": 0
                    },
                    "time_range": f"Last {time_range} day{'s' if time_range != '1' else ''}"
                }
            }
        
        offers = []
        for offer in offers_result.data:
            offer_id = offer["id"]
            
            # Get analytics for each offer
            views_result = supabase_admin.table("offer_views").select(
                "id", count="exact"
            ).eq("offer_id", offer_id).gte("viewed_at", start_date_str).execute()
            
            clicks_result = supabase_admin.table("offer_clicks").select(
                "id", count="exact"
            ).eq("offer_id", offer_id).gte("clicked_at", start_date_str).execute()
            
            claims_result = supabase_admin.table("claimed_offers").select(
                "id", count="exact"
            ).eq("offer_id", offer_id).gte("claimed_at", start_date_str).execute()
            
            total_views = views_result.count or 0
            total_clicks = clicks_result.count or 0
            total_claims = claims_result.count or 0
            
            # Calculate time left
            now = datetime.now(timezone.utc)
            expiry_date = datetime.fromisoformat(offer["expiry_date"].replace('Z', '+00:00'))
            time_left = expiry_date - now
            
            if time_left.total_seconds() <= 0:
                time_left_str = "Expired"
            else:
                days = time_left.days
                hours = time_left.seconds // 3600
                if days > 0:
                    time_left_str = f"{days}d {hours}hr left"
                else:
                    time_left_str = f"{hours}hr left"
            
            offers.append({
                "id": offer_id,
                "title": offer["title"],
                "description": offer["description"],
                "discount_type": offer["discount_type"],
                "discount_value": float(offer["discount_value"]) if offer["discount_value"] else 0,
                "time_left": time_left_str,
                "is_active": offer["is_active"],
                "max_claims": offer["max_claims"],
                "current_claims": offer["current_claims"] or 0,
                "product": offer["products"],
                "metrics": {
                    "views": total_views,
                    "clicks": total_clicks,
                    "claims": total_claims,
                    "click_through_rate": round((total_clicks / total_views * 100) if total_views > 0 else 0, 2),
                    "claim_rate": round((total_claims / total_views * 100) if total_views > 0 else 0, 2)
                }
            })
        
        # Calculate pagination
        total_items = offers_result.count
        total_pages = (total_items + limit - 1) // limit
        
        return {
            "success": True,
            "data": {
                "offers": offers,
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total": total_items,
                    "pages": total_pages
                },
                "time_range": f"Last {time_range} day{'s' if time_range != '1' else ''}",
                "period": {
                    "start": start_date.strftime("%Y-%m-%d"),
                    "end": now.strftime("%Y-%m-%d")
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting offers analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get offers analytics: {str(e)}"
        )


# ============================================================================
# BUSINESS QR CODE
# ============================================================================

@router.get("/qr-code", response_model=dict)
async def get_business_qr_code(
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Generate QR code for business that customers can scan to view offers"""
    
    try:
        # Get business info
        business_result = supabase_admin.table("businesses").select(
            "id, business_name"
        ).eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business = business_result.data[0]
        business_id = business["id"]
        business_name = business["business_name"]

        # Use web URL for universal compatibility
        # This page will auto-detect and open app if installed
        customer_url = f"{settings.frontend_url}/shoppers/business/{business_id}"

        # Mobile app deep link (for reference)
        app_deep_link = f"popupreach://business/{business_id}"
        
        # Generate QR code
        import qrcode
        import qrcode.image.svg
        from io import BytesIO
        import base64
        
        # Create QR code instance
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        
        # Add data
        qr.add_data(customer_url)
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64 for easy display
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        qr_code_data_url = f"data:image/png;base64,{img_str}"
        
        return {
            "qr_code": qr_code_data_url,
            "customer_url": customer_url,
            "app_deep_link": app_deep_link,
            "business_id": business_id,
            "business_name": business_name,
            "message": "QR code generated successfully. Customers can scan this to view your offers - it will open in the app if installed, or in a web browser otherwise."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating QR code: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate QR code: {str(e)}"
        )
