from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

# pgvector type – imported here so it is registered with SQLAlchemy's type system.
from pgvector.sqlalchemy import Vector


class LawDocument(Base):
    __tablename__ = "law_documents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(1024), nullable=False)
    law_code: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        # BGB / StGB / StPO / ZPO / VwGO / AGG / SGB / ArbGG / MietG etc.
    )
    section: Mapped[str | None] = mapped_column(
        String(50), nullable=True, index=True  # § number
    )
    subsection: Mapped[str | None] = mapped_column(String(50), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    # 1536-dimensional vector for text-embedding-3-large
    embedding: Mapped[list[float] | None] = mapped_column(
        Vector(1536), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    metadata_: Mapped[dict] = mapped_column(
        "metadata", JSON, nullable=False, default=dict
    )
    scraped_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    def __repr__(self) -> str:
        return (
            f"<LawDocument id={self.id} law_code={self.law_code!r} "
            f"section={self.section!r} title={self.title!r}>"
        )


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    case_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str | None] = mapped_column(String(512), nullable=True)
    conversation_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="general",
        # general / legal_chat / narrative_builder / roadmap_generator /
        # counterargument / document_analysis
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    case: Mapped["app.models.case.Case | None"] = relationship(  # type: ignore[name-defined]
        "Case", back_populates="conversations"
    )
    user: Mapped["app.models.user.User"] = relationship(  # type: ignore[name-defined]
        "User", back_populates="conversations"
    )
    messages: Mapped[list["Message"]] = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at",
        lazy="select",
    )

    def __repr__(self) -> str:
        return (
            f"<Conversation id={self.id} type={self.conversation_type!r} "
            f"user_id={self.user_id}>"
        )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        # user / assistant / system
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    citations: Mapped[list] = mapped_column(
        JSON, nullable=False, default=list
        # list of dicts: {law_code, section, title, excerpt}
    )
    metadata_: Mapped[dict] = mapped_column(
        "metadata", JSON, nullable=False, default=dict
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    conversation: Mapped["Conversation"] = relationship(
        "Conversation", back_populates="messages"
    )

    def __repr__(self) -> str:
        snippet = self.content[:40].replace("\n", " ")
        return f"<Message id={self.id} role={self.role!r} content={snippet!r}>"
