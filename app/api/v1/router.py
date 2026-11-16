from fastapi import APIRouter
from app.api.v1.endpoints import auth, businesses, health

api_router = APIRouter()

# Health endpoints
api_router.include_router(health.router, tags=["Health"])

# Authentication & Profile
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Multi-Tenant Business Management
api_router.include_router(businesses.router, prefix="/businesses", tags=["Businesses"])
