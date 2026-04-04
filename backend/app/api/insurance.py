"""Insurance integration API."""
from __future__ import annotations

from typing import Annotated
from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.database import get_db
from app.models.insurance import InsurancePartner, InsuranceQuery
from app.models.user import User
from app.schemas.insurance import (
    InsurancePartnerResponse,
    InsuranceQueryCreate,
    InsuranceQueryResponse,
)

log = structlog.get_logger(__name__)
router = APIRouter(prefix="/insurance", tags=["insurance"])


@router.get("/partners", response_model=list[InsurancePartnerResponse])
async def list_insurance_partners(
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = 0,
    limit: int = 20,
):
    """List available insurance partners."""
    result = await db.execute(
        select(InsurancePartner)
        .where(InsurancePartner.is_active == True)
        .order_by(InsurancePartner.name)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.post("/check-coverage", response_model=InsuranceQueryResponse, status_code=status.HTTP_201_CREATED)
async def check_insurance_coverage(
    data: InsuranceQueryCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Check if a case is covered by user's legal insurance."""
    # Create insurance query
    query = InsuranceQuery(
        user_id=current_user.id,
        case_id=data.case_id,
        query_type=data.query_type,
        case_type=data.case_type,
        description=data.description,
        status="pending",
    )

    # TODO: Implement actual insurance API integration
    # For now, provide basic coverage assessment
    coverage_assessment = _assess_coverage(data.case_type)
    query.is_covered = coverage_assessment["is_likely_covered"]
    query.coverage_details = coverage_assessment
    query.response_text = coverage_assessment["message"]
    query.status = "checked"

    db.add(query)
    await db.commit()
    await db.refresh(query)

    log.info("insurance_coverage_checked", query_id=str(query.id), case_type=data.case_type)

    return query


@router.get("/queries", response_model=list[InsuranceQueryResponse])
async def list_insurance_queries(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    skip: int = 0,
    limit: int = 20,
):
    """List user's insurance queries."""
    result = await db.execute(
        select(InsuranceQuery)
        .where(InsuranceQuery.user_id == current_user.id)
        .order_by(InsuranceQuery.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/queries/{query_id}", response_model=InsuranceQueryResponse)
async def get_insurance_query(
    query_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get specific insurance query details."""
    result = await db.execute(
        select(InsuranceQuery).where(
            InsuranceQuery.id == query_id,
            InsuranceQuery.user_id == current_user.id,
        )
    )
    query = result.scalar_one_or_none()

    if not query:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insurance query not found",
        )

    return query


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------


def _assess_coverage(case_type: str | None) -> dict:
    """Assess insurance coverage likelihood based on case type."""
    # Common coverage by German legal insurance
    coverage_map = {
        "traffic_violation": {
            "is_likely_covered": True,
            "message": "Traffic law cases are typically covered by legal insurance policies.",
            "requirements": ["Valid legal insurance policy", "Incident within policy coverage period"],
            "typical_coverage": "Defense against traffic violations, license suspension appeals",
        },
        "employment": {
            "is_likely_covered": True,
            "message": "Employment disputes are commonly covered by legal insurance.",
            "requirements": ["Waiting period (usually 3 months) must have passed"],
            "typical_coverage": "Wrongful termination, wage disputes, discrimination claims",
        },
        "housing": {
            "is_likely_covered": True,
            "message": "Landlord-tenant disputes are typically covered.",
            "requirements": ["Valid policy with housing module"],
            "typical_coverage": "Rent disputes, eviction defense, defects in rental property",
        },
        "consumer": {
            "is_likely_covered": True,
            "message": "Consumer protection cases are often covered.",
            "requirements": ["Purchase value above minimum threshold (typically €200)"],
            "typical_coverage": "Faulty products, warranty claims, contract disputes",
        },
        "family": {
            "is_likely_covered": False,
            "message": "Family law cases often have limited or no coverage in standard policies.",
            "requirements": ["Special family law module required"],
            "typical_coverage": "Some policies cover child custody, not typically divorce proceedings",
        },
        "criminal": {
            "is_likely_covered": False,
            "message": "Criminal defense is typically excluded from legal insurance.",
            "requirements": ["Only traffic-related criminal offenses may be covered"],
            "typical_coverage": "Limited to specific situations like traffic accidents",
        },
    }

    return coverage_map.get(
        case_type,
        {
            "is_likely_covered": None,
            "message": "Coverage depends on your specific policy. Please contact your insurance provider.",
            "requirements": ["Review your policy documents"],
            "typical_coverage": "Varies by policy and provider",
        },
    )
