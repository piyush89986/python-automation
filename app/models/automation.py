import enum
import uuid
from typing import TYPE_CHECKING, Optional
from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.business import Business


class TriggerType(str, enum.Enum):
    DM_RECEIVED = "DM_RECEIVED"
    COMMENT_RECEIVED = "COMMENT_RECEIVED"
    STORY_REPLY = "STORY_REPLY"


class AutomationWorkflow(BaseModel):
    """Visual drag-and-drop rule automation flow."""
    __tablename__ = "automation_workflows"

    business_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    trigger_type: Mapped[str] = mapped_column(String(50), default=TriggerType.DM_RECEIVED.value, nullable=False)
    nodes_graph: Mapped[dict] = mapped_column(JSON().with_variant(JSONB, "postgresql"), default=list)
    edges_graph: Mapped[dict] = mapped_column(JSON().with_variant(JSONB, "postgresql"), default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    business: Mapped["Business"] = relationship("Business", lazy="selectin")
