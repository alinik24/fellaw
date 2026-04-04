"""Notifications and user alerts models."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, JSON, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Notification(Base):
    """User notifications and alerts."""

    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Notification type: case_update, message, deadline, lawyer_response, etc.
    notification_type: Mapped[str] = mapped_column(String(50), nullable=False)

    # Title and message
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    # Related entity
    related_entity_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # e.g., "case", "message", "document"
    related_entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    # Link/action
    action_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    action_label: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Additional data
    extra_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Status
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Priority: low, medium, high, urgent
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="medium")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    user: Mapped["app.models.user.User"] = relationship("User", back_populates="notifications")  # type: ignore


class UserActivity(Base):
    """Track user activity for analytics."""

    __tablename__ = "user_activities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,  # Allow anonymous tracking
        index=True,
    )

    # Session tracking
    session_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)

    # Activity details
    activity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # e.g., page_view, case_created, document_uploaded, chat_message, etc.

    activity_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Context
    page_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    referrer: Mapped[str | None] = mapped_column(String(512), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Geo
    ip_address: Mapped[str | None] = mapped_column(String(50), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )

    # Relationships
    user: Mapped["app.models.user.User"] = relationship("User")  # type: ignore
