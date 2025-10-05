# app/routes/gatepass_pdf.py
"""
Gate Pass PDF Generation using FPDF - Modern Single Page Design
"""

from flask import Blueprint, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from io import BytesIO
from fpdf import FPDF
import qrcode
from datetime import datetime
import os
import tempfile
from app import db
from app.models.user import User
from app.models.gatepass import GatePass

# Create blueprint
gatepass_pdf_bp = Blueprint('gatepass_pdf', __name__)

class GatePassPDF(FPDF):
    """Custom PDF class for modern gate pass"""
    
    def header(self):
        """Page header with modern design"""
        # Header background gradient effect
        self.set_fill_color(30, 64, 175)  # Dark blue
        self.rect(0, 0, 210, 35, 'F')
        
        # Title
        self.set_text_color(255, 255, 255)
        self.set_font('Arial', 'B', 22)
        self.cell(0, 12, 'HOSTEL GATE PASS', 0, 1, 'C')
        
        self.set_font('Arial', '', 11)
        self.cell(0, 8, 'Smart Hostel Management System', 0, 1, 'C')
        
        # Reset text color
        self.set_text_color(0, 0, 0)
        self.ln(8)
    
    def add_info_box(self, title, x, y, width, height):
        """Add styled info box"""
        self.set_xy(x, y)
        
        # Box background
        self.set_fill_color(249, 250, 251)  # Light gray
        self.rect(x, y, width, height, 'F')
        
        # Box border
        self.set_draw_color(229, 231, 235)
        self.rect(x, y, width, height)
        
        # Title
        self.set_xy(x + 3, y + 2)
        self.set_font('Arial', 'B', 10)
        self.set_text_color(107, 114, 128)
        self.cell(0, 5, title, 0, 1)
        
        self.set_text_color(0, 0, 0)

