# app/core/dependencies.py

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token
from app.core.constants import UserRole
from app.models.user import User


# ── OAuth2 scheme ─────────────────────────────────────────────
# This tells FastAPI where to find the token in the request.
# tokenUrl is the login endpoint — used by swagger docs only.
# When a request comes in, FastAPI automatically extracts the
# token from the "Authorization: Bearer <token>" header.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ── Type aliases ──────────────────────────────────────────────
# Annotated combines a type with its dependency in one reusable alias.
# Instead of writing:
#     db: AsyncSession = Depends(get_db)
# in every route, you write:
#     db: DB
# Much cleaner, especially when you have 20+ routes.
DB = Annotated[AsyncSession, Depends(get_db)]
Token = Annotated[str, Depends(oauth2_scheme)]


# ── Get current user ──────────────────────────────────────────
async def get_current_user(
    token: Token,
    db: DB
) -> User:
    """
    This is the main security dependency.
    Every protected route calls this automatically via Depends().

    What it does step by step:
        1. Extracts JWT token from Authorization header
        2. Decodes and validates the token
        3. Reads user_id from token payload
        4. Fetches user from DB to confirm they still exist
        5. Checks user is still active (not deactivated)
        6. Returns the User object to the route

    If anything fails → raises 401 Unauthorized
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Step 1 & 2 — decode token
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    # Step 3 — get user id from payload
    # "sub" is JWT standard field for the subject (user identity)
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    # Step 4 — fetch from DB (import here to avoid circular imports)
    from app.repositories.user_repository import UserRepository
    user = await UserRepository.get_by_id(db, user_id)
    if user is None:
        raise credentials_exception

    # Step 5 — check active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated"
        )

    return user


# ── Current user type alias ───────────────────────────────────
# Used in routes as: current_user: CurrentUser
CurrentUser = Annotated[User, Depends(get_current_user)]


# ── Role-based dependencies ───────────────────────────────────
# These are "role guards" — they extend get_current_user
# by adding a role check on top.
#
# Usage in a router:
#     @router.get("/approve")
#     async def approve(current_user: CurrentWarden):
#         ...
# If a student hits this route → 403 Forbidden automatically

def require_role(*roles: UserRole):
    """
    Factory function that creates a role-checking dependency.
    Takes one or more roles and returns a dependency function.
    """
    async def role_checker(
        current_user: CurrentUser
    ) -> User:
        if current_user.user_type not in [r.value for r in roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access restricted. Required role: {[r.value for r in roles]}"
            )
        return current_user
    return role_checker


# Ready-to-use role dependencies for each role
# Use these directly in routers
CurrentStudent = Annotated[User, Depends(require_role(UserRole.STUDENT))]
CurrentWarden = Annotated[User, Depends(require_role(UserRole.WARDEN))]
CurrentSecurity = Annotated[User, Depends(require_role(UserRole.SECURITY))]
CurrentAdmin = Annotated[User, Depends(require_role(UserRole.ADMIN))]