from enum import Enum


class UserRole(str, Enum):
    STUDENT = "student"
    WARDEN = "warden"
    SECURITY = "security"
    ADMIN    = "admin"  


class GatePassStatus(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"


class ExitStatus(str, Enum):
    IN = "In"
    OUT = "Out"