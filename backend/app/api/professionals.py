"""
Professionals router – law firms, lawyer profiles, AI matching, and reviews.

Prefix : /professionals
Tags   : professionals

Endpoints
---------
Law Firms
  GET    /professionals/firms                 – list / filter firms
  POST   /professionals/firms                 – create a firm (requires LawyerProfile)
  GET    /professionals/firms/{firm_id}       – firm detail + member lawyers
  PUT    /professionals/firms/{firm_id}       – update firm

Lawyer Profiles
  GET    /professionals/lawyers               – search lawyers
  POST   /professionals/lawyers/profile       – create own lawyer profile
  GET    /professionals/lawyers/me            – own profile
  PUT    /professionals/lawyers/me            – update own profile
  GET    /professionals/lawyers/{id}          – public profile

AI Matching
  POST   /professionals/match                 – AI-powered lawyer matching

Reviews
  POST   /professionals/lawyers/{id}/reviews  – add review
  GET    /professionals/lawyers/{id}/reviews  – list reviews
"""
from __future__ import annotations

import uuid
from typing import Annotated

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.auth import CurrentUser, get_current_user
from app.database import get_db
from app.models.case import Case
from app.models.professional import LawFirm, LawyerProfile, LawyerReview
from app.models.user import User
from app.schemas.professional import (
    LawFirmCreate,
    LawFirmResponse,
    LawFirmUpdate,
    LawyerMatchRequest,
    LawyerMatchResponse,
    LawyerProfileCreate,
    LawyerProfileResponse,
    LawyerProfileUpdate,
    LawyerReviewCreate,
    LawyerReviewResponse,
    LawyerSearchResult,
)
from app.schemas.user import UserResponse

log = structlog.get_logger(__name__)

router = APIRouter(prefix="/professionals", tags=["professionals"])


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------


async def _get_lawyer_profile_for_user(
    user_id: uuid.UUID,
    db: AsyncSession,
    *,
    required: bool = True,
) -> LawyerProfile | None:
    """Return the LawyerProfile that belongs to the given user, or raise 403."""
    stmt = (
        select(LawyerProfile)
        .where(LawyerProfile.user_id == user_id)
        .options(selectinload(LawyerProfile.user), selectinload(LawyerProfile.law_firm))
    )
    profile = (await db.execute(stmt)).scalars().first()
    if profile is None and required:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Kein Anwaltsprofil gefunden. "
                "Erstellen Sie zunächst ein Profil unter POST /professionals/lawyers/profile."
            ),
        )
    return profile


def _build_lawyer_search_result(profile: LawyerProfile) -> LawyerSearchResult:
    """Map a LawyerProfile ORM object to the lightweight search schema."""
    full_name: str | None = profile.user.full_name if profile.user else None
    firm_name: str | None = profile.law_firm.name if profile.law_firm else None
    city: str | None = profile.law_firm.city if profile.law_firm else None
    bio_snippet: str | None = (
        profile.bio[:200] if profile.bio else None
    )
    return LawyerSearchResult(
        id=profile.id,
        user_full_name=full_name,
        title=profile.title,
        specializations=profile.specializations or [],
        languages=profile.languages or ["de"],
        rating=profile.rating,
        review_count=profile.review_count,
        hourly_rate=profile.hourly_rate,
        offers_free_consultation=profile.offers_free_consultation,
        verified=profile.verified,
        city=city,
        law_firm_name=firm_name,
        bio_snippet=bio_snippet,
    )


def _build_lawyer_profile_response(profile: LawyerProfile) -> LawyerProfileResponse:
    """Map a fully-loaded LawyerProfile to its response schema."""
    user_resp: UserResponse | None = (
        UserResponse.model_validate(profile.user) if profile.user else None
    )
    firm_name: str | None = profile.law_firm.name if profile.law_firm else None
    return LawyerProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        law_firm_id=profile.law_firm_id,
        law_firm_name=firm_name,
        title=profile.title,
        bar_number=profile.bar_number,
        specializations=profile.specializations or [],
        languages=profile.languages or ["de"],
        bio=profile.bio,
        years_experience=profile.years_experience,
        hourly_rate=profile.hourly_rate,
        offers_free_consultation=profile.offers_free_consultation,
        consultation_fee=profile.consultation_fee,
        avatar_url=profile.avatar_url,
        verified=profile.verified,
        available_for_referrals=profile.available_for_referrals,
        rating=profile.rating,
        review_count=profile.review_count,
        cases_handled=profile.cases_handled,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
        user=user_resp,
    )


# ---------------------------------------------------------------------------
# Law Firms
# ---------------------------------------------------------------------------