def generate_qr_code_image(data):
    """Generate QR code and save temporarily"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=2,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save to temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
    img.save(temp_file.name)
    temp_file.close()
    
    return temp_file.name

def format_date(date_obj):
    """Format date to readable format like Oct 05, 2025"""
    if not date_obj:
        return 'N/A'
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return f"{months[date_obj.month-1]} {date_obj.day:02d}, {date_obj.year}"

def format_time(time_obj):
    """Format time to 12-hour format"""
    if not time_obj:
        return 'N/A'
    hour = time_obj.hour
    minute = time_obj.minute
    ampm = 'AM' if hour < 12 else 'PM'
    hour = hour % 12 or 12
    return f"{hour}:{minute:02d} {ampm}"

def create_gate_pass_pdf(gate_pass, student):
    """
    Create modern single-page gate pass PDF
    
    Args:
        gate_pass: GatePass object
        student: User object (student)
    
    Returns:
        BytesIO: PDF buffer
    """
    pdf = GatePassPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=False)
    
    # Current Y position after header
    current_y = 50
    
    # Left column width and right column start
    left_width = 125
    right_x = 140
    
    # ========== STUDENT INFORMATION SECTION ==========
    pdf.add_info_box('STUDENT INFORMATION', 15, current_y, left_width, 55)
    
    pdf.set_xy(18, current_y + 8)
    pdf.set_font('Arial', 'B', 11)
    pdf.cell(35, 6, 'Name:', 0, 0)
    pdf.set_font('Arial', '', 11)
    pdf.cell(0, 6, student.name, 0, 1)
    
    pdf.set_x(18)
    pdf.set_font('Arial', 'B', 11)
    pdf.cell(35, 6, 'Student ID:', 0, 0)
    pdf.set_font('Arial', '', 11)
    pdf.cell(0, 6, student.id, 0, 1)
    
    pdf.set_x(18)
    pdf.set_font('Arial', 'B', 11)
    pdf.cell(35, 6, 'Room:', 0, 0)
    pdf.set_font('Arial', '', 11)
    pdf.cell(0, 6, student.room, 0, 1)
    
    pdf.set_x(18)
    pdf.set_font('Arial', 'B', 11)
    pdf.cell(35, 6, 'Course:', 0, 0)
    pdf.set_font('Arial', '', 11)
    pdf.cell(0, 6, f"{student.course} - {student.year}", 0, 1)
    
    pdf.set_x(18)
    pdf.set_font('Arial', 'B', 11)
    pdf.cell(35, 6, 'Phone:', 0, 0)
    pdf.set_font('Arial', '', 11)
    pdf.cell(0, 6, student.phone, 0, 1)
    
    # ========== QR CODE (Top Right) ==========
    try:
        qr_data = f"GATEPASS|STUDENT:{student.id}|NAME:{student.name}|ROOM:{student.room}|DATE:{gate_pass.from_date}"
        qr_image_path = generate_qr_code_image(qr_data)
        
        # QR Code box
        pdf.set_fill_color(249, 250, 251)
        pdf.rect(right_x, current_y, 55, 55, 'F')
        pdf.set_draw_color(229, 231, 235)
        pdf.rect(right_x, current_y, 55, 55)
        
        # Add QR code centered in box
        pdf.image(qr_image_path, x=right_x + 7.5, y=current_y + 5, w=40)
        
        # "Scan to Verify" text
        pdf.set_xy(right_x, current_y + 48)
        pdf.set_font('Arial', '', 8)
        pdf.set_text_color(107, 114, 128)
        pdf.cell(55, 4, 'Scan to Verify', 0, 1, 'C')
        pdf.set_text_color(0, 0, 0)
        
        # Clean up temp file
        os.unlink(qr_image_path)
    except Exception as e:
        print(f"QR Code generation error: {e}")
    
    current_y += 60
    
    # ========== GATE PASS DETAILS SECTION ==========
    pdf.add_info_box('GATE PASS DETAILS', 15, current_y, left_width, 65)
    
    pdf.set_xy(18, current_y + 8)
    pdf.set_font('Arial', 'B', 11)
    pdf.cell(45, 6, 'Reason:', 0, 0)
    pdf.set_font('Arial', '', 11)
    pdf.multi_cell(75, 6, gate_pass.reason, 0)
    
    pdf.set_x(18)
    pdf.set_font('Arial', 'B', 11)
    pdf.cell(45, 6, 'Destination:', 0, 0)
    pdf.set_font('Arial', '', 11)
    pdf.cell(0, 6, gate_pass.going_place or 'N/A', 0, 1)
    
    pdf.set_x(18)
    pdf.set_font('Arial', 'B', 11)
    pdf.cell(45, 6, 'From Date:', 0, 0)
    pdf.set_font('Arial', '', 11)
    pdf.cell(0, 6, format_date(gate_pass.from_date), 0, 1)
    
    pdf.set_x(18)
    pdf.set_font('Arial', 'B', 11)
    pdf.cell(45, 6, 'Return Date:', 0, 0)
    pdf.set_font('Arial', '', 11)
    pdf.cell(0, 6, format_date(gate_pass.return_date), 0, 1)
    
    pdf.set_x(18)
    pdf.set_font('Arial', 'B', 11)
    pdf.cell(45, 6, 'Out Time:', 0, 0)
    pdf.set_font('Arial', '', 11)
    pdf.cell(0, 6, format_time(gate_pass.out_time), 0, 1)
    
    pdf.set_x(18)
    pdf.set_font('Arial', 'B', 11)
    pdf.cell(45, 6, 'Return Time:', 0, 0)
    pdf.set_font('Arial', '', 11)
    pdf.cell(0, 6, format_time(gate_pass.return_time), 0, 1)
    
    # ========== GUARDIAN CONTACT (Right side) ==========
    pdf.add_info_box('GUARDIAN CONTACT', right_x, current_y, 55, 30)
    
    pdf.set_xy(right_x + 3, current_y + 8)
    pdf.set_font('Arial', 'B', 9)
    pdf.cell(0, 5, 'Name:', 0, 1)
    pdf.set_x(right_x + 3)
    pdf.set_font('Arial', '', 9)
    pdf.cell(0, 5, student.guardian_name or 'N/A', 0, 1)
    
    pdf.set_x(right_x + 3)
    pdf.set_font('Arial', 'B', 9)
    pdf.cell(0, 5, 'Phone:', 0, 1)
    pdf.set_x(right_x + 3)
    pdf.set_font('Arial', '', 9)
    pdf.cell(0, 5, student.guardian_phone or 'N/A', 0, 1)
    
    current_y += 70
    
    # ========== APPROVAL SECTION ==========
    if gate_pass.approved_by_id:
        approver = User.find_by_id(gate_pass.approved_by_id)
        if approver:
            pdf.add_info_box('AUTHORIZATION', 15, current_y, 180, 35)
            
            pdf.set_xy(18, current_y + 8)
            pdf.set_font('Arial', 'B', 11)
            pdf.cell(50, 6, 'Approved By:', 0, 0)
            pdf.set_font('Arial', '', 11)
            pdf.cell(0, 6, f"{approver.name} ({approver.id})", 0, 1)
            
            pdf.set_x(18)
            pdf.set_font('Arial', 'B', 11)
            pdf.cell(50, 6, 'Approved On:', 0, 0)
            pdf.set_font('Arial', '', 11)
            approved_date = format_date(gate_pass.approved_at) if gate_pass.approved_at else 'N/A'
            approved_time = format_time(gate_pass.approved_at) if gate_pass.approved_at else ''
            pdf.cell(0, 6, f"{approved_date} at {approved_time}", 0, 1)
            
            if gate_pass.remarks:
                pdf.set_x(18)
                pdf.set_font('Arial', 'B', 11)
                pdf.cell(50, 6, 'Remarks:', 0, 0)
                pdf.set_font('Arial', '', 11)
                pdf.multi_cell(125, 6, gate_pass.remarks, 0)
            
            current_y += 40
    
    # ========== FOOTER ==========
    pdf.set_y(270)
    pdf.set_draw_color(229, 231, 235)
    pdf.line(15, 270, 195, 270)
    
    pdf.set_y(272)
    pdf.set_font('Arial', 'I', 8)
    pdf.set_text_color(107, 114, 128)
    
    footer_text = 'This is an official document. Please carry this along with your student ID card.'
    pdf.cell(0, 4, footer_text, 0, 1, 'C')
    
    pdf.cell(0, 4, f'Generated on: {datetime.now().strftime("%b %d, %Y at %I:%M %p")}', 0, 1, 'C')
    
    # Main border
    pdf.set_draw_color(30, 64, 175)
    pdf.set_line_width(0.8)
    pdf.rect(10, 10, 190, 277)
    
    # Output PDF to buffer
    pdf_output = pdf.output(dest='S').encode('latin1')
    buffer = BytesIO(pdf_output)
    buffer.seek(0)
    
    return buffer

@gatepass_pdf_bp.route('/download/<pass_id>', methods=['GET'])
@jwt_required()
def download_gate_pass_pdf(pass_id):
    """Download gate pass as PDF"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.find_by_id(current_user_id)
        
        if not current_user:
            return jsonify({'message': 'User not found'}), 404
        
        gate_pass = GatePass.find_by_id(pass_id)
        if not gate_pass:
            return jsonify({'message': 'Gate pass not found'}), 404
        
        # Check permissions
        if current_user.user_type == 'student':
            if gate_pass.student_id != current_user.id:
                return jsonify({'message': 'Access denied'}), 403
        elif current_user.user_type not in ['warden', 'security']:
            return jsonify({'message': 'Access denied'}), 403
        
        # Only allow PDF download for approved passes
        if gate_pass.status != 'Approved':
            return jsonify({'message': 'PDF is only available for approved gate passes'}), 400
        
        student = User.find_by_id(gate_pass.student_id)
        if not student:
            return jsonify({'message': 'Student not found'}), 404
        
        # Generate PDF
        pdf_buffer = create_gate_pass_pdf(gate_pass, student)
        
        filename = f"GatePass_{student.name.replace(' ', '_')}_{format_date(gate_pass.from_date).replace(' ', '_')}.pdf"
        
        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf'
        )
        
    except Exception as e:
        print(f"PDF generation error: {e}")
        return jsonify({'message': f'Failed to generate PDF: {str(e)}'}), 500