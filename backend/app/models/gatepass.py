# app/models/gatepass.py

import uuid
from datetime import datetime, timezone, date, time

from sqlalchemy import String, Text, Date, Time, DateTime, ForeignKey, Enum as SAEnum, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.constants import GatePassStatus, ExitStatus

from app.models.user import User

def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class GatePass(Base):
    """
    GatePass model — tracks student exit/entry permissions.

    Workflow:
        1. Student creates a gate pass request
        2. Warden approves or rejects it
        3. Security marks exit and return
    """

    __tablename__ = "gate_passes"

    # ── Primary key ───────────────────────────────────────────
    # UUID — internal unique identifier, never shown to users
    # lambda: str(uuid.uuid4()) generates a new UUID on every INSERT
    pass_id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    # ── Human-readable pass number ────────────────────────────
    # Format: GP-250523-001
    #         GP  → GatePass prefix
    #         250523 → DDMMYY of creation date
    #         001 → serial number of that day (resets every day)
    # This is what gets printed on the PDF and shown to security
    # daily_serial tracks how many passes were created today
    pass_number: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    daily_serial: Mapped[int] = mapped_column(Integer, default=1)

    # ── Student link ──────────────────────────────────────────
    # ForeignKey points to users.id — PostgreSQL enforces this
    # If you try to insert a student_id that doesn't exist in users,
    # PostgreSQL will reject it with a ForeignKeyViolation error
    student_id: Mapped[str] = mapped_column(
        String(20),
        ForeignKey("users.id"),
        nullable=False
    )

    # ── Gate pass details ─────────────────────────────────────
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    going_place: Mapped[str] = mapped_column(String(255), nullable=False)

    # Date and Time are stored separately (same as your old model)
    # out_date → the day student plans to leave
    # out_time  → expected time of exit on out_date
    out_date: Mapped[date] = mapped_column(Date, nullable=False)
    out_time: Mapped[time] = mapped_column(Time, nullable=False)

    # return_date + return_time → when student plans to come back
    # Separate from out_date because passes can span multiple days
    return_date: Mapped[date] = mapped_column(Date, nullable=False)
    return_time: Mapped[time] = mapped_column(Time, nullable=False)

    # ── Approval workflow ─────────────────────────────────────
    # SAEnum enforces only Pending/Approved/Rejected at DB level
    status: Mapped[str] = mapped_column(
        SAEnum(GatePassStatus, values_callable=lambda x: [e.value for e in x]),
        default=GatePassStatus.PENDING,
        nullable=False
    )

    # Who approved/rejected — NULL until warden takes action
    approved_by_id: Mapped[str | None] = mapped_column(
        String(20),
        ForeignKey("users.id"),
        nullable=True
    )
    # When the approval/rejection happened
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Warden's optional note explaining approval or rejection
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Security tracking ─────────────────────────────────────
    # Tracks whether student is currently inside or outside hostel
    exit_status: Mapped[str] = mapped_column(
        SAEnum(ExitStatus, values_callable=lambda x: [e.value for e in x]),
        default=ExitStatus.IN,
        nullable=False
    )

    # Actual times recorded by security (different from planned times)
    actual_out_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_return_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_return_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Security guard's optional note
    security_remarks: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Timestamps ────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # ── Relationships ─────────────────────────────────────────
    # back_populates must match exactly what's in user.py
    # student → the User who made this request
    # approver → the Warden who approved/rejected
    student: Mapped["User"] = relationship(
        "User",
        back_populates="gate_passes",
        foreign_keys=[student_id],
        lazy="selectin"  
       
    )
    approver: Mapped["User | None"] = relationship(
        "User",
        back_populates="approved_passes",
        foreign_keys=[approved_by_id],
        lazy="selectin"  
    )

    def __repr__(self) -> str:
        return f"<GatePass {self.pass_number}: {self.student_id} - {self.status}>"