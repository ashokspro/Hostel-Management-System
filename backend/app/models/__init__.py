
# app/models/__init__.py
"""
Models Package

This file imports all models to ensure they are registered with SQLAlchemy.
"""

from app.models.user import User
from app.models.gatepass import GatePass

# Export all models
__all__ = ['User', 'GatePass']