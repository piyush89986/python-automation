import hashlib
import hmac
from typing import Any, Dict, List, Optional
import httpx
from app.core.config import settings
from app.core.logging import logger

GRAPH_API_BASE = settings.META_GRAPH_API_BASE.rstrip("/")
API_VERSION = settings.META_GRAPH_API_VERSION


class MetaService:
    """Production service for Meta Graph API v21.0 (Instagram & Messenger)."""

    @staticmethod
    async def exchange_short_lived_token(short_lived_token: str) -> Dict[str, Any]:
        """Exchange 1-hour short-lived user token for 60-day long-lived user token."""
        url = f"{GRAPH_API_BASE}/{API_VERSION}/oauth/access_token"
        params = {
            "grant_type": "fb_exchange_token",
            "client_id": settings.META_APP_ID,
            "client_secret": settings.META_APP_SECRET,
            "fb_exchange_token": short_lived_token,
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, params=params)
            if resp.status_code != 200:
                logger.error(f"Meta token exchange error: {resp.text}")
                raise ValueError(f"Failed to exchange token with Meta: {resp.text}")
            return resp.json()

    @staticmethod
    async def get_accounts_and_pages(long_lived_token: str) -> List[Dict[str, Any]]:
        """Fetch Facebook Pages and their linked Instagram Business Accounts."""
        url = f"{GRAPH_API_BASE}/{API_VERSION}/me/accounts"
        params = {
            "fields": "id,name,access_token,instagram_business_account{id,username,profile_picture_url}",
            "access_token": long_lived_token,
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, params=params)
            if resp.status_code != 200:
                logger.error(f"Failed to query Meta accounts: {resp.text}")
                raise ValueError(f"Failed to query Meta accounts: {resp.text}")
            data = resp.json()
            return data.get("data", [])

    @staticmethod
    async def subscribe_page_webhooks(page_id: str, page_access_token: str) -> bool:
        """Subscribe Facebook Page to receive messaging events."""
        url = f"{GRAPH_API_BASE}/{API_VERSION}/{page_id}/subscribed_apps"
        params = {
            "subscribed_fields": "messages,messaging_postbacks,message_deliveries,message_reads",
            "access_token": page_access_token,
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, params=params)
                return resp.status_code == 200 and resp.json().get("success", False)
        except Exception as e:
            logger.warning(f"Could not subscribe page {page_id} to webhooks: {e}")
            return False

    @staticmethod
    async def subscribe_instagram_webhooks(ig_account_id: str, page_access_token: str) -> bool:
        """Subscribe Instagram account to receive messages, comments and mentions."""
        url = f"{GRAPH_API_BASE}/{API_VERSION}/{ig_account_id}/subscribed_apps"
        params = {
            "subscribed_fields": "messages,comments,mentions",
            "access_token": page_access_token,
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, params=params)
                return resp.status_code == 200 and resp.json().get("success", False)
        except Exception as e:
            logger.warning(f"Could not subscribe IG account {ig_account_id} to webhooks: {e}")
            return False

    @staticmethod
    def verify_webhook_signature(payload_bytes: bytes, signature_header: Optional[str]) -> bool:
        """Validate Meta X-Hub-Signature-256 HMAC SHA-256 header."""
        if not signature_header or not signature_header.startswith("sha256="):
            return False

        expected_sig = hmac.new(
            settings.META_APP_SECRET.encode("utf-8"),
            payload_bytes,
            hashlib.sha256,
        ).hexdigest()
        actual_sig = signature_header.replace("sha256=", "").strip()
        return hmac.compare_digest(expected_sig, actual_sig)

    @staticmethod
    async def send_text_dm(
        page_access_token: str,
        recipient_igsid: str,
        text: str,
    ) -> Dict[str, Any]:
        """Send plain text DM to customer via Instagram Graph API."""
        url = f"{GRAPH_API_BASE}/{API_VERSION}/me/messages"
        headers = {
            "Authorization": f"Bearer {page_access_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "recipient": {"id": recipient_igsid},
            "message": {"text": text},
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code not in (200, 201):
                logger.error(f"Meta Send Text Error ({resp.status_code}): {resp.text}")
            return resp.json()

    @staticmethod
    async def send_carousel_dm(
        page_access_token: str,
        recipient_igsid: str,
        products: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Send visual product carousel cards (Generic Template) in Instagram DM."""
        url = f"{GRAPH_API_BASE}/{API_VERSION}/me/messages"
        headers = {
            "Authorization": f"Bearer {page_access_token}",
            "Content-Type": "application/json",
        }

        elements = []
        for p in products[:10]:  # Meta maximum 10 carousel items
            price_str = f"${p.get('price', 0):.2f}"
            subtitle = f"{price_str} | {p.get('description', '')}"[:80]
            elements.append({
                "title": p.get("name", "Product")[:80],
                "image_url": p.get("image_url", "https://images.unsplash.com/photo-1542291026-7eec264c27ff"),
                "subtitle": subtitle,
                "buttons": [
                    {
                        "type": "web_url",
                        "url": p.get("link_url", "https://example.com"),
                        "title": "Buy Now",
                    }
                ],
            })

        payload = {
            "recipient": {"id": recipient_igsid},
            "message": {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "generic",
                        "elements": elements,
                    },
                }
            },
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code not in (200, 201):
                logger.error(f"Meta Send Carousel Error ({resp.status_code}): {resp.text}")
            return resp.json()

    @staticmethod
    async def send_comment_reply(
        page_access_token: str,
        comment_id: str,
        text: str,
    ) -> Dict[str, Any]:
        """Reply publicly to an Instagram Post or Reel comment."""
        url = f"{GRAPH_API_BASE}/{API_VERSION}/{comment_id}/replies"
        headers = {
            "Authorization": f"Bearer {page_access_token}",
            "Content-Type": "application/json",
        }
        payload = {"message": text}
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            return resp.json()
