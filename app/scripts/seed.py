import asyncio
import uuid
from datetime import datetime, timezone
from sqlalchemy import select
from app.core.database import AsyncSessionFactory, engine
from app.core.security import get_password_hash, encrypt_field
from app.core.config import settings
from app.models.business import Business, PlanTier
from app.models.user import User, UserRole
from app.models.instagram import InstagramAccount
from app.models.product import Product
from app.models.contact import Contact, LeadStatus
from app.models.conversation import Conversation, ConversationStatus, Message, MessageSource
from app.models.automation import AutomationWorkflow, TriggerType


async def seed_database():
    print("==================================================")
    print("🌱 Running Database Seeding for Instagram Automation SaaS...")
    print("==================================================")

    async with AsyncSessionFactory() as session:
        # --------------------------------------------------
        # 1. Super Admin
        # --------------------------------------------------
        super_admin_email = settings.FIRST_SUPER_ADMIN_EMAIL or "superadmin@example.com"
        super_admin_pass = settings.FIRST_SUPER_ADMIN_PASSWORD or "SuperSecurePassword123!"

        super_user_query = select(User).where(User.email == super_admin_email)
        result = await session.execute(super_user_query)
        super_user = result.scalar_one_or_none()

        if not super_user:
            super_user = User(
                id=uuid.uuid4(),
                email=super_admin_email,
                hashed_password=get_password_hash(super_admin_pass),
                full_name="System Super Administrator",
                role=UserRole.SUPER_ADMIN.value,
                business_id=None,
                is_active=True,
            )
            session.add(super_user)
            print(f"✅ Created Super Admin: {super_admin_email}")
        else:
            super_user.hashed_password = get_password_hash(super_admin_pass)
            super_user.role = UserRole.SUPER_ADMIN.value
            super_user.is_active = True
            print(f"🔄 Updated Super Admin credentials: {super_admin_email}")

        # --------------------------------------------------
        # 2. Demo Business Tenant: Acme Corporation
        # --------------------------------------------------
        biz_slug = "acme-corp"
        biz_query = select(Business).where(Business.slug == biz_slug)
        biz_res = await session.execute(biz_query)
        business = biz_res.scalar_one_or_none()

        if not business:
            business = Business(
                id=uuid.uuid4(),
                name="Acme Corporation",
                slug=biz_slug,
                plan_tier=PlanTier.PRO.value,
                max_bots=10,
                max_messages_per_month=50000,
                current_month_messages=1420,
                max_documents=100,
                is_active=True,
            )
            session.add(business)
            await session.flush()
            print(f"✅ Created Tenant Organization: {business.name} (/{business.slug})")
        else:
            business.plan_tier = PlanTier.PRO.value
            business.is_active = True
            business.current_month_messages = 1420
            await session.flush()
            print(f"🔄 Verified Tenant Organization: {business.name}")

        # --------------------------------------------------
        # 3. Client Business Administrator
        # --------------------------------------------------
        admin_email = "admin@acme.com"
        admin_pass = "AdminPassword123!"

        admin_query = select(User).where(User.email == admin_email)
        admin_res = await session.execute(admin_query)
        client_admin = admin_res.scalar_one_or_none()

        if not client_admin:
            client_admin = User(
                id=uuid.uuid4(),
                email=admin_email,
                hashed_password=get_password_hash(admin_pass),
                full_name="Acme Client Administrator",
                role=UserRole.BUSINESS_ADMIN.value,
                business_id=business.id,
                is_active=True,
            )
            session.add(client_admin)
            print(f"✅ Created Client Business Admin: {admin_email}")
        else:
            client_admin.hashed_password = get_password_hash(admin_pass)
            client_admin.role = UserRole.BUSINESS_ADMIN.value
            client_admin.business_id = business.id
            client_admin.is_active = True
            print(f"🔄 Updated Client Business Admin credentials: {admin_email}")

        # --------------------------------------------------
        # 4. Connected Instagram Account
        # --------------------------------------------------
        ig_query = select(InstagramAccount).where(InstagramAccount.business_id == business.id)
        ig_acc = (await session.execute(ig_query)).scalar_one_or_none()

        if not ig_acc:
            ig_acc = InstagramAccount(
                business_id=business.id,
                meta_account_id="1797597918285205",
                instagram_account_id="1784140592837192",
                username="acme_official",
                profile_picture_url="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop",
                access_token_enc=encrypt_field("mock_long_lived_user_token_meta_v21"),
                page_access_token_enc=encrypt_field("mock_page_access_token_permanent_instagram"),
                is_active=True,
            )
            session.add(ig_acc)
            await session.flush()
            print("✅ Created Instagram Account: @acme_official")

        # --------------------------------------------------
        # 5. E-Commerce Product Catalog
        # --------------------------------------------------
        prod_check = select(Product).where(Product.business_id == business.id)
        existing_prods = (await session.execute(prod_check)).scalars().all()

        if not existing_prods:
            sample_products = [
                Product(
                    business_id=business.id,
                    name="Air Max Pulse 90",
                    description="Limited edition streetwear sneakers with responsive air cushioning.",
                    price=139.99,
                    currency="USD",
                    image_url="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop",
                    link_url="https://acmestore.com/products/air-max-pulse",
                    in_stock=True,
                    category="Sneakers",
                ),
                Product(
                    business_id=business.id,
                    name="Urban Minimalist Hoodie",
                    description="Heavyweight 450 GSM French Terry cotton hoodie in midnight black.",
                    price=79.50,
                    currency="USD",
                    image_url="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop",
                    link_url="https://acmestore.com/products/minimalist-hoodie",
                    in_stock=True,
                    category="Apparel",
                ),
                Product(
                    business_id=business.id,
                    name="Chronograph Matte Watch",
                    description="Surgical grade stainless steel with sapphire crystal and quartz movement.",
                    price=189.00,
                    currency="USD",
                    image_url="https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop",
                    link_url="https://acmestore.com/products/matte-watch",
                    in_stock=True,
                    category="Accessories",
                ),
            ]
            session.add_all(sample_products)
            print("✅ Seeded 3 E-Commerce Products for Instagram DM Carousels")

        # --------------------------------------------------
        # 6. CRM Contacts & Leads
        # --------------------------------------------------
        contact_check = select(Contact).where(Contact.business_id == business.id)
        existing_contacts = (await session.execute(contact_check)).scalars().all()

        if not existing_contacts:
            c1 = Contact(
                business_id=business.id,
                platform_user_id="igsid_9823471029",
                username="sneakerhead_john",
                full_name="John Doe",
                email="john.doe@gmail.com",
                phone="+1 (555) 234-8901",
                avatar_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop",
                lead_status=LeadStatus.QUALIFIED.value,
                tags=["sneakers", "vip_customer", "dm_lead"],
            )
            c2 = Contact(
                business_id=business.id,
                platform_user_id="igsid_3847291038",
                username="sarah_style",
                full_name="Sarah Jenkins",
                email="sarah@styleinspo.com",
                phone=None,
                avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop",
                lead_status=LeadStatus.LEAD.value,
                tags=["story_mention", "influencer"],
            )
            session.add_all([c1, c2])
            await session.flush()
            print("✅ Seeded 2 CRM Contacts")

            # --------------------------------------------------
            # 7. Live Inbox Conversations & Messages
            # --------------------------------------------------
            # Conversation 1: AI Active
            conv1 = Conversation(
                business_id=business.id,
                contact_id=c1.id,
                instagram_account_id=ig_acc.id,
                human_takeover=False, # AI actively responding
                status=ConversationStatus.OPEN.value,
                unread_count=0,
                last_message_preview="AI: Sent 3 featured products carousel cards.",
            )
            session.add(conv1)
            await session.flush()

            m1 = Message(
                conversation_id=conv1.id,
                sender_id=c1.platform_user_id,
                text="Hey! Can you show me your new sneaker collection?",
                source=MessageSource.CUSTOMER.value,
                is_read=True,
            )
            m2 = Message(
                conversation_id=conv1.id,
                sender_id="bot_assistant",
                text="Here is our latest footwear drop! Swipe through the carousel to see prices and tap 'Buy Now' to order directly.",
                source=MessageSource.AI.value,
                is_read=True,
            )
            session.add_all([m1, m2])

            # Conversation 2: Human Takeover Active!
            conv2 = Conversation(
                business_id=business.id,
                contact_id=c2.id,
                instagram_account_id=ig_acc.id,
                human_takeover=True, # Human agent took over! AI is silenced
                status=ConversationStatus.OPEN.value,
                unread_count=1,
                last_message_preview="Sarah: Can I speak with someone about custom collaboration?",
            )
            session.add(conv2)
            await session.flush()

            m3 = Message(
                conversation_id=conv2.id,
                sender_id=c2.platform_user_id,
                text="Can I speak with someone from partnerships about a custom brand collaboration?",
                source=MessageSource.CUSTOMER.value,
                is_read=False,
            )
            session.add(m3)
            print("✅ Seeded 2 Conversations (one with Human Takeover ACTIVE)")

        # --------------------------------------------------
        # 8. Visual Automation Workflow
        # --------------------------------------------------
        wf_check = select(AutomationWorkflow).where(AutomationWorkflow.business_id == business.id)
        existing_wf = (await session.execute(wf_check)).scalar_one_or_none()

        if not existing_wf:
            wf = AutomationWorkflow(
                business_id=business.id,
                name="Instagram DM Sales & Catalog Assistant",
                trigger_type=TriggerType.DM_RECEIVED.value,
                nodes_graph=[
                    {"id": "node-1", "type": "trigger", "position": {"x": 100, "y": 150}, "data": {"label": "Customer DM Received", "description": "Triggered when any user sends a message on Instagram."}},
                    {"id": "node-2", "type": "intent", "position": {"x": 380, "y": 150}, "data": {"label": "Detect Shopping Intent", "description": "Checks if message mentions sneakers, pricing or catalog."}},
                    {"id": "node-3", "type": "action", "position": {"x": 660, "y": 80}, "data": {"label": "Send Visual Product Carousel", "description": "Dispatches Meta Generic Template with image and buy button."}},
                    {"id": "node-4", "type": "action", "position": {"x": 660, "y": 240}, "data": {"label": "RAG Knowledge Q&A", "description": "Answers from indexed returns, shipping, and store FAQ."}},
                ],
                edges_graph=[
                    {"id": "e1-2", "source": "node-1", "target": "node-2"},
                    {"id": "e2-3", "source": "node-2", "target": "node-3", "label": "Product Query"},
                    {"id": "e2-4", "source": "node-2", "target": "node-4", "label": "General Q&A"},
                ],
                is_active=True,
            )
            session.add(wf)
            print("✅ Seeded Visual Automation Workflow Canvas")

        await session.commit()

    await engine.dispose()
    print("\n==================================================")
    print("🎉 FULL SAAS SEEDING COMPLETE!")
    print("==================================================")
    print("🔑 SUPER ADMIN:    superadmin@example.com / SuperSecurePassword123!")
    print("🔑 CLIENT ADMIN:   admin@acme.com / AdminPassword123!")
    print("==================================================")


if __name__ == "__main__":
    asyncio.run(seed_database())
