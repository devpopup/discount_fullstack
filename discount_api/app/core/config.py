# app/core/config.py - Updated configuration
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Supabase Configuration
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str  # This should match your .env
    
    # Database Configuration
    database_url: str
    
    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # App Configuration
    app_name: str = "Offers API"
    debug: bool = False

    # Feature Flags
    enable_superadmin_offers: bool = True  # Set to False to disable superadmin functionality
    
    # Frontend/QR Code Configuration
    frontend_url: str = "https://yourapp.com"  # Update this to your actual domain
    api_base_url: str = "https://api.yourapp.com"  # Your API domain
    
    # QR Code Settings
    qr_code_size: int = 10  # Box size for QR codes
    qr_code_border: int = 4  # Border size for QR codes
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        # Map environment variables to field names
        env_aliases = {
            'supabase_service_role_key': 'SUPABASE_SERVICE_KEY'  # Map your env var name
        }


settings = Settings()