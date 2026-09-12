"""Persisted first-response handoff, reminders, and product-event contracts.

CLIENT TELEMETRY vs AUTHORITATIVE DOMAIN EVENTS
------------------------------------------------
The public POST /first-response/{case_id}/events endpoint records CLIENT
TELEMETRY only (viewed/interaction signals). It REJECTS authoritative domain
event names: those are emitted server-side from the actual domain transition
(upload pipeline, first-response computation, handoff creation, action
completion) and can never be forged by a client POST.
"""
from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import CurrentUser
from app.database import get_db
from app.models.case import Case
from app.models.evidence import Document
from app.models.first_response_state import CurrentAction, Fact, FirstResponseClock, FirstResponseReminder, HandoffDossier, ProductEvent

router = APIRouter(prefix="/first-response", tags=["first-response"])

# Events a client may report about its own interaction surface only.
CLIENT_TELEMETRY_EVENTS = frozenset({
    "first_response_viewed",
    "fact_review_page_opened",
    "reminder_page_opened",
    "handoff_page_opened",
})

# Authoritative domain events: emitted ONLY by the server from the real
# successful domain transition. Clients can never POST these.
AUTHORITATIVE_EVENTS = frozenset({
    "notice_upload_started", "notice_upload_completed", "notice_classified",
    "fact_corrected", "deadline_confirmed", "action_completed",
    "human_review_requested", "handoff_created", "handoff_accepted",
    "matter_resolved",
})

ALL_EVENTS = frozenset(CLIENT_TELEMETRY_EVENTS | AUTHORITATIVE_EVENTS)

# Legacy alias kept for compatibility; delegates to the same allowlist check.
CANONICAL_EVENTS = ALL_EVENTS

# Which single authoritative event marks the CURRENT verified next action
# as completed. Kept explicit so the north star cannot drift.
ACTION_COMPLETION_EVENT = "action_completed"


class HandoffRequest(BaseModel):
    exact_human_question: str = Field(min_length=1, max_length=4000)
    language: str = Field(default="de", max_length=10)
    contact_preference: str | None = Field(default=None, max_length=80)


class ReminderRequest(BaseModel):
    source_clock_id: uuid.UUID
    reminder_date: date


class ProductEventRequest(BaseModel):
    event_name: str = Field(min_length=1, max_length=80)
    metadata: dict[str, Any] = Field(default_factory=dict)


class ActionCompletionRequest(BaseModel):
    """Optional completion contract binding the transition to the exact
    action version the client observed. When `expected_version` is supplied,
    a mismatch fails closed with 409 before any state transition."""

    expected_version: int | None = Field(default=None, ge=1)


async def _owned_case(case_id: uuid.UUID, current_user: CurrentUser, db: AsyncSession) -> Case:
    case = (await db.execute(select(Case).where(Case.id == case_id, Case.user_id == current_user.id))).scalar_one_or_none()
    if case is None:
        raise HTTPException(status_code=404, detail="Matter not found")
    return case


def _action_key_for(classification_family: str | None, rule_id: str | None, trigger_value: str | None) -> str:
    """Stable semantic identity of the CURRENT derived action.

    family|rule_id|trigger_value — when any of these genuinely change, the
    derived action has changed and the prior representation is superseded.
    """
    return f"{classification_family or 'UNKNOWN'}|{rule_id or ''}|{trigger_value or ''}"


async def derive_current_action(
    db: AsyncSession,
    case_id: uuid.UUID,
    *,
    classification_family: str | None,
    rule_id: str | None,
    trigger_value: str | None,
    label: str,
) -> CurrentAction:
    """Derive/refresh the persisted CURRENT next action (server-owned).

    - If an existing non-superseded action has the SAME action_key, keep its
      stable identity (id) and just refresh label/status-if-pending.
    - If the key genuinely changed, SUPERSEDE the prior (status=superseded,
      superseded_by=new id) and create the new current action.
    - The row is the canonical "current identified next action"; completing it
      (POST /actions/complete) flips the north star. A clock is NOT an action.
    """
    key = _action_key_for(classification_family, rule_id, trigger_value)
    # Serialize concurrent derivations: lock the owned Case row so two
    # simultaneous recomputations cannot both create non-superseded actions.
    # SELECT ... FOR UPDATE is the smallest repository-native solution.
    await db.execute(select(Case).where(Case.id == case_id).with_for_update())
    existing = (await db.execute(
        select(CurrentAction).where(CurrentAction.case_id == case_id, CurrentAction.status.in_(("pending", "completed"))).order_by(CurrentAction.created_at.desc())
    )).scalars().all()

    current = next((a for a in existing if not a.superseded_at), None)
    if current is not None and current.action_key == key:
        current.label = label
        await db.flush()
        return current

    # Genuinely new action (or first derivation): supersede prior, create new.
    if current is not None:
        current.status = "superseded"
        current.superseded_at = datetime.now(timezone.utc)
    version = (current.version + 1) if current is not None else 1
    new_action = CurrentAction(case_id=case_id, action_key=key, label=label, status="pending", version=version)
    db.add(new_action)
    await db.flush()
    if current is not None:
        current.superseded_by = new_action.id
        await db.flush()
    return new_action


