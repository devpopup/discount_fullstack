from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from supabase import create_client, Client
from app.core.config import settings

# SQLAlchemy setup for direct database access
# Using psycopg instead of asyncpg to avoid Windows build issues
engine = create_async_engine(
    settings.database_url.replace("postgresql://", "postgresql+psycopg2://"),
    echo=settings.debug
)

AsyncSessionLocal = sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

Base = declarative_base()

# Supabase client for auth and additional features
supabase: Client = create_client(
    settings.supabase_url, 
    settings.supabase_anon_key
)

# Service role client for admin operations
supabase_admin: Client = create_client(
    settings.supabase_url, 
    settings.supabase_service_role_key
)

# Dependency to get database session
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# Database health check
async def check_database_health() -> bool:
    try:
        from sqlalchemy import text
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
            return True
    except Exception:
        return False