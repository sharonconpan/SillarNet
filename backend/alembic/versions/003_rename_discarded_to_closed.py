"""Rename analysisstatus 'discarded' to 'closed'

Revision ID: 003
Revises: 002
Create Date: 2026-06-02

"""
from alembic import op

revision: str = "003"
down_revision: str = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create new enum with the correct values (no 'discarded', adds 'closed')
    op.execute("""
        CREATE TYPE analysisstatus_new AS ENUM (
            'pending', 'in_progress', 'completed', 'closed'
        )
    """)

    # Drop the default first so PostgreSQL can cast the column type freely
    op.execute("ALTER TABLE analyses ALTER COLUMN status DROP DEFAULT")

    # Migrate column, mapping 'discarded' -> 'closed' for any existing rows
    op.execute("""
        ALTER TABLE analyses
        ALTER COLUMN status TYPE analysisstatus_new
        USING CASE status::text
            WHEN 'discarded' THEN 'closed'::analysisstatus_new
            ELSE status::text::analysisstatus_new
        END
    """)

    # Swap types
    op.execute("DROP TYPE analysisstatus")
    op.execute("ALTER TYPE analysisstatus_new RENAME TO analysisstatus")

    # Restore the default using the renamed type
    op.execute("ALTER TABLE analyses ALTER COLUMN status SET DEFAULT 'pending'::analysisstatus")


def downgrade() -> None:
    op.execute("""
        CREATE TYPE analysisstatus_old AS ENUM (
            'pending', 'in_progress', 'completed', 'discarded'
        )
    """)
    op.execute("ALTER TABLE analyses ALTER COLUMN status DROP DEFAULT")
    op.execute("""
        ALTER TABLE analyses
        ALTER COLUMN status TYPE analysisstatus_old
        USING CASE status::text
            WHEN 'closed' THEN 'discarded'::analysisstatus_old
            ELSE status::text::analysisstatus_old
        END
    """)
    op.execute("DROP TYPE analysisstatus")
    op.execute("ALTER TYPE analysisstatus_old RENAME TO analysisstatus")
    op.execute("ALTER TABLE analyses ALTER COLUMN status SET DEFAULT 'pending'::analysisstatus")
