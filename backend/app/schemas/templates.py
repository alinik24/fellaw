"""Pydantic schemas for document templates."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class DocumentTemplateResponse(BaseModel):
    """Document template info."""

    id: UUID
    name: str
    description: Optional[str]
    category: str
    document_type: str
    required_fields: Optional[list[dict]]
    instructions: Optional[str]
    legal_disclaimer: Optional[str]
    output_format: str
    language: str
    jurisdiction: Optional[str]
    applicable_laws: Optional[list[str]]
    is_free: bool
    price: Optional[int]
    usage_count: int
    average_rating: Optional[float]
    is_active: bool

    class Config:
        from_attributes = True


class GenerateDocumentRequest(BaseModel):
    """Generate document from template."""

    template_id: UUID
    template_data: dict
    case_id: Optional[UUID] = None


class GeneratedDocumentResponse(BaseModel):
    """Generated document response."""

    id: UUID
    user_id: UUID
    template_id: UUID
    file_url: str
    file_name: str
    file_size: Optional[int]
    status: str
    download_count: int
    created_at: datetime

    class Config:
        from_attributes = True
