"""Initial schema — create all application tables.

Revision ID: 001_initial
Revises: None
Create Date: 2024-01-01 00:00:00.000000

Tables created:
  users, cases, timeline_events, narratives, roadmap_steps,
  evidence, documents, law_documents, conversations, messages
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# ---------------------------------------------------------------------------
# Revision identifiers
# ---------------------------------------------------------------------------
revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _vector_column(dim: int = 1536) -> sa.Column:
    """Return a pgvector column of the given dimensionality."""
    # Use the raw type string so we don't need pgvector's Python package
    # at migration time — Alembic can still emit the DDL correctly.
    return sa.Column("embedding", postgresql.ARRAY(sa.Float()), nullable=True)


# ---------------------------------------------------------------------------
# Upgrade
# ---------------------------------------------------------------------------

def upgrade() -> None:
    # ── Extensions ────────────────────────────────────────────────────────────
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")

    # ── users ─────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("uuid_generate_v4()"),
        ),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column("preferred_language", sa.String(10), nullable=False, server_default="de"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_superuser", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()"), onupdate=sa.text("now()")),
    )
    op.create_index("ix_users_email", "users", ["email"])

    # ── cases ─────────────────────────────────────────────────────────────────
    op.create_table(
        "cases",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("uuid_generate_v4()"),
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.String(50),
            nullable=False,
            server_default="open",
            comment="open | in_progress | closed | archived",
        ),
        sa.Column("category", sa.String(100), nullable=True, comment="e.g. tenancy, employment, criminal"),
        sa.Column("jurisdiction", sa.String(100), nullable=True, server_default="Germany"),
        sa.Column("metadata", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_cases_user_id", "cases", ["user_id"])
    op.create_index("ix_cases_status", "cases", ["status"])

    # ── timeline_events ───────────────────────────────────────────────────────
    op.create_table(
        "timeline_events",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("uuid_generate_v4()"),
        ),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cases.id", ondelete="CASCADE"), nullable=False),
        sa.Column("event_date", sa.Date(), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("event_type", sa.String(100), nullable=True),
        sa.Column("is_key_event", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("metadata", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_timeline_events_case_id", "timeline_events", ["case_id"])
    op.create_index("ix_timeline_events_event_date", "timeline_events", ["event_date"])

    # ── narratives ────────────────────────────────────────────────────────────
    op.create_table(
        "narratives",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("uuid_generate_v4()"),
        ),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cases.id", ondelete="CASCADE"), nullable=False),
        sa.Column(
            "narrative_type",
            sa.String(100),
            nullable=False,
            comment="police_statement | court_brief | formal_letter | complaint",
        ),
        sa.Column("title", sa.String(500), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("language", sa.String(10), nullable=False, server_default="de"),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("metadata", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_narratives_case_id", "narratives", ["case_id"])

    # ── roadmap_steps ─────────────────────────────────────────────────────────
    op.create_table(
        "roadmap_steps",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("uuid_generate_v4()"),
        ),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cases.id", ondelete="CASCADE"), nullable=False),
        sa.Column("step_number", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("action_required", sa.Text(), nullable=True),
        sa.Column("deadline", sa.Date(), nullable=True),
        sa.Column("is_completed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("resources", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_roadmap_steps_case_id", "roadmap_steps", ["case_id"])

    # ── evidence ──────────────────────────────────────────────────────────────
    op.create_table(
        "evidence",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("uuid_generate_v4()"),
        ),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cases.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("evidence_type", sa.String(100), nullable=True, comment="document | photo | witness | correspondence"),
        sa.Column("file_path", sa.String(1000), nullable=True),
        sa.Column("original_filename", sa.String(500), nullable=True),
        sa.Column("mime_type", sa.String(200), nullable=True),
        sa.Column("file_size_bytes", sa.BigInteger(), nullable=True),
        sa.Column("collected_at", sa.Date(), nullable=True),
        sa.Column("metadata", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_evidence_case_id", "evidence", ["case_id"])

    # ── documents (user-uploaded, analysed by Document Intelligence) ──────────
    op.create_table(
        "documents",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("uuid_generate_v4()"),
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cases.id", ondelete="SET NULL"), nullable=True),
        sa.Column("original_filename", sa.String(500), nullable=False),
        sa.Column("stored_filename", sa.String(500), nullable=False),
        sa.Column("file_path", sa.String(1000), nullable=False),
        sa.Column("mime_type", sa.String(200), nullable=True),
        sa.Column("file_size_bytes", sa.BigInteger(), nullable=True),
        sa.Column("extracted_text", sa.Text(), nullable=True),
        sa.Column("analysis_result", postgresql.JSONB(), nullable=True),
        sa.Column("processing_status", sa.String(50), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_documents_user_id", "documents", ["user_id"])
    op.create_index("ix_documents_case_id", "documents", ["case_id"])

    # ── law_documents (German law corpus, chunked + embedded for RAG) ─────────
    op.create_table(
        "law_documents",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("uuid_generate_v4()"),
        ),
        sa.Column("law_code", sa.String(50), nullable=False, comment="BGB | StGB | StPO | ZPO | ..."),
        sa.Column("law_name", sa.String(500), nullable=False),
        sa.Column("section_number", sa.String(50), nullable=True),
        sa.Column("section_title", sa.String(500), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("language", sa.String(10), nullable=False, server_default="de"),
        sa.Column("source_url", sa.String(1000), nullable=True),
        sa.Column("last_updated", sa.Date(), nullable=True),
        # pgvector column — stored as text-typed DDL so asyncpg can handle it.
        # The dimension matches AZURE_EMBEDDING_DIMENSIONS=1536.
        sa.Column("embedding", sa.Text(), nullable=True),
        sa.Column("metadata", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_law_documents_law_code", "law_documents", ["law_code"])
    op.create_index("ix_law_documents_section_number", "law_documents", ["section_number"])
    # GIN index on content for trigram search
    op.execute(
        "CREATE INDEX ix_law_documents_content_trgm "
        "ON law_documents USING GIN (content gin_trgm_ops)"
    )
    # Alter the embedding column to the proper vector type now that the extension is loaded
    op.execute(
        "ALTER TABLE law_documents ALTER COLUMN embedding TYPE vector(1536) "
        "USING NULL"
    )
    # HNSW index for fast ANN search
    op.execute(
        "CREATE INDEX ix_law_documents_embedding_hnsw "
        "ON law_documents USING hnsw (embedding vector_cosine_ops)"
    )

    # ── conversations ─────────────────────────────────────────────────────────
    op.create_table(
        "conversations",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("uuid_generate_v4()"),
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cases.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(500), nullable=True),
        sa.Column("metadata", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_conversations_user_id", "conversations", ["user_id"])
    op.create_index("ix_conversations_case_id", "conversations", ["case_id"])

    # ── messages ──────────────────────────────────────────────────────────────
    op.create_table(
        "messages",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("uuid_generate_v4()"),
        ),
        sa.Column("conversation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(20), nullable=False, comment="user | assistant | system"),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("sources", postgresql.JSONB(), nullable=True, comment="Law sections cited in the response"),
        sa.Column("token_count", sa.Integer(), nullable=True),
        sa.Column("model_used", sa.String(100), nullable=True),
        sa.Column("metadata", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_messages_conversation_id", "messages", ["conversation_id"])
    op.create_index("ix_messages_created_at", "messages", ["created_at"])


# ---------------------------------------------------------------------------
# Downgrade
# ---------------------------------------------------------------------------

def downgrade() -> None:
    # Drop tables in reverse dependency order
    op.drop_table("messages")
    op.drop_table("conversations")
    op.drop_table("law_documents")
    op.drop_table("documents")
    op.drop_table("evidence")
    op.drop_table("roadmap_steps")
    op.drop_table("narratives")
    op.drop_table("timeline_events")
    op.drop_table("cases")
    op.drop_table("users")

    op.execute("DROP EXTENSION IF EXISTS pg_trgm")
    op.execute('DROP EXTENSION IF EXISTS "uuid-ossp"')
    op.execute("DROP EXTENSION IF EXISTS vector")
