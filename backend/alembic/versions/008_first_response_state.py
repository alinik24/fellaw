"""Add provenance, clock, reminder, event, and handoff state.

Revision ID: 008_first_response_state
Revises: 007_embedding_4096
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "008_first_response_state"
down_revision = "007_embedding_4096"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "first_response_facts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("document_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("documents.id", ondelete="CASCADE"), nullable=False),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cases.id", ondelete="CASCADE"), nullable=True),
        sa.Column("fact_type", sa.String(80), nullable=False),
        sa.Column("value", sa.Text(), nullable=True),
        sa.Column("normalized_value", sa.Text(), nullable=True),
        sa.Column("reviewed_value", sa.Text(), nullable=True),
        sa.Column("source_page", sa.Integer(), nullable=True),
        sa.Column("source_span", sa.Text(), nullable=True),
        sa.Column("extractor", sa.String(80), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("review_status", sa.String(40), nullable=False, server_default="EXTRACTED_CANDIDATE"),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_first_response_facts_document_id", "first_response_facts", ["document_id"])
    op.create_index("ix_first_response_facts_case_id", "first_response_facts", ["case_id"])
    op.create_index("ix_first_response_facts_fact_type", "first_response_facts", ["fact_type"])
    op.create_table(
        "first_response_clocks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cases.id", ondelete="CASCADE"), nullable=False),
        sa.Column("trigger_fact_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("first_response_facts.id", ondelete="SET NULL"), nullable=True),
        sa.Column("clock_type", sa.String(40), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("rule_id", sa.String(160), nullable=True),
        sa.Column("rule_version", sa.String(40), nullable=True),
        sa.Column("legal_basis", sa.String(255), nullable=True),
        sa.Column("verification_status", sa.String(40), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("source_page", sa.Integer(), nullable=True),
        sa.Column("source_span", sa.Text(), nullable=True),
        sa.Column("label", sa.String(255), nullable=False, server_default=""),
        sa.Column("status", sa.String(30), nullable=False, server_default="open"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_first_response_clocks_case_id", "first_response_clocks", ["case_id"])
    op.create_table(
        "first_response_reminders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cases.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source_clock_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("first_response_clocks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reminder_date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="scheduled"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_first_response_reminders_case_id", "first_response_reminders", ["case_id"])
    op.create_table(
        "product_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cases.id", ondelete="SET NULL"), nullable=True),
        sa.Column("event_name", sa.String(80), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("occurred_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_product_events_user_id", "product_events", ["user_id"])
    op.create_index("ix_product_events_case_id", "product_events", ["case_id"])
    op.create_index("ix_product_events_event_name", "product_events", ["event_name"])
    op.create_index("ix_product_events_occurred_at", "product_events", ["occurred_at"])
    op.create_table(
        "handoff_dossiers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("language", sa.String(10), nullable=False, server_default="de"),
        sa.Column("contact_preference", sa.String(80), nullable=True),
        sa.Column("exact_human_question", sa.Text(), nullable=False),
        sa.Column("dossier", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("status", sa.String(30), nullable=False, server_default="created"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("handoff_dossiers")
    op.drop_index("ix_product_events_occurred_at", table_name="product_events")
    op.drop_index("ix_product_events_event_name", table_name="product_events")
    op.drop_index("ix_product_events_case_id", table_name="product_events")
    op.drop_index("ix_product_events_user_id", table_name="product_events")
    op.drop_table("product_events")
    op.drop_index("ix_first_response_reminders_case_id", table_name="first_response_reminders")
    op.drop_table("first_response_reminders")
    op.drop_index("ix_first_response_clocks_case_id", table_name="first_response_clocks")
    op.drop_table("first_response_clocks")
    op.drop_index("ix_first_response_facts_fact_type", table_name="first_response_facts")
    op.drop_index("ix_first_response_facts_case_id", table_name="first_response_facts")
    op.drop_index("ix_first_response_facts_document_id", table_name="first_response_facts")
    op.drop_table("first_response_facts")
