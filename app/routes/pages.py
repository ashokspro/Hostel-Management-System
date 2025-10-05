from flask import Blueprint, render_template

pages_bp = Blueprint('pages', __name__)

@pages_bp.route('/student/page')
def student_dashboard():
    # Render template directly
    return render_template('student_dashboard.html')

@pages_bp.route('/warden/page')
def warden_dashboard():
    return render_template('warden_dashboard.html')

@pages_bp.route('/security/page')
def security_dashboard():
    return render_template('security_dashboard.html')
