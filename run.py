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

@app.route('/', methods=['GET'])
@app.route('/home', methods=['GET'])
def login_page():
    return render_template('login.html')


if __name__ == '__main__':
    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()
    
    app.run(
        debug=True,
        host='0.0.0.0',  
        port=5000,       
        threaded=True    
    )