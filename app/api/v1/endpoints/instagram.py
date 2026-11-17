import json
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Header, Query, Request, Response, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.core.config import settings
from app.core.database import get_db, redis_client
from app.core.logging import logger
from app.core.security import encrypt_field, decrypt_field
from app.core.errors import BadRequestError, ForbiddenError, NotFoundError
from app.api.deps import TenantContext, get_current_user
from app.models.user import User
from app.models.instagram import InstagramAccount
from app.models.contact import Contact, LeadStatus
from app.models.conversation import Conversation, ConversationStatus, Message, MessageSource
from app.models.product import Product
from app.services.meta_service import MetaService
from app.schemas.common import StandardResponse

router = APIRouter()


@router.get(
    "/webhook",
    summary="Meta Webhook Verification Handshake",
    description="Responds to Meta's subscription challenge verify request.",
)
async def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    """GET verification endpoint required by Meta App Dashboard."""
    logger.info(f"Meta webhook handshake: mode={hub_mode}, verify_token={hub_verify_token}")
    if hub_mode == "subscribe" and hub_verify_token == settings.META_WEBHOOK_VERIFY_TOKEN:
        logger.info("Webhook verified successfully by Meta!")
        return PlainTextResponse(content=hub_challenge or "", status_code=200)

    logger.warning("Rejected invalid Meta webhook verification request.")
    return PlainTextResponse(content="Verification failed", status_code=403)


@router.post(
    "/webhook",
    summary="Meta Incoming Webhook Receiver",
    description="Receives real-time Instagram DMs, mentions, comments, and postbacks.",
)
async def receive_webhook(
    request: Request,
    x_hub_signature_256: Optional[str] = Header(None, alias="X-Hub-Signature-256"),
):
    """Processes real-time inbound events from Instagram with signature check and deduplication."""
    raw_body = await request.body()

    # 1. Signature Verification (if configured)
    if settings.APP_ENV != "development" and x_hub_signature_256:
        is_valid = MetaService.verify_webhook_signature(raw_body, x_hub_signature_256)
        if not is_valid:
            logger.warning("Invalid Meta webhook HMAC signature.")
            return Response(status_code=403)

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except Exception:
        return PlainTextResponse("Invalid JSON", status_code=400)

    # 2. Fast ACK to Meta (Immediate 200 within 5 seconds)
    entries = payload.get("entry", [])
    if entries:
        # Schedule background processing
        from asyncio import create_task
        create_task(process_meta_entries(entries))

    return PlainTextResponse("EVENT_RECEIVED", status_code=200)