@router.get(
    "/firms",
    response_model=list[LawFirmResponse],
    summary="Kanzleien auflisten",
)
async def list_firms(
    db: Annotated[AsyncSession, Depends(get_db)],
    city: str | None = Query(default=None, description="Filter by city"),
    specialization: str | None = Query(
        default=None, description="Filter by specialization keyword"
    ),
    verified_only: bool = Query(default=False, description="Only verified firms"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
) -> list[LawFirmResponse]:
    stmt = select(LawFirm).where(LawFirm.is_active == True)  # noqa: E712

    if city:
        stmt = stmt.where(LawFirm.city.ilike(f"%{city}%"))
    if verified_only:
        stmt = stmt.where(LawFirm.verified == True)  # noqa: E712
    if specialization:
        # JSON containment check: specializations column contains the value
        stmt = stmt.where(LawFirm.specializations.contains([specialization]))

    stmt = stmt.order_by(LawFirm.rating.desc().nullslast(), LawFirm.name).offset(skip).limit(limit)
    firms = (await db.execute(stmt)).scalars().all()
    return [LawFirmResponse.model_validate(f) for f in firms]


@router.post(
    "/firms",
    response_model=LawFirmResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Kanzlei erstellen (erfordert Anwaltsprofil)",
)
async def create_firm(
    body: LawFirmCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LawFirmResponse:
    # Only users who already have a lawyer profile can create a firm
    await _get_lawyer_profile_for_user(current_user.id, db, required=True)

    # Ensure slug is unique
    existing = (
        await db.execute(select(LawFirm).where(LawFirm.slug == body.slug))
    ).scalars().first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Eine Kanzlei mit dem Slug '{body.slug}' existiert bereits.",
        )

    firm = LawFirm(**body.model_dump())
    db.add(firm)
    await db.flush()
    await db.refresh(firm)
    log.info("create_firm.done", firm_id=str(firm.id), slug=firm.slug)
    return LawFirmResponse.model_validate(firm)


@router.get(
    "/firms/{firm_id}",
    response_model=LawFirmResponse,
    summary="Kanzlei-Details abrufen",
)
async def get_firm(
    firm_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LawFirmResponse:
    stmt = (
        select(LawFirm)
        .where(LawFirm.id == firm_id)
        .options(selectinload(LawFirm.lawyers))
    )
    firm = (await db.execute(stmt)).scalars().first()
    if firm is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kanzlei nicht gefunden.",
        )
    return LawFirmResponse.model_validate(firm)


@router.put(
    "/firms/{firm_id}",
    response_model=LawFirmResponse,
    summary="Kanzlei aktualisieren",
)
async def update_firm(
    firm_id: uuid.UUID,
    body: LawFirmUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LawFirmResponse:
    # Must have a lawyer profile that belongs to this firm (or any firm)
    await _get_lawyer_profile_for_user(current_user.id, db, required=True)

    firm = (
        await db.execute(select(LawFirm).where(LawFirm.id == firm_id))
    ).scalars().first()
    if firm is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kanzlei nicht gefunden.",
        )

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(firm, field, value)

    await db.flush()
    await db.refresh(firm)
    log.info("update_firm.done", firm_id=str(firm_id))
    return LawFirmResponse.model_validate(firm)


# ---------------------------------------------------------------------------
# Lawyer Profiles
# ---------------------------------------------------------------------------


@router.get(
    "/lawyers",
    response_model=list[LawyerSearchResult],
    summary="Anwälte suchen",
)
async def search_lawyers(
    db: Annotated[AsyncSession, Depends(get_db)],
    specialization: str | None = Query(default=None),
    city: str | None = Query(default=None),
    language: str | None = Query(default=None),
    max_rate: float | None = Query(default=None, ge=0),
    verified_only: bool = Query(default=False),
    offers_free: bool = Query(default=False),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
) -> list[LawyerSearchResult]:
    stmt = (
        select(LawyerProfile)
        .where(LawyerProfile.available_for_referrals == True)  # noqa: E712
        .options(
            selectinload(LawyerProfile.user),
            selectinload(LawyerProfile.law_firm),
        )
    )

    if verified_only:
        stmt = stmt.where(LawyerProfile.verified == True)  # noqa: E712
    if offers_free:
        stmt = stmt.where(LawyerProfile.offers_free_consultation == True)  # noqa: E712
    if max_rate is not None:
        stmt = stmt.where(
            (LawyerProfile.hourly_rate <= max_rate)
            | (LawyerProfile.hourly_rate.is_(None))
        )
    if specialization:
        stmt = stmt.where(
            LawyerProfile.specializations.contains([specialization])
        )
    if language:
        stmt = stmt.where(LawyerProfile.languages.contains([language]))

    stmt = (
        stmt.order_by(
            LawyerProfile.rating.desc().nullslast(),
            LawyerProfile.review_count.desc(),
        )
        .offset(skip)
        .limit(limit)
    )

    if city:
        # City is on the law_firm; post-filter after join resolution
        stmt = stmt.join(LawFirm, LawyerProfile.law_firm_id == LawFirm.id, isouter=True).where(
            LawFirm.city.ilike(f"%{city}%")
        )

    profiles = (await db.execute(stmt)).scalars().all()
    return [_build_lawyer_search_result(p) for p in profiles]


@router.post(
    "/lawyers/profile",
    response_model=LawyerProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Eigenes Anwaltsprofil erstellen",
)
async def create_lawyer_profile(
    body: LawyerProfileCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LawyerProfileResponse:
    # Prevent duplicate profile for same user
    existing = (
        await db.execute(
            select(LawyerProfile).where(LawyerProfile.user_id == current_user.id)
        )
    ).scalars().first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sie haben bereits ein Anwaltsprofil.",
        )

    # If a law_firm_id is provided, verify the firm exists
    if body.law_firm_id:
        firm = (
            await db.execute(select(LawFirm).where(LawFirm.id == body.law_firm_id))
        ).scalars().first()
        if firm is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Kanzlei nicht gefunden.",
            )

    profile = LawyerProfile(user_id=current_user.id, **body.model_dump())
    db.add(profile)
    await db.flush()

    # Re-fetch with eager-loaded relationships
    profile = (
        await db.execute(
            select(LawyerProfile)
            .where(LawyerProfile.id == profile.id)
            .options(
                selectinload(LawyerProfile.user),
                selectinload(LawyerProfile.law_firm),
            )
        )
    ).scalars().first()

    log.info("create_lawyer_profile.done", profile_id=str(profile.id))
    return _build_lawyer_profile_response(profile)


