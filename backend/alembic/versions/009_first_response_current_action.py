"""Add persisted current next action identity (north star).

Revision ID: 009_current_action
Revises: 008_first_response_state
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "009_current_action"
down_revision = "008_first_response_state"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "first_response_current_actions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cases.id", ondelete="CASCADE"), nullable=False),
        sa.Column("action_key", sa.String(255), nullable=False),
        sa.Column("label", sa.String(512), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("superseded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("superseded_by", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index(
        "ix_first_response_current_actions_case_id",
        "first_response_current_actions",
        ["case_id"],
    )
    op.create_index(
        "ix_first_response_current_actions_status",
        "first_response_current_actions",
        ["status"],
    )


def downgrade() -> None:
    op.drop_index("ix_first_response_current_actions_status", table_name="first_response_current_actions")
    op.drop_index("ix_first_response_current_actions_case_id", table_name="first_response_current_actions")
    op.drop_table("first_response_current_actions")
