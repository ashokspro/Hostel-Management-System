# tests/conftest.py

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.core.security import hash_password
from app.core.constants import UserRole
from app.models.user import User
from app.models.gatepass import GatePass


# ── Test database ─────────────────────────────────────────────
# We use SQLite in memory for tests — no need for PostgreSQL
# This means tests run fast and don't touch your real DB
# StaticPool — same connection reused (required for in-memory SQLite)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
    expire_on_commit=False
)


# ── Override get_db dependency ────────────────────────────────
# FastAPI's dependency injection lets us REPLACE get_db
# with our test version — so all routes use test DB
async def override_get_db():
    async with TestSessionLocal() as db:
        yield db


# Apply the override — this affects the entire app during tests
app.dependency_overrides[get_db] = override_get_db


# ── Create tables + seed test users ──────────────────────────
@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database():
    """
    Runs ONCE before all tests.
    
    scope="session" → runs once for entire test session
    autouse=True → runs automatically without being called
    
    Creates all tables in the in-memory SQLite DB,
    seeds default users so login tests work,
    then drops everything after all tests finish.
    """
    async with test_engine.begin() as conn:
        # Create all tables from your SQLAlchemy models
        await conn.run_sync(Base.metadata.create_all)

    # Seed default users
    async with TestSessionLocal() as db:
        # Default warden
        db.add(User(
            id="WARDEN001",
            name="Test Warden",
            password_hash=hash_password("Warden@123"),
            user_type=UserRole.WARDEN.value,
            email="warden@test.com",
            is_active=True
        ))
        # Default student
        db.add(User(
            id="STU001",
            name="Test Student",
            password_hash=hash_password("Student@123"),
            user_type=UserRole.STUDENT.value,
            email="student@test.com",
            room="101",
            course="Computer Science",
            year="2nd Year",
            guardian_phone="9999999999",
            is_active=True
        ))
        # Default security
        db.add(User(
            id="SEC001",
            name="Test Security",
            password_hash=hash_password("Security@123"),
            user_type=UserRole.SECURITY.value,
            email="security@test.com",
            is_active=True
        ))
        await db.commit()

    yield   # all tests run here

    # Drop all tables after tests finish
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


# ── HTTP client fixture ───────────────────────────────────────
@pytest_asyncio.fixture
async def client():
    """
    Provides an async HTTP client for each test.
    
    ASGITransport connects httpx directly to FastAPI
    without needing a running server.
    Each test gets a fresh client instance.
    """
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as c:
        yield c


# ── Token fixtures ────────────────────────────────────────────
# These fixtures log in and return tokens
# so individual tests don't need to repeat login logic

@pytest_asyncio.fixture
async def warden_token(client: AsyncClient) -> str:
    """Logs in as warden and returns JWT token."""
    response = await client.post("/api/auth/login", json={
        "id": "WARDEN001",
        "password": "Warden@123"
    })
    return response.json()["access_token"]


@pytest_asyncio.fixture
async def student_token(client: AsyncClient) -> str:
    """Logs in as student and returns JWT token."""
    response = await client.post("/api/auth/login", json={
        "id": "STU001",
        "password": "Student@123"
    })
    return response.json()["access_token"]


@pytest_asyncio.fixture
async def security_token(client: AsyncClient) -> str:
    """Logs in as security and returns JWT token."""
    response = await client.post("/api/auth/login", json={
        "id": "SEC001",
        "password": "Security@123"
    })
    return response.json()["access_token"]


# ── Auth header helper ────────────────────────────────────────
def auth_headers(token: str) -> dict:
    """
    Builds the Authorization header dict.
    
    Every protected route needs:
        Authorization: Bearer <token>
    
    Usage in tests:
        await client.get("/api/student/profile",
            headers=auth_headers(student_token))
    """
    return {"Authorization": f"Bearer {token}"}