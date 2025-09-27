# app/models/__init__.py
"""
Models Package

This file imports all models to ensure they are registered with SQLAlchemy.
Import this module to initialize all database models.
"""

# Import all models so SQLAlchemy can find them
from app.models.user import User
from app.models.gatepass import GatePass

# Make models available when importing from models package
__all__ = ['User', 'GatePass']

def init_models():
    """
    Initialize all models with the database
    This function can be called to ensure all models are loaded
    """
    # Import ensures models are registered with SQLAlchemy
    pass