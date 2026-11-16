import enum
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, Enum, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User


class PlanTier(str, enum.Enum):
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    ENTERPRISE = "enterprise"


# Default limits per subscription tier
TIER_LIMITS = {
    PlanTier.FREE: {"max_bots": 1, "max_messages": 1000, "max_docs": 5},
    PlanTier.STARTER: {"max_bots": 3, "max_messages": 10000, "max_docs": 25},
    PlanTier.PRO: {"max_bots": 10, "max_messages": 50000, "max_docs": 100},
    PlanTier.ENTERPRISE: {"max_bots": 100, "max_messages": 500000, "max_docs": 1000},
}


class Business(BaseModel):
    """Multi-tenant Business entity representing an organization/client."""
    __tablename__ = "businesses"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)

    # Subscription & Plans
    plan_tier: Mapped[str] = mapped_column(
        String(50),
        default=PlanTier.FREE.value,
        nullable=False,
    )
    max_bots: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    max_messages_per_month: Mapped[int] = mapped_column(Integer, default=1000, nullable=False)
    current_month_messages: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_documents: Mapped[int] = mapped_column(Integer, default=5, nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    settings: Mapped[Optional[dict]] = mapped_column(JSON().with_variant(JSONB, "postgresql"), default=dict)

    # Relationships
    users: Mapped[List["User"]] = relationship(
        "User",
        back_populates="business",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def can_add_bot(self, current_bot_count: int) -> bool:
        """Check if business has capacity to create another bot."""
        return current_bot_count < self.max_bots

    def can_send_message(self) -> bool:
        """Check if business is within monthly message allowance."""
        return self.current_month_messages < self.max_messages_per_month
