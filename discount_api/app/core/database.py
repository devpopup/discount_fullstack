import sys
import asyncio

# Fix for Windows compatibility
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy.ext.declarative import declarative_base
# SQLAlchemy imports commented out - using Supabase client only
# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker, Session
from supabase import create_client, Client
from app.core.config import settings
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

Base = declarative_base()

# SQLAlchemy setup (OPTIONAL - not used anymore, using Supabase client instead)
# Commented out to avoid connection issues in WSL
# engine = create_engine(
#     settings.database_url,
#     pool_pre_ping=True,
#     connect_args={
#         "connect_timeout": 10,
#         "options": "-c search_path=public"
#     }
# )
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Validate configuration
if not all([settings.supabase_url, settings.supabase_anon_key, settings.supabase_service_role_key]):
    raise ValueError("Missing required Supabase configuration. Check your .env file.")

# Initialize Supabase clients
supabase: Client = create_client(settings.supabase_url, settings.supabase_anon_key)
supabase_admin: Client = create_client(settings.supabase_url, settings.supabase_service_role_key)

# Simple database health check using Supabase
async def check_database_health() -> bool:
    try:
        # Test connection by querying profiles table
        result = supabase.table("profiles").select("id").limit(1).execute()
        logger.info("✅ Database connection successful")
        return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False

async def init_db():
    """Initialize database connection and verify tables exist"""
    try:
        # Test connection by checking if profiles table exists
        response = supabase.table("profiles").select("id").limit(1).execute()
        logger.info("✅ Database connection successful")
        
        # Check if sample categories exist
        categories_response = supabase.table("categories").select("*").execute()
        logger.info(f"✅ Found {len(categories_response.data)} categories")
        
        return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False

def get_supabase() -> Client:
    """Get Supabase client for regular operations"""
    return supabase

def get_supabase_admin() -> Client:
    """Get Supabase admin client for privileged operations"""
    return supabase_admin

def get_db():
    """
    Placeholder - no longer used (using Supabase client directly)
    """
    return supabase