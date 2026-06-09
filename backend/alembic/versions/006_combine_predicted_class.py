"""Combine predicted_class with grade (e.g. 'suciedad' + 'leve' -> 'suciedad_leve')

Revision ID: 006
Revises: 005
Create Date: 2026-06-09

"""
from alembic import op

revision: str = "006"
down_revision: str = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        UPDATE analyses
        SET predicted_class = CASE
            WHEN predicted_class = 'suciedad' AND suciedad_clase IS NOT NULL AND suciedad_clase != 'ninguno'
                THEN 'suciedad_' || suciedad_clase
            WHEN predicted_class = 'deterioro' AND deterioro_clase IS NOT NULL AND deterioro_clase != 'ninguno'
                THEN 'deterioro_' || deterioro_clase
            ELSE predicted_class
        END
        WHERE predicted_class IN ('suciedad', 'deterioro')
    """)


def downgrade() -> None:
    op.execute("""
        UPDATE analyses
        SET predicted_class = CASE
            WHEN predicted_class LIKE 'suciedad_%' THEN 'suciedad'
            WHEN predicted_class LIKE 'deterioro_%' THEN 'deterioro'
            ELSE predicted_class
        END
        WHERE predicted_class LIKE 'suciedad_%' OR predicted_class LIKE 'deterioro_%'
    """)
