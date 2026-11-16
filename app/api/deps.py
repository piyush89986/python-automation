import uuid
from typing import AsyncGenerator, Optional
from fastapi import Depends, Header, Path, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import decode_token
from app.core.errors import ForbiddenError, NotFoundError, UnauthorizedError
from app.models.user import User, UserRole
from app.models.business import Business

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Validate Bearer JWT access token and return authenticated active user."""
    if not auth or not auth.credentials:
        raise UnauthorizedError("Authentication credentials missing or invalid")

    payload = decode_token(auth.credentials, is_refresh=False)
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise UnauthorizedError("Invalid token payload: missing subject")

    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise UnauthorizedError("Invalid user ID in token")

    query = select(User).where(User.id == user_uuid, User.is_active == True)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise UnauthorizedError("User account does not exist or has been deactivated")

    return user


async def require_super_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Enforce that authenticated user has super_admin role."""
    if not current_user.is_super_admin:
        raise ForbiddenError("Super administrator privilege required for this action")
    return current_user


async def require_business_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Enforce that authenticated user is either business_admin or super_admin."""
    if not (current_user.is_business_admin or current_user.is_super_admin):
        raise ForbiddenError("Business administrator privilege required for this action")
    return current_user


class TenantContext:
    """Resolves and enforces multi-tenant business boundary for requests."""
    def __init__(
        self,
        current_user: User = Depends(get_current_user),
        x_business_id: Optional[str] = Header(None, alias="X-Business-ID"),
    ):
        self.user = current_user

        if current_user.is_super_admin:
            # Super admin can switch tenant via header or operate globally
            if x_business_id:
                try:
                    self.business_id = uuid.UUID(x_business_id)
                except ValueError:
                    raise ForbiddenError("Invalid X-Business-ID header format")
            else:
                self.business_id = current_user.business_id  # May be None for global
        else:
            # Business admins are strictly locked to their assigned tenant
            if not current_user.business_id:
                raise ForbiddenError("User is not associated with an active business organization")
            self.business_id = current_user.business_id

    def assert_tenant_access(self, target_business_id: uuid.UUID):
        """Verify that the user is permitted to access the target business."""
        if self.user.is_super_admin:
            return  # Super admin is authorized for all tenants
        if self.business_id != target_business_id:
            raise ForbiddenError("Access to this business organization is denied (cross-tenant violation)")
