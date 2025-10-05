# app/routes/admin.py
"""
Admin/Warden Routes

Handles student management, user CRUD operations, and administrative functions.
Only accessible by wardens.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.gatepass import GatePass
import re

# Create blueprint for admin routes
admin_bp = Blueprint('admin', __name__)



"""#new
from flask import render_template

@admin_bp.route('/create-student-page', methods=['GET'])
@jwt_required()
def create_student_dashboard():
    current_user_id = get_jwt_identity()
    current_user = User.find_by_id(current_user_id)
    
    if not current_user or current_user.user_type != 'warden':
        return "Unauthorized", 403
    
    return render_template('create_student.html')
##
"""

@admin_bp.route('/students', methods=['GET'])
@jwt_required()
def get_all_students():
    """
    Get all students with optional filtering
    
    Query parameters:
    - year: Filter by academic year
    - course: Filter by course
    - search: Search in name, ID, or room
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.find_by_id(current_user_id)
        
        if not current_user or current_user.user_type != 'warden':
            return jsonify({'message': 'Only wardens can access student data'}), 403
        
        # Get query parameters
        year = request.args.get('year')
        course = request.args.get('course')
        search = request.args.get('search')
        
        # Build filters
        filters = {}
        if year:
            filters['year'] = year
        if course:
            filters['course'] = course
        if search:
            filters['search'] = search
        
        # Get students with filters
        students = User.get_students(filters)
        
        return jsonify({
            'students': [student.to_dict() for student in students],
            'total': len(students)
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get students: {str(e)}'}), 500

@admin_bp.route('/students', methods=['POST'])
@jwt_required()
def add_student():
    """
    Add new student (Warden only)
    
    Expected JSON:
    {
        "id": "S103",
        "name": "Alice Johnson",
        "password": "password123",
        "email": "alice@hostel.edu",
        "phone": "+91-9876543217",
        "room": "R403",
        "course": "Mathematics",
        "year": "1st Year",
        "guardianName": "David Johnson",
        "guardianPhone": "+91-9876543218"
    }
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.find_by_id(current_user_id)
        
        if not current_user or current_user.user_type != 'warden':
            return jsonify({'message': 'Only wardens can add students'}), 403
        
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({'message': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['id', 'name', 'password', 'email', 'phone', 'room', 'course', 'year']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400
        
        # Validate data formats
        if len(data['password']) < 6:
            return jsonify({'message': 'Password must be at least 6 characters long'}), 400
        
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, data['email']):
            return jsonify({'message': 'Invalid email format'}), 400
        
        if data['year'] not in ['1st Year', '2nd Year', '3rd Year', '4th Year']:
            return jsonify({'message': 'Invalid year. Must be 1st Year, 2nd Year, 3rd Year, or 4th Year'}), 400
        
        # Check for duplicates
        student_id = data['id'].upper()
        
        if User.find_by_id(student_id):
            return jsonify({'message': 'Student ID already exists'}), 409
        
        if User.find_by_email(data['email']):
            return jsonify({'message': 'Email already exists'}), 409
        
        # Check if room is available
        ###
        """existing_room = User.query.filter_by(room=data['room'], user_type='student').first()
        if existing_room:
            return jsonify({'message': 'Room is already occupied'}), 409"""
        # Count how many students are already in this room
        room_occupancy = User.query.filter_by(room=data['room'], user_type='student').count()

# Allow max 4 students
        if room_occupancy >= 4:
            return jsonify({'message': 'Room is already fully occupied'}), 409

        
        # Create new student
        new_student = User(
            id=student_id,
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
        
        new_student.set_password(data['password'])
        
        # Save to database
        db.session.add(new_student)
        db.session.commit()
        
        return jsonify({
            'message': 'Student added successfully',
            'student': new_student.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to add student: {str(e)}'}), 500

@admin_bp.route('/students/<student_id>', methods=['PUT'])
@jwt_required()
def update_student(student_id):
    """
    Update student information (Warden only)
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.find_by_id(current_user_id)
        
        if not current_user or current_user.user_type != 'warden':
            return jsonify({'message': 'Only wardens can update students'}), 403
        
        # Find student
        student = User.find_by_id(student_id.upper())
        if not student or student.user_type != 'student':
            return jsonify({'message': 'Student not found'}), 404
        
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided'}), 400
        
        # Validate email if provided
        if 'email' in data and data['email']:
            email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_regex, data['email']):
                return jsonify({'message': 'Invalid email format'}), 400
            
            # Check if email is already used by another student
            existing_email = User.find_by_email(data['email'])
            if existing_email and existing_email.id != student.id:
                return jsonify({'message': 'Email already exists'}), 409
        
        # Validate year if provided
        if 'year' in data and data['year']:
            if data['year'] not in ['1st Year', '2nd Year', '3rd Year', '4th Year']:
                return jsonify({'message': 'Invalid year'}), 400
        
        # Check room availability if room is being changed
        if 'room' in data and data['room'] and data['room'] != student.room:
            existing_room = User.query.filter_by(room=data['room'], user_type='student').first()
            if existing_room:
                return jsonify({'message': 'Room is already occupied'}), 409
        
        # Update student
        student.update_from_dict(data)
        db.session.commit()
        
        return jsonify({
            'message': 'Student updated successfully',
            'student': student.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update student: {str(e)}'}), 500

@admin_bp.route('/students/<student_id>', methods=['DELETE'])
@jwt_required()
def delete_student(student_id):
    """
    Delete student (Warden only)
    Note: Cannot delete if student has gate pass history
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.find_by_id(current_user_id)
        
        if not current_user or current_user.user_type != 'warden':
            return jsonify({'message': 'Only wardens can delete students'}), 403
        
        # Find student
        student = User.find_by_id(student_id.upper())
        if not student or student.user_type != 'student':
            return jsonify({'message': 'Student not found'}), 404
        
        # Check if student has gate pass history
        has_gate_passes = GatePass.query.filter_by(student_id=student.id).first()
        if has_gate_passes:
            return jsonify({
                'message': 'Cannot delete student with existing gate pass records. Deactivate instead.'
            }), 400
        
        # Delete student
        db.session.delete(student)
        db.session.commit()
        
        return jsonify({'message': 'Student deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to delete student: {str(e)}'}), 500

@admin_bp.route('/students/<student_id>/deactivate', methods=['POST'])
@jwt_required()
def deactivate_student(student_id):
    """
    Deactivate student account (Warden only)
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.find_by_id(current_user_id)
        
        if not current_user or current_user.user_type != 'warden':
            return jsonify({'message': 'Only wardens can deactivate students'}), 403
        
        # Find student
        student = User.find_by_id(student_id.upper())
        if not student or student.user_type != 'student':
            return jsonify({'message': 'Student not found'}), 404
        
        # Deactivate student
        student.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Student account deactivated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to deactivate student: {str(e)}'}), 500

@admin_bp.route('/students/<student_id>/activate', methods=['POST'])
@jwt_required()
def activate_student(student_id):
    """
    Activate student account (Warden only)
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.find_by_id(current_user_id)
        
        if not current_user or current_user.user_type != 'warden':
            return jsonify({'message': 'Only wardens can activate students'}), 403
        
        # Find student
        student = User.find_by_id(student_id.upper())
        if not student or student.user_type != 'student':
            return jsonify({'message': 'Student not found'}), 404
        
        # Activate student
        student.is_active = True
        db.session.commit()
        
        return jsonify({'message': 'Student account activated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to activate student: {str(e)}'}), 500

@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """
    Get dashboard statistics for warden
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.find_by_id(current_user_id)
        
        if not current_user or current_user.user_type != 'warden':
            return jsonify({'message': 'Only wardens can access dashboard'}), 403
        
        # Get statistics
        total_students = User.query.filter_by(user_type='student', is_active=True).count()
        
        # Student distribution by year
        first_year = User.query.filter_by(user_type='student', year='1st Year', is_active=True).count()
        second_year = User.query.filter_by(user_type='student', year='2nd Year', is_active=True).count()
        third_year = User.query.filter_by(user_type='student', year='3rd Year', is_active=True).count()
        fourth_year = User.query.filter_by(user_type='student', year='4th Year', is_active=True).count()
        
        # Gate pass statistics
        pending_passes = GatePass.query.filter_by(status='Pending').count()
        approved_passes = GatePass.query.filter_by(status='Approved').count()
        currently_out = GatePass.query.filter_by(status='Approved', exit_status='Out').count()
        
        # Recent gate pass requests (last 10)
        recent_requests = GatePass.query.filter_by(status='Pending')\
                                        .order_by(GatePass.created_at.desc())\
                                        .limit(10).all()
        
        return jsonify({
            'studentStats': {
                'total': total_students,
                'firstYear': first_year,
                'secondYear': second_year,
                'thirdYear': third_year,
                'fourthYear': fourth_year
            },
            'gatePassStats': {
                'pending': pending_passes,
                'approved': approved_passes,
                'currentlyOut': currently_out
            },
            'recentRequests': [gp.to_dict() for gp in recent_requests]
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get dashboard stats: {str(e)}'}), 500

@admin_bp.route('/rooms/available', methods=['GET'])
@jwt_required()
def get_available_rooms():
    """
    Get list of available rooms
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.find_by_id(current_user_id)
        
        if not current_user or current_user.user_type != 'warden':
            return jsonify({'message': 'Only wardens can access room information'}), 403
        
        # Get occupied rooms
        occupied_rooms = db.session.query(User.room)\
                                  .filter(User.user_type == 'student', 
                                         User.is_active == True,
                                         User.room.isnot(None))\
                                  .all()
        
        occupied_room_numbers = [room[0] for room in occupied_rooms]
        
        # Generate list of all possible rooms (example: R401-R450)
        all_rooms = [f'R{i}' for i in range(401, 451)]  # Rooms R401 to R450
        
        # Find available rooms
        available_rooms = [room for room in all_rooms if room not in occupied_room_numbers]
        
        return jsonify({
            'availableRooms': available_rooms,
            'occupiedRooms': occupied_room_numbers,
            'totalRooms': len(all_rooms),
            'availableCount': len(available_rooms)
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get room information: {str(e)}'}), 500