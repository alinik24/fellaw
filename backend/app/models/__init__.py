"""
Import all ORM models so that:
  1. SQLAlchemy's mapper registry is fully populated before create_all() is called.
  2. Relationship back-references resolve correctly across modules.
"""

from app.models.user import User  # noqa: F401
from app.models.case import Case, Narrative, RoadmapStep, TimelineEvent  # noqa: F401
from app.models.evidence import Document, Evidence  # noqa: F401
from app.models.law_document import Conversation, LawDocument, Message  # noqa: F401
from app.models.forum_post import ForumPost  # noqa: F401
from app.models.professional import LawFirm, LawyerProfile, Referral, LawyerReview  # noqa: F401

__all__ = [
    "User",
    "Case",
    "TimelineEvent",
    "Narrative",
    "RoadmapStep",
    "Evidence",
    "Document",
    "LawDocument",
    "Conversation",
    "Message",
    "ForumPost",
    "LawFirm",
    "LawyerProfile",
    "Referral",
    "LawyerReview",
]
