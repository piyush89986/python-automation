import enum
import uuid
from typing import TYPE_CHECKING, Optional
from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.business import Business


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"       # System administrator
    BUSINESS_ADMIN = "business_admin" # Organization administrator


class User(BaseModel):
    """User account model for system administrators and client administrators."""
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default=UserRole.BUSINESS_ADMIN.value, nullable=False, index=True)

    # Scoped business tenant (null only for super_admin)
    business_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    # Relationships
    business: Mapped[Optional["Business"]] = relationship(
        "Business",
        back_populates="users",
        lazy="joined",
    )

    @property
    def is_super_admin(self) -> bool:
        return self.role == UserRole.SUPER_ADMIN.value

    @property
    def is_business_admin(self) -> bool:
        return self.role == UserRole.BUSINESS_ADMIN.value
