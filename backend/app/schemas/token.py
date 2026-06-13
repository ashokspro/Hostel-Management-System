# app/schemas/token.py

from pydantic import BaseModel


# ── What's encoded INSIDE the JWT ────────────────────────────
# When we decode a token, we get this data back
# This is used in dependencies.py to identify current user
class TokenPayload(BaseModel):
    sub: str        # subject — stores the user's id
                    # "sub" is the JWT standard field name for identity
    user_type: str  # needed to check roles without hitting DB


# ── What we send back after successful login ──────────────────
# Frontend stores this token and sends it in every request header
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"  # always "bearer" — JWT standard
    user_type: str              # frontend needs this to redirect to
                                # correct dashboard (student/warden/security)
    id: str                     # frontend needs this to fetch profile