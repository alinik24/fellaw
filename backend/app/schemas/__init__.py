"""
Re-export all Pydantic schemas for convenient top-level imports.
"""

from app.schemas.user import (  # noqa: F401
    GuestSession,
    Token,
    UserCreate,
    UserLogin,
    UserResponse,
    UserUpdate,
)
from app.schemas.case import (  # noqa: F401
    CaseCreate,
    CaseResponse,
    CaseUpdate,
    DocumentResponse,
    EvidenceCreate,
    EvidenceResponse,
    EvidenceUpdate,
    NarrativeCreate,
    NarrativeResponse,
    RoadmapStepCreate,
    RoadmapStepResponse,
    RoadmapStepUpdate,
    TimelineEventCreate,
    TimelineEventResponse,
)
from app.schemas.chat import (  # noqa: F401
    ChatRequest,
    ConversationCreate,
    ConversationResponse,
    CounterargumentRequest,
    LawDocumentResponse,
    LawSearchRequest,
    MessageCreate,
    MessageResponse,
    NarrativeRequest,
    RoadmapRequest,
)

__all__ = [
    # user
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "UserUpdate",
    "Token",
    "GuestSession",
    # case
    "CaseCreate",
    "CaseUpdate",
    "CaseResponse",
    "TimelineEventCreate",
    "TimelineEventResponse",
    "NarrativeCreate",
    "NarrativeResponse",
    "RoadmapStepCreate",
    "RoadmapStepUpdate",
    "RoadmapStepResponse",
    "EvidenceCreate",
    "EvidenceUpdate",
    "EvidenceResponse",
    "DocumentResponse",
    # chat
    "MessageCreate",
    "MessageResponse",
    "ConversationCreate",
    "ConversationResponse",
    "ChatRequest",
    "LawSearchRequest",
    "LawDocumentResponse",
    "NarrativeRequest",
    "RoadmapRequest",
    "CounterargumentRequest",
]
