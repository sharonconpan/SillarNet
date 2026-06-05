"""Add dual-model columns: deterioro_clase/indice and suciedad_clase/indice

Revision ID: 004
Revises: 003
Create Date: 2026-06-05

"""
import sqlalchemy as sa
from alembic import op

revision: str = "004"
down_revision: str = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("analyses", sa.Column("deterioro_clase",  sa.String(10), nullable=True))
    op.add_column("analyses", sa.Column("deterioro_indice", sa.Float(),     nullable=True))
    op.add_column("analyses", sa.Column("suciedad_clase",   sa.String(10), nullable=True))
    op.add_column("analyses", sa.Column("suciedad_indice",  sa.Float(),     nullable=True))


def downgrade() -> None:
    op.drop_column("analyses", "suciedad_indice")
    op.drop_column("analyses", "suciedad_clase")
    op.drop_column("analyses", "deterioro_indice")
    op.drop_column("analyses", "deterioro_clase")
