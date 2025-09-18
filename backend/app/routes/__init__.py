# app/routes/__init__.py
"""
Routes Package

This file imports all route blueprints.
"""

from app.routes.auth import auth_bp
from app.routes.gatepass import gatepass_bp
from app.routes.user import user_bp
from app.routes.admin import admin_bp

# Export all blueprints
__all__ = ['auth_bp', 'gatepass_bp', 'user_bp', 'admin_bp']