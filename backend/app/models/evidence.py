from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Evidence(Base):
    __tablename__ = "evidence"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    evidence_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        # document / photo / video / audio / digital / witness / physical / correspondence
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    file_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    file_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    event_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    # is_favorable: True = supports user, False = against user, None = neutral/unknown
    is_favorable: Mapped[bool | None] = mapped_column(
        # Using Integer column to allow NULL (None/True/False)
        Integer, nullable=True
    )
    strength: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="moderate",
        # weak / moderate / strong
    )
    tags: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    metadata_: Mapped[dict] = mapped_column(
        "metadata", JSON, nullable=False, default=dict
    )
    analysis: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    case: Mapped["app.models.case.Case"] = relationship(  # type: ignore[name-defined]
        "Case", back_populates="evidence_items"
    )

    def __repr__(self) -> str:
        return (
            f"<Evidence id={self.id} title={self.title!r} "
            f"type={self.evidence_type!r} strength={self.strength!r}>"
        )


class Document(Base):
    __tablename__ = "documents"

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
    original_filename: Mapped[str] = mapped_column(String(512), nullable=False)
    stored_filename: Mapped[str] = mapped_column(String(512), nullable=False)
    file_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_analysis: Mapped[str | None] = mapped_column(Text, nullable=True)
    document_category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="other",
        # police_report / court_letter / contract / id_document / medical /
        # financial / correspondence / other
    )
    processing_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pending",
        # pending / processing / completed / failed
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    case: Mapped["app.models.case.Case | None"] = relationship(  # type: ignore[name-defined]
        "Case", back_populates="documents"
    )
    user: Mapped["app.models.user.User"] = relationship(  # type: ignore[name-defined]
        "User", back_populates="documents"
    )

    def __repr__(self) -> str:
        return (
            f"<Document id={self.id} filename={self.original_filename!r} "
            f"status={self.processing_status!r}>"
        )
