from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any, Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, model_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import CurrentUser
from app.database import get_db
from app.models.case import Case
from app.models.evidence import Document
from app.models.first_response_state import Fact, FirstResponseClock
from app.services.first_response import (
    FactReviewStatus,
    ProvenanceFact,
    calculate_statutory_clock,
    classify_notice,
    document_stated_deadline,
    first_response,
    handoff_packet,
)

router = APIRouter(prefix="/first-response", tags=["first-response"])

class FirstResponseRequest(BaseModel):
    case_id: uuid.UUID
    document_id: uuid.UUID

# Provenance a client must never be able to set (blocker 6). Server-assigned.
CLIENT_FORBIDDEN_PROVENANCE = frozenset({"extractor", "confidence", "source_page", "source_span"})

class FactCreate(BaseModel):
    """User-supplied fact.

    Blockers 6/14: the client CANNOT set extraction provenance. Facts created
    through this endpoint are truthful USER-PROVIDED facts: the server labels
    them with extractor='user_provided' and null source_page/source_span/
    confidence. Extracted facts with real provenance (extractor set, source
    page/span, confidence) are created ONLY by the server-side extraction
    pipeline and carried in EXTRACTED_CANDIDATE review_status.
    """
    fact_type: str = Field(min_length=1, max_length=80)
    value: str | None = None
    normalized_value: str | None = None
    # Provenance fields are intentionally NOT accepted from clients.
    # extractor/confidence/source_page/source_span are server-assigned.
    user_provided: bool = True

    @model_validator(mode="before")
    @classmethod
    def _reject_client_provenance(cls, values: Any) -> Any:
        if isinstance(values, dict):
            supplied = [k for k in CLIENT_FORBIDDEN_PROVENANCE if k in values]
            if supplied:
                raise ValueError(
                    f"provenance fields are server-assigned and cannot be set by a client: {', '.join(supplied)}"
                )
        return values

class FactReviewRequest(BaseModel):
    review_status: FactReviewStatus
    reviewed_value: str | None = None

