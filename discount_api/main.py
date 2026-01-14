import sys
import asyncio
import json
from decimal import Decimal

# Fix for Windows psycopg3 compatibility
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import check_database_health
from app.api.routes import auth, health, business, categories, customer, superadmin


# Custom JSON encoder to handle Decimal objects
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


# Monkey patch the default encoder
def custom_jsonable_encoder(obj, **kwargs):
    """Custom JSON encoder that handles Decimal objects"""
    if isinstance(obj, dict):
        return {key: custom_jsonable_encoder(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [custom_jsonable_encoder(item) for item in obj]
    elif isinstance(obj, Decimal):
        return float(obj)
    else:
        return jsonable_encoder(obj, **kwargs)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print(f"Starting {settings.app_name}...")
    
    # Check database connection
    try:
        db_healthy = await check_database_health()
        if not db_healthy:
            print("⚠️  Warning: Database connection failed")
        else:
            print("✅ Database connection successful")
    except Exception as e:
        print(f"⚠️  Database check failed: {e}")
    
    yield
    
    # Shutdown
    print(f"Shutting down {settings.app_name}...")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description="API for offers and deals management platform",
    version="1.0.0",
    debug=settings.debug,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://discount-fullstack.vercel.app",
        "https://discount-fullstack-6y9dnsfnn-popupreach.vercel.app",
        "www.popupreach.com",
        "https://www.popupreach.com",
        "https://popupreach.com",
        "http://popupreach.com",
        "popupreach.com",
        "http://localhost:3000",
        "https://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(categories.router, prefix="/api/v1")
app.include_router(business.router, prefix="/api/v1")
app.include_router(customer.router, prefix="/api/v1")

# Include superadmin router if feature is enabled
if settings.enable_superadmin_offers:
    app.include_router(superadmin.router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/health"
    }

@app.get("/api/v1")
async def api_info():
    """API information"""
    return {
        "message": f"{settings.app_name} API v1",
        "endpoints": {
            "health": "/api/v1/health",
            "auth": "/api/v1/auth",
            "categories": "/api/v1/categories",
            "business": "/api/v1/business",
            "customer": "/api/v1/customer"
        },
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=settings.debug
    )

