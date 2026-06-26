# app/services/email_service.py

import resend
from app.core.config import settings
import logging

logger = logging.getLogger("uvicorn")

resend.api_key = settings.RESEND_API_KEY


def send_password_reset_email(to_email: str, name: str, reset_link: str) -> bool:
    """
    Sends a password reset email via Resend.
    Returns True on success, False on failure (logged, not raised —
    we don't want email failures to crash the request).
    """
    html_content = f"""
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6);
                    padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">
                Hostel Management System
            </h1>
            <p style="color: #dbeafe; margin: 8px 0 0; font-size: 13px;">
                Password Reset Request
            </p>
        </div>
        <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px;
                    border: 1px solid #e5e7eb;">
            <p style="color: #374151; font-size: 14px;">Hi {name},</p>
            <p style="color: #374151; font-size: 14px; line-height: 1.6;">
                We received a request to reset your password. Click the button
                below to choose a new password. This link expires in
                {settings.RESET_TOKEN_EXPIRE_MINUTES} minutes.
            </p>
            <div style="text-align: center; margin: 28px 0;">
                <a href="{reset_link}"
                   style="background: linear-gradient(135deg, #1e40af, #3b82f6);
                          color: white; padding: 12px 32px; border-radius: 8px;
                          text-decoration: none; font-weight: 600; font-size: 14px;
                          display: inline-block;">
                    Reset Password
                </a>
            </div>
            <p style="color: #9ca3af; font-size: 12px; line-height: 1.6;">
                If you didn't request this, you can safely ignore this email —
                your password will remain unchanged.
            </p>
            <p style="color: #9ca3af; font-size: 11px; margin-top: 24px;">
                If the button doesn't work, copy this link:<br>
                <span style="word-break: break-all;">{reset_link}</span>
            </p>
        </div>
    </div>
    """

    try:
        resend.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": to_email,
            "subject": "Reset your Hostel Management System password",
            "html": html_content,
        })
        return True
    except Exception as e:
        logger.exception(f"Failed to send password reset email: {e}")
        return False


def send_password_changed_notification(to_email: str, name: str) -> bool:
    """
    Optional — sends a confirmation when password is changed
    (by user or admin). Helps users notice unauthorized resets.
    """
    html_content = f"""
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6);
                    padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">
                Hostel Management System
            </h1>
        </div>
        <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px;
                    border: 1px solid #e5e7eb;">
            <p style="color: #374151; font-size: 14px;">Hi {name},</p>
            <p style="color: #374151; font-size: 14px; line-height: 1.6;">
                Your password was just changed. If this was you, no action is needed.
            </p>
            <p style="color: #991b1b; font-size: 13px; line-height: 1.6;
                      background: #fee2e2; padding: 12px; border-radius: 8px;">
                If you did not make this change, please contact your hostel
                administrator immediately.
            </p>
        </div>
    </div>
    """

    try:
        resend.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": to_email,
            "subject": "Your password was changed",
            "html": html_content,
        })
        return True
    except Exception as e:
        logger.exception(f"Failed to send password-changed notification: {e}")
        return False