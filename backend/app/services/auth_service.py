# app/services/auth_service.py

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.core.security import verify_password, create_access_token
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest
from app.schemas.token import TokenResponse


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

        # Step 6 — return response
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user_type=user.user_type,
            id=user.id
        )