import math
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select, or_

from app.core.database import get_db
from app.core.security import get_password_hash
from app.core.errors import BadRequestError, ConflictError, NotFoundError
from app.api.deps import (
    TenantContext,
    get_current_user,
    require_super_admin,
    require_business_admin,
)
from app.models.business import Business, PlanTier, TIER_LIMITS
from app.models.user import User, UserRole
from app.schemas.business import (
    BusinessCreate,
    BusinessRead,
    BusinessUpdate,
    BusinessUsage,
    generate_slug,
)
from app.schemas.common import PaginatedResponse, PaginationMeta, StandardResponse

router = APIRouter()


@router.post(
    "",
    response_model=StandardResponse[BusinessRead],
    status_code=status.HTTP_201_CREATED,
    summary="Create Business & Client Admin",
    description="Super Admin endpoint to provision a new business organization along with its client administrator account.",
)
async def create_business(
    payload: BusinessCreate,
    current_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    # Determine slug
    slug = payload.slug or generate_slug(payload.name)
    if not slug:
        raise BadRequestError("Could not generate a valid URL slug from the provided business name")

    # Check for existing slug
    existing_slug = await db.execute(select(Business).where(Business.slug == slug))
    if existing_slug.scalar_one_or_none():
        raise ConflictError(f"A business with slug '{slug}' already exists")

    # Check for existing admin email
    existing_user = await db.execute(select(User).where(User.email == payload.admin_email))
    if existing_user.scalar_one_or_none():
        raise ConflictError(f"A user with email '{payload.admin_email}' already exists")

    # Apply default plan limits if not overridden
    tier_defaults = TIER_LIMITS.get(payload.plan_tier, TIER_LIMITS[PlanTier.FREE])
    max_bots = payload.max_bots or tier_defaults["max_bots"]
    max_messages = payload.max_messages_per_month or tier_defaults["max_messages"]
    max_docs = payload.max_documents or tier_defaults["max_docs"]

    # 1. Create Business
    new_business = Business(
        name=payload.name,
        slug=slug,
        plan_tier=payload.plan_tier.value,
        max_bots=max_bots,
        max_messages_per_month=max_messages,
        max_documents=max_docs,
        is_active=True,
    )
    db.add(new_business)
    await db.flush()  # Flush to get new_business.id

    # 2. Create Initial Client Administrator
    admin_user = User(
        email=payload.admin_email,
        hashed_password=get_password_hash(payload.admin_password),
        full_name=payload.admin_full_name,
        role=UserRole.BUSINESS_ADMIN.value,
        business_id=new_business.id,
        is_active=True,
    )
    db.add(admin_user)
    await db.commit()
    await db.refresh(new_business)

    return StandardResponse(
        status="success",
        message="Business and client admin provisioned successfully",
        data=BusinessRead.model_validate(new_business),
    )


@router.get(
    "",
    response_model=PaginatedResponse[BusinessRead],
    summary="List Businesses",
    description="Super Admin endpoint to list all business tenants with pagination and filtering.",
)
async def list_businesses(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by name or slug"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    plan_tier: Optional[PlanTier] = Query(None, description="Filter by subscription tier"),
    current_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(Business)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.where(
            or_(
                Business.name.ilike(search_pattern),
                Business.slug.ilike(search_pattern),
            )
        )
    if is_active is not None:
        query = query.where(Business.is_active == is_active)
    if plan_tier is not None:
        query = query.where(Business.plan_tier == plan_tier.value)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    offset = (page - 1) * limit
    paginated_query = query.order_by(Business.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(paginated_query)
    businesses = result.scalars().all()

    pages = math.ceil(total / limit) if limit > 0 else 1

    return PaginatedResponse(
        status="success",
        data=[BusinessRead.model_validate(b) for b in businesses],
        pagination=PaginationMeta(
            total=total,
            page=page,
            limit=limit,
            pages=pages,
        ),
    )


@router.get(
    "/{id}",
    response_model=StandardResponse[BusinessRead],
    summary="Get Business by ID",
    description="Fetch details of a business organization. Accessible by Super Admin or the Business Admin of this tenant.",
)
async def get_business(
    id: uuid.UUID,
    tenant_ctx: TenantContext = Depends(),
    db: AsyncSession = Depends(get_db),
):
    tenant_ctx.assert_tenant_access(id)

    query = select(Business).where(Business.id == id)
    result = await db.execute(query)
    business = result.scalar_one_or_none()

    if not business:
        raise NotFoundError("Business not found")

    return StandardResponse(
        status="success",
        data=BusinessRead.model_validate(business),
    )


@router.get(
    "/{id}/usage",
    response_model=StandardResponse[BusinessUsage],
    summary="Get Business Quota & Usage",
    description="Fetch current consumption and configured limits for messages, bots, and documents.",
)
async def get_business_usage(
    id: uuid.UUID,
    tenant_ctx: TenantContext = Depends(),
    db: AsyncSession = Depends(get_db),
):
    tenant_ctx.assert_tenant_access(id)

    query = select(Business).where(Business.id == id)
    result = await db.execute(query)
    business = result.scalar_one_or_none()

    if not business:
        raise NotFoundError("Business not found")

    # In Phase 2, mock/calculate usage counts until bots/docs are created in Phases 3-4
    bots_count = 0
    docs_count = 0
    messages_percent = round((business.current_month_messages / max(1, business.max_messages_per_month)) * 100, 2)

    usage = BusinessUsage(
        business_id=business.id,
        plan_tier=business.plan_tier,
        messages_used=business.current_month_messages,
        messages_limit=business.max_messages_per_month,
        messages_usage_percent=messages_percent,
        bots_used=bots_count,
        bots_limit=business.max_bots,
        documents_used=docs_count,
        documents_limit=business.max_documents,
    )

    return StandardResponse(
        status="success",
        data=usage,
    )


@router.patch(
    "/{id}",
    response_model=StandardResponse[BusinessRead],
    summary="Update Business",
    description="Super Admin endpoint to modify business settings, subscription tier, or quota limits.",
)
async def update_business(
    id: uuid.UUID,
    payload: BusinessUpdate,
    current_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(Business).where(Business.id == id)
    result = await db.execute(query)
    business = result.scalar_one_or_none()

    if not business:
        raise NotFoundError("Business not found")

    update_data = payload.model_dump(exclude_unset=True)

    # If plan tier is updated and limits are not explicitly set, apply new defaults
    if "plan_tier" in update_data and update_data["plan_tier"]:
        new_tier = update_data["plan_tier"]
        tier_val = new_tier.value if hasattr(new_tier, "value") else str(new_tier)
        business.plan_tier = tier_val
        tier_limits = TIER_LIMITS.get(PlanTier(tier_val), TIER_LIMITS[PlanTier.FREE])
        if "max_bots" not in update_data:
            business.max_bots = tier_limits["max_bots"]
        if "max_messages_per_month" not in update_data:
            business.max_messages_per_month = tier_limits["max_messages"]
        if "max_documents" not in update_data:
            business.max_documents = tier_limits["max_docs"]

    for field, value in update_data.items():
        if field == "plan_tier":
            continue
        setattr(business, field, value)

    await db.commit()
    await db.refresh(business)

    return StandardResponse(
        status="success",
        message="Business updated successfully",
        data=BusinessRead.model_validate(business),
    )


@router.delete(
    "/{id}",
    response_model=StandardResponse[dict],
    summary="Deactivate Business",
    description="Super Admin endpoint to deactivate a business organization.",
)
async def deactivate_business(
    id: uuid.UUID,
    current_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(Business).where(Business.id == id)
    result = await db.execute(query)
    business = result.scalar_one_or_none()

    if not business:
        raise NotFoundError("Business not found")

    business.is_active = False
    await db.commit()

    return StandardResponse(
        status="success",
        message="Business deactivated successfully",
        data={"id": str(business.id), "is_active": False},
    )
