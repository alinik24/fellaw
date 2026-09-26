"""Align legacy initial tables with current ORM/API models.

Revision ID: 004_align_current_models
Revises: 003_add_user_anonymous

The original migrations and current models evolved independently. This
forward-only migration adds the columns required by current API routes while
preserving existing data and providing safe defaults for non-null fields.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "004_align_current_models"
down_revision: Union[str, None] = "003_add_user_anonymous"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def add(table: str, column: sa.Column) -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if column.name not in {c["name"] for c in inspector.get_columns(table)}:
        op.add_column(table, column)


def upgrade() -> None:
    # cases
    add("cases", sa.Column("case_type", sa.String(50), nullable=True))
    add("cases", sa.Column("incident_date", sa.Date(), nullable=True))
    add("cases", sa.Column("location", sa.String(512), nullable=True))
    add("cases", sa.Column("opposing_party", sa.String(512), nullable=True))
    add("cases", sa.Column("opposing_party_lawyer", sa.String(512), nullable=True))
    add("cases", sa.Column("court_name", sa.String(512), nullable=True))
    add("cases", sa.Column("case_number", sa.String(255), nullable=True))
    add("cases", sa.Column("urgency", sa.String(20), nullable=False, server_default="medium"))
    op.execute("UPDATE cases SET case_type = COALESCE(case_type, category, 'civil')")
    op.alter_column("cases", "case_type", nullable=False)

    # conversations/messages
    add("conversations", sa.Column("conversation_type", sa.String(50), nullable=False, server_default="general"))
    add("messages", sa.Column("citations", postgresql.JSON(), nullable=True))

    # documents/evidence
    add("documents", sa.Column("file_size", sa.Integer(), nullable=True))
    add("documents", sa.Column("ai_analysis", sa.Text(), nullable=True))
    add("documents", sa.Column("document_category", sa.String(100), nullable=False, server_default="other"))
    add("evidence", sa.Column("file_size", sa.Integer(), nullable=True))
    add("evidence", sa.Column("file_type", sa.String(100), nullable=True))
    add("evidence", sa.Column("event_date", sa.DateTime(timezone=True), nullable=True))
    add("evidence", sa.Column("is_favorable", sa.Boolean(), nullable=True))
    add("evidence", sa.Column("strength", sa.String(20), nullable=False, server_default="unknown"))
    add("evidence", sa.Column("tags", postgresql.JSON(), nullable=False, server_default=sa.text("'[]'::json")))
    add("evidence", sa.Column("analysis", sa.Text(), nullable=True))

    # law_documents
    add("law_documents", sa.Column("section", sa.String(50), nullable=True))
    add("law_documents", sa.Column("subsection", sa.String(50), nullable=True))
    add("law_documents", sa.Column("title", sa.String(500), nullable=True))
    add("law_documents", sa.Column("url", sa.String(1000), nullable=True))
    add("law_documents", sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"))
    add("law_documents", sa.Column("scraped_at", sa.DateTime(timezone=True), nullable=True))

    # narrative, roadmap, timeline
    add("narratives", sa.Column("is_final", sa.Boolean(), nullable=False, server_default="false"))
    add("roadmap_steps", sa.Column("action_items", postgresql.JSON(), nullable=False, server_default=sa.text("'[]'::json")))
    add("roadmap_steps", sa.Column("status", sa.String(20), nullable=False, server_default="pending"))
    add("roadmap_steps", sa.Column("priority", sa.String(20), nullable=False, server_default="medium"))
    add("timeline_events", sa.Column("source", sa.String(512), nullable=True))


def downgrade() -> None:
    # Preserve data by intentionally making this migration irreversible in
    # production; explicit drops are omitted to avoid accidental loss.
    pass
