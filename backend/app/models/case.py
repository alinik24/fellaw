from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    case_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        # criminal / civil / administrative / traffic / housing / employment / family
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="active",
        # active / pending / closed / won / lost
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    incident_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    location: Mapped[str | None] = mapped_column(String(512), nullable=True)
    opposing_party: Mapped[str | None] = mapped_column(String(512), nullable=True)
    opposing_party_lawyer: Mapped[str | None] = mapped_column(
        String(512), nullable=True
    )
    court_name: Mapped[str | None] = mapped_column(String(512), nullable=True)
    case_number: Mapped[str | None] = mapped_column(String(255), nullable=True)
    urgency: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="medium",
        # low / medium / high / critical
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
    user: Mapped["app.models.user.User"] = relationship(  # type: ignore[name-defined]
        "User", back_populates="cases"
    )
    timeline_events: Mapped[list["TimelineEvent"]] = relationship(
        "TimelineEvent",
        back_populates="case",
        cascade="all, delete-orphan",
        order_by="TimelineEvent.event_date",
        lazy="select",
    )
    narratives: Mapped[list["Narrative"]] = relationship(
        "Narrative",
        back_populates="case",
        cascade="all, delete-orphan",
        lazy="select",
    )
    roadmap_steps: Mapped[list["RoadmapStep"]] = relationship(
        "RoadmapStep",
        back_populates="case",
        cascade="all, delete-orphan",
        order_by="RoadmapStep.step_number",
        lazy="select",
    )
    evidence_items: Mapped[list] = relationship(
        "Evidence",
        back_populates="case",
        cascade="all, delete-orphan",
        lazy="select",
    )
    documents: Mapped[list] = relationship(
        "Document",
        back_populates="case",
        cascade="all, delete-orphan",
        lazy="select",
    )
    conversations: Mapped[list] = relationship(
        "Conversation",
        back_populates="case",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<Case id={self.id} title={self.title!r} status={self.status!r}>"


class TimelineEvent(Base):
    __tablename__ = "timeline_events"

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
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    event_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    event_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        # incident / police_contact / letter_received / court_hearing /
        # evidence_collected / witness_statement / deadline / other
    )
    is_key_event: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    source: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    case: Mapped["Case"] = relationship("Case", back_populates="timeline_events")

    def __repr__(self) -> str:
        return (
            f"<TimelineEvent id={self.id} title={self.title!r} "
            f"event_date={self.event_date!r}>"
        )


class Narrative(Base):
    __tablename__ = "narratives"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    narrative_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        # police_statement / court_brief / letter_to_opposing /
        # formal_complaint / witness_statement
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="de")
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    is_final: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    case: Mapped["Case"] = relationship("Case", back_populates="narratives")

    def __repr__(self) -> str:
        return (
            f"<Narrative id={self.id} type={self.narrative_type!r} "
            f"version={self.version}>"
        )


class RoadmapStep(Base):
    __tablename__ = "roadmap_steps"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    step_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    action_items: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pending",
        # pending / in_progress / completed / skipped
    )
    priority: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="medium",
        # low / medium / high
    )
    resources: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    case: Mapped["Case"] = relationship("Case", back_populates="roadmap_steps")

    def __repr__(self) -> str:
        return (
            f"<RoadmapStep id={self.id} step_number={self.step_number} "
            f"title={self.title!r} status={self.status!r}>"
        )
