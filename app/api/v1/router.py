from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    businesses,
    health,
    instagram,
    inbox,
    products,
    contacts,
    automations,
)

api_router = APIRouter()

# Health endpoints
api_router.include_router(health.router, tags=["Health"])

# Authentication & Profile
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Multi-Tenant Business Management
api_router.include_router(businesses.router, prefix="/businesses", tags=["Businesses"])

# Instagram Graph API & Webhooks
api_router.include_router(instagram.router, prefix="/instagram", tags=["Instagram"])

# Live Inbox & Conversations (Human Takeover)
api_router.include_router(inbox.router, prefix="/inbox", tags=["Inbox"])

# E-commerce Products Catalog
api_router.include_router(products.router, prefix="/products", tags=["Products"])

# CRM & Leads Directory
api_router.include_router(contacts.router, prefix="/contacts", tags=["CRM"])

# Visual Workflow Automations
api_router.include_router(automations.router, prefix="/automations", tags=["Automations"])
