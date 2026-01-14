from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime
import uuid


# Base schemas
class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None


# Request schemas
class UserRegister(UserBase):
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


# Response schemas
class UserProfile(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    avatar_url: Optional[str] = None
    is_business: bool = False
    is_admin: bool = False
    is_superadmin: bool = False
    is_active: bool = True
    created_at: datetime
    updated_at: datetime


class UserResponse(BaseModel):
    """Standard user response with token"""
    user: UserProfile
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenResponse(BaseModel):
    """Token-only response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int


# Generic response schemas
class MessageResponse(BaseModel):
    message: str
    success: bool = True


class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None