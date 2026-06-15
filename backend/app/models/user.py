# app/models/user.py

from datetime import datetime, timezone

from sqlalchemy import String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.constants import UserRole


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    # ── Primary key ───────────────────────────────────────────
    # String ID because students have college roll numbers like "22CS001"
    id: Mapped[str] = mapped_column(String(20), primary_key=True)

    # ── Common fields ─────────────────────────────────────────
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(128), nullable=False)

    # PostgreSQL enforces only valid UserRole values at DB level
    user_type: Mapped[str] = mapped_column(
        SAEnum(UserRole, values_callable=lambda x: [e.value for e in x]),
        nullable=False
    )

    email: Mapped[str | None] = mapped_column(String(120), unique=True, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Soft delete — deactivated users stay in DB for audit trail
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # ── Student-specific fields ───────────────────────────────
    # NULL for warden/security users
    room: Mapped[str | None] = mapped_column(String(20), nullable=True)
    course: Mapped[str | None] = mapped_column(String(100), nullable=True)
    year: Mapped[str | None] = mapped_column(String(20), nullable=True)
    guardian_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    guardian_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # ── Staff-specific fields ─────────────────────────────────
    # NULL for student users
    role: Mapped[str | None] = mapped_column(String(50), nullable=True)
    department: Mapped[str | None] = mapped_column(String(100), nullable=True)
    emergency_contact: Mapped[str | None] = mapped_column(String(20), nullable=True)
    

    # ── Password reset ──────────────────────────────────────
    reset_token_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    reset_token_expires: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # ── Relationships ─────────────────────────────────────────
    gate_passes: Mapped[list["GatePass"]] = relationship(
        "GatePass",
        back_populates="student",
        foreign_keys="GatePass.student_id",
        lazy="selectin"
    )
    approved_passes: Mapped[list["GatePass"]] = relationship(
        "GatePass",
        back_populates="approver",
        foreign_keys="GatePass.approved_by_id",
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<User {self.id}: {self.name} ({self.user_type})>"