async def process_meta_entries(entries: List[Dict[str, Any]]) -> None:
    """Async background worker for handling inbound Instagram DMs."""
    from app.core.database import AsyncSessionFactory
    async with AsyncSessionFactory() as db:
        for entry in entries:
            ig_recipient_id = entry.get("id") # The business Instagram Account ID
            messaging_events = entry.get("messaging", [])

            for event in messaging_events:
                sender_info = event.get("sender", {})
                recipient_info = event.get("recipient", {})
                sender_id = sender_info.get("id")
                recipient_id = recipient_info.get("id")

                # Echo suppression: Ignore bot's own dispatched messages
                if sender_id == recipient_id or sender_id == ig_recipient_id:
                    continue

                message_data = event.get("message", {})
                mid = message_data.get("mid")
                text = message_data.get("text", "").strip()

                if not mid or not text:
                    continue

                # Deduplication via Redis
                try:
                    is_new = await redis_client.set(f"meta:mid:{mid}", "1", nx=True, ex=3600)
                    if not is_new:
                        logger.info(f"Ignoring duplicate Meta message ID: {mid}")
                        continue
                except Exception as e:
                    logger.warning(f"Redis deduplication check failed: {e}")

                # Find the corresponding connected Instagram Account
                stmt = select(InstagramAccount).where(
                    or_(
                        InstagramAccount.instagram_account_id == ig_recipient_id,
                        InstagramAccount.meta_account_id == ig_recipient_id,
                    ),
                    InstagramAccount.is_active == True,
                )
                account_res = await db.execute(stmt)
                ig_account = account_res.scalar_one_or_none()

                if not ig_account:
                    # Fallback to any active account for development demo
                    stmt_fallback = select(InstagramAccount).where(InstagramAccount.is_active == True)
                    ig_account = (await db.execute(stmt_fallback)).scalar_one_or_none()

                if not ig_account:
                    logger.warning(f"No active Instagram Account found for recipient: {ig_recipient_id}")
                    continue

                business_id = ig_account.business_id

                # Upsert Contact
                contact_stmt = select(Contact).where(
                    Contact.business_id == business_id,
                    Contact.platform_user_id == sender_id,
                )
                contact = (await db.execute(contact_stmt)).scalar_one_or_none()

                if not contact:
                    contact = Contact(
                        business_id=business_id,
                        platform_user_id=sender_id,
                        username=f"ig_user_{sender_id[-6:]}",
                        full_name=f"Instagram Customer ({sender_id[-4:]})",
                        lead_status=LeadStatus.LEAD.value,
                        tags=["instagram_dm"],
                    )
                    db.add(contact)
                    await db.flush()

                # Upsert Conversation
                conv_stmt = select(Conversation).where(
                    Conversation.business_id == business_id,
                    Conversation.contact_id == contact.id,
                )
                conv = (await db.execute(conv_stmt)).scalar_one_or_none()

                if not conv:
                    conv = Conversation(
                        business_id=business_id,
                        contact_id=contact.id,
                        instagram_account_id=ig_account.id,
                        human_takeover=False,
                        status=ConversationStatus.OPEN.value,
                        unread_count=1,
                        last_message_preview=text[:100],
                    )
                    db.add(conv)
                    await db.flush()
                else:
                    conv.unread_count += 1
                    conv.last_message_preview = text[:100]

                # Save incoming customer message
                user_msg = Message(
                    conversation_id=conv.id,
                    sender_id=sender_id,
                    text=text,
                    source=MessageSource.CUSTOMER.value,
                    meta_message_id=mid,
                    is_read=False,
                )
                db.add(user_msg)
                await db.commit()

                # CRITICAL: Human Takeover Check
                if conv.human_takeover:
                    logger.info(f"Human Takeover is ACTIVE on conversation {conv.id}. Suppressing AI response.")
                    continue

                # AI Processing Pipeline
                page_token = decrypt_field(ig_account.page_access_token_enc)

                # Check if customer inquiry asks for products or shopping
                lower_text = text.lower()
                product_keywords = ["product", "shoe", "sneaker", "buy", "price", "catalog", "shop", "item", "collection", "cost"]
                is_product_inquiry = any(kw in lower_text for kw in product_keywords)

                if is_product_inquiry:
                    # Query product catalog
                    prod_stmt = select(Product).where(
                        Product.business_id == business_id,
                        Product.in_stock == True,
                    ).limit(4)
                    products = (await db.execute(prod_stmt)).scalars().all()

                    if products:
                        prod_dicts = [
                            {
                                "name": p.name,
                                "price": p.price,
                                "description": p.description or "",
                                "image_url": p.image_url,
                                "link_url": p.link_url,
                            }
                            for p in products
                        ]

                        # Send Generic Template Carousel DM
                        try:
                            await MetaService.send_carousel_dm(page_token, sender_id, prod_dicts)
                        except Exception as e:
                            logger.error(f"Error sending Meta carousel: {e}")

                        # Save AI Carousel confirmation message
                        bot_msg = Message(
                            conversation_id=conv.id,
                            sender_id="bot_assistant",
                            text=f"Sent {len(products)} featured products carousel cards.",
                            source=MessageSource.AI.value,
                            is_read=True,
                        )
                        db.add(bot_msg)
                        await db.commit()
                        continue

                # General Customer Support / FAQ Reply
                ai_reply = "Thank you for reaching out! Our return policy is 30 days with a full refund. Let us know if you need assistance with an existing order or sizing!"
                if "hello" in lower_text or "hi" in lower_text:
                    ai_reply = "Hey there! 👋 Welcome to our official store. How can we help you today? Ask about our latest drop, shipping times, or track an order!"

                try:
                    await MetaService.send_text_dm(page_token, sender_id, ai_reply)
                except Exception as e:
                    logger.error(f"Error sending Meta text DM: {e}")

                ai_msg = Message(
                    conversation_id=conv.id,
                    sender_id="bot_assistant",
                    text=ai_reply,
                    source=MessageSource.AI.value,
                    is_read=True,
                )
                db.add(ai_msg)
                await db.commit()


