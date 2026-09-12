"""Bot identity mapping table.

Revision ID: 006_bot_identities
Revises: 005_law_documents_law_name
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "006_bot_identities"
down_revision: Union[str, None] = "005_law_documents_law_name"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "bot_identities",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("channel", sa.String(32), nullable=False),
        sa.Column("channel_user_id", sa.String(128), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("linked_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("unlinked_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("last_seen_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.UniqueConstraint("channel", "channel_user_id", name="uq_bot_identity_channel_user"),
    )
    op.create_index("ix_bot_identities_channel", "bot_identities", ["channel"])
    op.create_index("ix_bot_identities_user_id", "bot_identities", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_bot_identities_user_id", table_name="bot_identities")
    op.drop_index("ix_bot_identities_channel", table_name="bot_identities")
    op.drop_table("bot_identities")
