"""
Referrals router – citizen-to-lawyer case referral lifecycle.

Prefix : /referrals
Tags   : referrals

Citizen endpoints
  POST   /referrals          – create referral (AI auto-matches if no lawyer given)
  GET    /referrals/my       – citizen's sent referrals
  GET    /referrals/{id}     – referral detail (citizen or assigned lawyer)
  DELETE /referrals/{id}     – cancel pending referral (citizen only)

Lawyer endpoints (requires an existing LawyerProfile)
  GET    /referrals/incoming         – incoming referrals for this lawyer
  PUT    /referrals/{id}/accept      – accept referral
  PUT    /referrals/{id}/decline     – decline referral (add reason)
  PUT    /referrals/{id}/complete    – mark referral completed
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Annotated

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.auth import CurrentUser
from app.database import get_db
from app.models.case import Case
from app.models.professional import LawFirm, LawyerProfile, Referral
from app.schemas.professional import ReferralCreate, ReferralResponse, ReferralUpdate

log = structlog.get_logger(__name__)

router = APIRouter(prefix="/referrals", tags=["referrals"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _get_lawyer_profile_or_403(
    user_id: uuid.UUID, db: AsyncSession
) -> LawyerProfile:
    """Return the LawyerProfile for the current user or raise HTTP 403."""
    stmt = select(LawyerProfile).where(LawyerProfile.user_id == user_id)
    profile = (await db.execute(stmt)).scalars().first()
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Kein Anwaltsprofil vorhanden. "
                "Nur Anwälte mit einem bestätigten Profil können auf Mandate zugreifen."
            ),
        )
    return profile


async def _load_referral(
    referral_id: uuid.UUID, db: AsyncSession
) -> Referral:
    """Fetch a single Referral with all eager-loaded relationships."""
    stmt = (
        select(Referral)
        .where(Referral.id == referral_id)
        .options(
            selectinload(Referral.case),
            selectinload(Referral.citizen_user),
            selectinload(Referral.lawyer_profile).selectinload(LawyerProfile.user),
            selectinload(Referral.law_firm),
        )
    )
    referral = (await db.execute(stmt)).scalars().first()
    if referral is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mandat nicht gefunden.",
        )
    return referral


def _build_referral_response(referral: Referral) -> ReferralResponse:
    """Map a loaded Referral ORM object to its response schema."""
    case_title: str | None = referral.case.title if referral.case else None
    citizen_name: str | None = (
        referral.citizen_user.full_name if referral.citizen_user else None
    )
    lawyer_name: str | None = None
    if referral.lawyer_profile and referral.lawyer_profile.user:
        lawyer_name = referral.lawyer_profile.user.full_name

    return ReferralResponse(
        id=referral.id,
        case_id=referral.case_id,
        citizen_user_id=referral.citizen_user_id,
        lawyer_profile_id=referral.lawyer_profile_id,
        law_firm_id=referral.law_firm_id,
        status=referral.status,
        urgency=referral.urgency,
        message=referral.message,
        lawyer_response=referral.lawyer_response,
        referral_type=referral.referral_type,
        estimated_fee=referral.estimated_fee,
        accepted_at=referral.accepted_at,
        completed_at=referral.completed_at,
        created_at=referral.created_at,
        updated_at=referral.updated_at,
        case_title=case_title,
        citizen_name=citizen_name,
        lawyer_name=lawyer_name,
    )


# ---------------------------------------------------------------------------
# Citizen endpoints
# ---------------------------------------------------------------------------


@router.post(
    "",
    response_model=ReferralResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Mandat erstellen (Bürger sendet Fall an Anwalt)",
)
async def create_referral(
    body: ReferralCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ReferralResponse:
    """
    Create a referral for one of the citizen's cases.

    If neither ``lawyer_profile_id`` nor ``law_firm_id`` is supplied the
    system attempts an AI-powered match (``referral_type='ai_matched'``).
    Otherwise the referral is created as a ``self_referral`` targeting the
    specified lawyer or firm.
    """
    # Verify the case exists and belongs to the current user
    case = (
        await db.execute(
            select(Case).where(
                Case.id == body.case_id, Case.user_id == current_user.id
            )
        )
    ).scalars().first()
    if case is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fall nicht gefunden.",
        )

    lawyer_profile_id = body.lawyer_profile_id
    law_firm_id = body.law_firm_id
    referral_type = body.referral_type

    # Validate explicit targets if provided
    if lawyer_profile_id:
        profile = (
            await db.execute(
                select(LawyerProfile).where(LawyerProfile.id == lawyer_profile_id)
            )
        ).scalars().first()
        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Anwaltsprofil nicht gefunden.",
            )
        referral_type = "self_referral"

    if law_firm_id:
        firm = (
            await db.execute(select(LawFirm).where(LawFirm.id == law_firm_id))
        ).scalars().first()
        if firm is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Kanzlei nicht gefunden.",
            )
        referral_type = "self_referral"

    # AI auto-matching when no explicit target is given
    if not lawyer_profile_id and not law_firm_id:
        referral_type = "ai_matched"
        try:
            from app.services.ai_matching_service import rank_lawyers_for_case

            candidates_stmt = (
                select(LawyerProfile)
                .where(
                    LawyerProfile.available_for_referrals == True,  # noqa: E712
                    LawyerProfile.verified == True,  # noqa: E712
                )
                .options(
                    selectinload(LawyerProfile.user),
                    selectinload(LawyerProfile.law_firm),
                )
                .order_by(LawyerProfile.rating.desc().nullslast())
                .limit(20)
            )
            candidates = (await db.execute(candidates_stmt)).scalars().all()

            if candidates:
                ranked, _ = await rank_lawyers_for_case(
                    case=case,
                    candidates=candidates,
                    preferred_specializations=[case.case_type],
                    preferred_language=current_user.preferred_language,
                )
                if ranked:
                    lawyer_profile_id = ranked[0].id
        except Exception as exc:
            log.warning("create_referral.ai_match_failed", error=str(exc))
            # Proceed with unassigned referral; platform admin will assign manually

    referral = Referral(
        case_id=body.case_id,
        citizen_user_id=current_user.id,
        lawyer_profile_id=lawyer_profile_id,
        law_firm_id=law_firm_id,
        status="pending",
        urgency=body.urgency,
        message=body.message,
        referral_type=referral_type,
    )
    db.add(referral)
    await db.flush()

    referral = await _load_referral(referral.id, db)
    log.info(
        "create_referral.done",
        referral_id=str(referral.id),
        referral_type=referral.referral_type,
        lawyer_id=str(referral.lawyer_profile_id),
    )
    return _build_referral_response(referral)


@router.get(
    "/my",
    response_model=list[ReferralResponse],
    summary="Eigene gesendete Mandate abrufen (Bürger)",
)
async def list_my_referrals(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
) -> list[ReferralResponse]:
    stmt = (
        select(Referral)
        .where(Referral.citizen_user_id == current_user.id)
        .options(
            selectinload(Referral.case),
            selectinload(Referral.citizen_user),
            selectinload(Referral.lawyer_profile).selectinload(LawyerProfile.user),
            selectinload(Referral.law_firm),
        )
        .order_by(Referral.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    referrals = (await db.execute(stmt)).scalars().all()
    return [_build_referral_response(r) for r in referrals]


@router.delete(
    "/{referral_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    summary="Mandat stornieren (Bürger, nur wenn noch ausstehend)",
)
async def cancel_referral(
    referral_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    referral = await _load_referral(referral_id, db)

    if referral.citizen_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sie sind nicht berechtigt, dieses Mandat zu stornieren.",
        )
    if referral.status not in ("pending", "sent"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Ein Mandat mit Status '{referral.status}' kann nicht mehr storniert werden."
            ),
        )

    await db.delete(referral)
    await db.flush()
    log.info("cancel_referral.done", referral_id=str(referral_id))


# ---------------------------------------------------------------------------
# Lawyer endpoints
# ---------------------------------------------------------------------------


@router.get(
    "/incoming",
    response_model=list[ReferralResponse],
    summary="Eingehende Mandate für diesen Anwalt",
)
async def list_incoming_referrals(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    status_filter: str | None = Query(default=None, alias="status"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
) -> list[ReferralResponse]:
    profile = await _get_lawyer_profile_or_403(current_user.id, db)

    stmt = (
        select(Referral)
        .where(
            or_(
                Referral.lawyer_profile_id == profile.id,
                Referral.law_firm_id == profile.law_firm_id,
            )
        )
        .options(
            selectinload(Referral.case),
            selectinload(Referral.citizen_user),
            selectinload(Referral.lawyer_profile).selectinload(LawyerProfile.user),
            selectinload(Referral.law_firm),
        )
        .order_by(Referral.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    if status_filter:
        stmt = stmt.where(Referral.status == status_filter)

    referrals = (await db.execute(stmt)).scalars().all()
    return [_build_referral_response(r) for r in referrals]


@router.put(
    "/{referral_id}/accept",
    response_model=ReferralResponse,
    summary="Mandat annehmen (Anwalt)",
)
async def accept_referral(
    referral_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ReferralResponse:
    profile = await _get_lawyer_profile_or_403(current_user.id, db)
    referral = await _load_referral(referral_id, db)

    _assert_lawyer_owns_referral(referral, profile)

    if referral.status not in ("pending", "sent"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mandat mit Status '{referral.status}' kann nicht angenommen werden.",
        )

    referral.status = "accepted"
    referral.accepted_at = datetime.now(timezone.utc)
    await db.flush()
    referral = await _load_referral(referral_id, db)
    log.info("accept_referral.done", referral_id=str(referral_id))
    return _build_referral_response(referral)


@router.put(
    "/{referral_id}/decline",
    response_model=ReferralResponse,
    summary="Mandat ablehnen (Anwalt)",
)
async def decline_referral(
    referral_id: uuid.UUID,
    body: ReferralUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ReferralResponse:
    profile = await _get_lawyer_profile_or_403(current_user.id, db)
    referral = await _load_referral(referral_id, db)

    _assert_lawyer_owns_referral(referral, profile)

    if referral.status not in ("pending", "sent"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mandat mit Status '{referral.status}' kann nicht abgelehnt werden.",
        )

    referral.status = "declined"
    if body.lawyer_response is not None:
        referral.lawyer_response = body.lawyer_response

    await db.flush()
    referral = await _load_referral(referral_id, db)
    log.info("decline_referral.done", referral_id=str(referral_id))
    return _build_referral_response(referral)


@router.put(
    "/{referral_id}/complete",
    response_model=ReferralResponse,
    summary="Mandat als abgeschlossen markieren (Anwalt)",
)
async def complete_referral(
    referral_id: uuid.UUID,
    body: ReferralUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ReferralResponse:
    profile = await _get_lawyer_profile_or_403(current_user.id, db)
    referral = await _load_referral(referral_id, db)

    _assert_lawyer_owns_referral(referral, profile)

    if referral.status != "accepted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nur angenommene Mandate können als abgeschlossen markiert werden.",
        )

    referral.status = "completed"
    referral.completed_at = datetime.now(timezone.utc)
    if body.lawyer_response is not None:
        referral.lawyer_response = body.lawyer_response
    if body.estimated_fee is not None:
        referral.estimated_fee = body.estimated_fee

    # Increment cases_handled counter on the lawyer's profile
    profile.cases_handled = (profile.cases_handled or 0) + 1
    await db.flush()

    referral = await _load_referral(referral_id, db)
    log.info("complete_referral.done", referral_id=str(referral_id))
    return _build_referral_response(referral)


# ---------------------------------------------------------------------------
# Shared endpoint
# ---------------------------------------------------------------------------


@router.get(
    "/{referral_id}",
    response_model=ReferralResponse,
    summary="Mandat-Details abrufen (Bürger oder Anwalt)",
)
async def get_referral(
    referral_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ReferralResponse:
    referral = await _load_referral(referral_id, db)

    is_citizen = referral.citizen_user_id == current_user.id

    # Check if the current user is the assigned lawyer
    is_lawyer = False
    if not is_citizen:
        profile = (
            await db.execute(
                select(LawyerProfile).where(LawyerProfile.user_id == current_user.id)
            )
        ).scalars().first()
        if profile and (
            referral.lawyer_profile_id == profile.id
            or (
                referral.law_firm_id is not None
                and profile.law_firm_id == referral.law_firm_id
            )
        ):
            is_lawyer = True

    if not is_citizen and not is_lawyer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sie haben keinen Zugriff auf dieses Mandat.",
        )

    return _build_referral_response(referral)


# ---------------------------------------------------------------------------
# Private guard
# ---------------------------------------------------------------------------


def _assert_lawyer_owns_referral(referral: Referral, profile: LawyerProfile) -> None:
    """Raise 403 if the referral is not addressed to the given lawyer / their firm."""
    if referral.lawyer_profile_id != profile.id and (
        referral.law_firm_id is None or referral.law_firm_id != profile.law_firm_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Dieses Mandat ist nicht an Sie adressiert.",
        )
