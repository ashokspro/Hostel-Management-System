# run.py
"""
Flask Application Entry Point

This file is used to run the Flask development server.
In production, you would use a WSGI server like Gunicorn.
"""

from app import create_app
from app import db
import os

from flask import render_template
# Create Flask application instance
app = create_app('development')

@app.route('/home', methods=['GET'])
def login_page():
    return render_template('login.html')


if __name__ == '__main__':
    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()
        print("Database tables created successfully!")
    
    # Run the development server
    print("Starting Flask development server...")
    print("API will be available at: http://localhost:5000")
    print("\nAvailable endpoints:")
    print("- POST /api/auth/login")
    print("- GET  /api/auth/validate")
    print("- POST /api/gatepass/create")
    print("- GET  /api/gatepass/student")
    print("- GET  /api/gatepass/pending")
    print("- And more...")
    
    print("\nDefault users:")
    print("Student: S101 / password123")
    print("Student: S102 / password123") 
    print("Warden:  W001 / warden123")
    print("Security: SEC001 / security123")
    print()
    
    # Run the Flask development server
    app.run(
        debug=True,
        host='0.0.0.0',  # Allow external connections
        port=5000,       # Port 5000 (matches your frontend)
        threaded=True    # Handle multiple requests
    )