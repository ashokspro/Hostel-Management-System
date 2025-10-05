"""Make actual_return_date nullable in GatePass"""

from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'make_actual_return_date_nullable'
down_revision = 'addbf14ee30c'
branch_labels = None
depends_on = None

def upgrade():
    with op.batch_alter_table('gate_passes', schema=None) as batch_op:
        # return_date stays NOT NULL
        batch_op.alter_column('actual_return_date',
                              existing_type=sa.Date(),
                              nullable=True)  # <- now nullable

def downgrade():
    with op.batch_alter_table('gate_passes', schema=None) as batch_op:
        batch_op.alter_column('actual_return_date',
                              existing_type=sa.Date(),
                              nullable=False)
