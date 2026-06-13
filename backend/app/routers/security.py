# app/routers/security.py

from fastapi import APIRouter

from app.core.dependencies import DB, CurrentSecurity
from app.schemas.gatepass import GatePassResponse, SecurityAction
from app.services.gatepass_service import GatePassService

router = APIRouter(prefix="/api/security", tags=["Security"])

# ── Static routes FIRST ───────────────────────────────────────
@router.get(
    "/gatepasses",
    response_model=list[GatePassResponse],
    summary="View all approved gate passes"
)
async def get_approved_gatepasses(db: DB, current_user: CurrentSecurity):
    return await GatePassService.get_approved_passes(db)


@router.get(
    "/gatepasses/out",              # ← static, must be BEFORE /{pass_id}
    response_model=list[GatePassResponse],
    summary="View students currently outside hostel"
)
async def get_currently_out(db: DB, current_user: CurrentSecurity):
    return await GatePassService.get_currently_out(db)


# ── Dynamic routes AFTER ──────────────────────────────────────
@router.put(
    "/gatepasses/{pass_id}/exit",
    response_model=GatePassResponse,
    summary="Mark student as exited"
)
async def mark_exit(
    pass_id: str,
    security_data: SecurityAction,
    db: DB,
    current_user: CurrentSecurity
):
    return await GatePassService.mark_exit(db, pass_id, security_data)


@router.put(
    "/gatepasses/{pass_id}/return",
    response_model=GatePassResponse,
    summary="Mark student as returned"
)
async def mark_return(
    pass_id: str,
    security_data: SecurityAction,
    db: DB,
    current_user: CurrentSecurity
):
    return await GatePassService.mark_return(db, pass_id, security_data)