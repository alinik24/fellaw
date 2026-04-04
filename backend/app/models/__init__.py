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
from app.models.emergency import EmergencyCase, EmergencyContact  # noqa: F401
from app.models.insurance import InsurancePartner, InsuranceCoverage, InsuranceQuery  # noqa: F401
from app.models.mediation import Mediator, MediationRequest, MediationSession, MediationReview  # noqa: F401
from app.models.careers import JobPosting, JobApplication  # noqa: F401
from app.models.templates import DocumentTemplate, GeneratedDocument, TemplateReview  # noqa: F401
from app.models.notifications import Notification, UserActivity  # noqa: F401

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
    "EmergencyCase",
    "EmergencyContact",
    "InsurancePartner",
    "InsuranceCoverage",
    "InsuranceQuery",
    "Mediator",
    "MediationRequest",
    "MediationSession",
    "MediationReview",
    "JobPosting",
    "JobApplication",
    "DocumentTemplate",
    "GeneratedDocument",
    "TemplateReview",
    "Notification",
    "UserActivity",
]
