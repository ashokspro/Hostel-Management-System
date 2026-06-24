# app/schemas/user.py

from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from typing import Optional
from datetime import datetime
import re

from app.core.constants import UserRole


# ── Base schema ───────────────────────────────────────────────
# Shared fields across multiple schemas
# Never used directly — only inherited
class UserBase(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None


# ── Create user ───────────────────────────────────────────────
# What admin sends when creating a new user
# password is plain text here — service layer will hash it
# NEVER store or return plain password anywhere else
class UserCreate(UserBase):
    password: str
    user_type: UserRole         # uses your enum — validates automatically

    # Student fields — optional because warden/security don't need them
    room: Optional[str] = None
    course: Optional[str] = None
    year: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None

    # Staff fields — optional because students don't need them
    role: Optional[str] = None
    department: Optional[str] = None
    emergency_contact: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if len(v) > 72:
            raise ValueError("Password cannot exceed 72 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in v):
            raise ValueError("Password must contain at least one special character")
        return v
    
    @field_validator("phone", "guardian_phone", "emergency_contact")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return v
        if not re.fullmatch(r"\d{10}", v):
            raise ValueError("Phone number must be exactly 10 digits")
        return v


# ── Update user ───────────────────────────────────────────────
# What admin/user sends when updating profile
# Every field is optional — only send what you want to change
# This is called a "PATCH schema" pattern
class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    room: Optional[str] = None
    course: Optional[str] = None
    year: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    emergency_contact: Optional[str] = None


# ── User response ─────────────────────────────────────────────
# What API sends back when returning user data
# Notice: NO password_hash here — never expose it
# from_attributes=True lets Pydantic read SQLAlchemy model directly:
#   UserResponse.model_validate(user_object_from_db)
class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    user_type: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    # Student fields
    room: Optional[str] = None
    course: Optional[str] = None
    year: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None

    # Staff fields
    role: Optional[str] = None
    department: Optional[str] = None
    emergency_contact: Optional[str] = None


# ── Student list item ─────────────────────────────────────────
# Lighter version used in lists — no sensitive staff fields
# When warden views all students, we don't need all fields
class StudentListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    room: Optional[str] = None
    course: Optional[str] = None
    year: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool

class AdminResetPasswordRequest(BaseModel):
    # If provided, admin sets this exact password (must pass strength check)
    # If None, system generates a random temporary password
    new_password: Optional[str] = None

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in v):
            raise ValueError("Password must contain at least one special character")
        return v


class AdminResetPasswordResponse(BaseModel):
    message: str
    # Only populated if admin didn't supply a password — show the generated one
    temporary_password: Optional[str] = None

class AdminPeriodStats(BaseModel):
    new_students: int
    new_wardens: int
    new_security: int
    new_admins: int


class AdminLiveStats(BaseModel):
    active_students: int
    active_wardens: int
    active_security: int
    active_admins: int
    total_users: int


class AdminStatsResponse(BaseModel):
    live: AdminLiveStats
    today: AdminPeriodStats
    week: AdminPeriodStats
    month: AdminPeriodStats
    overall: AdminPeriodStats