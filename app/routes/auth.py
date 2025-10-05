# app/routes/auth.py
"""
Authentication Routes

Handles user login, registration, token validation, and logout.
Uses JWT tokens for stateless authentication.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models.user import User
import re

import datetime
from zoneinfo import ZoneInfo
#new
from flask import Blueprint, request, jsonify



# Create blueprint for authentication routes
auth_bp = Blueprint('auth', __name__)
import pytz

def ist_now():
    tz = pytz.timezone("Asia/Kolkata")
    return datetime.now(tz)

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    User login endpoint
    
    Expected JSON:
    {
        "id": "S101",
        "password": "password123",
        "userType": "student"
    }
    
    Returns:
        JSON: Authentication response with token
    """
    try:
        # Get request data
        data = request.get_json()
        
        # Validate required fields
        if not data:
            return jsonify({'message': 'No data provided'}), 400
        
        user_id = data.get('id', '').strip()
        password = data.get('password', '')
        user_type = data.get('userType', '').lower()
        
        # Validate input
        if not all([user_id, password, user_type]):
            return jsonify({'message': 'ID, password, and user type are required'}), 400
        
        if user_type not in ['student', 'warden', 'security']:
            return jsonify({'message': 'Invalid user type'}), 400
        
        # Find user
        user = User.find_by_id(user_id.upper())
        
        if not user:
            return jsonify({'message': 'Invalid credentials'}), 401
        
        # Check if user type matches
        if user.user_type != user_type:
            return jsonify({'message': 'Invalid credentials'}), 401
        
        # Check if user is active
        if not user.is_active:
            return jsonify({'message': 'Account is deactivated'}), 401
        
        # Verify password
        if not user.check_password(password):
            return jsonify({'message': 'Invalid credentials'}), 401
        
        # Generate token
        token = user.generate_token()
        
        # Return success response
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict(),
            'userType': user.user_type
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Login failed: {str(e)}'}), 500

@auth_bp.route('/register', methods=['POST'])
@jwt_required()
def register():
    """
    User registration endpoint (Admin/Warden only)
    
    Only wardens can register new students.
    This endpoint is used by the "Add Student" functionality.
    """
    try:
        # Get current user from token
        current_user_id = get_jwt_identity()
        current_user = User.find_by_id(current_user_id)
        
        if not current_user or current_user.user_type != 'warden':
            return jsonify({'message': 'Only wardens can register new users'}), 403
        
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({'message': 'No data provided'}), 400
        
        # Validate required fields for student registration
        required_fields = ['id', 'name', 'password', 'email', 'phone', 'room', 'course', 'year']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400
        
        # Validate email format
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, data['email']):
            return jsonify({'message': 'Invalid email format'}), 400
        
        # Check if user ID already exists
        if User.find_by_id(data['id'].upper()):
            return jsonify({'message': 'User ID already exists'}), 409
        
        # Check if email already exists
        if User.find_by_email(data['email']):
            return jsonify({'message': 'Email already exists'}), 409
        
        # Check if room is already occupied
        existing_room = User.query.filter_by(room=data['room'], user_type='student').first()
        if existing_room:
            return jsonify({'message': 'Room is already occupied'}), 409
        
        # Create new student
        new_user = User(
            id=data['id'].upper(),
            name=data['name'],
            user_type='student',
            email=data['email'],
            phone=data['phone'],
            room=data['room'],
            course=data['course'],
            year=data['year'],
            guardian_name=data.get('guardianName'),
            guardian_phone=data.get('guardianPhone')
        )
        
        # Set password
        new_user.set_password(data['password'])
        
        # Save to database
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'message': 'Student registered successfully',
            'user': new_user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/validate', methods=['GET'])
@jwt_required()
def validate_token():
    """
    Validate JWT token and return user info
    
    Used by frontend to check if token is still valid
    and get current user information.
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.find_by_id(current_user_id)
        
        if not current_user or not current_user.is_active:
            return jsonify({'message': 'Invalid or inactive user'}), 401
        
        return jsonify({
            'message': 'Token is valid',
            'user': current_user.to_dict(),
            'userType': current_user.user_type
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Token validation failed: {str(e)}'}), 401

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    User logout endpoint
    
    Note: With JWT, we can't truly "logout" since tokens are stateless.
    This endpoint is mainly for logging purposes and client-side token removal.
    In production, you might want to implement a token blacklist.
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Log the logout event (optional)
        print(f"User {current_user_id} logged out at {ist_now()}")
        
        return jsonify({'message': 'Logged out successfully'}), 200
        
    except Exception as e:
        return jsonify({'message': f'Logout failed: {str(e)}'}), 500

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """
    Change user password
    
    Expected JSON:
    {
        "currentPassword": "old_password",
        "newPassword": "new_password"
    }
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.find_by_id(current_user_id)
        
        if not current_user:
            return jsonify({'message': 'User not found'}), 404
        
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({'message': 'No data provided'}), 400
        
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')
        
        if not all([current_password, new_password]):
            return jsonify({'message': 'Current password and new password are required'}), 400
        
        # Verify current password
        if not current_user.check_password(current_password):
            return jsonify({'message': 'Current password is incorrect'}), 400
        
        # Validate new password
        if len(new_password) < 6:
            return jsonify({'message': 'New password must be at least 6 characters long'}), 400
        
        # Set new password
        current_user.set_password(new_password)
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Password change failed: {str(e)}'}), 500

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """
    Update user profile information
    
    Allows users to update their profile details based on their role.
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.find_by_id(current_user_id)
        
        if not current_user:
            return jsonify({'message': 'User not found'}), 404
        
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({'message': 'No data provided'}), 400
        
        # Update user profile
        current_user.update_from_dict(data)
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': current_user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Profile update failed: {str(e)}'}), 500

# Error handlers for this blueprint
@auth_bp.errorhandler(400)
def bad_request(error):
    return jsonify({'message': 'Bad request'}), 400

@auth_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({'message': 'Unauthorized'}), 401

@auth_bp.errorhandler(403)
def forbidden(error):
    return jsonify({'message': 'Forbidden'}), 403

@auth_bp.errorhandler(404)
def not_found(error):
    return jsonify({'message': 'Not found'}), 404

@auth_bp.errorhandler(500)
def internal_error(error):
    return jsonify({'message': 'Internal server error'}), 500