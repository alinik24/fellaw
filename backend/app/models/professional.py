"""
Professional models – law firms, lawyer profiles, referrals, and reviews.

These models extend the citizen-facing Legal Aid system with a professional
(Rechtsanwalt / Kanzlei) layer that allows lawyers and law firms to:
  - Register and maintain a verified profile
  - Receive case referrals from citizens
  - Be matched by the AI engine based on specialisation and availability
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# ---------------------------------------------------------------------------
# LawFirm
# ---------------------------------------------------------------------------


class LawFirm(Base):
    __tablename__ = "law_firms"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(512), nullable=False)
    slug: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # List of case-type strings the firm handles, e.g. ["housing","criminal"]
    specializations: Mapped[list] = mapped_column(
        JSON, nullable=False, default=list
    )
    address: Mapped[str | None] = mapped_column(String(512), nullable=True)
    city: Mapped[str | None] = mapped_column(String(255), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    website: Mapped[str | None] = mapped_column(String(512), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    # Admin-verified firm (Kanzlei mit geprüftem Profil)
    verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # Computed from LawyerReview aggregation; stored denormalised for fast queries
    rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    review_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # Languages spoken by the firm, default German
    languages: Mapped[list] = mapped_column(
        JSON, nullable=False, default=lambda: ["de"]
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    lawyers: Mapped[list["LawyerProfile"]] = relationship(
        "LawyerProfile",
        back_populates="law_firm",
        cascade="all, delete-orphan",
        lazy="select",
    )
    referrals: Mapped[list["Referral"]] = relationship(
        "Referral",
        back_populates="law_firm",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<LawFirm id={self.id} name={self.name!r} slug={self.slug!r}>"


# ---------------------------------------------------------------------------
# LawyerProfile
# ---------------------------------------------------------------------------


class LawyerProfile(Base):
    __tablename__ = "lawyer_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # One-to-one: each User can have at most one LawyerProfile
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    # Nullable: solo practitioners have no affiliated firm
    law_firm_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("law_firms.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    # Academic / professional title (Dr., Prof., LL.M., etc.)
    title: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # German bar registration number (Zulassungsnummer / Anwaltsnummer)
    bar_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    # e.g. ["housing","criminal","immigration","employment"]
    specializations: Mapped[list] = mapped_column(
        JSON, nullable=False, default=list
    )
    languages: Mapped[list] = mapped_column(
        JSON, nullable=False, default=lambda: ["de"]
    )
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    years_experience: Mapped[int | None] = mapped_column(Integer, nullable=True)
    hourly_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    offers_free_consultation: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    consultation_fee: Mapped[float | None] = mapped_column(Float, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    # Admin-verified lawyer (zugelassener Rechtsanwalt bestätigt)
    verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    available_for_referrals: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
    # Denormalised from LawyerReview aggregation
    rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    review_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    cases_handled: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    user: Mapped["app.models.user.User"] = relationship(  # type: ignore[name-defined]
        "User", lazy="select"
    )
    law_firm: Mapped["LawFirm | None"] = relationship(
        "LawFirm", back_populates="lawyers", lazy="select"
    )
    referrals: Mapped[list["Referral"]] = relationship(
        "Referral",
        back_populates="lawyer_profile",
        cascade="all, delete-orphan",
        lazy="select",
    )
    reviews: Mapped[list["LawyerReview"]] = relationship(
        "LawyerReview",
        back_populates="lawyer_profile",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:
        return (
            f"<LawyerProfile id={self.id} user_id={self.user_id} "
            f"verified={self.verified}>"
        )


# ---------------------------------------------------------------------------
# Referral
# ---------------------------------------------------------------------------


class Referral(Base):
    """
    Represents a citizen's request for legal representation.

    A referral links a Case to a specific LawyerProfile (or LawFirm) and
    tracks the lifecycle from initial contact through acceptance/completion.
    Status values:
      pending   – created, not yet sent or reviewed
      sent      – forwarded to the lawyer / firm
      accepted  – lawyer confirmed they will take the case
      declined  – lawyer declined (reason in lawyer_response)
      completed – case engagement concluded
    """
    __tablename__ = "referrals"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # The citizen who originated the referral
    citizen_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Nullable: may be assigned to a firm without a specific lawyer
    lawyer_profile_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("lawyer_profiles.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    # Nullable: may target a specific lawyer directly without a firm
    law_firm_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("law_firms.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    # pending / sent / accepted / declined / completed
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )
    # low / medium / high / critical  (mirrors Case.urgency vocabulary)
    urgency: Mapped[str] = mapped_column(
        String(20), nullable=False, default="medium"
    )
    # Free-text message from citizen to lawyer
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Lawyer's reply / reason for declining
    lawyer_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    # self_referral / ai_matched / platform_assigned
    referral_type: Mapped[str] = mapped_column(
        String(30), nullable=False, default="self_referral"
    )
    estimated_fee: Mapped[float | None] = mapped_column(Float, nullable=True)
    accepted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
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

    # Relationships
    case: Mapped["app.models.case.Case"] = relationship(  # type: ignore[name-defined]
        "Case", lazy="select"
    )
    citizen_user: Mapped["app.models.user.User"] = relationship(  # type: ignore[name-defined]
        "User", foreign_keys=[citizen_user_id], lazy="select"
    )
    lawyer_profile: Mapped["LawyerProfile | None"] = relationship(
        "LawyerProfile", back_populates="referrals", lazy="select"
    )
    law_firm: Mapped["LawFirm | None"] = relationship(
        "LawFirm", back_populates="referrals", lazy="select"
    )

    def __repr__(self) -> str:
        return (
            f"<Referral id={self.id} case_id={self.case_id} "
            f"status={self.status!r}>"
        )


# ---------------------------------------------------------------------------
# LawyerReview
# ---------------------------------------------------------------------------


class LawyerReview(Base):
    """
    A citizen's rating and optional comment for a lawyer.

    Reviews can be submitted anonymously. The platform aggregates these into
    LawyerProfile.rating / review_count and LawFirm.rating / review_count.
    """
    __tablename__ = "lawyer_reviews"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    lawyer_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("lawyer_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reviewer_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Optional: link review to a specific case (adds authenticity signal)
    case_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="SET NULL"),
        nullable=True,
    )
    # Integer 1-5 star rating
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_anonymous: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    lawyer_profile: Mapped["LawyerProfile"] = relationship(
        "LawyerProfile", back_populates="reviews", lazy="select"
    )
    reviewer: Mapped["app.models.user.User"] = relationship(  # type: ignore[name-defined]
        "User", foreign_keys=[reviewer_user_id], lazy="select"
    )
    case: Mapped["app.models.case.Case | None"] = relationship(  # type: ignore[name-defined]
        "Case", lazy="select"
    )

    def __repr__(self) -> str:
        return (
            f"<LawyerReview id={self.id} lawyer_profile_id={self.lawyer_profile_id} "
            f"rating={self.rating}>"
        )
