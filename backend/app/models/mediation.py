"""Mediation and alternative dispute resolution models."""
from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, JSON, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Mediator(Base):
    """Certified mediators available on the platform."""

    __tablename__ = "mediators"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Personal details
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Professional details
    certification_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    certifying_body: Mapped[str | None] = mapped_column(String(255), nullable=True)
    years_experience: Mapped[int | None] = mapped_column(Numeric, nullable=True)

    # Specializations
    specializations: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    # e.g., ["family", "commercial", "employment", "landlord_tenant"]

    # Languages
    languages: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)

    # Location
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Rates
    hourly_rate: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    # Profile
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    profile_image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Ratings
    average_rating: Mapped[Decimal | None] = mapped_column(Numeric(3, 2), nullable=True)
    total_mediations: Mapped[int] = mapped_column(Numeric, nullable=False, default=0)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )


class MediationRequest(Base):
    """Mediation service requests from users."""

    __tablename__ = "mediation_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    case_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Request details
    dispute_type: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    # Parties involved
    other_party_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    other_party_contact: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Preferences
    preferred_mediator_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("mediators.id", ondelete="SET NULL"),
        nullable=True,
    )
    preferred_language: Mapped[str | None] = mapped_column(String(10), nullable=True)
    preferred_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Status: pending, matched, scheduled, in_progress, completed, cancelled
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user: Mapped["app.models.user.User"] = relationship("User")  # type: ignore
    preferred_mediator: Mapped["Mediator"] = relationship("Mediator", foreign_keys=[preferred_mediator_id])


class MediationSession(Base):
    """Active or completed mediation sessions."""

    __tablename__ = "mediation_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    mediation_request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("mediation_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    mediator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("mediators.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Session details
    session_number: Mapped[int] = mapped_column(Numeric, nullable=False, default=1)
    scheduled_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    duration_minutes: Mapped[int | None] = mapped_column(Numeric, nullable=True)

    # Session type: video, in_person, phone
    session_type: Mapped[str] = mapped_column(String(50), nullable=False, default="video")

    # Video conference details (if applicable)
    meeting_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    meeting_password: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Location (if in-person)
    location: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Notes and outcome
    mediator_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    outcome: Mapped[str | None] = mapped_column(String(50), nullable=True)  # agreement, no_agreement, adjourned
    agreement_reached: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    agreement_document_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Status: scheduled, in_progress, completed, cancelled
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="scheduled")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    mediation_request: Mapped["MediationRequest"] = relationship("MediationRequest")
    mediator: Mapped["Mediator"] = relationship("Mediator")


class MediationReview(Base):
    """User reviews of mediation sessions."""

    __tablename__ = "mediation_reviews"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("mediation_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    mediator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("mediators.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Rating (1-5 stars)
    rating: Mapped[int] = mapped_column(Numeric, nullable=False)

    # Review text
    review_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Would recommend?
    would_recommend: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    user: Mapped["app.models.user.User"] = relationship("User")  # type: ignore
    mediator: Mapped["Mediator"] = relationship("Mediator")