@router.post(
    "/oauth/callback",
    response_model=StandardResponse[Dict[str, Any]],
    summary="Meta OAuth Token Exchange",
    description="Exchanges short-lived user token for long-lived token, links Instagram accounts, and subscribes to webhooks.",
)
async def oauth_callback(
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    short_lived_token = payload.get("short_lived_token") or payload.get("access_token")
    if not short_lived_token:
        raise BadRequestError("Access token is required")

    business_id = current_user.business_id
    if not business_id:
        raise BadRequestError("User does not belong to a workspace organization")

    # 1. Exchange for long-lived user token
    token_data = await MetaService.exchange_short_lived_token(short_lived_token)
    long_lived_token = token_data.get("access_token")

    # 2. Query Facebook Pages and linked Instagram accounts
    pages = await MetaService.get_accounts_and_pages(long_lived_token)
    linked_accounts = []

    for page in pages:
        page_id = page.get("id")
        page_access_token = page.get("access_token")
        ig_business = page.get("instagram_business_account")

        if not ig_business:
            continue

        ig_id = ig_business.get("id")
        ig_username = ig_business.get("username", "instagram_business")
        ig_avatar = ig_business.get("profile_picture_url")

        # Subscribe webhooks
        await MetaService.subscribe_page_webhooks(page_id, page_access_token)
        await MetaService.subscribe_instagram_webhooks(ig_id, page_access_token)

        # Upsert in database
        stmt = select(InstagramAccount).where(
            InstagramAccount.business_id == business_id,
            InstagramAccount.instagram_account_id == ig_id,
        )
        existing = (await db.execute(stmt)).scalar_one_or_none()

        if not existing:
            account = InstagramAccount(
                business_id=business_id,
                meta_account_id=page_id,
                instagram_account_id=ig_id,
                username=ig_username,
                profile_picture_url=ig_avatar,
                access_token_enc=encrypt_field(long_lived_token),
                page_access_token_enc=encrypt_field(page_access_token),
                is_active=True,
            )
            db.add(account)
        else:
            existing.access_token_enc = encrypt_field(long_lived_token)
            existing.page_access_token_enc = encrypt_field(page_access_token)
            existing.username = ig_username
            existing.is_active = True
            account = existing

        linked_accounts.append({
            "page_id": page_id,
            "instagram_account_id": ig_id,
            "username": ig_username,
        })

    await db.commit()

    return StandardResponse(
        status="success",
        message=f"Connected {len(linked_accounts)} Instagram accounts successfully",
        data={"linked_accounts": linked_accounts},
    )


@router.get(
    "/accounts",
    response_model=StandardResponse[List[Dict[str, Any]]],
    summary="List Connected Instagram Accounts",
)
async def list_instagram_accounts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    business_id = current_user.business_id
    if not business_id:
        return StandardResponse(status="success", data=[])

    stmt = select(InstagramAccount).where(InstagramAccount.business_id == business_id)
    accounts = (await db.execute(stmt)).scalars().all()

    data = [
        {
            "id": str(acc.id),
            "meta_account_id": acc.meta_account_id,
            "instagram_account_id": acc.instagram_account_id,
            "username": acc.username,
            "profile_picture_url": acc.profile_picture_url,
            "is_active": acc.is_active,
            "created_at": acc.created_at.isoformat(),
        }
        for acc in accounts
    ]

    return StandardResponse(status="success", data=data)
