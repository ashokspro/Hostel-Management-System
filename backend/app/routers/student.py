# app/routers/student.py

from fastapi import APIRouter

from app.core.dependencies import DB, CurrentStudent
from app.schemas.user import UserResponse, UserUpdate
from app.schemas.gatepass import GatePassCreate, GatePassResponse
from app.services.user_service import UserService
from app.services.gatepass_service import GatePassService
from app.schemas.gatepass import StudentStatsResponse

router = APIRouter(prefix="/api/student", tags=["Student"])


@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: CurrentStudent):
    return current_user


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    update_data: UserUpdate,
    db: DB,
    current_user: CurrentStudent
):
    return await UserService.update_user(db, current_user.id, update_data)


# ── Gate pass routes ──────────────────────────────────────────

@router.post(
    "/gatepasses",
    response_model=GatePassResponse,
    status_code=201,
    summary="Create a gate pass request"
)
async def create_gatepass(
    gatepass_data: GatePassCreate,
    db: DB,
    current_user: CurrentStudent
):
    """
    Student creates a gate pass request.
    
    student_id comes from JWT token — not from request body.
    This means a student can ONLY create passes for themselves.
    They cannot forge passes for other students.
    """
    return await GatePassService.create_gatepass(
        db,
        student_id=current_user.id,  # from JWT — cannot be faked
        gatepass_data=gatepass_data
    )


@router.get(
    "/gatepasses",
    response_model=list[GatePassResponse],
    summary="View all my gate passes"
)
async def get_my_gatepasses(
    db: DB,
    current_user: CurrentStudent
):
    """Student sees only their own passes."""
    return await GatePassService.get_student_passes(db, current_user.id)


@router.get(
    "/gatepasses/stats",
    response_model=StudentStatsResponse,
    summary="Dashboard statistics — live status + Today/Week/Month/Overall activity"
)
async def get_stats(db: DB, current_user: CurrentStudent):
    return await GatePassService.get_student_stats(db, current_user.id)

@router.get(
    "/gatepasses/{pass_id}",
    response_model=GatePassResponse,
    summary="View a single gate pass"
)
async def get_gatepass(
    pass_id: str,
    db: DB,
    current_user: CurrentStudent
):
    gatepass = await GatePassService.get_gatepass(db, pass_id)

    # Security check — student can only view their OWN passes
    if gatepass.student_id != current_user.id:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own gate passes"
        )
    return gatepass