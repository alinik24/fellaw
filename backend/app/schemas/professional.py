"""
Pydantic v2 schemas for the professional (lawyer / law-firm) layer.

Naming convention mirrors the existing schemas in app/schemas/case.py:
  <Model>Create  – inbound payload for creation
  <Model>Update  – inbound payload for partial update (all fields optional)
  <Model>Response – outbound payload returned to the client
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, Field

from app.schemas.user import UserResponse


# ---------------------------------------------------------------------------
# LawFirm
# ---------------------------------------------------------------------------


class LawFirmCreate(BaseModel):
    name: str = Field(max_length=512)
    slug: str = Field(
        max_length=255,
        description="URL-friendly unique identifier, e.g. 'mueller-partner-berlin'",
    )
    description: str | None = None
    specializations: list[str] = Field(
        default_factory=list,
        description=(
            "Case types the firm handles, e.g. ['housing','criminal','immigration']"
        ),
    )
    address: str | None = Field(default=None, max_length=512)
    city: str | None = Field(default=None, max_length=255)
    postal_code: str | None = Field(default=None, max_length=20)
    phone: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=255)
    website: str | None = Field(default=None, max_length=512)
    logo_url: str | None = Field(default=None, max_length=1024)
    languages: list[str] = Field(default_factory=lambda: ["de"])


class LawFirmUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=512)
    description: str | None = None
    specializations: list[str] | None = None
    address: str | None = Field(default=None, max_length=512)
    city: str | None = Field(default=None, max_length=255)
    postal_code: str | None = Field(default=None, max_length=20)
    phone: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=255)
    website: str | None = Field(default=None, max_length=512)
    logo_url: str | None = Field(default=None, max_length=1024)
    languages: list[str] | None = None
    is_active: bool | None = None


class LawFirmResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: str | None
    specializations: list[str]
    address: str | None
    city: str | None
    postal_code: str | None
    phone: str | None
    email: str | None
    website: str | None
    logo_url: str | None
    verified: bool
    rating: float | None
    review_count: int
    languages: list[str]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# LawyerProfile
# ---------------------------------------------------------------------------


class LawyerProfileCreate(BaseModel):
    law_firm_id: uuid.UUID | None = None
    title: str | None = Field(
        default=None,
        max_length=50,
        description="Academic / professional title, e.g. 'Dr.', 'Prof.'",
    )
    bar_number: str | None = Field(
        default=None,
        max_length=100,
        description="German bar registration number (Zulassungsnummer)",
    )
    specializations: list[str] = Field(
        default_factory=list,
        description="e.g. ['housing','criminal','immigration','employment']",
    )
    languages: list[str] = Field(default_factory=lambda: ["de"])
    bio: str | None = None
    years_experience: int | None = Field(default=None, ge=0)
    hourly_rate: float | None = Field(default=None, ge=0.0)
    offers_free_consultation: bool = False
    consultation_fee: float | None = Field(default=None, ge=0.0)


class LawyerProfileUpdate(BaseModel):
    law_firm_id: uuid.UUID | None = None
    title: str | None = Field(default=None, max_length=50)
    bar_number: str | None = Field(default=None, max_length=100)
    specializations: list[str] | None = None
    languages: list[str] | None = None
    bio: str | None = None
    years_experience: int | None = Field(default=None, ge=0)
    hourly_rate: float | None = Field(default=None, ge=0.0)
    offers_free_consultation: bool | None = None
    consultation_fee: float | None = Field(default=None, ge=0.0)
    avatar_url: str | None = Field(default=None, max_length=1024)
    available_for_referrals: bool | None = None


class LawyerProfileResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    law_firm_id: uuid.UUID | None
    law_firm_name: str | None = None
    title: str | None
    bar_number: str | None
    specializations: list[str]
    languages: list[str]
    bio: str | None
    years_experience: int | None
    hourly_rate: float | None
    offers_free_consultation: bool
    consultation_fee: float | None
    avatar_url: str | None
    verified: bool
    available_for_referrals: bool
    rating: float | None
    review_count: int
    cases_handled: int
    created_at: datetime
    updated_at: datetime
    # Embedded user info
    user: UserResponse | None = None

    model_config = {"from_attributes": True}


class LawyerSearchResult(BaseModel):
    """Lightweight projection used in lawyer search listings."""

    id: uuid.UUID
    user_full_name: str | None
    title: str | None
    specializations: list[str]
    languages: list[str]
    rating: float | None
    review_count: int
    hourly_rate: float | None
    offers_free_consultation: bool
    verified: bool
    city: str | None
    law_firm_name: str | None
    # First 200 characters of bio used as a preview
    bio_snippet: str | None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Referral
# ---------------------------------------------------------------------------


class ReferralCreate(BaseModel):
    case_id: uuid.UUID
    message: str | None = None
    urgency: str = Field(
        default="medium",
        max_length=20,
        description="low | medium | high | critical",
    )
    referral_type: str = Field(
        default="self_referral",
        max_length=30,
        description="self_referral | ai_matched | platform_assigned",
    )
    # Citizen may optionally target a specific lawyer or firm
    lawyer_profile_id: uuid.UUID | None = None
    law_firm_id: uuid.UUID | None = None


class ReferralUpdate(BaseModel):
    status: str | None = Field(
        default=None,
        max_length=20,
        description="pending | sent | accepted | declined | completed",
    )
    lawyer_response: str | None = None
    estimated_fee: float | None = Field(default=None, ge=0.0)


class ReferralResponse(BaseModel):
    id: uuid.UUID
    case_id: uuid.UUID
    citizen_user_id: uuid.UUID
    lawyer_profile_id: uuid.UUID | None
    law_firm_id: uuid.UUID | None
    status: str
    urgency: str
    message: str | None
    lawyer_response: str | None
    referral_type: str
    estimated_fee: float | None
    accepted_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    # Convenience fields resolved at query time
    case_title: str | None = None
    citizen_name: str | None = None
    lawyer_name: str | None = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# LawyerReview
# ---------------------------------------------------------------------------


class LawyerReviewCreate(BaseModel):
    rating: Annotated[int, Field(ge=1, le=5)]
    comment: str | None = None
    is_anonymous: bool = False
    # Link to a specific case to add authenticity signal
    case_id: uuid.UUID | None = None


class LawyerReviewResponse(BaseModel):
    id: uuid.UUID
    lawyer_profile_id: uuid.UUID
    rating: int
    comment: str | None
    # Resolved at query time; None when is_anonymous=True
    reviewer_name: str | None = None
    is_anonymous: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# AI Lawyer Matching
# ---------------------------------------------------------------------------


class LawyerMatchRequest(BaseModel):
    case_id: uuid.UUID
    preferred_specializations: list[str] = Field(default_factory=list)
    preferred_language: str = Field(default="de", max_length=10)
    max_hourly_rate: float | None = Field(default=None, ge=0.0)


class LawyerMatchResponse(BaseModel):
    matches: list[LawyerSearchResult]
    explanation: str
