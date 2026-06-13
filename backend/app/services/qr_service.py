# app/services/qr_service.py

import os
import qrcode
from pathlib import Path


# ── Static folder paths ───────────────────────────────────────
# Path(__file__) → current file location (qr_service.py)
# .parent.parent → goes up to app/ folder
# / "static" / "qr_codes" → builds the full path
QR_FOLDER = Path(__file__).parent.parent / "static" / "qr_codes"

# Create the folder if it doesn't exist
# exist_ok=True means no error if folder already exists
QR_FOLDER.mkdir(parents=True, exist_ok=True)


def generate_qr(pass_id: str, pass_number: str) -> str:
    """
    Generates a QR code image for a gate pass.
    
    What the QR encodes:
        When security scans this QR code with any scanner,
        they see the pass_id and pass_number.
        In future you can encode a verification URL like:
        "https://yourhostel.com/verify/{pass_id}"
    
    Returns:
        str: Full file path to the saved QR image
    
    Example:
        generate_qr("23a9a3af-...", "GP-260526-001")
        → saves to static/qr_codes/GP-260526-001.png
        → returns the full path as string
    """
    # What gets encoded inside the QR code
    qr_data = (
        f"Pass Number: {pass_number}\n"
        f"Pass ID: {pass_id}\n"
        f"Verify at: hostel-mgmt/verify/{pass_id}"
    )

    # Create QR code object
    # error_correction=ERROR_CORRECT_H → highest error correction
    # meaning QR still works even if 30% of it is damaged/dirty
    qr = qrcode.QRCode(
        version=1,                              # size of QR (1=smallest)
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,                            # pixels per box
        border=4,                               # boxes for border/quiet zone
    )

    qr.add_data(qr_data)
    qr.make(fit=True)   # fit=True auto-adjusts version to fit data

    # Create the image
    # fill_color and back_color — black QR on white background
    img = qr.make_image(fill_color="black", back_color="white")

    # Save path — named after pass_number for easy identification
    file_path = QR_FOLDER / f"{pass_number}.png"
    img.save(str(file_path))

    return str(file_path)