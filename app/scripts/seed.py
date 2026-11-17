import asyncio
import uuid
from sqlalchemy import select
from app.core.database import AsyncSessionFactory, engine
from app.core.security import get_password_hash
from app.core.config import settings
from app.models.business import Business, PlanTier
from app.models.user import User, UserRole


async def seed_database():
    print("==================================================")
    print("🌱 Running Database Seeding...")
    print("==================================================")

    async with AsyncSessionFactory() as session:
        # --------------------------------------------------
        # 1. Seed or Update Super Admin
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
            # Update password and role to ensure known credentials
            super_user.hashed_password = get_password_hash(super_admin_pass)
            super_user.role = UserRole.SUPER_ADMIN.value
            super_user.is_active = True
            print(f"🔄 Updated Super Admin credentials: {super_admin_email}")

        # --------------------------------------------------
        # 2. Seed or Update Demo Business Tenant
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
                current_month_messages=1250,
                max_documents=100,
                is_active=True,
            )
            session.add(business)
            await session.flush()
            print(f"✅ Created Tenant Organization: {business.name} (/{business.slug})")
        else:
            business.plan_tier = PlanTier.PRO.value
            business.is_active = True
            business.current_month_messages = 1250
            await session.flush()
            print(f"🔄 Verified Tenant Organization: {business.name}")

        # --------------------------------------------------
        # 3. Seed or Update Client Business Administrator
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

        await session.commit()

    await engine.dispose()

    print("\n==================================================")
    print("🎉 SEEDING COMPLETED SUCCESSFULLY!")
    print("==================================================")
    print("🔑 SUPER ADMIN CREDENTIALS:")
    print(f"   Email:    {super_admin_email}")
    print(f"   Password: {super_admin_pass}")
    print(f"   Role:     super_admin")
    print("--------------------------------------------------")
    print("🔑 CLIENT (BUSINESS) ADMIN CREDENTIALS:")
    print(f"   Email:    {admin_email}")
    print(f"   Password: {admin_pass}")
    print(f"   Role:     business_admin")
    print(f"   Tenant:   Acme Corporation (/{biz_slug})")
    print("==================================================")


if __name__ == "__main__":
    asyncio.run(seed_database())
