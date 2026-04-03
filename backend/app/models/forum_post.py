"""
SQLAlchemy ORM model for forum_posts table.

Stores scraped German legal forum content from Reddit, Gutefrage, Anwalt.de,
Rechtsforum.at, and Jura-Forum.de — used by the RAG pipeline to surface
real user experiences alongside authoritative law sections.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Integer, JSON, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from pgvector.sqlalchemy import Vector


class ForumPost(Base):
    __tablename__ = "forum_posts"

    # Enforce source_id uniqueness per source platform so that re-runs of
    # the scraper are fully idempotent.
    __table_args__ = (
        UniqueConstraint("source", "source_id", name="uq_forum_post_source_source_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Platform identifier
    # Allowed values: reddit | legal_forum | gutefrage | jura_forum | anwalt_de
    source: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    # Original post ID from the source platform (e.g. Reddit post ID t3_xxxxx)
    source_id: Mapped[str] = mapped_column(String(256), nullable=False, index=True)

    title: Mapped[str] = mapped_column(String(1024), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    url: Mapped[str | None] = mapped_column(String(2048), nullable=True)

    # For Reddit: "r/germany"; for forums: "Mietrecht", "Strafrecht", etc.
    subreddit_or_category: Mapped[str | None] = mapped_column(
        String(256), nullable=True, index=True
    )

    # Detected legal domain
    # Values: housing | criminal | civil | employment | immigration | traffic | family | general
    case_type: Mapped[str | None] = mapped_column(
        String(64), nullable=True, index=True
    )

    upvotes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    comment_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # ISO 639-1 language code; almost always 'de'
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="de")

    # 1536-dimensional embedding from text-embedding-3-large
    embedding: Mapped[list[float] | None] = mapped_column(Vector(1536), nullable=True)

    # Free-form keyword tags extracted during scraping
    tags: Mapped[list] = mapped_column(JSON, nullable=False, default=list)

    scraped_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<ForumPost id={self.id} source={self.source!r} "
            f"case_type={self.case_type!r} title={self.title[:40]!r}>"
        )
