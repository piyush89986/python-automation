import asyncio
import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import get_db
from app.core.security import create_access_token, get_password_hash
from app.models.base import Base
from app.models.business import Business, PlanTier
from app.models.user import User, UserRole

# In-memory async SQLite engine for isolated and rapid tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest_asyncio.fixture(scope="function")
async def db_session():
    """Create test tables, yield clean session, and drop tables after test."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession):
    """FastAPI test client with database dependency override."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def super_admin(db_session: AsyncSession) -> User:
    """Fixture to create and return a Super Admin user."""
    admin = User(
        id=uuid.uuid4(),
        email="superadmin@test.com",
        hashed_password=get_password_hash("SuperAdmin123!"),
        full_name="Global Super Admin",
        role=UserRole.SUPER_ADMIN.value,
        business_id=None,
        is_active=True,
    )
    db_session.add(admin)
    await db_session.commit()
    await db_session.refresh(admin)
    return admin


@pytest_asyncio.fixture
def super_admin_token(super_admin: User) -> str:
    """Return JWT access token for Super Admin."""
    return create_access_token({
        "sub": str(super_admin.id),
        "email": super_admin.email,
        "role": super_admin.role,
        "business_id": None,
    })


@pytest_asyncio.fixture
async def test_business(db_session: AsyncSession) -> Business:
    """Fixture to create and return a test Business."""
    biz = Business(
        id=uuid.uuid4(),
        name="Acme Corporation",
        slug="acme-corp",
        plan_tier=PlanTier.STARTER.value,
        max_bots=3,
        max_messages_per_month=10000,
        current_month_messages=150,
        max_documents=25,
        is_active=True,
    )
    db_session.add(biz)
    await db_session.commit()
    await db_session.refresh(biz)
    return biz


@pytest_asyncio.fixture
async def business_admin(db_session: AsyncSession, test_business: Business) -> User:
    """Fixture to create and return a client Business Admin user."""
    admin = User(
        id=uuid.uuid4(),
        email="admin@acme.com",
        hashed_password=get_password_hash("AcmePassword123!"),
        full_name="Acme Admin",
        role=UserRole.BUSINESS_ADMIN.value,
        business_id=test_business.id,
        is_active=True,
    )
    db_session.add(admin)
    await db_session.commit()
    await db_session.refresh(admin)
    return admin


@pytest_asyncio.fixture
def business_admin_token(business_admin: User, test_business: Business) -> str:
    """Return JWT access token for Business Admin."""
    return create_access_token({
        "sub": str(business_admin.id),
        "email": business_admin.email,
        "role": business_admin.role,
        "business_id": str(test_business.id),
    })
