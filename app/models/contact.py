import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.business import Business


class LeadStatus(str, enum.Enum):
    LEAD = "LEAD"
    QUALIFIED = "QUALIFIED"
    CUSTOMER = "CUSTOMER"


class Contact(BaseModel):
    """Customer or lead captured from Instagram messaging."""
    __tablename__ = "contacts"

    business_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    platform_user_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True) # Instagram IGSID
    username: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    lead_status: Mapped[str] = mapped_column(String(50), default=LeadStatus.LEAD.value, nullable=False)
    tags: Mapped[List[str]] = mapped_column(JSON().with_variant(JSONB, "postgresql"), default=list)
    last_interaction_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    business: Mapped["Business"] = relationship("Business", lazy="selectin")
