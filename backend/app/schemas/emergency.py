"""Pydantic schemas for emergency cases."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class EmergencyCaseCreate(BaseModel):
    """Create emergency case request."""

    emergency_type: str = Field(..., max_length=50)
    description: str
    location: Optional[str] = Field(None, max_length=512)
    contact_phone: Optional[str] = Field(None, max_length=50)
    contact_email: Optional[EmailStr] = None
    urgency_level: int = Field(default=3, ge=1, le=5)


class EmergencyCaseResponse(BaseModel):
    """Emergency case response."""

    id: UUID
    user_id: Optional[UUID]
    case_id: Optional[UUID]
    emergency_type: str
    urgency_level: int
    description: str
    location: Optional[str]
    contact_phone: Optional[str]
    contact_email: Optional[str]
    status: str
    immediate_advice: Optional[dict]
    assigned_lawyer_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EmergencyContactResponse(BaseModel):
    """Emergency contact information."""

    id: UUID
    contact_type: str
    region: Optional[str]
    name: str
    phone: Optional[str]
    email: Optional[str]
    website: Optional[str]
    available_24_7: bool
    availability_hours: Optional[str]
    languages: Optional[list[str]]

    class Config:
        from_attributes = True
