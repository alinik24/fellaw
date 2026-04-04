"""Pydantic schemas for mediation."""
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class MediatorResponse(BaseModel):
    """Mediator profile."""

    id: UUID
    first_name: str
    last_name: str
    email: EmailStr
    specializations: Optional[list[str]]
    languages: Optional[list[str]]
    city: Optional[str]
    state: Optional[str]
    hourly_rate: Optional[Decimal]
    bio: Optional[str]
    profile_image_url: Optional[str]
    average_rating: Optional[Decimal]
    total_mediations: int
    is_active: bool

    class Config:
        from_attributes = True


class MediationRequestCreate(BaseModel):
    """Create mediation request."""

    case_id: Optional[UUID] = None
    dispute_type: str = Field(..., max_length=100)
    description: str
    other_party_name: Optional[str] = Field(None, max_length=255)
    other_party_contact: Optional[str] = Field(None, max_length=255)
    preferred_mediator_id: Optional[UUID] = None
    preferred_language: Optional[str] = Field(None, max_length=10)
    preferred_date: Optional[datetime] = None


class MediationRequestResponse(BaseModel):
    """Mediation request response."""

    id: UUID
    user_id: UUID
    case_id: Optional[UUID]
    dispute_type: str
    description: str
    other_party_name: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class MediationSessionResponse(BaseModel):
    """Mediation session details."""

    id: UUID
    mediation_request_id: UUID
    mediator_id: UUID
    session_number: int
    scheduled_date: datetime
    duration_minutes: Optional[int]
    session_type: str
    meeting_url: Optional[str]
    location: Optional[str]
    outcome: Optional[str]
    agreement_reached: bool
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
