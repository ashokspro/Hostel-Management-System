# app/__init__.py
"""
Flask Application Factory Pattern

This file creates and configures the Flask application.
Factory pattern allows creating multiple app instances for testing/production.
"""

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from datetime import timedelta

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
bcrypt = Bcrypt()

def create_app(config_name='development'):
    """
    Application Factory Function
    
    Args:
        config_name (str): Configuration environment name
    
    Returns:
        Flask: Configured Flask application instance
    """
    
    # Create Flask app instance
    app = Flask(__name__)
    
    # Load configuration
    if config_name == 'development':
        app.config['SECRET_KEY'] = 'dev-secret-key-change-in-production'
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///hostel.db'
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        app.config['JWT_SECRET_KEY'] = 'jwt-secret-string-change-in-production'
        app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)
        app.config['DEBUG'] = True
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    
    # Configure CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Import and register blueprints
    from app.routes.auth import auth_bp
    from app.routes.gatepass import gatepass_bp
    from app.routes.user import user_bp
    from app.routes.admin import admin_bp
    from app.routes.pages import pages_bp
    from app.routes.gatepass_pdf import gatepass_pdf_bp
    
    app.register_blueprint(gatepass_pdf_bp, url_prefix='/api/gatepass')

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(gatepass_bp, url_prefix='/api/gatepass')
    app.register_blueprint(user_bp, url_prefix='/api/user')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    #new 
    app.register_blueprint(pages_bp)

    # JWT Error Handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {'message': 'Token has expired'}, 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {'message': 'Invalid token'}, 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return {'message': 'Authorization token is required'}, 401
    
    # Create database tables
    with app.app_context():
        db.create_all()
        
        # Initialize default users if not exists
        from app.models.user import User
        init_default_users()
    
    return app

def init_default_users():
    """
    Initialize default users for testing
    This creates sample users for each role if they don't exist
    """
    from app.models.user import User
    
    # Check if users already exist
    if User.query.first():
        return
    
    # Default users data
    default_users = [
        # Students
        {
            'id': 'S101',
            'name': 'John Doe',
            'password': 'password123',
            'user_type': 'student',
            'email': 'john@hostel.edu',
            'phone': '+91-9876543210',
            'room': 'R401',
            'course': 'Computer Science',
            'year': '2nd Year',
            'guardian_name': 'Robert Doe',
            'guardian_phone': '+91-9876543211'
        },
        {
            'id': 'S102',
            'name': 'Jane Smith',
            'password': 'password123',
            'user_type': 'student',
            'email': 'jane@hostel.edu',
            'phone': '+91-9876543212',
            'room': 'R402',
            'course': 'Electronics',
            'year': '3rd Year',
            'guardian_name': 'Michael Smith',
            'guardian_phone': '+91-9876543213'
        },
        # Warden
        {
            'id': 'W001',
            'name': 'Dr. Sarah Wilson',
            'password': 'warden123',
            'user_type': 'warden',
            'email': 'sarah@hostel.edu',
            'phone': '+91-9876543214',
            'role': 'Head Warden',
            'department': 'Student Affairs',
            'experience': '10 years',
            'qualification': 'PhD in Education'
        },
        # Security
        {
            'id': 'SEC001',
            'name': 'Mike Johnson',
            'password': 'security123',
            'user_type': 'security',
            'email': 'mike@hostel.edu',
            'phone': '+91-9876543215',
            'role': 'Security Guard',
            'shift': 'Day Shift (6 AM - 6 PM)',
            'experience': '5 years',
            'emergency_contact': '+91-9876543216'
        }
    ]
    
    # Create users
    for user_data in default_users:
        user = User(
            id=user_data['id'],
            name=user_data['name'],
            user_type=user_data['user_type'],
            email=user_data.get('email'),
            phone=user_data.get('phone')
        )
        user.set_password(user_data['password'])
        
        # Set user-type specific fields
        if user_data['user_type'] == 'student':
            user.room = user_data.get('room')
            user.course = user_data.get('course')
            user.year = user_data.get('year')
            user.guardian_name = user_data.get('guardian_name')
            user.guardian_phone = user_data.get('guardian_phone')
        elif user_data['user_type'] in ['warden', 'security']:
            user.role = user_data.get('role')
            if user_data['user_type'] == 'warden':
                user.department = user_data.get('department')
                user.qualification = user_data.get('qualification')
            elif user_data['user_type'] == 'security':
                user.shift = user_data.get('shift')
                user.emergency_contact = user_data.get('emergency_contact')
            user.experience = user_data.get('experience')
        
        db.session.add(user)
    
    try:
        db.session.commit()
        print("Default users created successfully!")
    except Exception as e:
        db.session.rollback()
        print(f"Error creating default users: {e}")