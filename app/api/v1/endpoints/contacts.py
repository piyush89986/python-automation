import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.core.database import get_db
from app.core.errors import NotFoundError
from app.api.deps import get_current_user
from app.models.user import User
from app.models.contact import Contact, LeadStatus
from app.schemas.common import StandardResponse

router = APIRouter()


class ContactUpdate(BaseModel):
    lead_status: Optional[str] = None
    tags: Optional[List[str]] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


@router.get(
    "",
    summary="List CRM Contacts & Leads",
    description="Query Instagram users captured via DMs, comments, and story mentions.",
)
async def list_contacts(
    lead_status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    business_id = current_user.business_id
    if not business_id:
        return StandardResponse(status="success", data=[])

    query = select(Contact).where(Contact.business_id == business_id)

    if lead_status:
        query = query.where(Contact.lead_status == lead_status.upper())
    if search:
        s = f"%{search.strip()}%"
        query = query.where(
            or_(
                Contact.username.ilike(s),
                Contact.full_name.ilike(s),
                Contact.email.ilike(s),
            )
        )

    query = query.order_by(Contact.last_interaction_at.desc())
    contacts = (await db.execute(query)).scalars().all()

    data = [
        {
            "id": str(c.id),
            "platform_user_id": c.platform_user_id,
            "username": c.username,
            "full_name": c.full_name,
            "email": c.email,
            "phone": c.phone,
            "avatar_url": c.avatar_url,
            "lead_status": c.lead_status,
            "tags": c.tags,
            "last_interaction_at": c.last_interaction_at.isoformat(),
        }
        for c in contacts
    ]

    return StandardResponse(status="success", data=data)


@router.patch(
    "/{contact_id}",
    summary="Update Contact Details / Lead Status",
)
async def update_contact(
    contact_id: uuid.UUID,
    payload: ContactUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Contact).where(
        Contact.id == contact_id,
        Contact.business_id == current_user.business_id,
    )
    contact = (await db.execute(stmt)).scalar_one_or_none()
    if not contact:
        raise NotFoundError("Contact not found")

    if payload.lead_status:
        contact.lead_status = payload.lead_status.upper()
    if payload.tags is not None:
        contact.tags = payload.tags
    if payload.full_name is not None:
        contact.full_name = payload.full_name
    if payload.email is not None:
        contact.email = payload.email
    if payload.phone is not None:
        contact.phone = payload.phone

    await db.commit()
    await db.refresh(contact)

    return StandardResponse(
        status="success",
        message="Contact updated",
        data={
            "id": str(contact.id),
            "username": contact.username,
            "lead_status": contact.lead_status,
            "tags": contact.tags,
        },
    )