@router.get(
    "/lawyers/me",
    response_model=LawyerProfileResponse,
    summary="Eigenes Anwaltsprofil abrufen",
)
async def get_my_lawyer_profile(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LawyerProfileResponse:
    profile = await _get_lawyer_profile_for_user(current_user.id, db, required=True)
    return _build_lawyer_profile_response(profile)


@router.put(
    "/lawyers/me",
    response_model=LawyerProfileResponse,
    summary="Eigenes Anwaltsprofil aktualisieren",
)
async def update_my_lawyer_profile(
    body: LawyerProfileUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LawyerProfileResponse:
    profile = await _get_lawyer_profile_for_user(current_user.id, db, required=True)

    if body.law_firm_id is not None:
        firm = (
            await db.execute(select(LawFirm).where(LawFirm.id == body.law_firm_id))
        ).scalars().first()
        if firm is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Kanzlei nicht gefunden.",
            )

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(profile, field, value)

    await db.flush()

    # Re-fetch to reflect updated relationships
    profile = (
        await db.execute(
            select(LawyerProfile)
            .where(LawyerProfile.id == profile.id)
            .options(
                selectinload(LawyerProfile.user),
                selectinload(LawyerProfile.law_firm),
            )
        )
    ).scalars().first()

    log.info("update_my_lawyer_profile.done", profile_id=str(profile.id))
    return _build_lawyer_profile_response(profile)


@router.get(
    "/lawyers/{lawyer_id}",
    response_model=LawyerProfileResponse,
    summary="Öffentliches Anwaltsprofil abrufen",
)
async def get_lawyer_profile(
    lawyer_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LawyerProfileResponse:
    stmt = (
        select(LawyerProfile)
        .where(LawyerProfile.id == lawyer_id)
        .options(
            selectinload(LawyerProfile.user),
            selectinload(LawyerProfile.law_firm),
        )
    )
    profile = (await db.execute(stmt)).scalars().first()
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anwaltsprofil nicht gefunden.",
        )
    return _build_lawyer_profile_response(profile)


# ---------------------------------------------------------------------------
# AI-powered Lawyer Matching
# ---------------------------------------------------------------------------


@router.post(
    "/match",
    response_model=LawyerMatchResponse,
    summary="KI-gestützte Anwalts-Suche",
)
async def match_lawyers(
    body: LawyerMatchRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LawyerMatchResponse:
    """
    Find the best-matching lawyers for a given case using Azure AI.

    The service loads the case details, builds a structured prompt describing
    the legal situation and the citizen's preferences, and asks the language
    model to rank the available verified lawyers by suitability.  The top
    matches are returned together with a plain-language explanation.
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

    # Retrieve candidate lawyers (verified + available, matching filters)
    candidate_stmt = (
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
        .limit(50)  # pre-filter top 50; AI re-ranks from these
    )
    if body.preferred_specializations:
        candidate_stmt = candidate_stmt.where(
            LawyerProfile.specializations.contains(body.preferred_specializations[:1])
        )
    if body.max_hourly_rate is not None:
        candidate_stmt = candidate_stmt.where(
            (LawyerProfile.hourly_rate <= body.max_hourly_rate)
            | (LawyerProfile.hourly_rate.is_(None))
        )

    candidates = (await db.execute(candidate_stmt)).scalars().all()

    if not candidates:
        return LawyerMatchResponse(
            matches=[],
            explanation=(
                "Leider konnten keine passenden Anwälte für Ihren Fall gefunden werden. "
                "Bitte passen Sie Ihre Suchkriterien an oder wenden Sie sich direkt "
                "an eine Rechtsanwaltskammer."
            ),
        )

    # Build AI ranking prompt
    try:
        from app.services.ai_matching_service import rank_lawyers_for_case

        ranked, explanation = await rank_lawyers_for_case(
            case=case,
            candidates=candidates,
            preferred_specializations=body.preferred_specializations,
            preferred_language=body.preferred_language,
        )
    except Exception as exc:
        log.warning("match_lawyers.ai_fallback", error=str(exc))
        # Graceful degradation: return candidates sorted by rating
        ranked = candidates[:10]
        explanation = (
            "Die KI-Analyse ist vorübergehend nicht verfügbar. "
            "Die Ergebnisse sind nach Bewertung sortiert."
        )

    matches = [_build_lawyer_search_result(p) for p in ranked]
    log.info(
        "match_lawyers.done",
        case_id=str(body.case_id),
        candidates=len(candidates),
        returned=len(matches),
    )
    return LawyerMatchResponse(matches=matches, explanation=explanation)


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------


@router.post(
    "/lawyers/{lawyer_id}/reviews",
    response_model=LawyerReviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Bewertung für Anwalt abgeben",
)
async def add_review(
    lawyer_id: uuid.UUID,
    body: LawyerReviewCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LawyerReviewResponse:
    # Verify lawyer profile exists
    profile = (
        await db.execute(
            select(LawyerProfile).where(LawyerProfile.id == lawyer_id)
        )
    ).scalars().first()
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anwaltsprofil nicht gefunden.",
        )

    # Prevent self-review
    if profile.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sie können sich nicht selbst bewerten.",
        )

    # Verify case_id belongs to reviewer if provided
    if body.case_id:
        owned_case = (
            await db.execute(
                select(Case).where(
                    Case.id == body.case_id, Case.user_id == current_user.id
                )
            )
        ).scalars().first()
        if owned_case is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Fall nicht gefunden oder gehört nicht Ihnen.",
            )

    review = LawyerReview(
        lawyer_profile_id=lawyer_id,
        reviewer_user_id=current_user.id,
        case_id=body.case_id,
        rating=body.rating,
        comment=body.comment,
        is_anonymous=body.is_anonymous,
    )
    db.add(review)
    await db.flush()

    # Update denormalised rating / count on the LawyerProfile
    all_ratings_stmt = select(LawyerReview.rating).where(
        LawyerReview.lawyer_profile_id == lawyer_id
    )
    all_ratings = (await db.execute(all_ratings_stmt)).scalars().all()
    profile.review_count = len(all_ratings)
    profile.rating = round(sum(all_ratings) / len(all_ratings), 2)
    await db.flush()

    await db.refresh(review)
    log.info(
        "add_review.done",
        review_id=str(review.id),
        lawyer_id=str(lawyer_id),
        rating=review.rating,
    )

    reviewer_name: str | None = None
    if not body.is_anonymous:
        reviewer_name = current_user.full_name

    return LawyerReviewResponse(
        id=review.id,
        lawyer_profile_id=review.lawyer_profile_id,
        rating=review.rating,
        comment=review.comment,
        reviewer_name=reviewer_name,
        is_anonymous=review.is_anonymous,
        created_at=review.created_at,
    )


@router.get(
    "/lawyers/{lawyer_id}/reviews",
    response_model=list[LawyerReviewResponse],
    summary="Bewertungen für Anwalt abrufen",
)
async def list_reviews(
    lawyer_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
) -> list[LawyerReviewResponse]:
    profile = (
        await db.execute(
            select(LawyerProfile).where(LawyerProfile.id == lawyer_id)
        )
    ).scalars().first()
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anwaltsprofil nicht gefunden.",
        )

    stmt = (
        select(LawyerReview)
        .where(LawyerReview.lawyer_profile_id == lawyer_id)
        .options(selectinload(LawyerReview.reviewer))
        .order_by(LawyerReview.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    reviews = (await db.execute(stmt)).scalars().all()

    results: list[LawyerReviewResponse] = []
    for r in reviews:
        reviewer_name: str | None = None
        if not r.is_anonymous and r.reviewer:
            reviewer_name = r.reviewer.full_name
        results.append(
            LawyerReviewResponse(
                id=r.id,
                lawyer_profile_id=r.lawyer_profile_id,
                rating=r.rating,
                comment=r.comment,
                reviewer_name=reviewer_name,
                is_anonymous=r.is_anonymous,
                created_at=r.created_at,
            )
        )
    return results
