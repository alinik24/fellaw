from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str | None = None
    preferred_language: str = Field(default="de", max_length=10)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str | None
    preferred_language: str
    is_active: bool
    is_anonymous: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: str | None = None
    preferred_language: str | None = Field(default=None, max_length=10)


# ---------------------------------------------------------------------------
# Authentication tokens
# ---------------------------------------------------------------------------


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ---------------------------------------------------------------------------
# Guest / anonymous session
# ---------------------------------------------------------------------------


class GuestSession(BaseModel):
    session_id: uuid.UUID
    token: str
