from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.core.logging import logger
from app.core.security import get_password_hash
from app.models.user import User, UserRole


async def init_super_admin(db: AsyncSession) -> None:
    """Create initial super administrator account if no users exist in database."""
    query = select(User).where(User.role == UserRole.SUPER_ADMIN.value)
    result = await db.execute(query)
    super_admin = result.scalar_one_or_none()

    if not super_admin:
        logger.info(f"Bootstrapping initial Super Admin: {settings.FIRST_SUPER_ADMIN_EMAIL}")
        admin = User(
            email=settings.FIRST_SUPER_ADMIN_EMAIL,
            hashed_password=get_password_hash(settings.FIRST_SUPER_ADMIN_PASSWORD),
            full_name="System Super Administrator",
            role=UserRole.SUPER_ADMIN.value,
            business_id=None,
            is_active=True,
        )
        db.add(admin)
        await db.commit()
        logger.info("Super Administrator created successfully.")
