"""
Evidence router – CRUD for evidence items with AI analysis.
"""
from __future__ import annotations

import uuid
from typing import Annotated, Any

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import CurrentUser
from app.database import get_db
from app.models.case import Case
from app.models.evidence import Evidence
from app.schemas.case import EvidenceResponse, EvidenceUpdate

log = structlog.get_logger(__name__)

router = APIRouter(prefix="/evidence", tags=["evidence"])


# ---------------------------------------------------------------------------
# Request schema (extends the base with required case_id)
# ---------------------------------------------------------------------------


class EvidenceCreateWithCase(BaseModel):
    case_id: uuid.UUID
    title: str = Field(max_length=512)
    evidence_type: str = Field(
        max_length=50,
        description=(
            "document | photo | video | audio | digital | witness | "
            "physical | correspondence"
        ),
    )
    description: str | None = None
    file_path: str | None = Field(default=None, max_length=1024)
    file_type: str | None = Field(default=None, max_length=100)
    file_size: int | None = Field(default=None, ge=0)
    event_date: str | None = None  # ISO datetime string
    is_favorable: bool | None = None
    strength: str = Field(default="moderate", max_length=20)
    tags: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _verify_case_ownership(
    case_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> Case:
    stmt = select(Case).where(Case.id == case_id, Case.user_id == user_id)
    case = (await db.execute(stmt)).scalars().first()
    if case is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fall nicht gefunden oder kein Zugriff.",
        )
    return case


async def _get_evidence(
    evidence_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> Evidence:
    stmt = (
        select(Evidence)
        .join(Case, Evidence.case_id == Case.id)
        .where(Evidence.id == evidence_id, Case.user_id == user_id)
    )
    ev = (await db.execute(stmt)).scalars().first()
    if ev is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Beweismittel nicht gefunden.",
        )
    return ev


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("", response_model=list[EvidenceResponse])
async def list_evidence(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    case_id: uuid.UUID = Query(..., description="Filter by case UUID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
) -> list[EvidenceResponse]:
    await _verify_case_ownership(case_id, current_user.id, db)

    stmt = (
        select(Evidence)
        .where(Evidence.case_id == case_id)
        .order_by(Evidence.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    items = (await db.execute(stmt)).scalars().all()
    return [EvidenceResponse.model_validate(e) for e in items]


@router.post("", response_model=EvidenceResponse, status_code=status.HTTP_201_CREATED)
async def add_evidence(
    body: EvidenceCreateWithCase,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> EvidenceResponse:
    """Add a new evidence item. Include case_id in the request body."""
    await _verify_case_ownership(body.case_id, current_user.id, db)

    # Parse event_date if provided as string
    event_date = None
    if body.event_date:
        from datetime import datetime
        try:
            event_date = datetime.fromisoformat(body.event_date)
        except ValueError:
            event_date = None

    ev = Evidence(
        case_id=body.case_id,
        title=body.title,
        evidence_type=body.evidence_type,
        description=body.description,
        file_path=body.file_path,
        file_type=body.file_type,
        file_size=body.file_size,
        event_date=event_date,
        is_favorable=int(body.is_favorable) if body.is_favorable is not None else None,
        strength=body.strength,
        tags=body.tags,
        metadata_=body.metadata,
    )
    db.add(ev)
    await db.flush()
    await db.refresh(ev)
    log.info("add_evidence.done", evidence_id=str(ev.id), case_id=str(body.case_id))
    return EvidenceResponse.model_validate(ev)


@router.put("/{evidence_id}", response_model=EvidenceResponse)
async def update_evidence(
    evidence_id: uuid.UUID,
    body: EvidenceUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> EvidenceResponse:
    ev = await _get_evidence(evidence_id, current_user.id, db)

    update_data = body.model_dump(exclude_none=True)
    for field, value in update_data.items():
        if field == "is_favorable":
            ev.is_favorable = int(value) if value is not None else None
        elif field == "metadata":
            ev.metadata_ = value
        else:
            setattr(ev, field, value)

    await db.flush()
    await db.refresh(ev)
    return EvidenceResponse.model_validate(ev)


@router.delete("/{evidence_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
async def delete_evidence(
    evidence_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    ev = await _get_evidence(evidence_id, current_user.id, db)
    await db.delete(ev)
    await db.flush()
    log.info("delete_evidence.done", evidence_id=str(evidence_id))


@router.post("/{evidence_id}/analyze", response_model=EvidenceResponse)
async def analyze_evidence(
    evidence_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> EvidenceResponse:
    """Run AI analysis on this evidence item's description."""
    from app.services.ai_service import chat_completion

    ev = await _get_evidence(evidence_id, current_user.id, db)

    # Build a text representation of the evidence
    text = f"Beweismittel-Typ: {ev.evidence_type}\nTitel: {ev.title}\n"
    if ev.description:
        text += f"Beschreibung: {ev.description}\n"

    system = (
        "Du bist ein Rechtsassistent. Analysiere das Beweismittel und erkläre "
        "seine rechtliche Relevanz, Stärken und mögliche Schwächen in 2-4 Sätzen auf Deutsch. "
        "Gib auch eine Einschätzung zur Beweiskraft (schwach/mittel/stark) ab."
    )
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": f"Analysiere dieses Beweismittel:\n{text}"},
    ]
    analysis = await chat_completion(messages, temperature=0.3, max_tokens=600)
    assert isinstance(analysis, str)

    ev.analysis = analysis
    await db.flush()
    await db.refresh(ev)
    log.info("analyze_evidence.done", evidence_id=str(evidence_id))
    return EvidenceResponse.model_validate(ev)


@router.get("/timeline/{case_id}", response_model=list[EvidenceResponse])
async def get_evidence_timeline(
    case_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[EvidenceResponse]:
    """Return evidence items ordered by event_date (chronological timeline view)."""
    await _verify_case_ownership(case_id, current_user.id, db)

    stmt = (
        select(Evidence)
        .where(Evidence.case_id == case_id, Evidence.event_date.is_not(None))
        .order_by(Evidence.event_date)
    )
    items = (await db.execute(stmt)).scalars().all()
    return [EvidenceResponse.model_validate(e) for e in items]
