"""Mediation services API."""
from __future__ import annotations

from typing import Annotated
from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.database import get_db
from app.models.mediation import Mediator, MediationRequest, MediationSession
from app.models.user import User
from app.schemas.mediation import (
    MediationRequestCreate,
    MediationRequestResponse,
    MediationSessionResponse,
    MediatorResponse,
)

log = structlog.get_logger(__name__)
router = APIRouter(prefix="/mediation", tags=["mediation"])


@router.get("/mediators", response_model=list[MediatorResponse])
async def list_mediators(
    db: Annotated[AsyncSession, Depends(get_db)],
    specialization: str | None = None,
    city: str | None = None,
    language: str | None = None,
    skip: int = 0,
    limit: int = 20,
):
    """List available mediators with optional filters."""
    query = select(Mediator).where(
        Mediator.is_active == True,
        Mediator.is_verified == True,
    )

    if city:
        query = query.where(Mediator.city == city)

    # TODO: Add JSON array filtering for specializations and languages

    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.get("/mediators/{mediator_id}", response_model=MediatorResponse)
async def get_mediator(
    mediator_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get mediator profile."""
    result = await db.execute(
        select(Mediator).where(Mediator.id == mediator_id)
    )
    mediator = result.scalar_one_or_none()

    if not mediator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mediator not found",
        )

    return mediator


@router.post("/requests", response_model=MediationRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_mediation_request(
    data: MediationRequestCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Create a mediation request."""
    mediation_request = MediationRequest(
        user_id=current_user.id,
        case_id=data.case_id,
        dispute_type=data.dispute_type,
        description=data.description,
        other_party_name=data.other_party_name,
        other_party_contact=data.other_party_contact,
        preferred_mediator_id=data.preferred_mediator_id,
        preferred_language=data.preferred_language,
        preferred_date=data.preferred_date,
        status="pending",
    )

    db.add(mediation_request)
    await db.commit()
    await db.refresh(mediation_request)

    log.info(
        "mediation_request_created",
        request_id=str(mediation_request.id),
        dispute_type=data.dispute_type,
    )

    # TODO: Notify matching mediators

    return mediation_request


@router.get("/requests", response_model=list[MediationRequestResponse])
async def list_mediation_requests(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    skip: int = 0,
    limit: int = 20,
):
    """List user's mediation requests."""
    result = await db.execute(
        select(MediationRequest)
        .where(MediationRequest.user_id == current_user.id)
        .order_by(MediationRequest.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/sessions", response_model=list[MediationSessionResponse])
async def list_mediation_sessions(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    skip: int = 0,
    limit: int = 20,
):
    """List user's mediation sessions."""
    # Get sessions through mediation requests
    result = await db.execute(
        select(MediationSession)
        .join(MediationRequest)
        .where(MediationRequest.user_id == current_user.id)
        .order_by(MediationSession.scheduled_date.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/sessions/{session_id}", response_model=MediationSessionResponse)
async def get_mediation_session(
    session_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get mediation session details."""
    result = await db.execute(
        select(MediationSession)
        .join(MediationRequest)
        .where(
            MediationSession.id == session_id,
            MediationRequest.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mediation session not found",
        )

    return session
