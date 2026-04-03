from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# TimelineEvent
# ---------------------------------------------------------------------------


class TimelineEventCreate(BaseModel):
    title: str = Field(max_length=512)
    description: str | None = None
    event_date: datetime
    event_type: str = Field(
        max_length=50,
        description=(
            "incident | police_contact | letter_received | court_hearing | "
            "evidence_collected | witness_statement | deadline | other"
        ),
    )
    is_key_event: bool = False
    source: str | None = Field(default=None, max_length=512)


class TimelineEventResponse(BaseModel):
    id: uuid.UUID
    case_id: uuid.UUID
    title: str
    description: str | None
    event_date: datetime
    event_type: str
    is_key_event: bool
    source: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Narrative
# ---------------------------------------------------------------------------


class NarrativeCreate(BaseModel):
    narrative_type: str = Field(
        max_length=50,
        description=(
            "police_statement | court_brief | letter_to_opposing | "
            "formal_complaint | witness_statement"
        ),
    )
    content: str
    language: str = Field(default="de", max_length=10)
    version: int = Field(default=1, ge=1)
    is_final: bool = False


class NarrativeResponse(BaseModel):
    id: uuid.UUID
    case_id: uuid.UUID
    narrative_type: str
    content: str
    language: str
    version: int
    is_final: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# RoadmapStep
# ---------------------------------------------------------------------------


class RoadmapStepCreate(BaseModel):
    step_number: int = Field(ge=1)
    title: str = Field(max_length=512)
    description: str
    action_items: list[str] = Field(default_factory=list)
    deadline: date | None = None
    status: str = Field(
        default="pending",
        max_length=20,
        description="pending | in_progress | completed | skipped",
    )
    priority: str = Field(
        default="medium",
        max_length=20,
        description="low | medium | high",
    )
    resources: list[dict[str, Any]] = Field(default_factory=list)


class RoadmapStepUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=512)
    description: str | None = None
    action_items: list[str] | None = None
    deadline: date | None = None
    status: str | None = Field(default=None, max_length=20)
    priority: str | None = Field(default=None, max_length=20)
    resources: list[dict[str, Any]] | None = None


class RoadmapStepResponse(BaseModel):
    id: uuid.UUID
    case_id: uuid.UUID
    step_number: int
    title: str
    description: str
    action_items: list[str]
    deadline: date | None
    status: str
    priority: str
    resources: list[dict[str, Any]]
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Case
# ---------------------------------------------------------------------------


class CaseCreate(BaseModel):
    title: str = Field(max_length=512)
    case_type: str = Field(
        max_length=50,
        description=(
            "criminal | civil | administrative | traffic | housing | "
            "employment | family"
        ),
    )
    status: str = Field(
        default="active",
        max_length=20,
        description="active | pending | closed | won | lost",
    )
    description: str | None = None
    incident_date: date | None = None
    location: str | None = Field(default=None, max_length=512)
    opposing_party: str | None = Field(default=None, max_length=512)
    opposing_party_lawyer: str | None = Field(default=None, max_length=512)
    court_name: str | None = Field(default=None, max_length=512)
    case_number: str | None = Field(default=None, max_length=255)
    urgency: str = Field(
        default="medium",
        max_length=20,
        description="low | medium | high | critical",
    )


class CaseUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=512)
    case_type: str | None = Field(default=None, max_length=50)
    status: str | None = Field(default=None, max_length=20)
    description: str | None = None
    incident_date: date | None = None
    location: str | None = Field(default=None, max_length=512)
    opposing_party: str | None = Field(default=None, max_length=512)
    opposing_party_lawyer: str | None = Field(default=None, max_length=512)
    court_name: str | None = Field(default=None, max_length=512)
    case_number: str | None = Field(default=None, max_length=255)
    urgency: str | None = Field(default=None, max_length=20)


class CaseResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    case_type: str
    status: str
    description: str | None
    incident_date: date | None
    location: str | None
    opposing_party: str | None
    opposing_party_lawyer: str | None
    court_name: str | None
    case_number: str | None
    urgency: str
    created_at: datetime
    updated_at: datetime
    timeline_events: list[TimelineEventResponse] = Field(default_factory=list)
    roadmap_steps: list[RoadmapStepResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Evidence
# ---------------------------------------------------------------------------


class EvidenceCreate(BaseModel):
    title: str = Field(max_length=512)
    evidence_type: str = Field(
        max_length=50,
        description=(
            "document | photo | video | audio | digital | witness | "
            "physical | correspondence"
        ),
    )
    description: str | None = None
    file_path: str | None = Field(default=None, max_length=1024)
    file_type: str | None = Field(default=None, max_length=100)
    file_size: int | None = Field(default=None, ge=0)
    event_date: datetime | None = None
    is_favorable: bool | None = None
    strength: str = Field(
        default="moderate",
        max_length=20,
        description="weak | moderate | strong",
    )
    tags: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class EvidenceUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=512)
    evidence_type: str | None = Field(default=None, max_length=50)
    description: str | None = None
    event_date: datetime | None = None
    is_favorable: bool | None = None
    strength: str | None = Field(default=None, max_length=20)
    tags: list[str] | None = None
    metadata: dict[str, Any] | None = None
    analysis: str | None = None


class EvidenceResponse(BaseModel):
    id: uuid.UUID
    case_id: uuid.UUID
    title: str
    evidence_type: str
    description: str | None
    file_path: str | None
    file_type: str | None
    file_size: int | None
    event_date: datetime | None
    is_favorable: bool | None
    strength: str
    tags: list[str]
    metadata: dict[str, Any] = Field(default_factory=dict)
    analysis: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Document
# ---------------------------------------------------------------------------


class DocumentResponse(BaseModel):
    id: uuid.UUID
    case_id: uuid.UUID | None
    user_id: uuid.UUID
    original_filename: str
    stored_filename: str
    file_path: str
    mime_type: str
    file_size: int
    extracted_text: str | None
    ai_analysis: str | None
    document_category: str
    processing_status: str
    created_at: datetime

    model_config = {"from_attributes": True}
