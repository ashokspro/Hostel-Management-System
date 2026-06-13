"""rename from_date to out_date in gate_passes

Revision ID: dcf277fbe3a2
Revises: ab75b41bfa1b
Create Date: 2026-05-26 11:19:57.830968

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dcf277fbe3a2'
down_revision: Union[str, Sequence[str], None] = 'ab75b41bfa1b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Step 1 — add column as NULLABLE first
    op.add_column('gate_passes', sa.Column('out_date', sa.Date(), nullable=True))
    
    # Step 2 — copy existing from_date data into out_date
    op.execute("UPDATE gate_passes SET out_date = from_date")
    
    # Step 3 — now make it NOT NULL (all rows have values now)
    op.alter_column('gate_passes', 'out_date', nullable=False)
    
    # Step 4 — drop the old column
    op.drop_column('gate_passes', 'from_date')


def downgrade() -> None:
    op.add_column('gate_passes', sa.Column('from_date', sa.Date(), nullable=True))
    op.execute("UPDATE gate_passes SET from_date = out_date")
    op.alter_column('gate_passes', 'from_date', nullable=False)
    op.drop_column('gate_passes', 'out_date')
