# app/routers/warden.py

from fastapi import APIRouter
from app.core.dependencies import DB, CurrentWarden
from app.schemas.user import UserResponse, StudentListItem
from app.schemas.gatepass import GatePassResponse, GatePassApproval
from app.services.user_service import UserService
from app.services.gatepass_service import GatePassService
from app.core.constants import GatePassStatus

router = APIRouter(prefix="/api/warden", tags=["Warden"])


# ── Students ──────────────────────────────────────────────────
@router.get("/students", response_model=list[StudentListItem])
async def list_students(
    db: DB, current_user: CurrentWarden,
    search: str | None = None,
    year: str | None = None,
    course: str | None = None
):
    return await UserService.get_students(db, search=search, year=year, course=course)


@router.get("/students/{student_id}", response_model=UserResponse)
async def get_student(student_id: str, db: DB, current_user: CurrentWarden):
    return await UserService.get_user(db, student_id)


# ── Gate passes ───────────────────────────────────────────────
@router.get("/gatepasses/pending", response_model=list[GatePassResponse])
async def get_pending(db: DB, current_user: CurrentWarden):
    return await GatePassService.get_pending_passes(db)


@router.get("/gatepasses", response_model=list[GatePassResponse])
async def get_all(db: DB, current_user: CurrentWarden):
    return await GatePassService.get_all_passes(db)


@router.put("/gatepasses/{pass_id}/approve", response_model=GatePassResponse)
async def approve(
    pass_id: str,
    approval_data: GatePassApproval,
    db: DB,
    current_user: CurrentWarden
):
    approval_data.status = GatePassStatus.APPROVED
    return await GatePassService.approve_or_reject(
        db, pass_id, current_user.id, approval_data
    )


@router.put("/gatepasses/{pass_id}/reject", response_model=GatePassResponse)
async def reject(
    pass_id: str,
    approval_data: GatePassApproval,
    db: DB,
    current_user: CurrentWarden
):
    approval_data.status = GatePassStatus.REJECTED
    return await GatePassService.approve_or_reject(
        db, pass_id, current_user.id, approval_data
    )

from app.schemas.gatepass import WardenStatsResponse

@router.get(
    "/gatepasses/stats",
    response_model=WardenStatsResponse,
    summary="Dashboard statistics — live status + Today/Week/Month/Overall activity"
)
async def get_stats(db: DB, current_user: CurrentWarden):
    return await GatePassService.get_warden_stats(db)