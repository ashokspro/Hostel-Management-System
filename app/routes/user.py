# app/routes/user.py
"""
User Profile Routes

Handles user profile management, password changes, and user-specific data.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from datetime import datetime
import re



# Create blueprint for user routes
user_bp = Blueprint('user', __name__)

@user_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """
    Get current user's profile information
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.find_by_id(current_user_id)
        
        if not current_user:
            return jsonify({'message': 'User not found'}), 404
        
        return jsonify({
            'user': current_user.to_dict(),
            'userType': current_user.user_type
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get profile: {str(e)}'}), 500

@user_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """
    Update current user's profile information
    
    Expected JSON varies by user type:
    
    Student:
    {
        "name": "Updated Name",
        "email": "updated@email.com",
        "phone": "+91-1234567890",
        "course": "Updated Course",
        "year": "2nd Year",
        "guardianName": "Updated Guardian",
        "guardianPhone": "+91-0987654321"
    }
    
    Warden/Security:
    {
        "name": "Updated Name",
        "email": "updated@email.com",
        "phone": "+91-1234567890",
        "department": "Updated Department", // warden only
        "experience": "Updated Experience",
        "qualification": "Updated Qualification", // warden only
        "shift": "Updated Shift", // security only
        "emergencyContact": "Updated Emergency Contact" // security only
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
        
        # Validate email format if provided
        if 'email' in data and data['email']:
            email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_regex, data['email']):
                return jsonify({'message': 'Invalid email format'}), 400
            
            # Check if email is already used by another user
            existing_user = User.find_by_email(data['email'])
            if existing_user and existing_user.id != current_user.id:
                return jsonify({'message': 'Email already exists'}), 409
        
        # Validate year for students
        if (current_user.user_type == 'student' and 
            'year' in data and data['year']):
            if data['year'] not in ['1st Year', '2nd Year', '3rd Year', '4th Year']:
                return jsonify({'message': 'Invalid year'}), 400
        
        # Validate shift for security
        if (current_user.user_type == 'security' and 
            'shift' in data and data['shift']):
            valid_shifts = ['Day Shift (6 AM - 6 PM)', 'Night Shift (6 PM - 6 AM)']
            if data['shift'] not in valid_shifts:
                return jsonify({'message': 'Invalid shift'}), 400
        
        # Update user profile
        current_user.update_from_dict(data)
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': current_user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update profile: {str(e)}'}), 500

@user_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """
    Change current user's password
    
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
        
        if current_password == new_password:
            return jsonify({'message': 'New password must be different from current password'}), 400
        
        # Set new password
        current_user.set_password(new_password)
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Password change failed: {str(e)}'}), 500

@user_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_user_dashboard():
    """
    Get user-specific dashboard data
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.find_by_id(current_user_id)
        
        if not current_user:
            return jsonify({'message': 'User not found'}), 404
        
        dashboard_data = {
            'user': current_user.to_dict(),
            'userType': current_user.user_type
        }
        
        # Add user-type specific dashboard data
        if current_user.user_type == 'student':
            from app.models.gatepass import GatePass
            
            # Get student's gate passes
            student_passes = GatePass.get_student_passes(current_user.id)
            
            # Calculate statistics
            total_passes = len(student_passes)
            approved_passes = len([gp for gp in student_passes if gp.status == 'Approved'])
            pending_passes = len([gp for gp in student_passes if gp.status == 'Pending'])
            rejected_passes = len([gp for gp in student_passes if gp.status == 'Rejected'])
            
            # Check if currently out
            currently_out = any(gp.exit_status == 'Out' and gp.status == 'Approved' 
                              for gp in student_passes)
            
            dashboard_data.update({
                'gatePassStats': {
                    'total': total_passes,
                    'approved': approved_passes,
                    'pending': pending_passes,
                    'rejected': rejected_passes,
                    'currentlyOut': currently_out
                },
                'recentPasses': [gp.to_dict() for gp in student_passes[:5]]  # Last 5 passes
            })
            
        elif current_user.user_type == 'warden':
            from app.models.gatepass import GatePass
            
            # Get pending requests count
            pending_count = GatePass.query.filter_by(status='Pending').count()
            
            # Get today's approved passes
            from datetime import date
            today_approved = GatePass.query.filter_by(
                status='Approved',
                from_date=date.today()
            ).count()
            
            # Get currently out count
            currently_out = GatePass.query.filter_by(
                status='Approved',
                exit_status='Out'
            ).count()
            
            dashboard_data.update({
                'wardenStats': {
                    'pendingRequests': pending_count,
                    'todayApproved': today_approved,
                    'currentlyOut': currently_out
                }
            })
            
        elif current_user.user_type == 'security':
            from app.models.gatepass import GatePass
            
            # Get today's approved passes (for security to track)
            from datetime import date
            today_passes = GatePass.query.filter_by(
                status='Approved',
                from_date=date.today()
            ).count()
            
            # Get currently out count
            currently_out = GatePass.query.filter_by(
                status='Approved',
                exit_status='Out'
            ).count()
            
            dashboard_data.update({
                'securityStats': {
                    'todayPasses': today_passes,
                    'currentlyOut': currently_out
                }
            })
        
        return jsonify(dashboard_data), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get dashboard data: {str(e)}'}), 500

@user_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """
    Get user notifications
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.find_by_id(current_user_id)
        
        if not current_user:
            return jsonify({'message': 'User not found'}), 404
        
        # Initialize notifications list
        notifications = []
        
        if current_user.user_type == 'student':
            # Check for overdue returns
            from app.models.gatepass import GatePass
            from datetime import datetime, date, time
            
            student_passes = GatePass.get_student_passes(current_user.id)
            overdue_passes = []
            
            ###
            from datetime import datetime

            overdue_passes = []

            for gp in student_passes:
                if gp.exit_status == 'Out' and gp.status == 'Approved':
        # Combine return_date and return_time for accurate comparison
                    expected_return = datetime.combine(gp.return_date, gp.return_time)
                    if datetime.now() > expected_return:
                        overdue_passes.append(gp)

            """for gp in student_passes:
                if (gp.exit_status == 'Out' and gp.status == 'Approved'):
                    expected_return = datetime.combine(gp.from_date, gp.return_time)
                    if datetime.now() > expected_return:
                        overdue_passes.append(gp)
            """
            if overdue_passes:
                notifications.append({
                    'id': 'overdue_return',
                    'type': 'warning',
                    'title': 'Overdue Return',
                    'message': f'You have {len(overdue_passes)} overdue gate pass(es). Please return to hostel.',
                    'timestamp': datetime.now().isoformat()
                })
            
            # Check for rejected passes
            rejected_passes = [gp for gp in student_passes if gp.status == 'Rejected']
            if rejected_passes:
                notifications.append({
                    'id': 'rejected_passes',
                    'type': 'error',
                    'title': 'Rejected Gate Passes',
                    'message': f'You have {len(rejected_passes)} rejected gate pass(es).',
                    'timestamp': datetime.now().isoformat()
                })
            
            # Check for pending passes
            pending_passes = [gp for gp in student_passes if gp.status == 'Pending']
            if pending_passes:
                notifications.append({
                    'id': 'pending_passes',
                    'type': 'info',
                    'title': 'Pending Gate Passes',
                    'message': f'You have {len(pending_passes)} gate pass(es) awaiting approval.',
                    'timestamp': datetime.now().isoformat()
                })
        
        elif current_user.user_type == 'warden':
            # Check for pending requests
            from app.models.gatepass import GatePass
            pending_count = GatePass.query.filter_by(status='Pending').count()
            
            if pending_count > 0:
                notifications.append({
                    'id': 'pending_requests',
                    'type': 'info',
                    'title': 'Pending Requests',
                    'message': f'You have {pending_count} pending gate pass request(s) to review.',
                    'timestamp': datetime.now().isoformat()
                })
            
            # Check for overdue students
            overdue_students = []
            all_passes = GatePass.query.filter_by(status='Approved', exit_status='Out').all()
            
            for gp in all_passes:
                expected_return = datetime.combine(gp.return_date, gp.return_time)
                if datetime.now() > expected_return:
                    overdue_students.append(gp)
            
            if overdue_students:
                notifications.append({
                    'id': 'overdue_students',
                    'type': 'warning',
                    'title': 'Overdue Students',
                    'message': f'{len(overdue_students)} student(s) are overdue for return.',
                    'timestamp': datetime.now().isoformat()
                })
        
        elif current_user.user_type == 'security':
            # Check for approved passes for today
            from app.models.gatepass import GatePass
            from datetime import date
            
            today_passes = GatePass.query.filter_by(
                status='Approved',
                from_date=date.today()
            ).count()
            
            if today_passes > 0:
                notifications.append({
                    'id': 'today_passes',
                    'type': 'info',
                    'title': 'Today\'s Gate Passes',
                    'message': f'{today_passes} gate pass(es) approved for today.',
                    'timestamp': datetime.now().isoformat()
                })
        
        return jsonify({
            'notifications': notifications,
            'count': len(notifications)
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get notifications: {str(e)}'}), 500

@user_bp.route('/search', methods=['GET'])
@jwt_required()
def search_users():
    """
    Search users (for autocomplete, etc.)
    Only accessible by wardens and security
    
    Query parameters:
    - q: search query
    - type: user type (default: student)
    - limit: result limit (default: 10)
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.find_by_id(current_user_id)
        
        if not current_user or current_user.user_type not in ['warden', 'security']:
            return jsonify({'message': 'Access denied'}), 403
        
        # Get search parameters
        query = request.args.get('q', '').strip()
        user_type = request.args.get('type', 'student')  # Default to student
        limit = int(request.args.get('limit', 10))
        
        if not query:
            return jsonify({'users': []}), 200
        
        if len(query) < 2:
            return jsonify({'message': 'Search query must be at least 2 characters'}), 400
        
        # Validate user type
        if user_type not in ['student', 'warden', 'security']:
            return jsonify({'message': 'Invalid user type'}), 400
        
        # Build search query
        search_query = User.query.filter(User.user_type == user_type, User.is_active == True)
        
        # Search in name, ID, and room (for students)
        if user_type == 'student':
            search_query = search_query.filter(
                db.or_(
                    User.name.ilike(f'%{query}%'),
                    User.id.ilike(f'%{query.upper()}%'),
                    User.room.ilike(f'%{query.upper()}%')
                )
            )
        else:
            search_query = search_query.filter(
                db.or_(
                    User.name.ilike(f'%{query}%'),
                    User.id.ilike(f'%{query.upper()}%')
                )
            )
        
        # Limit results and order by name
        users = search_query.order_by(User.name).limit(limit).all()
        
        # Return minimal user info
        user_list = []
        for user in users:
            user_info = {
                'id': user.id,
                'name': user.name,
                'user_type': user.user_type
            }
            
            if user.user_type == 'student':
                user_info['room'] = user.room
                user_info['course'] = user.course
                user_info['year'] = user.year
            
            user_list.append(user_info)
        
        return jsonify({
            'users': user_list,
            'count': len(user_list),
            'query': query,
            'type': user_type
        }), 200
        
    except ValueError:
        return jsonify({'message': 'Invalid limit parameter'}), 400
    except Exception as e:
        return jsonify({'message': f'Search failed: {str(e)}'}), 500

@user_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_user_stats():
    """
    Get user-specific statistics
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.find_by_id(current_user_id)
        
        if not current_user:
            return jsonify({'message': 'User not found'}), 404
        
        stats = {}
        
        if current_user.user_type == 'student':
            from app.models.gatepass import GatePass
            from datetime import datetime, timedelta
            
            # Get all student's gate passes
            all_passes = GatePass.get_student_passes(current_user.id)
            
            # Calculate monthly statistics
            current_month = datetime.now().month
            current_year = datetime.now().year
            
            monthly_passes = [gp for gp in all_passes 
                            if gp.created_at.month == current_month and 
                               gp.created_at.year == current_year]
            
            # Calculate approval rate
            approved_count = len([gp for gp in all_passes if gp.status == 'Approved'])
            total_count = len(all_passes)
            approval_rate = (approved_count / total_count * 100) if total_count > 0 else 0
            
            stats = {
                'totalPasses': total_count,
                'approvedPasses': approved_count,
                'pendingPasses': len([gp for gp in all_passes if gp.status == 'Pending']),
                'rejectedPasses': len([gp for gp in all_passes if gp.status == 'Rejected']),
                'monthlyPasses': len(monthly_passes),
                'approvalRate': round(approval_rate, 2),
                'currentlyOut': any(gp.exit_status == 'Out' and gp.status == 'Approved' 
                                  for gp in all_passes)
            }
            
        elif current_user.user_type == 'warden':
            from app.models.gatepass import GatePass
            from datetime import datetime, date
            
            # Get today's statistics
            today = date.today()
            today_passes = GatePass.query.filter_by(from_date=today).all()
            
            # Get pending requests
            pending_requests = GatePass.get_pending_requests()
            
            # Get monthly statistics
            current_month = datetime.now().month
            current_year = datetime.now().year
            
            monthly_passes = GatePass.query.filter(
                db.extract('month', GatePass.created_at) == current_month,
                db.extract('year', GatePass.created_at) == current_year
            ).all()
            
            stats = {
                'pendingRequests': len(pending_requests),
                'todayPasses': len(today_passes),
                'monthlyPasses': len(monthly_passes),
                'totalStudents': User.query.filter_by(user_type='student', is_active=True).count(),
                'currentlyOut': GatePass.query.filter_by(status='Approved', exit_status='Out').count()
            }
            
        elif current_user.user_type == 'security':
            from app.models.gatepass import GatePass
            from datetime import date
            
            # Get today's approved passes
            today = date.today()
            today_passes = GatePass.query.filter_by(
                status='Approved',
                from_date=today
            ).all()
            
            # Get currently out students
            currently_out = GatePass.get_currently_out()
            ###
            stats = {
    'todayPasses': len(today_passes),
    'currentlyOut': len(currently_out),
    'todayExits': len([gp for gp in today_passes if gp.exit_status == 'Out']),
    'todayReturns': len([
        gp for gp in today_passes 
        if gp.actual_return_time and gp.actual_return_time.date() == today
    ])
}

            """stats = {
                'todayPasses': len(today_passes),
                'currentlyOut': len(currently_out),
                'todayExits': len([gp for gp in today_passes if gp.exit_status == 'Out']),
                'todayReturns': len([gp for gp in today_passes if gp.actual_return_time and 
                                   gp.actual_return_time.date() == today])
            }"""
        
        return jsonify({
            'stats': stats,
            'userType': current_user.user_type
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get statistics: {str(e)}'}), 500

# Error handlers for this blueprint
@user_bp.errorhandler(400)
def bad_request(error):
    return jsonify({'message': 'Bad request'}), 400

@user_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({'message': 'Unauthorized'}), 401

@user_bp.errorhandler(403)
def forbidden(error):
    return jsonify({'message': 'Forbidden'}), 403

@user_bp.errorhandler(404)
def not_found(error):
    return jsonify({'message': 'User not found'}), 404

@user_bp.errorhandler(500)
def internal_error(error):
    return jsonify({'message': 'Internal server error'}), 500