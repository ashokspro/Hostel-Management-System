# app/services/pdf_service.py

from fpdf import FPDF
from pathlib import Path
from datetime import datetime, timezone
import pytz

from app.models.gatepass import GatePass
from app.services.qr_service import generate_qr


# ── Paths ─────────────────────────────────────────────────────
PDF_FOLDER = Path(__file__).parent.parent / "static" / "generated_pdfs"
PDF_FOLDER.mkdir(parents=True, exist_ok=True)

# IST timezone for displaying times on PDF
IST = pytz.timezone("Asia/Kolkata")


def format_datetime(dt: datetime | None) -> str:
    """
    Converts UTC datetime to IST string for display.
    Returns "N/A" if datetime is None.
    
    Example:
        UTC: 2026-05-26 05:09:12+00:00
        IST: 26-May-2026 10:39 AM
    """
    if not dt:
        return "N/A"
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    ist_time = dt.astimezone(IST)
    return ist_time.strftime("%d-%b-%Y %I:%M %p")


def format_date(d) -> str:
    """Formats a date object to readable string."""
    if not d:
        return "N/A"
    return d.strftime("%d-%b-%Y")


def format_time(t) -> str:
    """Formats a time object to readable string."""
    if not t:
        return "N/A"
    return t.strftime("%I:%M %p")


class GatePassPDF(FPDF):
    """
    Custom PDF class extending FPDF.
    
    By extending FPDF, we can override:
        header() → runs automatically on every page top
        footer() → runs automatically on every page bottom
    
    This keeps the header/footer consistent without
    calling them manually.
    """

    def header(self):
        """
        Automatically called at the top of every page.
        Draws the hostel name and document title.
        """
        # ── Hostel name ───────────────────────────────────────
        self.set_font("Helvetica", "B", 18)
        self.set_text_color(30, 30, 30)         # near black
        self.cell(0, 10, "HOSTEL MANAGEMENT SYSTEM", align="C", new_x="LMARGIN", new_y="NEXT")

        # ── Subtitle ──────────────────────────────────────────
        self.set_font("Helvetica", "", 11)
        self.set_text_color(100, 100, 100)      # gray
        self.cell(0, 6, "Gate Pass Document", align="C", new_x="LMARGIN", new_y="NEXT")

        # ── Divider line ──────────────────────────────────────
        # draw_color controls line color
        self.set_draw_color(200, 200, 200)      # light gray
        self.set_line_width(0.5)
        self.line(10, self.get_y() + 2, 200, self.get_y() + 2)
        self.ln(8)                              # 8mm space after line

    def footer(self):
        """
        Automatically called at the bottom of every page.
        Shows page number and generation timestamp.
        """
        self.set_y(-15)                         # 15mm from bottom
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(150, 150, 150)
        self.cell(
            0, 10,
            f"Page {self.page_no()} | Generated: {datetime.now(IST).strftime('%d-%b-%Y %I:%M %p')} IST",
            align="C"
        )


def draw_section_header(pdf: FPDF, title: str):
    """
    Draws a colored section header bar.
    Used to visually separate sections on the PDF.
    
    Example: "STUDENT INFORMATION", "GATE PASS DETAILS"
    """
    pdf.set_fill_color(41, 128, 185)            # blue background
    pdf.set_text_color(255, 255, 255)           # white text
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 8, f"  {title}", fill=True, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)


def draw_field(pdf: FPDF, label: str, value: str, col_width: float = 90):
    """
    Draws a label-value pair in two columns.
    
    Example:
        "Student Name:"    "John Doe"
        "Room Number:"     "101"
    
    col_width controls label column width.
    Value gets the remaining space.
    """
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(80, 80, 80)              # dark gray label
    pdf.cell(col_width, 7, label)

    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(30, 30, 30)              # near black value
    pdf.cell(0, 7, str(value), new_x="LMARGIN", new_y="NEXT")


def draw_status_badge(pdf: FPDF, status: str):
    """
    Draws a colored status badge.
    
    Colors:
        Approved → green
        Rejected → red
        Pending  → orange
    """
    colors = {
        "Approved": (39, 174, 96),      # green
        "Rejected": (231, 76, 60),      # red
        "Pending":  (243, 156, 18),     # orange
    }
    r, g, b = colors.get(status, (100, 100, 100))

    pdf.set_fill_color(r, g, b)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 11)

    # Save position, draw centered badge
    pdf.cell(0, 10, f"Status: {status.upper()}", fill=True, align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)


