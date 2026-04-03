"""
Cases router – CRUD for cases, timeline events, roadmap steps, and narratives.
"""
from __future__ import annotations

import uuid
from datetime import date, timedelta
from typing import Annotated, Any

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.auth import CurrentUser
from app.database import get_db
from app.models.case import Case, Narrative, RoadmapStep, TimelineEvent
from app.schemas.case import (
    CaseCreate,
    CaseResponse,
    CaseUpdate,
    NarrativeCreate,
    NarrativeResponse,
    RoadmapStepResponse,
    RoadmapStepUpdate,
    TimelineEventCreate,
    TimelineEventResponse,
)
from app.schemas.chat import NarrativeRequest, RoadmapRequest

log = structlog.get_logger(__name__)

router = APIRouter(prefix="/cases", tags=["cases"])


# ---------------------------------------------------------------------------
# Helper: load case owned by current user
# ---------------------------------------------------------------------------


async def _get_case(
    case_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
    *,
    load_relations: bool = False,
) -> Case:
    stmt = select(Case).where(Case.id == case_id, Case.user_id == user_id)
    if load_relations:
        stmt = stmt.options(
            selectinload(Case.timeline_events),
            selectinload(Case.roadmap_steps),
            selectinload(Case.narratives),
        )
    result = await db.execute(stmt)
    case = result.scalars().first()
    if case is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fall nicht gefunden.")
    return case


# ---------------------------------------------------------------------------
# Cases CRUD
# ---------------------------------------------------------------------------


@router.get("", response_model=list[CaseResponse])
async def list_cases(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
) -> list[CaseResponse]:
    stmt = (
        select(Case)
        .where(Case.user_id == current_user.id)
        .options(
            selectinload(Case.timeline_events),
            selectinload(Case.roadmap_steps),
        )
        .order_by(Case.updated_at.desc())
        .offset(skip)
        .limit(limit)
    )
    if status_filter:
        stmt = stmt.where(Case.status == status_filter)

    cases = (await db.execute(stmt)).scalars().all()
    return [CaseResponse.model_validate(c) for c in cases]


