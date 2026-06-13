from pydantic import BaseModel, ConfigDict, field_validator, model_validator
from typing import Optional, Any
from datetime import datetime, date, time

from app.core.constants import GatePassStatus, ExitStatus


class GatePassCreate(BaseModel):
    reason: str
    going_place: str
    out_date: date      # ← renamed
    out_time: time
    return_date: date
    return_time: time

    @field_validator("reason", "going_place")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("This field cannot be empty")
        return v.strip()

    # ── Add date/time validation ──────────────────────────────
    @model_validator(mode="after")
    def validate_dates(self) -> "GatePassCreate":
        from datetime import datetime, date as date_type, time as time_type

        # Rule 1 — return date cannot be before out date
        if self.return_date < self.out_date:
            raise ValueError("Return date cannot be before departure date")

        # Rule 2 — if same day, return time must be after out time
        if self.return_date == self.out_date:
            if self.return_time <= self.out_time:
                raise ValueError(
                    "Return time must be after out time when dates are the same"
                )

        # Rule 3 — out_date cannot be in the past
        if self.out_date < date_type.today():
            raise ValueError("Departure date cannot be in the past")

        return self


class GatePassApproval(BaseModel):
    status: Optional[GatePassStatus] = None
    remarks: Optional[str] = None


class SecurityAction(BaseModel):
    security_remarks: Optional[str] = None


class GatePassResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    pass_id: str
    pass_number: Optional[str] = None
    student_id: str

    # These are computed from relationships
    # Cannot be read directly by from_attributes
    # So we set them as optional and fill via model_validator
    student_name: Optional[str] = None
    room_no: Optional[str] = None

    reason: str
    going_place: str
    out_date: date
    out_time: time
    return_date: date
    return_time: time

    status: str
    approved_by_id: Optional[str] = None
    approved_at: Optional[datetime] = None
    remarks: Optional[str] = None

    exit_status: str
    actual_out_time: Optional[datetime] = None
    actual_return_time: Optional[datetime] = None
    actual_return_date: Optional[date] = None
    security_remarks: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    @model_validator(mode="before")
    @classmethod
    def extract_student_info(cls, data: Any) -> Any:
        """
        model_validator runs BEFORE field validation.
        
        When data comes from SQLAlchemy object (not a dict),
        we manually read the relationship and extract
        student_name and room_no from it.
        
        This runs on every GatePassResponse creation —
        so student_name is always populated if student exists.
        """
        # Only do this for SQLAlchemy objects, not dicts
        if hasattr(data, "student") and data.student:
            data.student_name = data.student.name
            data.room_no = data.student.room
        return data


class GatePassListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    pass_id: str
    pass_number: Optional[str] = None
    student_id: str
    student_name: Optional[str] = None
    room_no: Optional[str] = None
    going_place: str
    out_date: date
    return_date: date
    status: str
    exit_status: str
    created_at: datetime

    @model_validator(mode="before")
    @classmethod
    def extract_student_info(cls, data: Any) -> Any:
        if hasattr(data, "student") and data.student:
            data.student_name = data.student.name
            data.room_no = data.student.room
        return data