def generate_gatepass_pdf(gatepass: GatePass) -> bytes:
    """
    Generates a complete gate pass PDF.
    
    Returns bytes — the raw PDF file content.
    The router converts this to a StreamingResponse
    so the browser downloads it.
    
    Structure of the PDF:
        1. Header (auto — hostel name + title)
        2. Pass number + status badge
        3. QR code (right side)
        4. Student information section
        5. Gate pass details section
        6. Approval information section
        7. Security tracking section
        8. Footer (auto — page number + timestamp)
    """
    # Get student info from relationship
    student = gatepass.student
    student_name = student.name if student else "Unknown"
    room_no = student.room if student else "N/A"
    course = student.course if student else "N/A"
    year = student.year if student else "N/A"
    phone = student.phone if student else "N/A"
    guardian_phone = student.guardian_phone if student else "N/A"

    # Get approver info
    approver_name = gatepass.approver.name if gatepass.approver else "N/A"

    # ── Create PDF ────────────────────────────────────────────
    pdf = GatePassPDF(orientation="P", unit="mm", format="A4")
    pdf.set_margins(left=10, top=10, right=10)
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # ── Pass number ───────────────────────────────────────────
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 10, f"Gate Pass: {gatepass.pass_number}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    # ── Status badge ──────────────────────────────────────────
    draw_status_badge(pdf, gatepass.status)

    # ── QR code ───────────────────────────────────────────────
    # Generate QR and place it in top-right corner
    # We save current Y position, place QR at fixed X=155
    # then restore Y so content flows normally on the left
    try:
        qr_path = generate_qr(gatepass.pass_id, gatepass.pass_number)
        qr_y = pdf.get_y() + 15              # remember current Y
        pdf.image(
            qr_path,
            x=155,                      # right side of page
            y=qr_y,
            w=40,                       # 40mm wide
            h=40                        # 40mm tall
        )
        # Don't advance Y — let content flow on left side
    except Exception:
        pass                            # QR failed — continue without it

    # ── Student information ───────────────────────────────────
    draw_section_header(pdf, "STUDENT INFORMATION")
    draw_field(pdf, "Student ID:", gatepass.student_id)
    draw_field(pdf, "Student Name:", student_name)
    draw_field(pdf, "Room Number:", room_no or "N/A")
    draw_field(pdf, "Course:", course or "N/A")
    draw_field(pdf, "Year:", year or "N/A")
    draw_field(pdf, "Phone:", phone or "N/A")
    draw_field(pdf, "Guardian Phone:", guardian_phone or "N/A")
    pdf.ln(4)

    # ── Gate pass details ─────────────────────────────────────
    draw_section_header(pdf, "GATE PASS DETAILS")
    draw_field(pdf, "Reason:", gatepass.reason)
    draw_field(pdf, "Going To:", gatepass.going_place)
    draw_field(pdf, "Departure Date:", format_date(gatepass.out_date))
    draw_field(pdf, "Departure Time:", format_time(gatepass.out_time))
    draw_field(pdf, "Return Date:", format_date(gatepass.return_date))
    draw_field(pdf, "Return Time:", format_time(gatepass.return_time))
    draw_field(pdf, "Created At:", format_datetime(gatepass.created_at))
    pdf.ln(4)

    # ── Approval information ──────────────────────────────────
    draw_section_header(pdf, "APPROVAL INFORMATION")
    draw_field(pdf, "Approved By:", approver_name)
    draw_field(pdf, "Approved At:", format_datetime(gatepass.approved_at))
    draw_field(pdf, "Warden Remarks:", gatepass.remarks or "None")
    pdf.ln(4)

    # ── Security tracking ─────────────────────────────────────
    draw_section_header(pdf, "SECURITY TRACKING")

    # Split "ExitStatus.IN" → "In", "ExitStatus.OUT" → "Out"
    exit_status_display = str(gatepass.exit_status).split(".")[-1].title()

    draw_field(pdf, "Current Status:", exit_status_display)
    draw_field(pdf, "Actual Exit Time:", format_datetime(gatepass.actual_out_time))
    draw_field(pdf, "Actual Return Time:", format_datetime(gatepass.actual_return_time))
    draw_field(pdf, "Actual Return Date:", format_date(gatepass.actual_return_date))
    draw_field(pdf, "Security Remarks:", gatepass.security_remarks or "None")
    pdf.ln(4)

    # ── Return PDF as bytes ───────────────────────────────────
    return bytes(pdf.output())