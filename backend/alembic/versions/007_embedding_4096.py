"""Embedding column 1536 -> 4096 for KIT qwen3-embedding-8b.

Existing embeddings (if any) are incompatible with the new model and are
cleared; the backfill re-embeds from statute text.

Index note: pgvector HNSW caps at 2000 dims (halfvec at 4000), and the KIT
endpoint does not support the `dimensions` request parameter, so a 4096-dim
column cannot be ANN-indexed. With the current corpus size (33 statutes, low
hundreds at most) a sequential cosine scan is the correct choice — the
`<=>` ordering in rag_service works identically without an index. Revisit
(halfvec expression index or model-level dimension reduction) only when the
corpus grows past seq-scan viability.

Revision ID: 007_embedding_4096
Revises: 006_bot_identities
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "007_embedding_4096"
down_revision: Union[str, None] = "006_bot_identities"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _existing_tables() -> set[str]:
    """Inspect the live DB and return the set of tables that actually exist."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return set(inspector.get_table_names())


def upgrade() -> None:
    # law_documents is always part of the canonical chain and must be migrated.
    # forum_posts is a legacy model present in the ORM layer (ForumPost) but is
    # NOT created by migration 001 — it may exist in historical databases. To
    # be safe for both fresh and historical DBs, inspect rather than assume:
    # law_documents is always migrated; forum_posts is migrated only if the
    # table actually exists. This replaces the previous version that still
    # dropped an index for a table that the canonical chain never creates.
    tables = {"law_documents"}
    live = _existing_tables()
    if "forum_posts" in live:
        tables.add("forum_posts")

    for table in tables:
        # Old 1536-dim hnsw index (from 001) — dropped, not recreated (see note).
        op.execute(f"DROP INDEX IF EXISTS ix_{table}_embedding_hnsw")
        op.execute(f"UPDATE {table} SET embedding = NULL")
        op.execute(f"ALTER TABLE {table} ALTER COLUMN embedding TYPE vector(4096)")


def downgrade() -> None:
    # Mirror the upgrade's inspection so downgrade is symmetric.
    tables = {"law_documents"}
    live = _existing_tables()
    if "forum_posts" in live:
        tables.add("forum_posts")

    for table in tables:
        op.execute(f"UPDATE {table} SET embedding = NULL")
        op.execute(f"ALTER TABLE {table} ALTER COLUMN embedding TYPE vector(1536)")
        op.execute(
            f"CREATE INDEX ix_{table}_embedding_hnsw ON {table} USING hnsw (embedding vector_cosine_ops)"
        )
