from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Message
# ---------------------------------------------------------------------------


class MessageCreate(BaseModel):
    content: str = Field(min_length=1)
    conversation_id: uuid.UUID | None = None
    case_id: uuid.UUID | None = None
    conversation_type: str = Field(
        default="general",
        max_length=50,
        description=(
            "general | legal_chat | narrative_builder | roadmap_generator | "
            "counterargument | document_analysis"
        ),
    )


class MessageResponse(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    citations: list[dict[str, Any]]
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Conversation
# ---------------------------------------------------------------------------


class ConversationCreate(BaseModel):
    case_id: uuid.UUID | None = None
    title: str | None = Field(default=None, max_length=512)
    conversation_type: str = Field(
        default="general",
        max_length=50,
        description=(
            "general | legal_chat | narrative_builder | roadmap_generator | "
            "counterargument | document_analysis"
        ),
    )


class ConversationResponse(BaseModel):
    id: uuid.UUID
    case_id: uuid.UUID | None
    user_id: uuid.UUID
    title: str | None
    conversation_type: str
    created_at: datetime
    updated_at: datetime
    messages: list[MessageResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Chat request (streaming or non-streaming)
# ---------------------------------------------------------------------------


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    conversation_id: uuid.UUID | None = None
    case_id: uuid.UUID | None = None
    conversation_type: str = Field(
        default="legal_chat",
        max_length=50,
        description=(
            "general | legal_chat | narrative_builder | roadmap_generator | "
            "counterargument | document_analysis"
        ),
    )
    stream: bool = False


# ---------------------------------------------------------------------------
# Law / RAG search
# ---------------------------------------------------------------------------


class LawSearchRequest(BaseModel):
    query: str = Field(min_length=1)
    law_codes: list[str] = Field(
        default_factory=list,
        description="Filter by specific law codes, e.g. ['BGB', 'StGB']. Empty = all.",
    )
    limit: int = Field(default=5, ge=1, le=50)


class LawDocumentResponse(BaseModel):
    id: uuid.UUID
    title: str
    law_code: str
    section: str | None
    content: str
    url: str | None
    relevance_score: float = Field(
        default=0.0,
        description="Cosine similarity score from vector search (0–1).",
    )

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Specialised AI request schemas
# ---------------------------------------------------------------------------


class NarrativeRequest(BaseModel):
    case_id: uuid.UUID
    narrative_type: str = Field(
        max_length=50,
        description=(
            "police_statement | court_brief | letter_to_opposing | "
            "formal_complaint | witness_statement"
        ),
    )
    language: str = Field(default="de", max_length=10)
    additional_context: str | None = Field(
        default=None,
        description="Any extra details the user wants to include in the narrative.",
    )


class RoadmapRequest(BaseModel):
    case_id: uuid.UUID
    context: str | None = Field(
        default=None,
        description="Optional extra context to guide roadmap generation.",
    )


class CounterargumentRequest(BaseModel):
    case_id: uuid.UUID
    opponent_claims: str = Field(
        min_length=1,
        description="The opposing party's arguments or claims, as free text.",
    )
    context: str | None = Field(
        default=None,
        description="Additional background information relevant to the analysis.",
    )
