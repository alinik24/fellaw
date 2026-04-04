"""Pydantic schemas for careers."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, HttpUrl


class JobPostingResponse(BaseModel):
    """Job posting details."""

    id: UUID
    title: str
    department: str
    location: str
    employment_type: str
    experience_level: str
    description: str
    responsibilities: Optional[list[str]]
    qualifications: Optional[list[str]]
    benefits: Optional[list[str]]
    salary_min: Optional[int]
    salary_max: Optional[int]
    salary_currency: str
    required_skills: Optional[list[str]]
    preferred_skills: Optional[list[str]]
    is_active: bool
    positions_available: int
    posted_date: datetime
    application_deadline: Optional[datetime]

    class Config:
        from_attributes = True


class JobApplicationCreate(BaseModel):
    """Create job application."""

    job_posting_id: UUID
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=50)
    resume_url: Optional[str] = None
    cover_letter: Optional[str] = None
    portfolio_url: Optional[HttpUrl] = None
    linkedin_url: Optional[HttpUrl] = None
    years_experience: Optional[int] = None
    current_location: Optional[str] = Field(None, max_length=255)
    willing_to_relocate: bool = False
    notice_period: Optional[str] = Field(None, max_length=100)
    expected_salary: Optional[int] = None
    custom_answers: Optional[dict] = None


class JobApplicationResponse(BaseModel):
    """Job application response."""

    id: UUID
    job_posting_id: UUID
    first_name: str
    last_name: str
    email: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
