"""Add in_progress value to analysisstatus enum

Revision ID: 002
Revises: 001
Create Date: 2026-06-02

"""
from alembic import op

revision: str = "002"
down_revision: str = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # PostgreSQL supports adding enum values non-transactionally
    op.execute("ALTER TYPE analysisstatus ADD VALUE IF NOT EXISTS 'in_progress' AFTER 'pending'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values.
    # To rollback, recreate the type without 'in_progress' and migrate existing rows.
    pass
