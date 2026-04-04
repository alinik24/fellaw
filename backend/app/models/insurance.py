"""Legal insurance integration models."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, JSON, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class InsurancePartner(Base):
    """Legal insurance company partners."""

    __tablename__ = "insurance_partners"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Company details
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    website: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Coverage specialties (list of legal areas covered)
    specialties: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)

    # API integration
    has_api_integration: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    api_endpoint: Mapped[str | None] = mapped_column(String(512), nullable=True)
    api_credentials: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # Encrypted

    # Partnership details
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    partnership_start_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )


class InsuranceCoverage(Base):
    """User's insurance coverage details."""

    __tablename__ = "insurance_coverage"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    partner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("insurance_partners.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Policy details
    policy_number: Mapped[str] = mapped_column(String(100), nullable=False)
    policy_holder_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Coverage details
    coverage_areas: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    coverage_limit: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Validity
    valid_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user: Mapped["app.models.user.User"] = relationship("User", back_populates="insurance_policies")  # type: ignore
    partner: Mapped["InsurancePartner"] = relationship("InsurancePartner")


class InsuranceQuery(Base):
    """Insurance coverage check requests."""

    __tablename__ = "insurance_queries"

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
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=True,
    )

    # Query details
    query_type: Mapped[str] = mapped_column(String(50), nullable=False)  # check_coverage, file_claim
    case_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Response
    is_covered: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    coverage_details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    response_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Status: pending, checked, covered, not_covered, claim_filed
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user: Mapped["app.models.user.User"] = relationship("User")  # type: ignore
