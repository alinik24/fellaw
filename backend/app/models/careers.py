"""Careers and job posting models."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class JobPosting(Base):
    """Job openings at fellaw."""

    __tablename__ = "job_postings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Job details
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    # e.g., Engineering, Legal Operations, Customer Success, Marketing

    location: Mapped[str] = mapped_column(String(255), nullable=False)
    # e.g., Paderborn, Remote, Hybrid

    employment_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # full_time, part_time, contract, internship

    experience_level: Mapped[str] = mapped_column(String(50), nullable=False)
    # entry, mid, senior, lead, executive

    # Description
    description: Mapped[str] = mapped_column(Text, nullable=False)
    responsibilities: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    qualifications: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    benefits: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)

    # Salary
    salary_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salary_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salary_currency: Mapped[str] = mapped_column(String(3), nullable=False, default="EUR")

    # Skills/tags
    required_skills: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    preferred_skills: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    positions_available: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    # Dates
    posted_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    application_deadline: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )


class JobApplication(Base):
    """Job applications submitted by candidates."""

    __tablename__ = "job_applications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    job_posting_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("job_postings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Applicant details
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Application materials
    resume_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    cover_letter: Mapped[str | None] = mapped_column(Text, nullable=True)
    portfolio_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    linkedin_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Additional info
    years_experience: Mapped[int | None] = mapped_column(Integer, nullable=True)
    current_location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    willing_to_relocate: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    notice_period: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Expected salary
    expected_salary: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Custom questions answers
    custom_answers: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Status: submitted, under_review, interview_scheduled, rejected, offer_made, hired
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="submitted")

    # Notes (internal)
    internal_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    job_posting: Mapped["JobPosting"] = relationship("JobPosting")