@router.post("", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
async def create_case(
    body: CaseCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CaseResponse:
    case = Case(user_id=current_user.id, **body.model_dump())
    db.add(case)
    await db.flush()
    # Re-fetch with eager-loaded relationships to avoid async lazy-load errors
    case = await _get_case(case.id, current_user.id, db, load_relations=True)
    log.info("create_case.done", case_id=str(case.id))
    return CaseResponse.model_validate(case)


@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(
    case_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CaseResponse:
    case = await _get_case(case_id, current_user.id, db, load_relations=True)
    return CaseResponse.model_validate(case)


@router.put("/{case_id}", response_model=CaseResponse)
async def update_case(
    case_id: uuid.UUID,
    body: CaseUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CaseResponse:
    case = await _get_case(case_id, current_user.id, db)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(case, field, value)
    await db.flush()
    case = await _get_case(case_id, current_user.id, db, load_relations=True)
    return CaseResponse.model_validate(case)


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
async def delete_case(
    case_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    case = await _get_case(case_id, current_user.id, db)
    await db.delete(case)
    await db.flush()
    log.info("delete_case.done", case_id=str(case_id))


# ---------------------------------------------------------------------------
# Timeline events
# ---------------------------------------------------------------------------


@router.post("/{case_id}/timeline", response_model=TimelineEventResponse, status_code=201)
async def add_timeline_event(
    case_id: uuid.UUID,
    body: TimelineEventCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TimelineEventResponse:
    await _get_case(case_id, current_user.id, db)
    event = TimelineEvent(case_id=case_id, **body.model_dump())
    db.add(event)
    await db.flush()
    await db.refresh(event)
    return TimelineEventResponse.model_validate(event)


@router.get("/{case_id}/timeline", response_model=list[TimelineEventResponse])
async def get_timeline(
    case_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[TimelineEventResponse]:
    await _get_case(case_id, current_user.id, db)
    stmt = (
        select(TimelineEvent)
        .where(TimelineEvent.case_id == case_id)
        .order_by(TimelineEvent.event_date)
    )
    events = (await db.execute(stmt)).scalars().all()
    return [TimelineEventResponse.model_validate(e) for e in events]


@router.put("/{case_id}/timeline/{event_id}", response_model=TimelineEventResponse)
async def update_timeline_event(
    case_id: uuid.UUID,
    event_id: uuid.UUID,
    body: TimelineEventCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TimelineEventResponse:
    await _get_case(case_id, current_user.id, db)
    stmt = select(TimelineEvent).where(
        TimelineEvent.id == event_id, TimelineEvent.case_id == case_id
    )
    event = (await db.execute(stmt)).scalars().first()
    if event is None:
        raise HTTPException(status_code=404, detail="Zeitlinienereignis nicht gefunden.")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(event, field, value)
    await db.flush()
    await db.refresh(event)
    return TimelineEventResponse.model_validate(event)


@router.delete("/{case_id}/timeline/{event_id}", status_code=204, response_model=None)
async def delete_timeline_event(
    case_id: uuid.UUID,
    event_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    await _get_case(case_id, current_user.id, db)
    stmt = select(TimelineEvent).where(
        TimelineEvent.id == event_id, TimelineEvent.case_id == case_id
    )
    event = (await db.execute(stmt)).scalars().first()
    if event is None:
        raise HTTPException(status_code=404, detail="Zeitlinienereignis nicht gefunden.")
    await db.delete(event)
    await db.flush()


# ---------------------------------------------------------------------------
# Roadmap
# ---------------------------------------------------------------------------


@router.post("/{case_id}/roadmap/generate", response_model=list[RoadmapStepResponse])
async def generate_roadmap(
    case_id: uuid.UUID,
    body: RoadmapRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[RoadmapStepResponse]:
    from app.services.roadmap_service import generate_roadmap as svc_generate_roadmap

    case = await _get_case(case_id, current_user.id, db, load_relations=True)

    # Delete existing roadmap steps for this case before regenerating
    stmt = select(RoadmapStep).where(RoadmapStep.case_id == case_id)
    existing = (await db.execute(stmt)).scalars().all()
    for step in existing:
        await db.delete(step)
    await db.flush()

    steps_data = await svc_generate_roadmap(case, db)

    today = date.today()
    created_steps: list[RoadmapStep] = []
    for step_dict in steps_data:
        deadline_days = step_dict.pop("deadline_days", None)
        deadline = today + timedelta(days=deadline_days) if deadline_days else None
        step = RoadmapStep(
            case_id=case_id,
            deadline=deadline,
            **{k: v for k, v in step_dict.items() if k != "deadline"},
        )
        db.add(step)
        created_steps.append(step)

    await db.flush()
    for step in created_steps:
        await db.refresh(step)

    log.info("generate_roadmap.done", case_id=str(case_id), steps=len(created_steps))
    return [RoadmapStepResponse.model_validate(s) for s in created_steps]


@router.get("/{case_id}/roadmap", response_model=list[RoadmapStepResponse])
async def get_roadmap(
    case_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[RoadmapStepResponse]:
    await _get_case(case_id, current_user.id, db)
    stmt = (
        select(RoadmapStep)
        .where(RoadmapStep.case_id == case_id)
        .order_by(RoadmapStep.step_number)
    )
    steps = (await db.execute(stmt)).scalars().all()
    return [RoadmapStepResponse.model_validate(s) for s in steps]


@router.put("/{case_id}/roadmap/{step_id}", response_model=RoadmapStepResponse)
async def update_roadmap_step(
    case_id: uuid.UUID,
    step_id: uuid.UUID,
    body: RoadmapStepUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RoadmapStepResponse:
    await _get_case(case_id, current_user.id, db)
    stmt = select(RoadmapStep).where(
        RoadmapStep.id == step_id, RoadmapStep.case_id == case_id
    )
    step = (await db.execute(stmt)).scalars().first()
    if step is None:
        raise HTTPException(status_code=404, detail="Schritt nicht gefunden.")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(step, field, value)
    await db.flush()
    await db.refresh(step)
    return RoadmapStepResponse.model_validate(step)


# ---------------------------------------------------------------------------
# Narratives
# ---------------------------------------------------------------------------


@router.get("/{case_id}/narratives", response_model=list[NarrativeResponse])
async def list_narratives(
    case_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[NarrativeResponse]:
    await _get_case(case_id, current_user.id, db)
    stmt = (
        select(Narrative)
        .where(Narrative.case_id == case_id)
        .order_by(Narrative.created_at.desc())
    )
    narratives = (await db.execute(stmt)).scalars().all()
    return [NarrativeResponse.model_validate(n) for n in narratives]


@router.post(
    "/{case_id}/narratives/generate",
    response_model=NarrativeResponse,
    status_code=201,
)
async def generate_narrative(
    case_id: uuid.UUID,
    body: NarrativeRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> NarrativeResponse:
    from app.services.narrative_service import build_narrative

    case = await _get_case(case_id, current_user.id, db, load_relations=True)

    content = await build_narrative(
        case=case,
        narrative_type=body.narrative_type,
        language=body.language,
        additional_context=body.additional_context or "",
        db=db,
    )

    # Determine next version number for this type
    stmt = select(Narrative).where(
        Narrative.case_id == case_id,
        Narrative.narrative_type == body.narrative_type,
    )
    existing = (await db.execute(stmt)).scalars().all()
    version = len(existing) + 1

    narrative = Narrative(
        case_id=case_id,
        narrative_type=body.narrative_type,
        content=content,
        language=body.language,
        version=version,
        is_final=False,
    )
    db.add(narrative)
    await db.flush()
    await db.refresh(narrative)

    log.info("generate_narrative.done", narrative_id=str(narrative.id))
    return NarrativeResponse.model_validate(narrative)


@router.put("/{case_id}/narratives/{narrative_id}", response_model=NarrativeResponse)
async def update_narrative(
    case_id: uuid.UUID,
    narrative_id: uuid.UUID,
    body: NarrativeCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> NarrativeResponse:
    await _get_case(case_id, current_user.id, db)
    stmt = select(Narrative).where(
        Narrative.id == narrative_id, Narrative.case_id == case_id
    )
    narrative = (await db.execute(stmt)).scalars().first()
    if narrative is None:
        raise HTTPException(status_code=404, detail="Narrativ nicht gefunden.")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(narrative, field, value)
    await db.flush()
    await db.refresh(narrative)
    return NarrativeResponse.model_validate(narrative)
