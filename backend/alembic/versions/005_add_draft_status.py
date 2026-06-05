"""Add draft value to analysisstatus enum

Revision ID: 005
Revises: 004
Create Date: 2026-06-05

"""
from alembic import op

revision: str = "005"
down_revision: str = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE analysisstatus ADD VALUE IF NOT EXISTS 'draft' BEFORE 'pending'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values.
    pass
