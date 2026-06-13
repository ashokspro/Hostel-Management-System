"""add admin to userrole enum

Revision ID: 9c373a11e097
Revises: 0f9f0c9f0509
Create Date: 2026-06-01 12:41:41.491536

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9c373a11e097'
down_revision: Union[str, Sequence[str], None] = '0f9f0c9f0509'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add 'admin' value to the existing PostgreSQL enum type
    # Cannot use autogenerate for enum value additions — must be raw SQL
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'admin'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values directly
    # To downgrade you'd need to recreate the type — skip for now
    pass