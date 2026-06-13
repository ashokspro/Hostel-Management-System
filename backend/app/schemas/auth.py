# app/schemas/auth.py

from pydantic import BaseModel, field_validator


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