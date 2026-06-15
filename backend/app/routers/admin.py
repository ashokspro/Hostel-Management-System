# app/routers/admin.py

from fastapi import APIRouter, status
from app.core.dependencies import DB, CurrentAdmin, CurrentWarden, CurrentAdminOrWarden
from app.schemas.user import UserCreate, UserResponse, StudentListItem, UserUpdate, AdminResetPasswordRequest, AdminResetPasswordResponse
from app.services.user_service import UserService

from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ── Only ADMIN can create wardens, security, other admins ─────
@router.post(
    "/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create any user — Admin only"
)
async def create_user(
    user_data: UserCreate,
    db: DB,
    current_user: CurrentAdmin    # ← only admin now
):
    return await UserService.create_user(db, user_data)


# ── Both ADMIN and WARDEN can list/manage students ────────────
@router.get(
    "/users",
    response_model=list[StudentListItem],
    summary="List all students"
)
async def list_students(
    db: DB,
    current_user: CurrentAdminOrWarden,  # ← now both roles work
    search: str | None = None,
    year: str | None = None,
    course: str | None = None,
    is_active: bool | None = None
):
    return await UserService.get_students(
        db, search=search, year=year,
        course=course, is_active=is_active
    )


@router.get(
    "/wardens",
    response_model=list[UserResponse],
    summary="List all wardens — Admin only"
)
async def list_wardens(db: DB, current_user: CurrentAdmin):
    return await UserService.get_users_by_type(db, "warden")


@router.get(
    "/security",
    response_model=list[UserResponse],
    summary="List all security staff — Admin only"
)
async def list_security(db: DB, current_user: CurrentAdmin):
    return await UserService.get_users_by_type(db, "security")

@router.get(
    "/admins",
    response_model=list[UserResponse],
    summary="List all admins — Admin only"
)
async def list_admins(db: DB, current_user: CurrentAdmin):
    return await UserService.get_users_by_type(db, "admin")

@router.get(
    "/users/{user_id}",
    response_model=UserResponse,
    summary="Get any user by ID"
)
async def get_user(
    user_id: str,
    db: DB,
    current_user: CurrentAdmin
):
    return await UserService.get_user(db, user_id)


@router.put(
    "/users/{user_id}",
    response_model=UserResponse,
    summary="Edit any user — Admin only"
)
async def update_user(
    user_id: str,
    update_data: UserUpdate,
    db: DB,
    current_user: CurrentAdmin
):
    return await UserService.update_user(db, user_id, update_data)


@router.put(
    "/users/{user_id}/activate",
    response_model=UserResponse,
    summary="Activate user — Admin only"
)
async def activate_user(
    user_id: str,
    db: DB,
    current_user: CurrentAdmin
):
    return await UserService.toggle_active(db, user_id, is_active=True)


@router.put(
    "/users/{user_id}/deactivate",
    response_model=UserResponse,
    summary="Deactivate user — Admin only"
)
async def deactivate_user(
    user_id: str,
    db: DB,
    current_user: CurrentAdmin
):
    return await UserService.toggle_active(db, user_id, is_active=False)



@router.put(
    "/users/{user_id}/reset-password",
    response_model=AdminResetPasswordResponse,
    summary="Admin resets any user's password"
)
async def admin_reset_password(
    user_id: str,
    data: AdminResetPasswordRequest,
    db: DB,
    current_user: CurrentAdmin
):
    temp_password = await AuthService.admin_reset_password(
        db, user_id, data.new_password
    )

    if temp_password:
        return AdminResetPasswordResponse(
            message="Password reset. Share this temporary password with the user securely.",
            temporary_password=temp_password
        )

    return AdminResetPasswordResponse(
        message="Password reset successfully with the provided password."
    )