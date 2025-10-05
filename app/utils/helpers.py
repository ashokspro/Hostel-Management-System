# app/utils/helpers.py
"""
Utility Helper Functions

Common functions used across the application for validation,
formatting, and other utility operations.
"""

import re
from datetime import datetime, date, time
from functools import wraps
from flask import jsonify
from zoneinfo import ZoneInfo


import pytz

def ist_now():
    tz = pytz.timezone("Asia/Kolkata")
    return datetime.now(tz)

def validate_email(email):
    """
    Validate email format
    
    Args:
        email (str): Email to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone(phone):
    """
    Validate phone number format (Indian format)
    
    Args:
        phone (str): Phone number to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    # Remove spaces, hyphens, and plus signs
    cleaned = re.sub(r'[\s\-\+]', '', phone)
    
    # Check if it matches Indian phone format
    pattern = r'^(\+91|91|0)?[6789]\d{9}$'
    return re.match(pattern, cleaned) is not None

def validate_time_range(start_time, end_time):
    """
    Validate that end time is after start time
    
    Args:
        start_time (time): Start time
        end_time (time): End time
        
    Returns:
        bool: True if valid, False otherwise
    """
    if not isinstance(start_time, time) or not isinstance(end_time, time):
        return False
    
    return end_time > start_time

def format_datetime_for_display(dt):
    """
    Format datetime for display in frontend
    
    Args:
        dt (datetime): Datetime to format
        
    Returns:
        str: Formatted datetime string
    """
    if not dt:
        return None
    
    if isinstance(dt, str):
        try:
            dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
        except:
            return dt
    
    return dt.strftime('%d-%m-%Y %I:%M %p:%S')

def calculate_duration(start_time, end_time=None):
    """
    Calculate duration between two datetime objects
    
    Args:
        start_time (datetime): Start time
        end_time (datetime): End time (defaults to now)
        
    Returns:
        dict: Duration information
    """
    if not start_time:
        return None
    
    if not end_time:
        end_time = ist_now()
    
    if isinstance(start_time, str):
        start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
    
    if isinstance(end_time, str):
        end_time = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
    
    duration = end_time - start_time
    
    total_seconds = int(duration.total_seconds())
    days = total_seconds // 86400
    hours = (total_seconds % 86400) // 3600
    minutes = (total_seconds % 3600) // 60
    
    return {
        'days': days,
        'hours': hours,
        'minutes': minutes,
        'total_seconds': total_seconds,
        'total_minutes': total_seconds // 60,
        'total_hours': total_seconds // 3600
    }

def sanitize_string(input_string, max_length=None):
    """
    Sanitize string input by removing harmful characters
    
    Args:
        input_string (str): String to sanitize
        max_length (int): Maximum allowed length
        
    Returns:
        str: Sanitized string
    """
    if not input_string:
        return ""
    
    # Remove HTML tags and script content
    sanitized = re.sub(r'<[^>]*>', '', str(input_string))
    
    # Remove potentially harmful characters
    sanitized = re.sub(r'[<>"\']', '', sanitized)
    
    # Trim whitespace
    sanitized = sanitized.strip()
    
    # Apply length limit
    if max_length and len(sanitized) > max_length:
        sanitized = sanitized[:max_length]
    
    return sanitized

def generate_response(message, status_code=200, data=None, errors=None):
    """
    Generate standardized API response
    
    Args:
        message (str): Response message
        status_code (int): HTTP status code
        data (dict): Response data
        errors (list): List of errors
        
    Returns:
        tuple: Flask response tuple
    """
    response = {
        'message': message,
        'timestamp': ist_now().isoformat(),
        'success': status_code < 400
    }
    
    if data is not None:
        response.update(data)
    
    if errors:
        response['errors'] = errors
    
    return jsonify(response), status_code

def requires_role(*allowed_roles):
    """
    Decorator to require specific user roles
    
    Args:
        allowed_roles: List of allowed user types
        
    Returns:
        function: Decorator function
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from flask_jwt_extended import get_jwt_identity
            from app.models.user import User
            
            current_user_id = get_jwt_identity()
            current_user = User.find_by_id(current_user_id)
            
            if not current_user or current_user.user_type not in allowed_roles:
                return generate_response(
                    "Access denied. Insufficient permissions.", 
                    403
                )
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def log_activity(user_id, action, details=None):
    """
    Log user activity (placeholder for future implementation)
    
    Args:
        user_id (str): User ID
        action (str): Action performed
        details (dict): Additional details
    """
    # In a production system, you would log this to a database or file
    timestamp = ist_now().isoformat()
    log_entry = f"[{timestamp}] User {user_id}: {action}"
    
    if details:
        log_entry += f" - {details}"
    
    print(log_entry)  # For now, just print to console

def is_business_hours(current_time=None):
    """
    Check if current time is within business hours
    
    Args:
        current_time (time): Time to check (defaults to now)
        
    Returns:
        bool: True if within business hours
    """
    if not current_time:
        current_time = datetime.now().time()
    
    # Business hours: 6 AM to 10 PM
    start_time = time(6, 0)  # 6:00 AM
    end_time = time(22, 0)   # 10:00 PM
    
    return start_time <= current_time <= end_time

def get_academic_year():
    """
    Get current academic year based on date
    
    Returns:
        str: Academic year (e.g., "2024-25")
    """
    now = datetime.now()
    
    # Academic year starts in June
    if now.month >= 6:
        start_year = now.year
        end_year = now.year + 1
    else:
        start_year = now.year - 1
        end_year = now.year
    
    return f"{start_year}-{str(end_year)[2:]}"

def paginate_query(query, page=1, per_page=10, max_per_page=100):
    """
    Paginate SQLAlchemy query results
    
    Args:
        query: SQLAlchemy query object
        page (int): Page number (1-based)
        per_page (int): Items per page
        max_per_page (int): Maximum items per page
        
    Returns:
        dict: Pagination information
    """
    # Ensure valid pagination parameters
    page = max(1, int(page))
    per_page = min(max_per_page, max(1, int(per_page)))
    
    # Get total count
    total = query.count()
    
    # Calculate pagination values
    total_pages = (total + per_page - 1) // per_page
    has_prev = page > 1
    has_next = page < total_pages
    
    # Get items for current page
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    
    return {
        'items': items,
        'page': page,
        'per_page': per_page,
        'total': total,
        'total_pages': total_pages,
        'has_prev': has_prev,
        'has_next': has_next,
        'prev_page': page - 1 if has_prev else None,
        'next_page': page + 1 if has_next else None
    }