async def _owned_document(case_id: uuid.UUID, document_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> tuple[Case, Document]:
    case = (await db.execute(select(Case).where(Case.id == case_id, Case.user_id == user_id))).scalar_one_or_none()
    document = (await db.execute(select(Document).where(Document.id == document_id, Document.case_id == case_id, Document.user_id == user_id))).scalar_one_or_none()
    if case is None or document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Matter or document not found")
    return case, document

def _domain_fact(row: Fact) -> ProvenanceFact:
    return ProvenanceFact(
        id=str(row.id), document_id=str(row.document_id), case_id=str(row.case_id) if row.case_id else None,
        fact_type=row.fact_type, value=row.value, normalized_value=row.normalized_value,
        source_page=row.source_page, source_span=row.source_span, extractor=row.extractor,
        confidence=row.confidence, review_status=FactReviewStatus(row.review_status),
        reviewed_value=row.reviewed_value, reviewed_at=row.reviewed_at.isoformat() if row.reviewed_at else None,
    )

@router.post("", summary="Generate a first response from owned persisted state")
async def create_first_response(body: FirstResponseRequest, current_user: CurrentUser, db: Annotated[AsyncSession, Depends(get_db)]) -> dict[str, Any]:
    case, document = await _owned_document(body.case_id, body.document_id, current_user.id, db)
    # Serialize the ENTIRE recompute for this case (clock reconciliation +
    # current-action derivation) with a single owned Case-row lock taken
    # BEFORE any other row is read/written in this transaction. This prevents
    # two concurrent recomputations from interleaving clock/action writes
    # (which deadlocks) or creating two non-superseded current actions.
    await db.execute(select(Case).where(Case.id == case.id).with_for_update())
    facts_rows = (await db.execute(select(Fact).where(Fact.document_id == document.id, Fact.case_id == case.id).order_by(Fact.created_at))).scalars().all()
    facts = tuple(_domain_fact(row) for row in facts_rows)
    text = document.extracted_text or ""
    classification = classify_notice(text, document_id=str(document.id))
    clocks = [calculate_statutory_clock(case_id=str(case.id), classification=classification, facts=facts)]
    stated = next((fact for fact in facts if fact.fact_type == "document_stated_deadline"), None)
    if stated is not None:
        clocks.append(document_stated_deadline(case_id=str(case.id), fact=stated, clock_id="document-stated-deadline"))
    response = first_response(classification=classification, facts=facts, clocks=clocks, case_id=str(case.id))
    # Stable clock reconciliation: preserve semantic identity of clocks that
    # still exist, update changed state, create only genuinely new clocks,
    # and explicitly mark obsolete ones cancelled. Reminders reference source
    # clocks; blanket delete+recreate would cascade-destroy user reminders.
    existing_rows = list((await db.execute(select(FirstResponseClock).where(FirstResponseClock.case_id == case.id))).scalars().all())
    key_of = lambda c: (c.clock_type.value, c.rule_id or "", c.label or "")  # semantic identity
    desired = {key_of(c): c for c in response.clocks}
    by_key: dict[tuple, FirstResponseClock] = {}
    for row in existing_rows:
        k = (row.clock_type, row.rule_id or "", row.label or "")
        by_key[k] = row
    persisted_clocks = []
    # 1) update existing / create new
    for k, clock in desired.items():
        trigger_id = None
        if clock.trigger_fact_id:
            try:
                trigger_id = uuid.UUID(clock.trigger_fact_id)
            except ValueError:
                trigger_id = None
        row = by_key.get(k)
        if row is None:
            row = FirstResponseClock(case_id=case.id, trigger_fact_id=trigger_id, clock_type=clock.clock_type.value)
            db.add(row)
        row.trigger_fact_id = trigger_id
        row.due_date = clock.due_date
        row.rule_id = clock.rule_id
        row.rule_version = clock.rule_version
        row.legal_basis = clock.legal_basis
        row.verification_status = clock.verification_status.value
        row.confidence = clock.confidence
        row.source_page = clock.source_page
        row.source_span = clock.source_span
        row.label = clock.label
        row.status = clock.status
        await db.flush()
        persisted_clocks.append(row)
    # 2) explicitly cancel obsolete clocks (no silent deletion)
    for k, row in by_key.items():
        if k not in desired:
            row.status = "cancelled"
    await db.flush()
    clock_payload = []
    for row, clock in zip(persisted_clocks, response.clocks):
        payload = dict(clock.__dict__); payload["id"] = str(row.id); clock_payload.append(payload)

    # Derive/refresh the CURRENT next action (server-owned, stable identity).
    # A clock is NOT an action: the north star tracks THIS action's completion.
    from app.api.first_response_state import derive_current_action
    classification_family = response.classification.family.value if hasattr(response.classification.family, "value") else str(response.classification.family)
    rule_id = None
    trigger_value = None
    for clock in response.clocks:
        if clock.clock_type.value == "STATUTORY_DEADLINE":
            rule_id = clock.rule_id
            trigger_value = None
            if clock.trigger_fact_id:
                trig = next((f for f in facts if f.id == clock.trigger_fact_id), None)
                trigger_value = trig.reviewed_value or trig.value if trig else None
            break
    label = response.next_actions[0] if response.next_actions else "Current next action"
    action = await derive_current_action(
        db, case.id,
        classification_family=classification_family,
        rule_id=rule_id,
        trigger_value=trigger_value,
        label=label,
    )

    return {
        "case_id": str(case.id), "document_id": str(document.id),
        "classification": response.classification.__dict__,
        "facts": [fact.__dict__ for fact in response.facts],
        "clocks": clock_payload,
        "next_actions": list(response.next_actions), "recommended_targets": [clock.__dict__ for clock in response.recommended_targets],
        "handoff_required": response.handoff_required, "handoff_reason": response.handoff_reason,
        "handoff_packet": handoff_packet(response),
        "current_action": {"id": str(action.id), "action_key": action.action_key, "label": action.label, "status": action.status, "version": action.version},
    }

@router.post("/{case_id}/documents/{document_id}/facts", status_code=201)
async def create_candidate_fact(case_id: uuid.UUID, document_id: uuid.UUID, body: FactCreate, current_user: CurrentUser, db: Annotated[AsyncSession, Depends(get_db)]):
    await _owned_document(case_id, document_id, current_user.id, db)
    # User-provided fact is labeled truthfully and must never claim an
    # extraction identity or set source provenance (blocker 6).
    row = Fact(
        document_id=document_id,
        case_id=case_id,
        fact_type=body.fact_type,
        value=body.value,
        normalized_value=body.normalized_value,
        source_page=None,
        source_span=None,
        extractor="user_provided",
        confidence=None,
    )
    db.add(row); await db.flush(); await db.refresh(row)
    return {"id": str(row.id), "fact_type": row.fact_type, "review_status": row.review_status, "extractor": row.extractor, "source_page": row.source_page, "source_span": row.source_span}

@router.get("/{case_id}/documents/{document_id}/facts")
async def list_facts(case_id: uuid.UUID, document_id: uuid.UUID, current_user: CurrentUser, db: Annotated[AsyncSession, Depends(get_db)]):
    await _owned_document(case_id, document_id, current_user.id, db)
    rows = (await db.execute(select(Fact).where(Fact.case_id == case_id, Fact.document_id == document_id).order_by(Fact.created_at))).scalars().all()
    return [{"id": str(row.id), "fact_type": row.fact_type, "value": row.value, "normalized_value": row.normalized_value, "reviewed_value": row.reviewed_value, "review_status": row.review_status, "source_page": row.source_page, "source_span": row.source_span, "extractor": row.extractor, "confidence": row.confidence, "reviewed_at": row.reviewed_at} for row in rows]

@router.patch("/{case_id}/documents/{document_id}/facts/{fact_id}")
async def review_fact(case_id: uuid.UUID, document_id: uuid.UUID, fact_id: uuid.UUID, body: FactReviewRequest, current_user: CurrentUser, db: Annotated[AsyncSession, Depends(get_db)]):
    await _owned_document(case_id, document_id, current_user.id, db)
    row = (await db.execute(select(Fact).where(Fact.id == fact_id, Fact.case_id == case_id, Fact.document_id == document_id))).scalar_one_or_none()
    if row is None: raise HTTPException(status_code=404, detail="Fact not found")
    if body.review_status == FactReviewStatus.USER_CORRECTED and not body.reviewed_value:
        raise HTTPException(status_code=422, detail="reviewed_value required for correction")
    row.review_status = body.review_status.value
    row.reviewed_value = body.reviewed_value if body.reviewed_value is not None else row.reviewed_value or row.normalized_value or row.value
    row.reviewed_at = datetime.now(timezone.utc)
    await db.flush()
    return {"id": str(row.id), "review_status": row.review_status, "reviewed_value": row.reviewed_value, "reviewed_at": row.reviewed_at}
