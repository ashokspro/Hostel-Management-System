# app/repositories/gatepass_repository.py

import uuid
from datetime import datetime, timezone, date, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gatepass import GatePass
from app.core.constants import GatePassStatus, ExitStatus


from sqlalchemy import select, func, distinct
import pytz

IST = pytz.timezone("Asia/Kolkata")
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
    



    @staticmethod
    async def get_security_stats(db: AsyncSession) -> dict:
        """
        Returns live counts + Today/Week/Month/Overall activity stats.

        Live stats count UNIQUE STUDENTS (not gate passes).
        Period stats count EVENTS (gate passes, exits, returns) that
        occurred within that period.
        """
        now_utc = datetime.now(timezone.utc)

        # ── Period boundaries (UTC) ────────────────────────────
        today_start = datetime(now_utc.year, now_utc.month, now_utc.day, tzinfo=timezone.utc)
        week_start  = today_start - timedelta(days=now_utc.weekday())   # Monday
        month_start = datetime(now_utc.year, now_utc.month, 1, tzinfo=timezone.utc)

        async def period_stats(start: datetime) -> dict:
            gate_passes = await db.scalar(
                select(func.count(GatePass.pass_id))
                .where(GatePass.created_at >= start)
            )
            exits = await db.scalar(
                select(func.count(GatePass.pass_id))
                .where(GatePass.actual_out_time >= start)
            )
            returns = await db.scalar(
                select(func.count(GatePass.pass_id))
                .where(GatePass.actual_return_time >= start)
            )
            return {
                "gate_passes": gate_passes or 0,
                "exits": exits or 0,
                "returns": returns or 0,
            }

        today = await period_stats(today_start)
        week  = await period_stats(week_start)
        month = await period_stats(month_start)

        overall = {
            "gate_passes": await db.scalar(select(func.count(GatePass.pass_id))) or 0,
            "exits": await db.scalar(
                select(func.count(GatePass.pass_id))
                .where(GatePass.actual_out_time.isnot(None))
            ) or 0,
            "returns": await db.scalar(
                select(func.count(GatePass.pass_id))
                .where(GatePass.actual_return_time.isnot(None))
            ) or 0,
        }

        # ── Live stats — unique students ───────────────────────
        total_approved = await db.scalar(
            select(func.count(distinct(GatePass.student_id)))
            .where(GatePass.status == GatePassStatus.APPROVED.value)
        ) or 0

        # Fetch all currently-out approved passes to compute
        # unique out-students AND overdue students in one pass
        out_result = await db.execute(
            select(GatePass).where(
                GatePass.status == GatePassStatus.APPROVED.value,
                GatePass.exit_status == ExitStatus.OUT.value
            )
        )
        out_passes = out_result.scalars().all()

        # Compare against IST "now" since return_date/return_time
        # are stored as plain local date/time values
        now_ist_naive = now_utc.astimezone(IST).replace(tzinfo=None)

        out_student_ids = set()
        overdue_student_ids = set()
        for p in out_passes:
            out_student_ids.add(p.student_id)
            expected_return = datetime.combine(p.return_date, p.return_time)
            if expected_return < now_ist_naive:
                overdue_student_ids.add(p.student_id)

        out_count     = len(out_student_ids)
        overdue_count = len(overdue_student_ids)
        inside_count  = max(total_approved - out_count, 0)

        return {
            "live": {
                "total_approved": total_approved,
                "inside": inside_count,
                "out": out_count,
                "overdue": overdue_count,
            },
            "today": today,
            "week": week,
            "month": month,
            "overall": overall,
        }
    
    @staticmethod
    async def get_student_stats(db: AsyncSession, student_id: str) -> dict:
        now_utc = datetime.now(timezone.utc)
        today_start = datetime(now_utc.year, now_utc.month, now_utc.day, tzinfo=timezone.utc)
        week_start  = today_start - timedelta(days=now_utc.weekday())
        month_start = datetime(now_utc.year, now_utc.month, 1, tzinfo=timezone.utc)

        async def period_stats(start: datetime) -> dict:
            requests_made = await db.scalar(
                select(func.count(GatePass.pass_id))
                .where(GatePass.student_id == student_id, GatePass.created_at >= start)
            )
            approved = await db.scalar(
                select(func.count(GatePass.pass_id))
                .where(
                    GatePass.student_id == student_id,
                    GatePass.status == GatePassStatus.APPROVED.value,
                    GatePass.approved_at >= start,
                )
            )
            rejected = await db.scalar(
                select(func.count(GatePass.pass_id))
                .where(
                    GatePass.student_id == student_id,
                    GatePass.status == GatePassStatus.REJECTED.value,
                    GatePass.approved_at >= start,
                )
            )
            trips_completed = await db.scalar(
                select(func.count(GatePass.pass_id))
                .where(GatePass.student_id == student_id, GatePass.actual_return_time >= start)
            )
            return {
                "requests_made": requests_made or 0,
                "approved": approved or 0,
                "rejected": rejected or 0,
                "trips_completed": trips_completed or 0,
            }

        today = await period_stats(today_start)
        week  = await period_stats(week_start)
        month = await period_stats(month_start)

        base = select(func.count(GatePass.pass_id)).where(GatePass.student_id == student_id)
        overall = {
            "requests_made": await db.scalar(base) or 0,
            "approved": await db.scalar(base.where(GatePass.status == GatePassStatus.APPROVED.value)) or 0,
            "rejected": await db.scalar(base.where(GatePass.status == GatePassStatus.REJECTED.value)) or 0,
            "trips_completed": await db.scalar(base.where(GatePass.actual_return_time.isnot(None))) or 0,
        }

        # ── Live ────────────────────────────────────────────────
        result = await db.execute(select(GatePass).where(GatePass.student_id == student_id))
        all_passes = result.scalars().all()

        total    = len(all_passes)
        approved_n = sum(1 for p in all_passes if p.status == GatePassStatus.APPROVED.value)
        pending_n  = sum(1 for p in all_passes if p.status == GatePassStatus.PENDING.value)
        rejected_n = sum(1 for p in all_passes if p.status == GatePassStatus.REJECTED.value)
        currently_out = any(
            p.status == GatePassStatus.APPROVED.value and p.exit_status == ExitStatus.OUT.value
            for p in all_passes
        )

        return {
            "live": {
                "total": total,
                "approved": approved_n,
                "pending": pending_n,
                "rejected": rejected_n,
                "currently_out": currently_out,
            },
            "today": today,
            "week": week,
            "month": month,
            "overall": overall,
        }
    @staticmethod
    async def get_warden_stats(db: AsyncSession) -> dict:
        now_utc = datetime.now(timezone.utc)
        today_start = datetime(now_utc.year, now_utc.month, now_utc.day, tzinfo=timezone.utc)
        week_start  = today_start - timedelta(days=now_utc.weekday())
        month_start = datetime(now_utc.year, now_utc.month, 1, tzinfo=timezone.utc)

        async def period_stats(start: datetime) -> dict:
            requests_received = await db.scalar(
                select(func.count(GatePass.pass_id)).where(GatePass.created_at >= start)
            )
            approved = await db.scalar(
                select(func.count(GatePass.pass_id))
                .where(GatePass.status == GatePassStatus.APPROVED.value, GatePass.approved_at >= start)
            )
            rejected = await db.scalar(
                select(func.count(GatePass.pass_id))
                .where(GatePass.status == GatePassStatus.REJECTED.value, GatePass.approved_at >= start)
            )
            return {
                "requests_received": requests_received or 0,
                "approved": approved or 0,
                "rejected": rejected or 0,
            }

        today = await period_stats(today_start)
        week  = await period_stats(week_start)
        month = await period_stats(month_start)

        overall = {
            "requests_received": await db.scalar(select(func.count(GatePass.pass_id))) or 0,
            "approved": await db.scalar(
                select(func.count(GatePass.pass_id)).where(GatePass.status == GatePassStatus.APPROVED.value)
            ) or 0,
            "rejected": await db.scalar(
                select(func.count(GatePass.pass_id)).where(GatePass.status == GatePassStatus.REJECTED.value)
            ) or 0,
        }

        pending_requests = await db.scalar(
            select(func.count(GatePass.pass_id)).where(GatePass.status == GatePassStatus.PENDING.value)
        ) or 0

        total_approved = await db.scalar(
            select(func.count(distinct(GatePass.student_id)))
            .where(GatePass.status == GatePassStatus.APPROVED.value)
        ) or 0

        currently_out = await db.scalar(
            select(func.count(distinct(GatePass.student_id)))
            .where(
                GatePass.status == GatePassStatus.APPROVED.value,
                GatePass.exit_status == ExitStatus.OUT.value
            )
        ) or 0

        return {
            "live": {
                "pending_requests": pending_requests,
                "total_approved": total_approved,
                "currently_out": currently_out,
                "total_students": 0,   # filled in by service layer
            },
            "today": today,
            "week": week,
            "month": month,
            "overall": overall,
        }