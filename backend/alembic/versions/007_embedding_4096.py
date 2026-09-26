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

from alembic import op

revision: str = "007_embedding_4096"
down_revision: Union[str, None] = "006_bot_identities"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLES = ("law_documents", "forum_posts")


def upgrade() -> None:
    for table in TABLES:
        # Old 1536-dim hnsw index (from 001) — dropped, not recreated (see note).
        op.execute("DROP INDEX IF EXISTS ix_law_documents_embedding_hnsw")
        op.execute("DROP INDEX IF EXISTS ix_forum_posts_embedding_hnsw")
        op.execute(f"UPDATE {table} SET embedding = NULL")
        op.execute(f"ALTER TABLE {table} ALTER COLUMN embedding TYPE vector(4096)")


def downgrade() -> None:
    for table in TABLES:
        op.execute(f"UPDATE {table} SET embedding = NULL")
        op.execute(f"ALTER TABLE {table} ALTER COLUMN embedding TYPE vector(1536)")
        op.execute(
            f"CREATE INDEX ix_{table}_embedding_hnsw ON {table} USING hnsw (embedding vector_cosine_ops)"
        )
