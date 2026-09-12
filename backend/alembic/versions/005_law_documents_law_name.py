"""Relax legacy law_documents.law_name to nullable for current ORM inserts.

Revision ID: 005_law_documents_law_name
Revises: 004_align_current_models

The legacy initial schema required law_name NOT NULL without default, while
the current LawDocument ORM maps title/section/subsection instead. Real
ingestion from gesetze-im-internet.de supplies title but not law_name.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005_law_documents_law_name"
down_revision: Union[str, None] = "004_align_current_models"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Backfill any existing rows first so no data is lost.
    op.execute("UPDATE law_documents SET law_name = COALESCE(law_name, title, law_code)")
    op.alter_column("law_documents", "law_name", existing_type=sa.String(500), nullable=True)


def downgrade() -> None:
    op.execute("UPDATE law_documents SET law_name = COALESCE(law_name, title, law_code) WHERE law_name IS NULL")
    op.alter_column("law_documents", "law_name", existing_type=sa.String(500), nullable=False)
