"""Emergency legal assistance models."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class EmergencyCase(Base):
    """Emergency/urgent legal cases with priority handling."""

    __tablename__ = "emergency_cases"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,  # Allow anonymous emergency submissions
        index=True,
    )
    case_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="SET NULL"),
        nullable=True,  # Linked case (created after emergency triage)
        index=True,
    )

    # Emergency type: police_stop, accident, assault, arrest, domestic_violence, eviction
    emergency_type: Mapped[str] = mapped_column(String(50), nullable=False)

    # Triage level: 1 (critical) to 5 (low)
    urgency_level: Mapped[int] = mapped_column(Integer, nullable=False, default=3)

    # Emergency details
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str | None] = mapped_column(String(512), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Status: pending, lawyer_notified, in_progress, resolved, escalated
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")

    # AI-generated immediate advice
    immediate_advice: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Lawyer assignment
    assigned_lawyer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("lawyer_profiles.id", ondelete="SET NULL"),
        nullable=True,
    )
    assigned_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Response time tracking
    first_response_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user: Mapped["app.models.user.User"] = relationship("User", foreign_keys=[user_id])  # type: ignore
    assigned_lawyer: Mapped["app.models.professional.LawyerProfile"] = relationship(  # type: ignore
        "LawyerProfile", foreign_keys=[assigned_lawyer_id]
    )


class EmergencyContact(Base):
    """Emergency hotline and contact information."""

    __tablename__ = "emergency_contacts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Contact type: hotline, on_call_lawyer, emergency_service, support
    contact_type: Mapped[str] = mapped_column(String(50), nullable=False)

    # Region/jurisdiction
    region: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Contact details
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    website: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Availability
    available_24_7: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    availability_hours: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Languages supported
    languages: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
