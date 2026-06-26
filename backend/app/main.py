from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.core.constants import UserRole
from app.models.user import User
from app.models import Base
from sqlalchemy import select

# Add these imports and includes to your existing main.py

from app.routers.auth import router as auth_router
from app.routers.admin import router as admin_router
from app.routers.warden import router as warden_router
from app.routers.student import router as student_router
from app.routers.security import router as security_router
from app.routers.gatepass import router as gatepass_router

from fastapi.staticfiles import StaticFiles
from app.core.database import engine

logger = logging.getLogger("uvicorn")

async def create_default_users():
    """
    Creates default warden and security accounts on startup.
    Only creates them if they don't already exist.
    So this is safe to run every time app starts.
    """
    async with AsyncSessionLocal() as db:
        # ── Default Warden ────────────────────────────────
        warden = await db.execute(
            select(User).where(User.id == "WARDEN001")
        )
        if not warden.scalar_one_or_none():
            db.add(User(
                id="WARDEN001",
                name="Default Warden",
                password_hash=hash_password("Warden@123"),
                user_type=UserRole.WARDEN.value,
                email="warden@hostel.com",
                is_active=True
            ))
            logger.info("Default Warden account created.")

        # ── Default Security ──────────────────────────────
        security = await db.execute(
            select(User).where(User.id == "SECURITY001")
        )
        if not security.scalar_one_or_none():
            db.add(User(
                id="SECURITY001",
                name="Default Security",
                password_hash=hash_password("Security@123"),
                user_type=UserRole.SECURITY.value,
                email="security@hostel.com",
                is_active=True
            ))
            logger.info("Default Security account created.")
        # ── Default Student ───────────────────────────────
        student = await db.execute(
            select(User).where(User.id == "STU001")
        )
        if not student.scalar_one_or_none():
            db.add(User(
                id="STU001",
                name="Default Student",
                password_hash=hash_password("Student@123"),
                user_type=UserRole.STUDENT.value,
                email="student@hostel.com",
                room="101",
                course="Computer Science",
                year="2nd Year",
                guardian_name="Default Guardian",
                guardian_phone="9999999999",
                is_active=True
            ))
            logger.info("Default Student account created.")
        
        # ── Default Admin ─────────────────────────────
        admin = await db.execute(
            select(User).where(User.id == "ADMIN001")
        )
        if not admin.scalar_one_or_none():
            db.add(User(
                id="ADMIN001",
                name="System Admin",
                password_hash=hash_password("Admin@123"),
                user_type=UserRole.ADMIN.value,
                email="admin@hostel.com",
                is_active=True
            ))
            logger.info("Default admin account created.")
        await db.commit()

  

@asynccontextmanager
async def lifespan(app: FastAPI):
    
    logger.info(f"{settings.APP_NAME} is starting...")
    await create_default_users()
    yield
    logger.info(f"{settings.APP_NAME} is shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.ALLOWED_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(warden_router)
app.include_router(student_router)
app.include_router(security_router)
app.include_router(gatepass_router)


# Mount static folder — serves files at /static/...
app.mount("/static", StaticFiles(directory="app/static"), name="static")


