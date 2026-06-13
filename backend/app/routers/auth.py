# app/routers/auth.py

from fastapi import APIRouter
from app.core.dependencies import DB
from app.schemas.auth import LoginRequest
from app.schemas.token import TokenResponse
from app.services.auth_service import AuthService



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