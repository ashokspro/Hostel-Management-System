# app/routers/gatepass.py

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import io

from app.core.dependencies import DB, CurrentStudent, CurrentWarden, CurrentSecurity
from app.services.gatepass_service import GatePassService
from app.services.pdf_service import generate_gatepass_pdf

router = APIRouter(prefix="/api/gatepasses", tags=["Gate Pass PDF"])


@router.get(
    "/{pass_id}/download",
    summary="Download gate pass as PDF"
)
async def download_gatepass_pdf(
    pass_id: str,
    db: DB,
    current_user: CurrentStudent  # any logged in user can download
):
    """
    Generates and returns a gate pass PDF for download.
    
    StreamingResponse streams the PDF bytes directly
    to the browser — no file saved on server permanently.
    
    Content-Disposition: attachment → browser downloads it
    Content-Disposition: inline → browser opens it in tab
    """
    # Fetch the gate pass
    gatepass = await GatePassService.get_gatepass(db, pass_id)

    # Generate PDF bytes
    pdf_bytes = generate_gatepass_pdf(gatepass)

    # Stream to browser as downloadable file
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=gatepass_{gatepass.pass_number}.pdf"
        }
    )

