"""Initial schema — users and analyses tables

Revision ID: 001
Revises:
Create Date: 2026-06-02

"""
from typing import Sequence, Union
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("display_name", sa.String(100), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "analyses",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("stored_path", sa.String(500), nullable=False),
        sa.Column("predicted_class", sa.String(50), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("top5_json", postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column("color", sa.String(10), nullable=False),
        sa.Column("urgency", sa.String(150), nullable=False),
        sa.Column("recommendation", sa.Text(), nullable=False),
        sa.Column("is_deterioration", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("location_label", sa.String(255), nullable=True),
        sa.Column(
            "status",
            sa.Enum("pending", "discarded", "completed", name="analysisstatus"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("re_analyze_suggested", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_analyses_user_id_status", "analyses", ["user_id", "status"])
    op.create_index("ix_analyses_lat_lng", "analyses", ["latitude", "longitude"])


def downgrade() -> None:
    op.drop_table("analyses")
    op.execute("DROP TYPE IF EXISTS analysisstatus")
    op.drop_table("users")
