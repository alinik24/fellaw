"""Emergency legal assistance API."""
from __future__ import annotations

from typing import Annotated
from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.database import get_db
from app.models.emergency import EmergencyCase, EmergencyContact
from app.models.user import User
from app.schemas.emergency import (
    EmergencyCaseCreate,
    EmergencyCaseResponse,
    EmergencyContactResponse,
)

log = structlog.get_logger(__name__)
router = APIRouter(prefix="/emergency", tags=["emergency"])


@router.post("/cases", response_model=EmergencyCaseResponse, status_code=status.HTTP_201_CREATED)
async def create_emergency_case(
    data: EmergencyCaseCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User | None, Depends(get_current_user)] = None,
):
    """Create an emergency case (supports anonymous submissions)."""
    # Generate immediate AI advice based on emergency type
    immediate_advice = await _generate_emergency_advice(data.emergency_type, data.description)

    emergency_case = EmergencyCase(
        user_id=current_user.id if current_user else None,
        emergency_type=data.emergency_type,
        urgency_level=data.urgency_level,
        description=data.description,
        location=data.location,
        contact_phone=data.contact_phone,
        contact_email=data.contact_email,
        immediate_advice=immediate_advice,
        status="pending",
    )

    db.add(emergency_case)
    await db.commit()
    await db.refresh(emergency_case)

    log.info(
        "emergency_case_created",
        case_id=str(emergency_case.id),
        type=data.emergency_type,
        urgency=data.urgency_level,
    )

    # TODO: Notify on-call lawyers for high-urgency cases
    if data.urgency_level <= 2:
        # Send notifications to on-call lawyers
        pass

    return emergency_case


@router.get("/cases/{case_id}", response_model=EmergencyCaseResponse)
async def get_emergency_case(
    case_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get emergency case details."""
    result = await db.execute(
        select(EmergencyCase).where(
            EmergencyCase.id == case_id,
            EmergencyCase.user_id == current_user.id,
        )
    )
    emergency_case = result.scalar_one_or_none()

    if not emergency_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency case not found",
        )

    return emergency_case


@router.get("/cases", response_model=list[EmergencyCaseResponse])
async def list_emergency_cases(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    skip: int = 0,
    limit: int = 20,
):
    """List user's emergency cases."""
    result = await db.execute(
        select(EmergencyCase)
        .where(EmergencyCase.user_id == current_user.id)
        .order_by(EmergencyCase.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/contacts", response_model=list[EmergencyContactResponse])
async def get_emergency_contacts(
    db: Annotated[AsyncSession, Depends(get_db)],
    region: str | None = None,
):
    """Get emergency contact information (hotlines, on-call lawyers, etc.)."""
    query = select(EmergencyContact).where(EmergencyContact.is_active == True)

    if region:
        query = query.where(EmergencyContact.region == region)

    result = await db.execute(query.order_by(EmergencyContact.name))
    return result.scalars().all()


@router.post("/immediate-advice")
async def get_immediate_advice(
    emergency_type: str,
    description: str,
):
    """Get immediate AI-generated legal advice for emergency situations."""
    advice = await _generate_emergency_advice(emergency_type, description)
    return {"emergency_type": emergency_type, "advice": advice}


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------


async def _generate_emergency_advice(emergency_type: str, description: str) -> dict:
    """Generate immediate AI advice for emergency situations."""
    # Map emergency types to immediate actions
    emergency_guidance = {
        "police_stop": {
            "immediate_actions": [
                "Remain calm and polite",
                "Do not resist or argue",
                "Ask if you are free to leave",
                "You have the right to remain silent",
                "Request a lawyer if arrested",
            ],
            "dos": [
                "Keep your hands visible",
                "Provide ID when requested",
                "Document officer badge numbers",
            ],
            "donts": [
                "Do not consent to searches without a warrant",
                "Do not make sudden movements",
                "Do not volunteer information",
            ],
        },
        "accident": {
            "immediate_actions": [
                "Ensure safety - move to safe location if possible",
                "Call emergency services (112)",
                "Document the scene with photos",
                "Exchange insurance information",
                "Note witness contact details",
            ],
            "dos": [
                "Get medical attention if injured",
                "Report to police if injuries or major damage",
                "Contact your insurance within 7 days",
            ],
            "donts": [
                "Do not admit fault at the scene",
                "Do not leave the scene",
                "Do not agree to informal settlements",
            ],
        },
        "assault": {
            "immediate_actions": [
                "Get to a safe location",
                "Call police (110) immediately",
                "Seek medical attention",
                "Preserve evidence (clothing, photos of injuries)",
                "Write down what happened while fresh in memory",
            ],
            "dos": [
                "File a police report",
                "Document all injuries with photos",
                "Keep all medical records",
            ],
            "donts": [
                "Do not wash or change clothes before police arrive",
                "Do not confront the assailant",
            ],
        },
        "arrest": {
            "immediate_actions": [
                "Remain silent - say 'Ich möchte einen Anwalt'",
                "Do not sign anything without a lawyer",
                "Demand to contact a lawyer immediately",
                "Note the time, location, and officers present",
            ],
            "dos": [
                "Stay calm and cooperative",
                "Ask for an interpreter if needed",
                "Request medical attention if injured",
            ],
            "donts": [
                "Do not resist arrest",
                "Do not answer questions without a lawyer",
                "Do not waive your rights",
            ],
        },
        "domestic_violence": {
            "immediate_actions": [
                "Get to safety immediately",
                "Call police (110) if in danger",
                "Seek medical attention for injuries",
                "Contact domestic violence hotline: 08000 116 016",
                "Consider obtaining a restraining order",
            ],
            "dos": [
                "Document all incidents with dates and details",
                "Take photos of injuries",
                "Keep emergency bag ready",
            ],
            "donts": [
                "Do not return to unsafe situation",
                "Do not feel obligated to protect the abuser",
            ],
        },
        "eviction": {
            "immediate_actions": [
                "Do not leave immediately - you have rights",
                "Review the eviction notice carefully",
                "Check if proper notice period was given",
                "Gather all rental documents",
                "Contact tenant association (Mieterverein)",
            ],
            "dos": [
                "Respond to the eviction notice in writing",
                "Seek legal counsel immediately",
                "Document condition of property",
            ],
            "donts": [
                "Do not ignore the notice",
                "Do not stop paying rent",
                "Do not leave without legal advice",
            ],
        },
    }

    guidance = emergency_guidance.get(
        emergency_type,
        {
            "immediate_actions": ["Contact emergency services if in immediate danger"],
            "dos": ["Document everything", "Seek legal counsel"],
            "donts": ["Do not take any rash actions"],
        },
    )

    return {
        "emergency_type": emergency_type,
        "immediate_actions": guidance["immediate_actions"],
        "dos": guidance["dos"],
        "donts": guidance["donts"],
        "next_steps": [
            "Document everything related to the incident",
            "Gather all relevant evidence and documents",
            "Contact a lawyer as soon as possible",
            "Follow up through the fellaw platform for continued support",
        ],
        "important_note": "This is general guidance. Every situation is unique. Seek professional legal advice for your specific case.",
    }
