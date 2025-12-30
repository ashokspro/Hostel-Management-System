# app/models/gatepass.py
"""
GatePass Model Definition

This model handles gate pass requests and approvals.
Tracks student movements in and out of the hostel.
"""

from app import db
from datetime import datetime,date
import uuid
from zoneinfo import ZoneInfo

import pytz

def ist_now():
    tz = pytz.timezone("Asia/Kolkata")
    return datetime.now(tz)

class GatePass(db.Model):
    """
    GatePass model for managing student exit/entry permissions
    
    Workflow:
    1. Student creates gate pass request
    2. Warden approves/rejects
    3. Security marks entry/exit
    """
    
    __tablename__ = 'gate_passes'
    
    # Primary key - using UUID for unique identification
    pass_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Student information
    student_id = db.Column(db.String(20), db.ForeignKey('users.id'), nullable=False)
    
    # Gate pass details
    reason = db.Column(db.Text, nullable=False)  # Reason for going out
    from_date = db.Column(db.Date, nullable=False)  # Date of going out
    out_time = db.Column(db.Time, nullable=False)  # Expected out time
    return_time = db.Column(db.Time, nullable=False)  # Expected return time
    ###
    return_date = db.Column(db.Date, nullable=False)
    going_place = db.Column(db.String(255), nullable=False, server_default='')

    # Approval workflow
    status = db.Column(db.String(20), default='Pending')  # Pending, Approved, Rejected
    approved_by_id = db.Column(db.String(20), db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    remarks = db.Column(db.Text, nullable=True)  # Warden's remarks
    
    # Security tracking
    exit_status = db.Column(db.String(10), default='In')  # In, Out
    actual_out_time = db.Column(db.DateTime, nullable=True)  # When actually left
    actual_return_time = db.Column(db.DateTime, nullable=True)  # When actually returned
    security_remarks = db.Column(db.Text, nullable=True)
    ###
    actual_return_date = db.Column(db.Date, nullable=True)
    # Timestamps
    created_at = db.Column(db.DateTime, default=ist_now)
    updated_at = db.Column(db.DateTime, default=ist_now, onupdate=ist_now)
    
    def __init__(self, **kwargs):
        """
        Initialize gate pass with validation
        """
        super(GatePass, self).__init__(**kwargs)
        
        #modified c
        if not self.status:
            self.status = "Pending"

        if not self.exit_status:
            self.exit_status = "In"

        # Validate status
        if self.status not in ['Pending', 'Approved', 'Rejected']:
            raise ValueError("Invalid status")
        
        # Validate exit status
        if self.exit_status not in ['In', 'Out']:
            raise ValueError("Invalid exit status")
    
    def approve(self, approved_by_user_id, remarks=None):
        """
        Approve the gate pass
        
        Args:
            approved_by_user_id (str): ID of the approving warden
            remarks (str): Optional remarks from warden
        """
        self.status = 'Approved'
        self.approved_by_id = approved_by_user_id
        self.approved_at = ist_now()
        self.remarks = remarks
        self.updated_at = ist_now()
    
    def reject(self, rejected_by_user_id, remarks=None):
        """
        Reject the gate pass
        
        Args:
            rejected_by_user_id (str): ID of the rejecting warden
            remarks (str): Optional remarks from warden
        """
        self.status = 'Rejected'
        self.approved_by_id = rejected_by_user_id
        self.approved_at = ist_now()
        self.remarks = remarks
        self.updated_at = ist_now()
    
    def mark_exit(self, security_remarks=None):
        """
        Mark student as exited
        
        Args:
            security_remarks (str): Optional security remarks
        """
        if self.status != 'Approved':
            raise ValueError("Cannot mark exit for non-approved gate pass")
        
        self.exit_status = 'Out'
        self.actual_out_time = ist_now()
        self.security_remarks = security_remarks
        self.updated_at = ist_now()
    
    def mark_return(self, security_remarks=None):
        """
        Mark student as returned
        
        Args:
            security_remarks (str): Optional security remarks
        """
        if self.exit_status != 'Out':
            raise ValueError("Cannot mark return for student who hasn't exited")
        
        self.exit_status = 'In'
        self.actual_return_time = ist_now()
        ###
        self.actual_return_date = datetime.today()
        if security_remarks:
            self.security_remarks = (self.security_remarks or '') + f" | Return: {security_remarks}"
        self.updated_at = ist_now()
    
    def to_dict(self):
        """
        Convert gate pass to dictionary
        
        Returns:
            dict: Gate pass data as dictionary
        """
        # Get student information
        student = self.student
        student_name = student.name if student else "Unknown"
        room_no = student.room if student else "Unknown"
        
        # Get approver information
        approver_name = None
        if self.approver:
            approver_name = self.approver.name

        return {
            'pass_id': self.pass_id,
            'student_id': self.student_id,
            'student_name': student_name,
            'room_no': room_no,
            'reason': self.reason,
            'from_date': self.from_date.strftime('%Y-%m-%d') if self.from_date else None,
            'out_time': self.out_time.strftime('%H:%M') if self.out_time else None,
            ###
            'going_place': self.going_place,
            'phone': student.phone if student else None,
            'guardian_phone': student.guardian_phone if student else None,
            'return_date': self.return_date.isoformat() if self.return_date else None,
            'return_time': self.return_time.strftime('%H:%M') if self.return_time else None,
            'status': self.status,
            'approved_by': approver_name,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'remarks': self.remarks,
            'exit_status': self.exit_status,
            'actual_out_time': self.actual_out_time.isoformat() if self.actual_out_time else None,
            'actual_return_time': self.actual_return_time.isoformat() if self.actual_return_time else None,
            ###
            'actual_return_date': self.actual_return_date.isoformat() if self.actual_return_date else None,
            'security_remarks': self.security_remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @staticmethod
    def get_pending_requests():
        """
        Get all pending gate pass requests
        
        Returns:
            list: List of pending gate passes
        """
        return GatePass.query.filter_by(status='Pending').order_by(GatePass.created_at.desc()).all()
    
    @staticmethod
    def get_approved_passes():
        """
        Get all approved gate passes
        
        Returns:
            list: List of approved gate passes
        """
        return GatePass.query.filter_by(status='Approved').order_by(GatePass.from_date.desc()).all()
    
    @staticmethod
    def get_student_passes(student_id):
        """
        Get all gate passes for a specific student
        
        Args:
            student_id (str): Student ID
            
        Returns:
            list: List of student's gate passes
        """
        return GatePass.query.filter_by(student_id=student_id).order_by(GatePass.created_at.desc()).all()
    
    @staticmethod
    def get_currently_out():
        """
        Get all students currently out (exit_status = 'Out')
        
        Returns:
            list: List of gate passes for students currently out
        """
        return GatePass.query.filter_by(
            status='Approved',
            exit_status='Out'
        ).order_by(GatePass.actual_out_time.desc()).all()
    
    @staticmethod
    def find_by_id(pass_id):
        """
        Find gate pass by ID
        
        Args:
            pass_id (str): Gate pass ID
            
        Returns:
            GatePass: Gate pass object or None
        """
        return GatePass.query.filter_by(pass_id=pass_id).first()
    
    def is_overdue(self):
        """
        Check if student is overdue for return
        
        Returns:
            bool: True if overdue, False otherwise
        """
        if self.exit_status != 'Out':
            return False
        ###

# Combine date and time into a single datetime
        expected_return = datetime.combine(self.return_date, self.return_time)  # return_date is a date object, return_time is a time object

# Compare with current datetime
        is_past = ist_now() > expected_return  # True if current time is past the expected return

        """from datetime import datetime, time
        expected_return = datetime.combine(self.from_date, self.return_time)
        return ist_now() > expected_return
    """
    def get_duration_out(self):
        """
        Calculate how long student has been out
        
        Returns:
            dict: Duration information
        """
        if self.exit_status != 'Out' or not self.actual_out_time:
            return None
        
        duration = ist_now() - self.actual_out_time
        hours = int(duration.total_seconds() // 3600)
        minutes = int((duration.total_seconds() % 3600) // 60)
        
        return {
            'hours': hours,
            'minutes': minutes,
            'total_minutes': int(duration.total_seconds() // 60)
        }
    
    def __repr__(self):
        return f'<GatePass {self.pass_id}: {self.student_id} - {self.status}>'