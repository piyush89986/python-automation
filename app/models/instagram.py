import uuid
from typing import TYPE_CHECKING, Optional
from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.business import Business


class InstagramAccount(BaseModel):
    """Connected Instagram Professional/Business account."""
    __tablename__ = "instagram_accounts"

    business_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    meta_account_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True) # Facebook Page ID
    instagram_account_id: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True) # IG Business ID
    username: Mapped[str] = mapped_column(String(100), nullable=False)
    profile_picture_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    access_token_enc: Mapped[str] = mapped_column(Text, nullable=False)
    page_access_token_enc: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    business: Mapped["Business"] = relationship("Business", lazy="selectin")
