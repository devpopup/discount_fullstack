from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from app.core.database import supabase
from app.schemas.user import UserProfile
import uuid

security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> UserProfile:
    """Get current authenticated user"""
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Extract token
    token = credentials.credentials
    
    # Verify with Supabase first
    try:
        supabase_user = supabase.auth.get_user(token)
        if not supabase_user.user:
            raise credentials_exception
        
        user_id = supabase_user.user.id
    except Exception:
        raise credentials_exception
    
    # Get user from database
    try:
        result = supabase.table("profiles").select("*").eq("id", user_id).execute()
        
        if not result.data:
            raise credentials_exception
            
        user_data = result.data[0]
        
        if not user_data.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )
            
        return UserProfile(**user_data)
    
    except ValueError:
        raise credentials_exception
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving user"
        )

async def get_current_active_user(
    current_user: UserProfile = Depends(get_current_user)
) -> UserProfile:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Inactive user"
        )
    return current_user

async def get_current_business_user(
    current_user: UserProfile = Depends(get_current_active_user)
) -> UserProfile:
    """Get current business user"""
    if not current_user.is_business:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Business account required."
        )
    return current_user

async def get_current_admin_user(
    current_user: UserProfile = Depends(get_current_active_user)
) -> UserProfile:
    """Get current admin user"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required."
        )
    return current_user

# Optional user dependency (doesn't raise exception if no user)
async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security)
) -> Optional[UserProfile]:
    """Get current user if authenticated, None otherwise"""
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None