import uuid
from datetime import timedelta
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.core.errors import BadRequestError, UnauthorizedError
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserProfileResponse,
    UserRead,
)
from app.schemas.common import StandardResponse

router = APIRouter()


@router.post(
    "/login",
    response_model=StandardResponse[TokenResponse],
    summary="User Login",
    description="Authenticate user with email and password, returning JWT access and refresh tokens.",
)
async def login(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    query = select(User).where(User.email == payload.email)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise UnauthorizedError("Incorrect email or password")

    if not user.is_active:
        raise UnauthorizedError("Account has been deactivated. Please contact support.")

    token_payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "business_id": str(user.business_id) if user.business_id else None,
    }

    access_token = create_access_token(token_payload)
    refresh_token = create_refresh_token({"sub": str(user.id)})

    token_data = TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserRead.model_validate(user),
    )

    return StandardResponse(
        status="success",
        message="Authentication successful",
        data=token_data,
    )


@router.post(
    "/refresh",
    response_model=StandardResponse[TokenResponse],
    summary="Refresh Access Token",
    description="Exchange a valid refresh token for a newly signed access token.",
)
async def refresh_token(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    decoded = decode_token(payload.refresh_token, is_refresh=True)
    user_id_str = decoded.get("sub")
    if not user_id_str:
        raise UnauthorizedError("Invalid token payload")

    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise UnauthorizedError("Invalid user ID in token")

    query = select(User).where(User.id == user_uuid, User.is_active == True)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise UnauthorizedError("User does not exist or account deactivated")

    token_payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "business_id": str(user.business_id) if user.business_id else None,
    }

    new_access_token = create_access_token(token_payload)
    new_refresh_token = create_refresh_token({"sub": str(user.id)})

    token_data = TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserRead.model_validate(user),
    )

    return StandardResponse(
        status="success",
        message="Token refreshed successfully",
        data=token_data,
    )


@router.get(
    "/me",
    response_model=StandardResponse[UserProfileResponse],
    summary="Get Current User Profile",
    description="Return the authenticated user profile along with associated organization information.",
)
async def get_me(
    current_user: User = Depends(get_current_user),
):
    business_dict = None
    if current_user.business:
        business_dict = {
            "id": str(current_user.business.id),
            "name": current_user.business.name,
            "slug": current_user.business.slug,
            "plan_tier": current_user.business.plan_tier,
            "max_bots": current_user.business.max_bots,
            "max_messages_per_month": current_user.business.max_messages_per_month,
            "current_month_messages": current_user.business.current_month_messages,
            "is_active": current_user.business.is_active,
        }

    profile = UserProfileResponse(
        user=UserRead.model_validate(current_user),
        business=business_dict,
    )

    return StandardResponse(
        status="success",
        data=profile,
    )