async def _assemble_journey_state(case_id: uuid.UUID, current_user: CurrentUser, db: AsyncSession) -> dict[str, Any]:
    """Reconstruct the persisted first-response journey from the DB (read model).

    Single coherent read contract used by GET /state (hard-reload
    reconstruction) and by the handoff dossier assembly. No client memory
    participates; every value is loaded from the persisted canonical rows.
    """
    case = await _owned_case(case_id, current_user, db)

    docs = (await db.execute(select(Document).where(Document.case_id == case_id, Document.user_id == current_user.id))).scalars().all()
    doc_ids = [d.id for d in docs]

    facts = []
    if doc_ids:
        rows = (await db.execute(select(Fact).where(Fact.case_id == case_id).order_by(Fact.review_status))).scalars().all()
        seen = set()
        for r in rows:
            key = (r.document_id, r.fact_type, r.value, r.extractor)
            if key in seen:
                continue
            seen.add(key)
            facts.append({
                "id": str(r.id),
                "document_id": str(r.document_id),
                "fact_type": r.fact_type,
                "value": r.value,
                "reviewed_value": r.reviewed_value,
                "review_status": r.review_status,
                "extractor": r.extractor,
                "source_page": r.source_page,
                "source_span": r.source_span,
            })

    clocks = []
    for c in (await db.execute(select(FirstResponseClock).where(FirstResponseClock.case_id == case_id))).scalars().all():
        clocks.append({
            "id": str(c.id), "clock_type": c.clock_type, "due_date": c.due_date.isoformat() if c.due_date else None,
            "verification_status": c.verification_status, "status": c.status, "rule_id": c.rule_id,
            "label": c.label,
        })

    reminders = []
    for r in (await db.execute(select(FirstResponseReminder).where(FirstResponseReminder.case_id == case_id))).scalars().all():
        reminders.append({
            "id": str(r.id), "reminder_date": r.reminder_date.isoformat(), "status": r.status,
            "source_clock_id": str(r.source_clock_id),
        })

    timeline = []
    for ev in (await db.execute(select(ProductEvent).where(ProductEvent.case_id == case_id).order_by(ProductEvent.occurred_at))).scalars().all():
        timeline.append({"event_name": ev.event_name, "occurred_at": ev.occurred_at.isoformat() if ev.occurred_at else None})

    # Latest handoff dossier (if any): reloadable status + assembled dossier.
    handoff_summary = None
    latest_handoff = (await db.execute(
        select(HandoffDossier).where(HandoffDossier.case_id == case_id).order_by(HandoffDossier.created_at.desc())
    )).scalars().first()
    if latest_handoff is not None:
        handoff_summary = {
            "id": str(latest_handoff.id),
            "status": latest_handoff.status,
            "exact_human_question": latest_handoff.exact_human_question,
            "dossier": latest_handoff.dossier or {},
        }

    event_set = {ev["event_name"] for ev in timeline}
    current = (await db.execute(
        select(CurrentAction).where(CurrentAction.case_id == case_id, CurrentAction.status.in_(("pending", "completed"))).order_by(CurrentAction.created_at.desc())
    )).scalars().first()
    current = current if (current is not None and not current.superseded_at) else None
    north_star = {
        "case_id": str(case_id),
        "verified_next_action_completed": current is not None and current.status == "completed",
        "evidence_events": sorted(event_set),
        "current_action": {
            "id": str(current.id) if current else None,
            "action_key": current.action_key if current else None,
            "status": current.status if current else None,
            "version": current.version if current else None,
            "label": current.label if current else None,
        },
    }

    return {
        "case_id": str(case_id),
        "title": case.title,
        "case_type": case.case_type,
        "status": case.status,
        "documents": [{"id": str(d.id), "original_filename": d.original_filename} for d in docs],
        "facts": facts,
        "clocks": clocks,
        "reminders": reminders,
        "timeline": timeline,
        "handoff": handoff_summary,
        "north_star": north_star,
    }


