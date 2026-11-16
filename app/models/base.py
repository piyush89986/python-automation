import uuid
from datetime import datetime, timezone
from typing import Any
from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, declared_attr


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    """SQLAlchemy 2.0 declarative base class."""
    pass


class TimestampMixin:
    """Provides automatic UTC timestamps for creation and modification."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )


class BaseModel(Base, TimestampMixin):
    """Abstract base model with a UUID primary key and timestamps."""
    __abstract__ = True

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )


class TenantMixin:
    """Enforces multi-tenancy by scoping records to a specific business."""
    @declared_attr
    def business_id(cls) -> Mapped[uuid.UUID]:
        return mapped_column(
            UUID(as_uuid=True),
            ForeignKey("businesses.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )


class BotMixin:
    """Scopes records to a specific bot within a business."""
    @declared_attr
    def bot_id(cls) -> Mapped[uuid.UUID]:
        return mapped_column(
            UUID(as_uuid=True),
            ForeignKey("bots.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
