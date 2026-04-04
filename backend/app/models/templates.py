"""Self-service legal document templates models."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DocumentTemplate(Base):
    """Legal document templates for self-service generation."""

    __tablename__ = "document_templates"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Template details
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Category and type
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    # e.g., contracts, letters, notices, complaints, applications

    document_type: Mapped[str] = mapped_column(String(100), nullable=False)
    # e.g., rental_agreement, termination_letter, complaint_letter, visa_application

    # Template content
    template_content: Mapped[str] = mapped_column(Text, nullable=False)
    # Jinja2 template with placeholders

    # Required fields for the template
    required_fields: Mapped[list[dict] | None] = mapped_column(JSON, nullable=True)
    # [{"name": "tenant_name", "type": "text", "label": "Tenant Name", "required": true}, ...]

    # Optional conditional logic
    conditional_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Guidance text
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    legal_disclaimer: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Output format: pdf, docx, txt
    output_format: Mapped[str] = mapped_column(String(10), nullable=False, default="pdf")

    # Language
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="de")

    # Metadata
    jurisdiction: Mapped[str | None] = mapped_column(String(100), nullable=True)  # e.g., "Germany", "NRW"
    applicable_laws: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)

    # Pricing (if premium)
    is_free: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    price: Mapped[int | None] = mapped_column(Integer, nullable=True)  # cents

    # Usage stats
    usage_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    average_rating: Mapped[float | None] = mapped_column(JSON, nullable=True)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )


class GeneratedDocument(Base):
    """Documents generated from templates by users."""

    __tablename__ = "generated_documents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("document_templates.id", ondelete="CASCADE"),
        nullable=False,
    )

    # User-provided data for template
    template_data: Mapped[dict] = mapped_column(JSON, nullable=False)

    # Generated document
    file_url: Mapped[str] = mapped_column(String(512), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)  # bytes

    # Status: generating, ready, downloaded, deleted
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="ready")

    # Optional case association
    case_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Download tracking
    download_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_downloaded_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user: Mapped["app.models.user.User"] = relationship("User", back_populates="generated_documents")  # type: ignore
    template: Mapped["DocumentTemplate"] = relationship("DocumentTemplate")


class TemplateReview(Base):
    """User reviews and ratings for document templates."""

    __tablename__ = "template_reviews"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("document_templates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Rating (1-5)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)

    # Review
    review_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Was it helpful?
    was_helpful: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    template: Mapped["DocumentTemplate"] = relationship("DocumentTemplate")
    user: Mapped["app.models.user.User"] = relationship("User")  # type: ignore