@router.get("/{case_id}/state")
async def get_journey_state(case_id: uuid.UUID, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    """Persisted-read contract: reconstruct the whole journey from the DB.

    Used by the CaseJourney UI after an ACTUAL browser hard reload — the
    rendered page is built from this response, never from previous React
    memory. Ownership-bound (404 for foreign users). Read-only.
    """
    return await _assemble_journey_state(case_id, current_user, db)


async def emit_authoritative_event(db: AsyncSession, user_id, case_id, event_name: str, metadata: dict[str, Any] | None = None) -> ProductEvent:
    """Server-side emitter for authoritative domain events."""
    if event_name not in AUTHORITATIVE_EVENTS:
        raise ValueError(f"not an authoritative event: {event_name}")
    event = ProductEvent(user_id=user_id, case_id=case_id, event_name=event_name, metadata_=metadata or {})
    db.add(event)
    return event


@router.post("/{case_id}/handoff")
async def create_handoff(case_id: uuid.UUID, body: HandoffRequest, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    case = await _owned_case(case_id, current_user, db)

    # handoff_created is an AUTHORITATIVE domain event emitted server-side by the
    # real handoff creation transition (never client-forgeable). Insert the
    # record + event first so the dossier's timeline includes this transition.
    record = HandoffDossier(case_id=case.id, language=body.language, contact_preference=body.contact_preference, exact_human_question=body.exact_human_question, dossier={})
    db.add(record)
    db.add(ProductEvent(user_id=current_user.id, case_id=case.id, event_name="handoff_created", metadata_={"dossier_id": str(record.id)}))
    await db.flush()

    # Blockers 12/14: the dossier assembles the actual persisted canonical state,
    # not merely a row. It is reloadable and ownership-bound (_owned_case ensures
    # the current user owns this matter).
    docs = (await db.execute(select(Document).where(Document.case_id == case_id, Document.user_id == current_user.id))).scalars().all()
    doc_ids = [d.id for d in docs]

    facts = []
    if doc_ids:
        rows = (await db.execute(select(Fact).where(Fact.case_id == case_id).order_by(Fact.review_status))).scalars().all()
        seen = set()
        for r in rows:
            key = (r.document_id, r.fact_type, r.value, r.extractor)
            if key in seen:
                continue
            seen.add(key)
            facts.append({
                "id": str(r.id),
                "document_id": str(r.document_id),
                "fact_type": r.fact_type,
                "value": r.value,
                "reviewed_value": r.reviewed_value,
                "review_status": r.review_status,
                "extractor": r.extractor,
                "source_page": r.source_page,
                "source_span": r.source_span,
            })

    clocks = []
    for c in (await db.execute(select(FirstResponseClock).where(FirstResponseClock.case_id == case_id))).scalars().all():
        clocks.append({
            "id": str(c.id), "clock_type": c.clock_type, "due_date": c.due_date.isoformat() if c.due_date else None,
            "verification_status": c.verification_status, "status": c.status, "rule_id": c.rule_id,
        })

    reminders = []
    for r in (await db.execute(select(FirstResponseReminder).where(FirstResponseReminder.case_id == case_id))).scalars().all():
        reminders.append({
            "id": str(r.id), "reminder_date": r.reminder_date.isoformat(), "status": r.status,
            "source_clock_id": str(r.source_clock_id),
        })

    timeline = []
    for ev in (await db.execute(select(ProductEvent).where(ProductEvent.case_id == case_id).order_by(ProductEvent.occurred_at))).scalars().all():
        timeline.append({"event_name": ev.event_name, "occurred_at": ev.occurred_at.isoformat() if ev.occurred_at else None})

    dossier = {
        "case_id": str(case.id),
        "title": case.title,
        "case_type": case.case_type,
        "status": case.status,
        "counsel_decision": "UNKNOWN",
        "language": body.language,
        "contact_preference": body.contact_preference,
        "documents": [{"id": str(d.id), "original_filename": d.original_filename} for d in docs],
        "facts": facts,
        "clocks": clocks,
        "reminders": reminders,
        "timeline": timeline,
    }
    record.dossier = dossier
    await db.flush()
    return {"id": record.id, "case_id": case.id, "status": record.status, "dossier": record.dossier, "exact_human_question": record.exact_human_question}


@router.post("/{case_id}/reminders")
async def create_reminder(case_id: uuid.UUID, body: ReminderRequest, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    case = await _owned_case(case_id, current_user, db)
    clock = (await db.execute(select(FirstResponseClock).where(FirstResponseClock.id == body.source_clock_id, FirstResponseClock.case_id == case_id))).scalar_one_or_none()
    if case is None or clock is None:
        raise HTTPException(status_code=404, detail="Matter or source clock not found")
    record = FirstResponseReminder(case_id=case_id, source_clock_id=clock.id, reminder_date=body.reminder_date)
    db.add(record)
    await db.flush()
    return {"id": record.id, "case_id": case_id, "source_clock_id": clock.id, "clock_type": "REMINDER_DATE", "reminder_date": record.reminder_date, "status": record.status}


@router.post("/{case_id}/events")
async def record_event(case_id: uuid.UUID, body: ProductEventRequest, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    # Client telemetry only: authoritative names are rejected here and are
    # emitted server-side by the domain transition that actually performed them.
    if body.event_name in AUTHORITATIVE_EVENTS:
        raise HTTPException(status_code=422, detail="Authoritative domain events cannot be reported by clients")
    if body.event_name not in CLIENT_TELEMETRY_EVENTS:
        raise HTTPException(status_code=422, detail="Unsupported product event")
    case = await _owned_case(case_id, current_user, db)
    event = ProductEvent(user_id=current_user.id, case_id=case.id, event_name=body.event_name, metadata_=body.metadata)
    db.add(event)
    await db.flush()
    return {"id": event.id, "event_name": event.event_name, "case_id": case.id}


@router.get("/{case_id}/verified-next-action")
async def verified_next_action(case_id: uuid.UUID, current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    case = await _owned_case(case_id, current_user, db)
    # North star = the CURRENT identified next action (stable identity) has
    # been COMPLETED. Historical completions of superseded actions never
    # satisfy it: only the non-superseded current action's status matters.
    current = (await db.execute(
        select(CurrentAction).where(CurrentAction.case_id == case_id, CurrentAction.status.in_(("pending", "completed"))).order_by(CurrentAction.created_at.desc())
    )).scalars().first()
    current = current if (current is not None and not current.superseded_at) else None
    completed = current is not None and current.status == "completed"
    events = sorted(set((await db.execute(select(ProductEvent.event_name).where(ProductEvent.case_id == case_id))).scalars().all()))
    return {
        "case_id": str(case_id),
        "verified_next_action_completed": completed,
        "evidence_events": events,
        "current_action": {
            "id": str(current.id) if current else None,
            "action_key": current.action_key if current else None,
            "status": current.status if current else None,
            "version": current.version if current else None,
        },
    }


@router.post("/{case_id}/actions/{action_id}/complete")
async def complete_bound_action(
    case_id: uuid.UUID,
    action_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    body: ActionCompletionRequest | None = None,
) -> dict[str, Any]:
    """Server-owned domain completion of a specific current next action.

    Binds completion to the EXACT action identity the client saw (from
    GET /state or the compute response). The transaction is:

    1. authenticate (dependency);
    2. ownership-check the case;
    3. load the supplied action_id scoped to the case;
    4. require it to be the current (non-superseded) action;
    5. require expected version to match when supplied;
    6. require status pending;
    7. transition exactly that action to completed;
    8. emit authoritative action_completed metadata (action_id/version);
    9. commit;
    10. return current north-star state.

    If A was superseded by B before this request arrives, complete(A) MUST
    fail closed (409 stale-action) and MUST NOT complete B.
    """
    case = await _owned_case(case_id, current_user, db)
    # Serialize against concurrent derivation: lock the owned Case row so two
    # simultaneous recomputations cannot both create non-superseded actions.
    await db.execute(select(Case).where(Case.id == case.id).with_for_update())

    action = (await db.execute(
        select(CurrentAction).where(CurrentAction.case_id == case.id, CurrentAction.id == action_id)
    )).scalars().first()

    if action is None:
        raise HTTPException(status_code=404, detail="Action not found for this case")

    if action.superseded_at is not None or action.status == "superseded":
        raise HTTPException(status_code=409, detail="Stale action: this action was superseded by a newer current action")

    current = (await db.execute(
        select(CurrentAction).where(CurrentAction.case_id == case.id, CurrentAction.status.in_(("pending", "completed"))).order_by(CurrentAction.created_at.desc())
    )).scalars().first()
    current = current if (current is not None and not current.superseded_at) else None

    if current is None or current.id != action.id:
        raise HTTPException(status_code=409, detail="Stale action: this action is not the current next action")

    if body is not None and body.expected_version is not None and body.expected_version != action.version:
        raise HTTPException(status_code=409, detail="Version mismatch: expected version does not match the current action")

    if action.status == "completed":
        raise HTTPException(status_code=409, detail="Action already completed")

    if action.status != "pending":
        raise HTTPException(status_code=409, detail=f"Action is not in pending state (status={action.status})")

    # 7. transition exactly THIS action to completed
    action.status = "completed"
    action.completed_at = datetime.now(timezone.utc)
    # 8. authoritative event metadata carries action_id/version
    db.add(ProductEvent(
        user_id=current_user.id,
        case_id=case.id,
        event_name=ACTION_COMPLETION_EVENT,
        metadata_={"action_id": str(action.id), "action_key": action.action_key, "version": action.version},
    ))
    await db.flush()

    return {
        "case_id": str(case.id),
        "completed": True,
        "action": {"id": str(action.id), "action_key": action.action_key, "status": action.status, "version": action.version},
        "north_star": {
            "case_id": str(case.id),
            "verified_next_action_completed": True,
            "evidence_events": sorted(
                set((await db.execute(select(ProductEvent.event_name).where(ProductEvent.case_id == case_id))).scalars().all())
            ),
        },
    }
