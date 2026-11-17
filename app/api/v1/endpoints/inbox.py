import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.core.security import decrypt_field
from app.core.errors import BadRequestError, NotFoundError
from app.api.deps import get_current_user
from app.models.user import User
from app.models.conversation import Conversation, ConversationStatus, Message, MessageSource
from app.models.contact import Contact
from app.models.instagram import InstagramAccount
from app.services.meta_service import MetaService
from app.schemas.common import StandardResponse

router = APIRouter()


class SendMessagePayload(BaseModel):
    text: str


class TakeoverPayload(BaseModel):
    human_takeover: bool


class StatusPayload(BaseModel):
    status: str


@router.get(
    "/conversations",
    summary="List Conversations for Live Inbox",
    description="Returns open/resolved conversations with customer profiles, unread counts, and Human Takeover state.",
)
async def list_conversations(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    business_id = current_user.business_id
    if not business_id:
        return StandardResponse(status="success", data=[])

    query = select(Conversation).where(Conversation.business_id == business_id)
    if status_filter:
        query = query.where(Conversation.status == status_filter.upper())

    query = query.order_by(desc(Conversation.last_message_at))
    result = await db.execute(query)
    conversations = result.scalars().all()

    output = []
    for c in conversations:
        contact_dict = {
            "id": str(c.contact.id),
            "username": c.contact.username,
            "full_name": c.contact.full_name,
            "email": c.contact.email,
            "phone": c.contact.phone,
            "avatar_url": c.contact.avatar_url,
            "lead_status": c.contact.lead_status,
            "tags": c.contact.tags,
        } if c.contact else None

        if search and contact_dict:
            q = search.lower()
            if q not in contact_dict["username"].lower() and q not in (contact_dict["full_name"] or "").lower():
                continue

        output.append({
            "id": str(c.id),
            "contact": contact_dict,
            "human_takeover": c.human_takeover,
            "status": c.status,
            "unread_count": c.unread_count,
            "last_message_at": c.last_message_at.isoformat(),
            "last_message_preview": c.last_message_preview,
        })

    return StandardResponse(status="success", data=output)


@router.get(
    "/conversations/{conversation_id}/messages",
    summary="Get Message Stream for Conversation",
)
async def get_messages(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv_stmt = select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.business_id == current_user.business_id,
    )
    conv = (await db.execute(conv_stmt)).scalar_one_or_none()
    if not conv:
        raise NotFoundError("Conversation not found")

    # Mark as read
    conv.unread_count = 0
    await db.commit()

    msg_stmt = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    )
    messages = (await db.execute(msg_stmt)).scalars().all()

    data = [
        {
            "id": str(m.id),
            "conversation_id": str(m.conversation_id),
            "sender_id": m.sender_id,
            "text": m.text,
            "media_url": m.media_url,
            "source": m.source, # CUSTOMER, AI, AGENT
            "created_at": m.created_at.isoformat(),
        }
        for m in messages
    ]

    return StandardResponse(status="success", data=data)


@router.post(
    "/conversations/{conversation_id}/messages",
    summary="Agent Manual Send DM",
    description="Dispatches a manual reply directly to Instagram customer via Meta Graph API.",
)
async def send_agent_message(
    conversation_id: uuid.UUID,
    payload: SendMessagePayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv_stmt = select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.business_id == current_user.business_id,
    )
    conv = (await db.execute(conv_stmt)).scalar_one_or_none()
    if not conv:
        raise NotFoundError("Conversation not found")

    text = payload.text.strip()
    if not text:
        raise BadRequestError("Message text cannot be empty")

    # Save Agent message in DB
    agent_msg = Message(
        conversation_id=conv.id,
        sender_id=str(current_user.id),
        text=text,
        source=MessageSource.AGENT.value,
        is_read=True,
    )
    db.add(agent_msg)
    conv.last_message_preview = f"You: {text[:100]}"
    await db.commit()
    await db.refresh(agent_msg)

    # Dispatch to Instagram via Meta Graph API
    if conv.instagram_account_id:
        acc_stmt = select(InstagramAccount).where(InstagramAccount.id == conv.instagram_account_id)
        ig_acc = (await db.execute(acc_stmt)).scalar_one_or_none()
        if ig_acc and conv.contact:
            page_token = decrypt_field(ig_acc.page_access_token_enc)
            try:
                await MetaService.send_text_dm(page_token, conv.contact.platform_user_id, text)
            except Exception as e:
                pass

    return StandardResponse(
        status="success",
        message="Message dispatched to Instagram",
        data={
            "id": str(agent_msg.id),
            "conversation_id": str(agent_msg.conversation_id),
            "sender_id": agent_msg.sender_id,
            "text": agent_msg.text,
            "source": agent_msg.source,
            "created_at": agent_msg.created_at.isoformat(),
        },
    )


@router.patch(
    "/conversations/{conversation_id}/takeover",
    summary="Toggle Human Takeover Switch",
    description="Silences or enables the AI assistant for this specific customer conversation.",
)
async def toggle_human_takeover(
    conversation_id: uuid.UUID,
    payload: TakeoverPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv_stmt = select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.business_id == current_user.business_id,
    )
    conv = (await db.execute(conv_stmt)).scalar_one_or_none()
    if not conv:
        raise NotFoundError("Conversation not found")

    conv.human_takeover = payload.human_takeover
    await db.commit()

    return StandardResponse(
        status="success",
        message=f"Human Takeover {'enabled (AI silenced)' if conv.human_takeover else 'disabled (AI active)'}",
        data={"id": str(conv.id), "human_takeover": conv.human_takeover},
    )


@router.patch(
    "/conversations/{conversation_id}/status",
    summary="Update Conversation Status (OPEN, RESOLVED, SNOOZED)",
)
async def update_conversation_status(
    conversation_id: uuid.UUID,
    payload: StatusPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv_stmt = select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.business_id == current_user.business_id,
    )
    conv = (await db.execute(conv_stmt)).scalar_one_or_none()
    if not conv:
        raise NotFoundError("Conversation not found")

    new_status = payload.status.upper()
    if new_status in ConversationStatus.__members__:
        conv.status = new_status
        await db.commit()

    return StandardResponse(
        status="success",
        data={"id": str(conv.id), "status": conv.status},
    )
