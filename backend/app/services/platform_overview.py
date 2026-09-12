"""
Profile-linked overview read model shared by web and bot.

`build_overview()` is pure so it can be unit-tested; `load_overview()` does
the role-scoped DB queries.  Access is always scoped by the authenticated
user id — the client can never widen the scope by passing another id.
"""
from __future__ import annotations

import uuid
from dataclasses import asdict, dataclass, field
from datetime import date, datetime, timezone

from app.services.platform_capabilities import (
    Role,
    capabilities_for_role,
)


@dataclass(frozen=True)
class CaseSummary:
    id: str
    title: str
    case_type: str
    status: str
    urgency: str
    next_deadline: str | None = None
    # U3 read-only roadmap state (derived from persisted roadmap_steps only;
    # never invented): presence flag + next open step title, or explicit
    # not-generated marker so surfaces can stay honest without extra queries.
    roadmap_generated: bool = False
    next_step_title: str | None = None


@dataclass(frozen=True)
class Overview:
    role: Role
    display_name: str
    language: str
    counts: dict[str, int]
    recent_cases: list[CaseSummary]
    urgent_cases: list[CaseSummary]
    deep_links: dict[str, str]
    capabilities: list[str] = field(default_factory=list)
    generated_at: str = ""

    def to_dict(self) -> dict:
        return asdict(self)


URGENT = {"high", "critical"}


def build_overview(
    *,
    role: Role,
    display_name: str,
    language: str,
    cases: list[CaseSummary],
    unread_notifications: int,
    open_referrals: int,
    conversations: int,
    now: datetime | None = None,
) -> Overview:
    now = now or datetime.now(timezone.utc).replace(tzinfo=None)
    open_cases = [c for c in cases if c.status in {"active", "pending"}]
    urgent = [c for c in open_cases if c.urgency in URGENT]
    counts = {
        "cases_total": len(cases),
        "cases_open": len(open_cases),
        "cases_urgent": len(urgent),
        "unread_notifications": unread_notifications,
        "open_referrals": open_referrals,
        "conversations": conversations,
    }
    deep_links = {
        "dashboard": "/user/dashboard" if role in ("citizen", "admin") else "/",
        "cases": "/user/dashboard" if role in ("citizen", "admin") else "/",
        "new_case": "/new-case",
        "urgent": "/urgent/select",
        "find_lawyer": "/find-lawyer",
    }
    return Overview(
        role=role,
        display_name=display_name,
        language=language,
        counts=counts,
        recent_cases=cases[:5],
        urgent_cases=urgent[:5],
        deep_links=deep_links,
        capabilities=[c.id for c in capabilities_for_role(role)],
        generated_at=now.replace(microsecond=0).isoformat() + "Z",
    )


def format_overview_text(ov: Overview) -> str:
    """Channel-safe plain text (Telegram / CLI / assistant bubble)."""
    de = ov.language.startswith("de")
    lines = []
    lines.append(("Übersicht für " if de else "Overview for ") + ov.display_name)
    c = ov.counts
    if de:
        lines.append(f"Fälle: {c['cases_open']} offen / {c['cases_total']} gesamt, {c['cases_urgent']} dringend")
        lines.append(f"Ungelesene Benachrichtigungen: {c['unread_notifications']}")
        if c["open_referrals"]:
            lines.append(f"Offene Vermittlungen: {c['open_referrals']}")
    else:
        lines.append(f"Cases: {c['cases_open']} open / {c['cases_total']} total, {c['cases_urgent']} urgent")
        lines.append(f"Unread notifications: {c['unread_notifications']}")
        if c["open_referrals"]:
            lines.append(f"Open referrals: {c['open_referrals']}")
    if ov.urgent_cases:
        lines.append("!! " + ("Dringend:" if de else "Urgent:"))
        for cs in ov.urgent_cases:
            dl = f" (Frist {cs.next_deadline})" if de and cs.next_deadline else (
                f" (deadline {cs.next_deadline})" if cs.next_deadline else "")
            lines.append(f"  - {cs.title} [{cs.status}]{dl}")
    lines.append(("Links: " if de else "Links: ") + ", ".join(f"{k}={v}" for k, v in ov.deep_links.items()))
    lines.append(
        "Hinweis: Diese Übersicht ist keine Rechtsberatung (RDG)."
        if de else
        "Note: this overview is informational, not legal advice (RDG)."
    )
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# DB-backed loader (only imported by the API layer)
# ---------------------------------------------------------------------------


async def load_overview(user, db) -> Overview:
    from sqlalchemy import func, select
    from sqlalchemy.orm import selectinload

    from app.models.case import Case, RoadmapStep
    from app.models.law_document import Conversation
    from app.models.notifications import Notification
    from app.models.professional import LawyerProfile, Referral

    uid: uuid.UUID = user.id

    lawyer = (
        await db.execute(select(LawyerProfile.id).where(LawyerProfile.user_id == uid))
    ).scalars().first()
    role: Role = "lawyer" if lawyer else "citizen"

    case_rows = (
        await db.execute(
            select(Case)
            .where(Case.user_id == uid)
            .options(selectinload(Case.roadmap_steps))
            .order_by(Case.updated_at.desc())
            .limit(25)
        )
    ).scalars().all()

    def _next_deadline(case) -> str | None:
        steps = getattr(case, "roadmap_steps", None) or []
        today = date.today()
        future = sorted(
            s.deadline for s in steps
            if getattr(s, "deadline", None) and s.deadline >= today and s.status != "completed"
        )
        return future[0].isoformat() if future else None

    def _roadmap_state(case) -> tuple[bool, str | None]:
        """Read-only roadmap truth from persisted steps only.

        A case has a roadmap iff roadmap_steps rows exist. The next step is
        the lowest step_number whose status is not completed/skipped. Nothing
        is fabricated: no steps -> (False, None) and the surface must show
        the explicit 'not yet generated' state.
        """
        steps = sorted(
            (getattr(case, "roadmap_steps", None) or []),
            key=lambda s: s.step_number,
        )
        if not steps:
            return False, None
        open_steps = [s for s in steps if s.status not in ("completed", "skipped")]
        next_title = open_steps[0].title if open_steps else None
        return True, next_title

    cases = []
    for c in case_rows:
        has_roadmap, next_step = _roadmap_state(c)
        cases.append(
            CaseSummary(
                id=str(c.id),
                title=c.title,
                case_type=c.case_type,
                status=c.status,
                urgency=c.urgency,
                next_deadline=_next_deadline(c),
                roadmap_generated=has_roadmap,
                next_step_title=next_step,
            )
        )

    unread = (
        await db.execute(
            select(func.count(Notification.id)).where(
                Notification.user_id == uid, Notification.is_read == False  # noqa: E712
            )
        )
    ).scalar_one()

    if role == "lawyer":
        ref_stmt = select(func.count(Referral.id)).where(
            Referral.lawyer_profile_id == lawyer, Referral.status == "pending"
        )
    else:
        ref_stmt = select(func.count(Referral.id)).where(
            Referral.citizen_user_id == uid, Referral.status == "pending"
        )
    open_referrals = (await db.execute(ref_stmt)).scalar_one()

    conversations = (
        await db.execute(select(func.count(Conversation.id)).where(Conversation.user_id == uid))
    ).scalar_one()

    return build_overview(
        role=role,
        display_name=user.full_name or user.email,
        language=getattr(user, "preferred_language", "de") or "de",
        cases=cases,
        unread_notifications=unread,
        open_referrals=open_referrals,
        conversations=conversations,
    )
