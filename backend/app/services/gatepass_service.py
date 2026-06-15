# app/services/gatepass_service.py

import uuid
from datetime import datetime, timezone, date

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.repositories.gatepass_repository import GatePassRepository
from app.repositories.user_repository import UserRepository
from app.models.gatepass import GatePass
from app.schemas.gatepass import GatePassCreate, GatePassApproval, SecurityAction
from app.core.constants import GatePassStatus, ExitStatus


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class GatePassService:
    """
    ALL business logic for gate passes lives here.
    
    Workflow rules enforced here:
        - Student can only create pass for themselves
        - Only PENDING passes can be approved/rejected
        - Only APPROVED passes can have exit marked
        - Only OUT students can be marked as returned
    """

    @staticmethod
    def generate_pass_number(serial: int) -> str:
        """
        Generates human-readable pass number.
        
        Format: GP-DDMMYY-XXX
        Example: GP-250523-004
        
        Breaking it down:
            GP     → GatePass prefix
            250523 → 23rd May 2025 (YYMMDD format)
            004    → 4th pass created today (zero-padded to 3 digits)
        
        zfill(3) pads with zeros:
            "4"  → "004"
            "12" → "012"
        """
        today = date.today()
        # strftime formats date as string
        # %y=2-digit year, %m=month, %d=day
        date_part = today.strftime("%d%m%y")
        serial_part = str(serial).zfill(3)
        return f"GP-{date_part}-{serial_part}"

    @staticmethod
    async def create_gatepass(
        db: AsyncSession,
        student_id: str,
        gatepass_data: GatePassCreate
    ) -> GatePass:

        # ── Bug fix: one active pass at a time ────────────────
        # Check if student already has a PENDING or APPROVED pass
        # ── Check for active gate pass ─────────────────────────
        existing_passes = await GatePassRepository.get_by_student(db, student_id)

        for p in existing_passes:
            # Block if pass is still pending warden action
            if p.status == GatePassStatus.PENDING.value:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"You already have a pending gate pass ({p.pass_number}). Wait for warden action."
                )

            # Block if approved and student is currently outside
            if (
                p.status == GatePassStatus.APPROVED.value
                and p.exit_status == ExitStatus.OUT.value
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"You are currently outside the hostel ({p.pass_number}). Return first before creating a new pass."
                )

            # Allow if rejected — student can try again
            # Allow if approved + returned (exit_status=IN + actual_return_time set)
            # Allow if approved but student hasn't exited yet and wants to cancel
            # (This case handled by warden rejecting)

        # Rule 1 — validate dates
        if gatepass_data.return_date < gatepass_data.out_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Return date cannot be before departure date"
            )

        # Rule 2 — confirm student exists
        student = await UserRepository.get_by_id(db, student_id)
        if not student or not student.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Student account not found or inactive"
            )

        # Rule 3 — generate pass number
        today_count = await GatePassRepository.count_today(db)
        serial = today_count + 1
        pass_number = GatePassService.generate_pass_number(serial)

        gatepass = GatePass(
            pass_id=str(uuid.uuid4()),
            pass_number=pass_number,
            daily_serial=serial,
            student_id=student_id,
            reason=gatepass_data.reason,
            going_place=gatepass_data.going_place,
            out_date=gatepass_data.out_date,
            out_time=gatepass_data.out_time,
            return_date=gatepass_data.return_date,
            return_time=gatepass_data.return_time,
            status=GatePassStatus.PENDING.value,
            exit_status=ExitStatus.IN.value
        )

        return await GatePassRepository.create(db, gatepass)

    @staticmethod
    async def get_gatepass(
        db: AsyncSession,
        pass_id: str
    ) -> GatePass:
        """
        Fetch single gate pass — raises 404 if not found.
        """
        gatepass = await GatePassRepository.get_by_id(db, pass_id)
        if not gatepass:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Gate pass '{pass_id}' not found"
            )
        return gatepass

    @staticmethod
    async def approve_or_reject(
        db: AsyncSession,
        pass_id: str,
        warden_id: str,         # comes from JWT token
        approval_data: GatePassApproval
    ) -> GatePass:
        """
        Warden approves or rejects a gate pass.
        
        Rules:
            1. Pass must exist
            2. Pass must be PENDING — can't approve already approved pass
            3. Records who approved and when
        """
        gatepass = await GatePassService.get_gatepass(db, pass_id)

        # Rule 2 — only pending passes can be actioned
        if gatepass.status != GatePassStatus.PENDING.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot action a pass with status '{gatepass.status}'. Only PENDING passes can be approved or rejected."
            )

        # Update the pass
        gatepass.status = approval_data.status.value
        gatepass.approved_by_id = warden_id
        gatepass.approved_at = utcnow()
        gatepass.remarks = approval_data.remarks

        return await GatePassRepository.update(db, gatepass)

    @staticmethod
    async def mark_exit(
        db: AsyncSession,
        pass_id: str,
        security_data: SecurityAction
    ) -> GatePass:
        """
        Security marks student as exited.
        
        Rules:
            1. Pass must be APPROVED — pending passes can't exit
            2. Student must currently be IN — can't exit twice
            3. Records actual exit time
        """
        gatepass = await GatePassService.get_gatepass(db, pass_id)

        # Rule 1 — must be approved
        if gatepass.status != GatePassStatus.APPROVED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only APPROVED passes can mark exit"
            )

        # Rule 2 — must currently be IN
        if gatepass.exit_status == ExitStatus.OUT.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student has already exited"
            )

        # Record exit
        gatepass.exit_status = ExitStatus.OUT.value
        gatepass.actual_out_time = utcnow()
        gatepass.security_remarks = security_data.security_remarks

        return await GatePassRepository.update(db, gatepass)
    

    @staticmethod
    async def mark_return(
    db: AsyncSession,
    pass_id: str,
    security_data: SecurityAction
    ) -> GatePass:

        gatepass = await GatePassService.get_gatepass(db, pass_id)

        # Check 1 — must be approved
        if gatepass.status != GatePassStatus.APPROVED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only APPROVED passes can mark return"
            )

        # Check 2 — must currently be OUT (this is the primary guard)
        if gatepass.exit_status != ExitStatus.OUT.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot mark return — student has not exited yet"
            )

        # Update — order matters, set exit_status FIRST
        gatepass.exit_status        = ExitStatus.IN.value
        gatepass.actual_return_time = utcnow()
        gatepass.actual_return_date = date.today()

        if security_data.security_remarks:
            existing = gatepass.security_remarks or ""
            gatepass.security_remarks = (
                f"{existing} | Return: {security_data.security_remarks}"
                if existing
                else f"Return: {security_data.security_remarks}"
            )

        return await GatePassRepository.update(db, gatepass)

    @staticmethod
    async def get_student_passes(
        db: AsyncSession,
        student_id: str
    ) -> list[GatePass]:
        return await GatePassRepository.get_by_student(db, student_id)

    @staticmethod
    async def get_all_passes(db: AsyncSession) -> list[GatePass]:
        return await GatePassRepository.get_all(db)

    @staticmethod
    async def get_pending_passes(db: AsyncSession) -> list[GatePass]:
        return await GatePassRepository.get_pending(db)

    @staticmethod
    async def get_approved_passes(db: AsyncSession) -> list[GatePass]:
        return await GatePassRepository.get_approved(db)

    @staticmethod
    async def get_currently_out(db: AsyncSession) -> list[GatePass]:
        return await GatePassRepository.get_currently_out(db)
    
    @staticmethod
    async def get_completed_passes(db: AsyncSession) -> list[GatePass]:
        """
        Returns approved passes where the student has completed
        the full cycle: exited AND returned.
        """
        return await GatePassRepository.get_completed(db)
    

    @staticmethod
    async def get_actionable_passes(db: AsyncSession) -> list[GatePass]:
        """
        Returns approved passes that still need security action —
        either haven't exited yet, or are currently out.
        Excludes completed (exited and returned) passes.
        """
        return await GatePassRepository.get_actionable(db)