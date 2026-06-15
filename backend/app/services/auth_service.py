# app/services/auth_service.py

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.core.security import verify_password, create_access_token
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest
from app.schemas.token import TokenResponse


from datetime import datetime, timedelta, timezone


from app.core.security import (
    hash_password, verify_password,
    generate_reset_token, hash_reset_token, generate_temp_password
)
from app.core.config import settings

from app.services.email_service import (
    send_password_reset_email, send_password_changed_notification
)


class AuthService:
    """
    Handles authentication business logic.

    Business logic means:
        - Decisions ("is this password correct?")
        - Rules ("is this user active?")
        - Orchestration (calls repository + security together)

    NOT responsible for:
        - HTTP requests/responses (that's the router)
        - DB queries (that's the repository)
        - Password hashing algorithm (that's security.py)
    """

    @staticmethod
    async def login(db: AsyncSession, credentials: LoginRequest) -> TokenResponse:
        """
        Authenticates a user and returns a JWT token.

        Step by step:
            1. Find user by ID in DB
            2. Check user exists
            3. Check password is correct
            4. Check user is active
            5. Build JWT token with user info
            6. Return token response

        Why we use the same error for "user not found" and
        "wrong password":
            If we said "user not found" → attacker knows ID is wrong
            If we said "wrong password" → attacker knows ID is right
            Saying "invalid credentials" for both reveals nothing
        """
        # Step 1 — find user
        user = await UserRepository.get_by_id(db, credentials.id)

        # Steps 2 & 3 — validate existence and password
        # verify_password returns False if user is None (safe)
        if not user or not verify_password(credentials.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
                headers={"WWW-Authenticate": "Bearer"}
            )

        # Step 4 — check active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been deactivated. Contact the warden."
            )

        # Step 5 — create token
        # "sub" (subject) is the JWT standard field for user identity
        token = create_access_token({
            "sub": user.id,
            "user_type": user.user_type
        })

        
        return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_type=user.user_type,
        id=user.id
    )

    @staticmethod
    async def request_password_reset(db, email: str) -> None:
        """
        Generates a reset token and emails it to the user.
        IMPORTANT: Always returns successfully, even if the email
        doesn't exist — prevents attackers from discovering which
        emails are registered (email enumeration attack).
        """
        user = await UserRepository.get_by_email(db, email)

        if not user:
            # Silently succeed — don't reveal whether email exists
            return

        # Generate token, store hash + expiry
        raw_token = generate_reset_token()
        user.reset_token_hash = hash_reset_token(raw_token)
        user.reset_token_expires = datetime.now(timezone.utc) + timedelta(
            minutes=settings.RESET_TOKEN_EXPIRE_MINUTES
        )
        await UserRepository.update(db, user)

        # Build reset link — frontend page that accepts ?token=...
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"

        send_password_reset_email(user.email, user.name, reset_link)


    @staticmethod
    async def reset_password(db, token: str, new_password: str) -> None:
        """
        Validates the reset token and updates the password.
        Token must match stored hash AND not be expired.
        """
        token_hash = hash_reset_token(token)

        user = await UserRepository.get_by_reset_token_hash(db, token_hash)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset link."
            )

        # Check expiry
        now = datetime.now(timezone.utc)
        expires = user.reset_token_expires
        if expires and expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)

        if not expires or expires < now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This reset link has expired. Please request a new one."
            )

        # Update password, clear token (one-time use)
        user.password_hash = hash_password(new_password)
        user.reset_token_hash = None
        user.reset_token_expires = None
        await UserRepository.update(db, user)

        if user.email:
            send_password_changed_notification(user.email, user.name)


    @staticmethod
    async def change_password(db, current_user, current_password: str, new_password: str) -> None:
        """
        Logged-in user changes their own password.
        Requires current password for verification.
        """
        if not verify_password(current_password, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect."
            )

        if current_password == new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be different from current password."
            )

        current_user.password_hash = hash_password(new_password)
        await UserRepository.update(db, current_user)

        if current_user.email:
            send_password_changed_notification(current_user.email, current_user.name)


    @staticmethod
    async def admin_reset_password(db, user_id: str, new_password: str | None) -> str | None:
        """
        Admin resets any user's password.
        If new_password is None, generates a random temp password and returns it.
        Otherwise sets the provided password and returns None.
        """
        user = await UserRepository.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )

        temp_password = None
        if new_password:
            user.password_hash = hash_password(new_password)
        else:
            temp_password = generate_temp_password()
            user.password_hash = hash_password(temp_password)

        # Invalidate any pending reset tokens
        user.reset_token_hash = None
        user.reset_token_expires = None

        await UserRepository.update(db, user)

        if user.email:
            send_password_changed_notification(user.email, user.name)

        return temp_password
        # Step 6 — return response
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user_type=user.user_type,
            id=user.id
        )