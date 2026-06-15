# app/schemas/auth.py

from pydantic import BaseModel, field_validator, EmailStr


# ── What frontend sends to /auth/login ───────────────────────
class LoginRequest(BaseModel):
    id: str
    password: str

    # field_validator runs BEFORE the data is accepted
    # Strips whitespace so "  22CS001  " becomes "22CS001"
    # This prevents login failures due to accidental spaces
    @field_validator("id", "password")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip()


# ── What we send back after successful login ──────────────────
# Imports TokenResponse and re-exports it as LoginResponse
# so routers can just import from schemas.auth
from app.schemas.token import TokenResponse

class LoginResponse(TokenResponse):
    pass


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
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


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
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


class GenericMessageResponse(BaseModel):
    message: str