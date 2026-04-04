"""Pydantic schemas for insurance."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class InsurancePartnerResponse(BaseModel):
    """Insurance partner info."""

    id: UUID
    name: str
    description: Optional[str]
    logo_url: Optional[str]
    website: Optional[str]
    specialties: Optional[list[str]]
    is_active: bool

    class Config:
        from_attributes = True


class InsuranceQueryCreate(BaseModel):
    """Create insurance query."""

    case_id: Optional[UUID] = None
    query_type: str = Field(..., max_length=50)
    case_type: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None


class InsuranceQueryResponse(BaseModel):
    """Insurance query response."""

    id: UUID
    user_id: UUID
    case_id: Optional[UUID]
    query_type: str
    case_type: Optional[str]
    description: Optional[str]
    is_covered: Optional[bool]
    coverage_details: Optional[dict]
    response_text: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
