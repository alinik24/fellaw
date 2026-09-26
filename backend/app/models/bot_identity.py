"""Channel-identity -> FelLaw-user mapping for the Telegram/OpenClaw bot.

One row per (channel, channel_user_id). This is the audit surface for bot
identity: pairing is explicit, revocable (unlinked_at), and never inferred
from chat content or client-claimed roles.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class BotIdentity(Base):
    __tablename__ = "bot_identities"
    __table_args__ = (UniqueConstraint("channel", "channel_user_id", name="uq_bot_identity_channel_user"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    channel: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    channel_user_id: Mapped[str] = mapped_column(String(128), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    linked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    unlinked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:
        return f"<BotIdentity {self.channel}:{self.channel_user_id} -> user {self.user_id}>"
