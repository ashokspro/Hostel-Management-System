# app/repositories/gatepass_repository.py

import uuid
from datetime import datetime, timezone, date

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.gatepass import GatePass
from app.core.constants import GatePassStatus, ExitStatus


class GatePassRepository:
    """
    ALL database operations for GatePass live here.
    No business logic — just pure DB queries.
    """

    @staticmethod
    async def get_by_id(db: AsyncSession, pass_id: str) -> GatePass | None:
        """
        Fetch single gate pass by UUID.
        Returns None if not found.
        """
        result = await db.execute(
            select(GatePass).where(GatePass.pass_id == pass_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_student(
        db: AsyncSession,
        student_id: str
    ) -> list[GatePass]:
        """
        Fetch all gate passes for a specific student.
        Ordered by newest first — student sees latest pass on top.
        """
        result = await db.execute(
            select(GatePass)
            .where(GatePass.student_id == student_id)
            .order_by(GatePass.created_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_all(db: AsyncSession) -> list[GatePass]:
        """
        Fetch ALL gate passes.
        Used by warden to see complete history.
        """
        result = await db.execute(
            select(GatePass).order_by(GatePass.created_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_pending(db: AsyncSession) -> list[GatePass]:
        """
        Fetch only PENDING gate passes.
        Used by warden dashboard — action required.
        """
        result = await db.execute(
            select(GatePass)
            .where(GatePass.status == GatePassStatus.PENDING.value)
            .order_by(GatePass.created_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_approved(db: AsyncSession) -> list[GatePass]:
        """
        Fetch only APPROVED gate passes.
        Used by security to see who is allowed to exit.
        """
        result = await db.execute(
            select(GatePass)
            .where(GatePass.status == GatePassStatus.APPROVED.value)
            .order_by(GatePass.out_date.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_currently_out(db: AsyncSession) -> list[GatePass]:
        """
        Fetch passes where student is currently OUTSIDE hostel.
        
        Two conditions must BOTH be true:
            1. Pass is approved (warden said yes)
            2. Exit status is OUT (security marked exit)
        
        Used by security for real-time monitoring.
        """
        result = await db.execute(
            select(GatePass)
            .where(
                GatePass.status == GatePassStatus.APPROVED.value,
                GatePass.exit_status == ExitStatus.OUT.value
            )
            .order_by(GatePass.actual_out_time.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def count_today(db: AsyncSession) -> int:
        """
        Count how many gate passes were created TODAY.
        
        Used to generate pass_number serial:
            If 3 passes exist today → next serial is 4
            Result: GP-250523-004
        
        func.count() → SQL COUNT()
        func.date() → extracts date part from datetime
        """
        today = date.today()
        result = await db.execute(
            select(func.count(GatePass.pass_id))
            .where(
                func.date(GatePass.created_at) == today
            )
        )
        return result.scalar() or 0

    @staticmethod
    async def create(db: AsyncSession, gatepass: GatePass) -> GatePass:
        """
        Save a new gate pass to DB.
        Same pattern as UserRepository.create()
        """
        db.add(gatepass)
        await db.commit()
        await db.refresh(gatepass)
        return gatepass

    @staticmethod
    async def update(db: AsyncSession, gatepass: GatePass) -> GatePass:
        """
        Save changes to existing gate pass.
        Used for approve, reject, exit, return actions.
        """
        await db.commit()
        await db.refresh(gatepass)
        return gatepass
    
    @staticmethod
    async def get_completed(db: AsyncSession) -> list[GatePass]:
        """
        Fetch passes where exit_status is IN (back home)
        AND actual_return_time is set (meaning they actually went out and returned).
        """
        result = await db.execute(
            select(GatePass)
            .where(
                GatePass.status == GatePassStatus.APPROVED.value,
                GatePass.exit_status == ExitStatus.IN.value,
                GatePass.actual_return_time.isnot(None)
            )
            .order_by(GatePass.actual_return_time.desc())
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def get_actionable(db: AsyncSession) -> list[GatePass]:
        """
        Approved passes needing action: not yet exited, or currently out.
        Excludes passes where actual_return_time is already set.
        """
        result = await db.execute(
            select(GatePass)
            .where(
                GatePass.status == GatePassStatus.APPROVED.value,
                GatePass.actual_return_time.is_(None)
            )
            .order_by(GatePass.created_at.desc())
        )
        return list(result.scalars().all())