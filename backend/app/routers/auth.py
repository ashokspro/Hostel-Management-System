# app/routers/auth.py

from fastapi import APIRouter
from app.schemas.token import TokenResponse
from app.services.auth_service import AuthService




from app.schemas.auth import (
    ForgotPasswordRequest, ResetPasswordRequest,
    ChangePasswordRequest, GenericMessageResponse,
    LoginRequest
)

from app.core.dependencies import DB, CurrentUser

# ── Router setup ──────────────────────────────────────────────
# prefix="/api/auth" means all routes here start with /api/auth
# tags=["Authentication"] groups them in Swagger docs
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/login",
    response_model=TokenResponse,     # Pydantic validates the response
    status_code=200,
    summary="Login with ID and password"
)
async def login(
    credentials: LoginRequest,        # Pydantic validates the request body
    db: DB                            # async DB session from dependencies
):
    """
    Login endpoint — the only public route in the whole app.

    What happens here:
        1. FastAPI validates request body against LoginRequest schema
        2. Passes validated data to AuthService
        3. AuthService returns TokenResponse
        4. FastAPI validates response against TokenResponse schema
        5. Sends JSON response to client

    The router itself has ZERO logic —
    it just connects HTTP to the service layer.
    """
    return await AuthService.login(db, credentials)

###
from app.core.dependencies import CurrentUser
from app.schemas.user import UserResponse

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current logged-in user's profile"
)
async def get_me(current_user: CurrentUser):
    """Returns the profile of whoever owns the JWT — any role."""
    return current_user

@router.post(
    "/forgot-password",
    response_model=GenericMessageResponse,
    summary="Request a password reset email"
)
async def forgot_password(data: ForgotPasswordRequest, db: DB):
    await AuthService.request_password_reset(db, data.email)

    # Always return the same message — don't reveal if email exists
    return GenericMessageResponse(
        message="If an account exists with that email, a reset link has been sent."
    )


@router.post(
    "/reset-password",
    response_model=GenericMessageResponse,
    summary="Reset password using token from email"
)
async def reset_password(data: ResetPasswordRequest, db: DB):
    await AuthService.reset_password(db, data.token, data.new_password)
    return GenericMessageResponse(message="Password reset successful. You can now log in.")


@router.put(
    "/change-password",
    response_model=GenericMessageResponse,
    summary="Change your own password (requires current password)"
)
async def change_password(
    data: ChangePasswordRequest,
    db: DB,
    current_user: CurrentUser
):
    await AuthService.change_password(
        db, current_user, data.current_password, data.new_password
    )
    return GenericMessageResponse(message="Password changed successfully.")

@router.post(
    "/forgot-password",
    response_model=GenericMessageResponse,
    summary="Request a password reset email"
)
async def forgot_password(data: ForgotPasswordRequest, db: DB):
    await AuthService.request_password_reset(db, data.email)

    # Always return the same message — don't reveal if email exists
    return GenericMessageResponse(
        message="If an account exists with that email, a reset link has been sent."
    )


@router.post(
    "/reset-password",
    response_model=GenericMessageResponse,
    summary="Reset password using token from email"
)
async def reset_password(data: ResetPasswordRequest, db: DB):
    await AuthService.reset_password(db, data.token, data.new_password)
    return GenericMessageResponse(message="Password reset successful. You can now log in.")


@router.put(
    "/change-password",
    response_model=GenericMessageResponse,
    summary="Change your own password (requires current password)"
)
async def change_password(
    data: ChangePasswordRequest,
    db: DB,
    current_user: CurrentUser
):
    await AuthService.change_password(
        db, current_user, data.current_password, data.new_password
    )
    return GenericMessageResponse(message="Password changed successfully.")