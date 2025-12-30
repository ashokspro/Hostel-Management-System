# app/models/user.py
"""
User Model Definition

This model handles different types of users: students, wardens, and security personnel.
Uses single table inheritance pattern for simplicity.
"""

from app import db, bcrypt
from datetime import datetime
from flask_jwt_extended import create_access_token
from zoneinfo import ZoneInfo

import pytz

def ist_now():
    tz = pytz.timezone("Asia/Kolkata")
    return datetime.now(tz)

class User(db.Model):
    """
    User model for all user types (student, warden, security)
    
    Single Table Inheritance: All user types in one table with discriminator column
    """
    
    __tablename__ = 'users'
    
    # Common fields for all users
    id = db.Column(db.String(20), primary_key=True)  # Student ID, Warden ID, Security ID
    name = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    user_type = db.Column(db.String(20), nullable=False)  # 'student', 'warden', 'security'
    email = db.Column(db.String(120), unique=True, nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, default=ist_now)
    updated_at = db.Column(db.DateTime, default=ist_now, onupdate=ist_now)
    is_active = db.Column(db.Boolean, default=True)
    
    # Student-specific fields
    room = db.Column(db.String(20), nullable=True)  # Room number
    course = db.Column(db.String(100), nullable=True)  # Course/Program
    year = db.Column(db.String(20), nullable=True)  # Academic year
    guardian_name = db.Column(db.String(100), nullable=True)
    guardian_phone = db.Column(db.String(20), nullable=True)
    
    # Staff fields (warden and security)
    role = db.Column(db.String(50), nullable=True)  # Job role/designation
    department = db.Column(db.String(100), nullable=True)  # For wardens
    experience = db.Column(db.String(50), nullable=True)  # Years of experience
    qualification = db.Column(db.String(200), nullable=True)  # For wardens
    shift = db.Column(db.String(50), nullable=True)  # For security
    emergency_contact = db.Column(db.String(20), nullable=True)  # For security
    
    # Relationship with gate passes
    gate_passes = db.relationship('GatePass', backref='student', lazy='dynamic', 
                                 foreign_keys='GatePass.student_id')
    approved_passes = db.relationship('GatePass', backref='approver', lazy='dynamic',
                                    foreign_keys='GatePass.approved_by_id')
    
    def __init__(self, **kwargs):
        """
        Initialize user with validation
        """
        super(User, self).__init__(**kwargs)
        
        # Validate user type
        if self.user_type not in ['student', 'warden', 'security']:
            raise ValueError("Invalid user type")
    
    def set_password(self, password):
        """
        Hash and set password
        
        Args:
            password (str): Plain text password
        """
        if not password or len(password) < 6:
            raise ValueError("Password must be at least 6 characters long")
        
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        """
        Check if provided password matches stored hash
        
        Args:
            password (str): Plain text password to verify
            
        Returns:
            bool: True if password matches, False otherwise
        """
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def generate_token(self):
        """
        Generate JWT access token for user
        
        Returns:
            str: JWT access token
        """
        additional_claims = {
            "user_type": self.user_type,
            "name": self.name,
            "room": self.room if self.user_type == 'student' else None
        }
        return create_access_token(identity=self.id, additional_claims=additional_claims)
    
    def to_dict(self, include_sensitive=False):
        """
        Convert user object to dictionary
        
        Args:
            include_sensitive (bool): Whether to include sensitive information
            
        Returns:
            dict: User data as dictionary
        """
        user_dict = {
            'id': self.id,
            'name': self.name,
            'user_type': self.user_type,
            'email': self.email,
            'phone': self.phone,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        # Include password hash if requested (for admin purposes)
        if include_sensitive:
            user_dict['password'] = self.password_hash
        
        # Add user-type specific fields
        if self.user_type == 'student':
            user_dict.update({
                'room': self.room,
                'course': self.course,
                'year': self.year,
                'guardian_name': self.guardian_name,
                'guardian_phone': self.guardian_phone
            })
        elif self.user_type in ['warden', 'security']:
            user_dict.update({
                'role': self.role,
                'experience': self.experience
            })
            
            if self.user_type == 'warden':
                user_dict.update({
                    'department': self.department,
                    'qualification': self.qualification
                })
            elif self.user_type == 'security':
                user_dict.update({
                    'shift': self.shift,
                    'emergency_contact': self.emergency_contact
                })
        
        return user_dict
    
    def update_from_dict(self, data):
        """
        Update user fields from dictionary
        
        Args:
            data (dict): Dictionary containing field updates
        """
        # Update common fields
        for field in ['name', 'email', 'phone']:
            if field in data:
                setattr(self, field, data[field])
        
        # Update user-type specific fields
        if self.user_type == 'student':
            for field in ['course', 'year', 'guardian_name', 'guardian_phone']:
                if field in data:
                    setattr(self, field, data[field])
        elif self.user_type in ['warden', 'security']:
            for field in ['role', 'experience']:
                if field in data:
                    setattr(self, field, data[field])
            
            if self.user_type == 'warden':
                for field in ['department', 'qualification']:
                    if field in data:
                        setattr(self, field, data[field])
            elif self.user_type == 'security':
                for field in ['shift', 'emergency_contact']:
                    if field in data:
                        setattr(self, field, data[field])
        
        self.updated_at = ist_now()
    
    @staticmethod
    def find_by_id(user_id):
        """
        Find user by ID
        
        Args:
            user_id (str): User ID to search for
            
        Returns:
            User: User object or None if not found
        """
        return User.query.filter_by(id=user_id).first()
    
    @staticmethod
    def find_by_email(email):
        """
        Find user by email
        
        Args:
            email (str): Email to search for
            
        Returns:
            User: User object or None if not found
        """
        return User.query.filter_by(email=email).first()
    
    @staticmethod
    def get_students(filters=None):
        """
        Get all students with optional filters
        
        Args:
            filters (dict): Optional filters (year, course, etc.)
            
        Returns:
            list: List of student users
        """
        ###
        query = User.query.filter_by(user_type='student')
        
        if filters:
            if 'year' in filters:
                query = query.filter_by(year=filters['year'])
            if 'course' in filters:
                query = query.filter(User.course.contains(filters['course']))
            if 'search' in filters:
                search_term = f"%{filters['search']}%"
                query = query.filter(
                    db.or_(
                        User.name.contains(filters['search']),
                        User.id.contains(filters['search']),
                        User.room.contains(filters['search'])
                    )
                )
        
        return query.all()
    
    def __repr__(self):
        return f'<User {self.id}: {self.name} ({self.user_type})>'
    



#new
# from app import db
# from app.models.user import User

def create_user(user_data):
    """
    Create a new user in the database.
    user_data: dict with keys: id, name, password, user_type, email, phone, etc.
    """
    if User.find_by_id(user_data['id']):
        return False, "User already exists"

    user = User(
        id=user_data['id'],
        name=user_data['name'],
        user_type=user_data['user_type'].lower(),
        email=user_data.get('email'),
        phone=user_data.get('phone'),
        room=user_data.get('room'),
        course=user_data.get('course'),
        year=user_data.get('year'),
        guardian_name=user_data.get('guardian_name'),
        guardian_phone=user_data.get('guardian_phone'),
        role=user_data.get('role'),
        department=user_data.get('department'),
        experience=user_data.get('experience'),
        qualification=user_data.get('qualification'),
        shift=user_data.get('shift'),
        emergency_contact=user_data.get('emergency_contact')
    )

    user.set_password(user_data['password'])
    db.session.add(user)
    db.session.commit()
    return True, "User created successfully"
