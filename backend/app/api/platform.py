"""
Platform endpoints shared by the web shell and the Telegram/OpenClaw bot.

  GET /api/v1/platform/capabilities   – role-filtered registry (public; role
                                        is derived from the optional bearer
                                        token, never from the client).
  GET /api/v1/platform/overview       – authenticated, profile-scoped read model.
  GET /api/v1/platform/overview/text  – same, rendered as channel-safe text.
"""
from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import CurrentUser, verify_token
from app.database import get_db
from app.services.platform_capabilities import (
    capabilities_for_role,
    registry_summary,
)
from app.services.platform_overview import format_overview_text, load_overview

router = APIRouter(prefix="/platform", tags=["platform"])


async def _optional_role(request: Request, db: AsyncSession) -> str:
    """Resolve role from an *optional* bearer token. Anonymous when absent/invalid."""
    auth = request.headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        return "anonymous"
    subject = verify_token(auth.split(" ", 1)[1].strip())
    if not subject:
        return "anonymous"
    import uuid

    from sqlalchemy import select

    from app.models.professional import LawyerProfile
    from app.models.user import User

    try:
        uid = uuid.UUID(subject)
    except ValueError:
        return "anonymous"
    user = (await db.execute(select(User).where(User.id == uid, User.is_active == True))).scalars().first()  # noqa: E712
    if user is None:
        return "anonymous"
    lawyer = (await db.execute(select(LawyerProfile.id).where(LawyerProfile.user_id == uid))).scalars().first()
    return "lawyer" if lawyer else "citizen"


@router.get("/capabilities", summary="Role-filtered capability registry")
async def list_capabilities(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    role = await _optional_role(request, db)
    caps = capabilities_for_role(role)
    return {
        "role": role,
        "summary": registry_summary(),
        "capabilities": [c.to_dict() for c in caps],
        "disclaimer": (
            "FelLaw liefert Rechtsinformationen, keine Rechtsberatung im Sinne des RDG. "
            "Mutationen erfordern eine ausdrückliche Bestätigung."
        ),
    }


@router.get("/overview", summary="Profile-scoped overview (web + bot)")
async def get_overview(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    ov = await load_overview(current_user, db)
    return ov.to_dict()


@router.get("/overview/text", summary="Overview as channel-safe text", response_class=PlainTextResponse)
async def get_overview_text(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> str:
    ov = await load_overview(current_user, db)
    return format_overview_text(ov)
