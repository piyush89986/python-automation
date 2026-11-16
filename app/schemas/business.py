import re
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from app.models.business import PlanTier


def generate_slug(text: str) -> str:
    """Generate a clean URL-friendly slug from text."""
    slug = re.sub(r"[^\w\s-]", "", text).strip().lower()
    return re.sub(r"[-\s]+", "-", slug)


class BusinessCreate(BaseModel):
    """Payload for super admin to provision a new business and its client administrator."""
    name: str = Field(..., min_length=2, max_length=255)
    slug: Optional[str] = Field(None, max_length=100)
    plan_tier: PlanTier = PlanTier.FREE
    max_bots: Optional[int] = Field(None, ge=1)
    max_messages_per_month: Optional[int] = Field(None, ge=100)
    max_documents: Optional[int] = Field(None, ge=1)

    # Initial Client Admin Credentials
    admin_email: EmailStr
    admin_password: str = Field(..., min_length=8)
    admin_full_name: str = Field(..., min_length=2, max_length=255)

    @field_validator("slug", mode="before")
    @classmethod
    def validate_slug(cls, v: Optional[str], values) -> Optional[str]:
        if v:
            return generate_slug(v)
        return v


class BusinessUpdate(BaseModel):
    """Payload for updating business configuration or plan quotas."""
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    plan_tier: Optional[PlanTier] = None
    max_bots: Optional[int] = Field(None, ge=1)
    max_messages_per_month: Optional[int] = Field(None, ge=100)
    max_documents: Optional[int] = Field(None, ge=1)
    is_active: Optional[bool] = None
    settings: Optional[dict] = None


class BusinessRead(BaseModel):
    """Response payload for business details."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    plan_tier: str
    max_bots: int
    max_messages_per_month: int
    current_month_messages: int
    max_documents: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class BusinessUsage(BaseModel):
    """Usage limits and current consumption metrics for a business tenant."""
    business_id: uuid.UUID
    plan_tier: str
    messages_used: int
    messages_limit: int
    messages_usage_percent: float
    bots_used: int
    bots_limit: int
    documents_used: int
    documents_limit: int
