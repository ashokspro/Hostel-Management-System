"""Add return_date and actual_return_date to GatePass

Revision ID: addbf14ee30c
Revises: 
Create Date: 2025-09-28 16:03:22.830742

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'addbf14ee30c'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    with op.batch_alter_table('gate_passes', schema=None) as batch_op:
        batch_op.add_column(sa.Column('return_date', sa.Date(), nullable=False, server_default=sa.text("'1970-01-01'")))
        batch_op.add_column(sa.Column('actual_return_date', sa.Date(), nullable=True))  # <-- nullable now

def downgrade():
    with op.batch_alter_table('gate_passes', schema=None) as batch_op:
        batch_op.drop_column('return_date')
        batch_op.drop_column('actual_return_date')
