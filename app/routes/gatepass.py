# app/routes/gatepass.py
"""
GatePass Routes

Handles gate pass creation, approval, rejection, and tracking.
Different endpoints for students, wardens, and security personnel.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.gatepass import GatePass
from datetime import datetime, date, time
import uuid
from zoneinfo import ZoneInfo
# Create blueprint for gate pass routes
gatepass_bp = Blueprint('gatepass', __name__)

import pytz

def ist_now():
    tz = pytz.timezone("Asia/Kolkata")
    return datetime.now(tz)

@gatepass_bp.route('/create', methods=['POST'])
@jwt_required()
def create_gatepass():
    """
    Create new gate pass request (Student only)
    
    Expected JSON:
    {
        "reason": "Medical appointment",
        "fromDate": "2025-09-20",
        "outTime": "09:00",
        "returnTime": "18:00"
    }
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.find_by_id(current_user_id)
        
        # Only students can create gate passes
        if not current_user or current_user.user_type != 'student':
            return jsonify({'message': 'Only students can create gate passes'}), 403
        
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({'message': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['reason', 'fromDate', 'outTime', 'returnTime','returnDate','goingPlace']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400
        # Parse and validate dates/times
        try:
            from_date = datetime.strptime(data['fromDate'], '%Y-%m-%d').date()
            out_time = datetime.strptime(data['outTime'], '%H:%M').time()
            ###
            return_date = datetime.strptime(data['returnDate'], '%Y-%m-%d').date() 
            return_time = datetime.strptime(data['returnTime'], '%H:%M').time()
        except ValueError:
            return jsonify({'message': 'Invalid date or time format'}), 400
        
        # Validate date is not in the past
        if from_date < date.today():
            return jsonify({'message': 'Gate pass date cannot be in the past'}), 400
        
        # Validate time logic
        ###
        start_dt = datetime.combine(from_date, out_time)
        end_dt = datetime.combine(return_date, return_time)

# Validation
        if end_dt <= start_dt:
            return jsonify({'message': 'Return date/time must be after out date/time'}), 400
        """if out_time >= return_time:
            return jsonify({'message': 'Return time must be after out time'}), 400"""
        
        # Check if student has any pending gate passes
        pending_passes = GatePass.query.filter_by(
            student_id=current_user.id,
            status='Pending'
        ).count()
        
        if pending_passes > 0:
            return jsonify({'message': 'You already have a pending gate pass request'}), 400
        
        # Check if student is currently out
        currently_out = GatePass.query.filter_by(
            student_id=current_user.id,
            status='Approved',
            exit_status='Out'
        ).first()
        
        if currently_out:
            return jsonify({'message': 'You are currently out. Please return before creating a new gate pass'}), 400
        ###
        # Create new gate pass
        gate_pass = GatePass(
            student_id=current_user.id,
            reason=data['reason'].strip(),
            going_place=data['goingPlace'].strip(),
            from_date=from_date,
            out_time=out_time,
            return_date=return_date,
            return_time=return_time
        )
        
        db.session.add(gate_pass)
        db.session.commit()
        
        return jsonify({
            'message': 'Gate pass request created successfully',
            'gatePass': gate_pass.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create gate pass: {str(e)}'}), 500

@gatepass_bp.route('/student', methods=['GET'])
@jwt_required()
def get_student_gatepasses():
    """
    Get all gate passes for the current student
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.find_by_id(current_user_id)
        
        if not current_user or current_user.user_type != 'student':
            return jsonify({'message': 'Only students can access this endpoint'}), 403
        
        # Get student's gate passes
        gate_passes = GatePass.get_student_passes(current_user.id)
        
        return jsonify({
            'gatePasses': [gp.to_dict() for gp in gate_passes]
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get gate passes: {str(e)}'}), 500

@gatepass_bp.route('/pending', methods=['GET'])
@jwt_required()
def get_pending_requests():
    """
    Get all pending gate pass requests (Warden only)
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.find_by_id(current_user_id)
        
        if not current_user or current_user.user_type != 'warden':
            return jsonify({'message': 'Only wardens can access pending requests'}), 403
        
        # Get pending gate passes
        pending_passes = GatePass.get_pending_requests()
        
        return jsonify({
            'pendingRequests': [gp.to_dict() for gp in pending_passes]
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get pending requests: {str(e)}'}), 500

@gatepass_bp.route('/approve/<pass_id>', methods=['POST'])
@jwt_required()
def approve_gatepass(pass_id):
    """
    Approve gate pass request (Warden only)
    
    Expected JSON:
    {
        "remarks": "Approved for medical appointment"  // Optional
    }
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.find_by_id(current_user_id)
        
        if not current_user or current_user.user_type != 'warden':
            return jsonify({'message': 'Only wardens can approve gate passes'}), 403
        
        # Find gate pass
        gate_pass = GatePass.find_by_id(pass_id)
        if not gate_pass:
            return jsonify({'message': 'Gate pass not found'}), 404
        
        if gate_pass.status != 'Pending':
            return jsonify({'message': 'Gate pass is not pending'}), 400
        
        # Get optional remarks
        data = request.get_json() or {}
        remarks = data.get('remarks')
        
        # Approve the gate pass
        gate_pass.approve(current_user.id, remarks)
        db.session.commit()
        
        return jsonify({
            'message': 'Gate pass approved successfully',
            'gatePass': gate_pass.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to approve gate pass: {str(e)}'}), 500

@gatepass_bp.route('/reject/<pass_id>', methods=['POST'])
@jwt_required()
def reject_gatepass(pass_id):
    """
    Reject gate pass request (Warden only)
    
    Expected JSON:
    {
        "remarks": "Reason for rejection"  // Optional but recommended
    }
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.find_by_id(current_user_id)
        
        if not current_user or current_user.user_type != 'warden':
            return jsonify({'message': 'Only wardens can reject gate passes'}), 403
        
        # Find gate pass
        gate_pass = GatePass.find_by_id(pass_id)
        if not gate_pass:
            return jsonify({'message': 'Gate pass not found'}), 404
        
        if gate_pass.status != 'Pending':
            return jsonify({'message': 'Gate pass is not pending'}), 400
        
        # Get optional remarks
        data = request.get_json() or {}
        remarks = data.get('remarks')
        
        # Reject the gate pass
        gate_pass.reject(current_user.id, remarks)
        db.session.commit()
        
        return jsonify({
            'message': 'Gate pass rejected successfully',
            'gatePass': gate_pass.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to reject gate pass: {str(e)}'}), 500

@gatepass_bp.route('/approved', methods=['GET'])
@jwt_required()
def get_approved_gatepasses():
    """
    Get all approved gate passes (Security and Warden access)
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.find_by_id(current_user_id)
        if not current_user or current_user.user_type not in ['security', 'warden']:
            return jsonify({'message': 'Access denied'}), 403
        
        # Get approved gate passes
        approved_passes = GatePass.get_approved_passes()
        
        return jsonify({
            'approvedPasses': [gp.to_dict() for gp in approved_passes]
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get approved gate passes: {str(e)}'}), 500

@gatepass_bp.route('/mark-exit/<pass_id>', methods=['POST'])
@jwt_required()
def mark_exit(pass_id):
    """
    Mark student as exited (Security only)
    
    Expected JSON:
    {
        "remarks": "Student left at main gate"  // Optional
    }
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.find_by_id(current_user_id)
        
        if not current_user or current_user.user_type != 'security':
            return jsonify({'message': 'Only security personnel can mark exits'}), 403
        
        # Find gate pass
        gate_pass = GatePass.find_by_id(pass_id)
        if not gate_pass:
            return jsonify({'message': 'Gate pass not found'}), 404
        
        if gate_pass.status != 'Approved':
            return jsonify({'message': 'Gate pass is not approved'}), 400
        
        if gate_pass.exit_status == 'Out':
            return jsonify({'message': 'Student is already marked as out'}), 400
        
        # Get optional remarks
        data = request.get_json() or {}
        remarks = data.get('remarks')
        
        # Mark exit
        gate_pass.mark_exit(remarks)
        db.session.commit()
        
        return jsonify({
            'message': 'Student marked as exited successfully',
            'gatePass': gate_pass.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to mark exit: {str(e)}'}), 500

@gatepass_bp.route('/mark-return/<pass_id>', methods=['POST'])
@jwt_required()
def mark_return(pass_id):
    """
    Mark student as returned (Security only)
    
    Expected JSON:
    {
        "remarks": "Student returned at main gate"  // Optional
    }
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.find_by_id(current_user_id)
        
        if not current_user or current_user.user_type != 'security':
            return jsonify({'message': 'Only security personnel can mark returns'}), 403
        
        # Find gate pass
        gate_pass = GatePass.find_by_id(pass_id)
        if not gate_pass:
            return jsonify({'message': 'Gate pass not found'}), 404
        
        if gate_pass.exit_status != 'Out':
            return jsonify({'message': 'Student is not marked as out'}), 400
        
        # Get optional remarks
        data = request.get_json() or {}
        remarks = data.get('remarks')
        
        # Mark return
        gate_pass.mark_return(remarks)
        db.session.commit()
        
        return jsonify({
            'message': 'Student marked as returned successfully',
            'gatePass': gate_pass.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to mark return: {str(e)}'}), 500

@gatepass_bp.route('/currently-out', methods=['GET'])
@jwt_required()
def get_currently_out():
    """
    Get all students currently out (Security access)
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.find_by_id(current_user_id)
        
        if not current_user or current_user.user_type != 'security':
            return jsonify({'message': 'Only security personnel can access this'}), 403
        
        # Get currently out students
        currently_out = GatePass.get_currently_out()
        
        return jsonify({
            'currentlyOut': [gp.to_dict() for gp in currently_out]
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get currently out students: {str(e)}'}), 500

@gatepass_bp.route('/all', methods=['GET'])
@jwt_required()
def get_all_gatepasses():
    """
    Get all gate passes (Warden access for reports)
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.find_by_id(current_user_id)
        
        if not current_user or current_user.user_type != 'warden':
            return jsonify({'message': 'Only wardens can access all gate passes'}), 403
        
        # Get query parameters for filtering
        status = request.args.get('status')  # pending, approved, rejected
        student_id = request.args.get('student_id')
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        
        # Build query
        query = GatePass.query
        
        if status:
            query = query.filter_by(status=status.capitalize())
        
        if student_id:
            query = query.filter_by(student_id=student_id.upper())
        
        if from_date:
            try:
                from_date_obj = datetime.strptime(from_date, '%Y-%m-%d').date()
                query = query.filter(GatePass.from_date >= from_date_obj)
            except ValueError:
                return jsonify({'message': 'Invalid from_date format. Use YYYY-MM-DD'}), 400
        
        if to_date:
            try:
                to_date_obj = datetime.strptime(to_date, '%Y-%m-%d').date()
                query = query.filter(GatePass.from_date <= to_date_obj)
            except ValueError:
                return jsonify({'message': 'Invalid to_date format. Use YYYY-MM-DD'}), 400
        
        # Order by creation date (newest first)
        gate_passes = query.order_by(GatePass.created_at.desc()).all()
        
        return jsonify({
            'gatePasses': [gp.to_dict() for gp in gate_passes],
            'total': len(gate_passes)
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get gate passes: {str(e)}'}), 500

@gatepass_bp.route('/<pass_id>', methods=['GET'])
@jwt_required()
def get_gatepass_details(pass_id):
    """
    Get detailed information about a specific gate pass
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.find_by_id(current_user_id)
        
        if not current_user:
            return jsonify({'message': 'User not found'}), 404
        
        # Find gate pass
        gate_pass = GatePass.find_by_id(pass_id)
        if not gate_pass:
            return jsonify({'message': 'Gate pass not found'}), 404
        
        # Check access permissions
        if (current_user.user_type == 'student' and 
            gate_pass.student_id != current_user.id):
            return jsonify({'message': 'Access denied'}), 403
        
        return jsonify({
            'gatePass': gate_pass.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get gate pass details: {str(e)}'}), 500